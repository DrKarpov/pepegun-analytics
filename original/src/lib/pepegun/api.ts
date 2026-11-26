import { COLLECTOR_FRIENDLY, SOURCES, CACHE_VERSION, type SourceId } from "./config";
import {
  classify,
  compareLt,
  dedupeTxs,
  mapTonapiTx,
  mapToncenterTx,
  mergeRows,
  normalizeAddress,
  SchemaError,
  verifyChain,
  type ExclusionReason,
  type RawTx,
  type Row,
} from "./parse";

export interface Cache {
  v: number;
  address: string;
  /** raw address of the collector as reported by the API */
  selfRaw: string | null;
  source: SourceId;
  rows: Row[];
  newestLt: string | null;
  /** all transactions of the account inspected (qualifying or not) */
  txScanned: number;
  excluded: Partial<Record<ExclusionReason, number>>;
  firstTxUtime: number | null;
  lastSuccess: number;
  lastFullSync: number;
}

export interface Progress {
  mode: "full" | "incremental";
  source: SourceId;
  pages: number;
  txs: number;
  oldestUtime: number | null;
  /** set while backing off after a rate limit or network error */
  waiting: null | { attempt: number; seconds: number; reason: string };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}
export class CoverageError extends Error {}

const MAX_ATTEMPTS = 7;
const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export const backoffMs = (attempt: number) =>
  Math.min(30_000, 1_000 * 2 ** attempt) + Math.floor(Math.random() * 400);

interface Ctx {
  signal?: AbortSignal;
  onWait?: (w: { attempt: number; seconds: number; reason: string }) => void;
  fetchImpl?: typeof fetch;
}

/** GET JSON with retry and exponential backoff on 429, 5xx and network failures. */
export async function getJson(url: string, ctx: Ctx = {}): Promise<unknown> {
  const doFetch = ctx.fetchImpl ?? fetch;
  const host = new URL(url).host;
  let last: Error = new ApiError(`${host}: request failed`);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let wait = backoffMs(attempt);
    let reason = "network error";
    try {
      const res = await doFetch(url, ctx.signal ? { signal: ctx.signal } : {});
      if (res.ok) return (await res.json()) as unknown;
      const retryable = res.status === 429 || res.status >= 500;
      last = new ApiError(`${host} answered HTTP ${res.status}`, res.status);
      if (!retryable) throw last;
      reason = res.status === 429 ? "rate limited" : `HTTP ${res.status}`;
      const ra = Number(res.headers.get("retry-after"));
      if (Number.isFinite(ra) && ra > 0) wait = Math.min(60_000, ra * 1000);
    } catch (e) {
      if (isAbort(e)) throw e;
      if (e instanceof ApiError && e.status && e.status !== 429 && e.status < 500) throw e;
      if (!(e instanceof ApiError))
        last = new ApiError(`${host} could not be reached (${e instanceof Error ? e.message : "network error"})`);
    }
    if (attempt === MAX_ATTEMPTS - 1) break;
    ctx.onWait?.({ attempt: attempt + 1, seconds: Math.round(wait / 1000), reason });
    await sleep(wait, ctx.signal);
  }
  throw last;
}

function pageUrl(source: SourceId, cursor: string | null, afterLt: string | null): string {
  const size = SOURCES[source].pageSize;
  if (source === "toncenter") {
    const u = new URL("https://toncenter.com/api/v3/transactions");
    u.searchParams.set("account", COLLECTOR_FRIENDLY);
    u.searchParams.set("limit", String(size));
    u.searchParams.set("sort", "desc");
    if (afterLt) u.searchParams.set("start_lt", afterLt); // inclusive
    if (cursor) u.searchParams.set("end_lt", cursor); // inclusive
    return u.toString();
  }
  const u = new URL(`https://tonapi.io/v2/blockchain/accounts/${COLLECTOR_FRIENDLY}/transactions`);
  u.searchParams.set("limit", String(size));
  u.searchParams.set("sort_order", "desc");
  if (afterLt) u.searchParams.set("after_lt", afterLt); // exclusive
  if (cursor) u.searchParams.set("before_lt", cursor); // exclusive
  return u.toString();
}

/**
 * Pages backwards from the newest transaction until the API returns a short
 * page (inception reached, or `afterLt` reached for incremental refreshes).
 * Returns transactions newer than `afterLt`, oldest first, deduplicated.
 */
export async function fetchTransactions(
  source: SourceId,
  afterLt: string | null,
  ctx: Ctx & { onPage?: (p: { pages: number; txs: number; oldestUtime: number | null }) => void } = {},
): Promise<RawTx[]> {
  const { pageSize, throttleMs } = SOURCES[source];
  const map = source === "toncenter" ? mapToncenterTx : mapTonapiTx;
  const seen = new Map<string, RawTx>();
  let cursor: string | null = null;
  let pages = 0;
  for (;;) {
    const json = await getJson(pageUrl(source, cursor, afterLt), ctx);
    const list = (json as { transactions?: unknown } | null)?.transactions;
    if (!Array.isArray(list))
      throw new SchemaError(`${SOURCES[source].label}: response has no "transactions" array`);
    const page = list.map(map);
    pages++;
    let fresh = 0;
    let oldest: RawTx | null = null;
    for (const tx of page) {
      if (!seen.has(tx.hash)) fresh++;
      seen.set(tx.hash, tx);
      if (!oldest || compareLt(tx.lt, oldest.lt) < 0) oldest = tx;
    }
    let oldestUtime: number | null = null;
    for (const tx of seen.values()) if (oldestUtime === null || tx.utime < oldestUtime) oldestUtime = tx.utime;
    ctx.onPage?.({ pages, txs: seen.size, oldestUtime });
    if (page.length < pageSize || fresh === 0 || !oldest) break;
    cursor = oldest.lt;
    await sleep(throttleMs, ctx.signal);
  }
  const all = dedupeTxs([...seen.values()]);
  return afterLt ? all.filter((t) => compareLt(t.lt, afterLt) > 0) : all;
}

function applyTxs(base: Cache | null, source: SourceId, txs: RawTx[], now: number, full: boolean): Cache {
  const selfRaw =
    base?.selfRaw ?? normalizeAddress(txs.find((t) => t.account)?.account ?? null) ?? null;
  const rows: Row[] = [];
  const excluded: Partial<Record<ExclusionReason, number>> = { ...(base?.excluded ?? {}) };
  for (const tx of txs) {
    const c = classify(tx, selfRaw ?? "");
    if (c.type === "row") rows.push(c.row);
    else if (c.type === "excluded") excluded[c.reason] = (excluded[c.reason] ?? 0) + 1;
  }
  const newest = txs[txs.length - 1];
  const first = txs[0];
  return {
    v: CACHE_VERSION,
    address: COLLECTOR_FRIENDLY,
    selfRaw,
    source,
    rows: mergeRows(base?.rows ?? [], rows),
    newestLt: newest ? newest.lt : (base?.newestLt ?? null),
    txScanned: (base?.txScanned ?? 0) + txs.length,
    excluded,
    firstTxUtime: base?.firstTxUtime ?? (first ? first.utime : null),
    lastSuccess: now,
    lastFullSync: full ? now : (base?.lastFullSync ?? now),
  };
}

async function syncWith(
  source: SourceId,
  cache: Cache | null,
  opts: SyncOptions,
): Promise<Cache> {
  const report = (mode: Progress["mode"], p: Partial<Progress>) =>
    opts.onProgress?.({ mode, source, pages: 0, txs: 0, oldestUtime: null, waiting: null, ...p });
  let last: Partial<Progress> = {};
  const ctxFor = (mode: Progress["mode"]) => ({
    ...(opts.signal ? { signal: opts.signal } : {}),
    ...(opts.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
    onWait: (waiting: Progress["waiting"]) => report(mode, { ...last, waiting }),
    onPage: (p: { pages: number; txs: number; oldestUtime: number | null }) => {
      last = p;
      report(mode, p);
    },
  });

  if (cache && cache.newestLt && !opts.forceFull) {
    report("incremental", {});
    const txs = await fetchTransactions(source, cache.newestLt, ctxFor("incremental"));
    if (verifyChain(txs, cache.newestLt).ok) return applyTxs(cache, source, txs, Date.now(), false);
    // The new transactions do not attach to the cached history: rebuild from scratch.
  }
  last = {};
  report("full", {});
  const txs = await fetchTransactions(source, null, ctxFor("full"));
  const chain = verifyChain(txs, "0");
  if (!chain.ok)
    throw new CoverageError(
      `${SOURCES[source].label}: history is not contiguous (${chain.breaks} gap${chain.breaks === 1 ? "" : "s"}), refusing to show incomplete data`,
    );
  return applyTxs(null, source, txs, Date.now(), true);
}

export interface SyncOptions {
  signal?: AbortSignal;
  forceFull?: boolean;
  onProgress?: (p: Progress) => void;
  fetchImpl?: typeof fetch;
  sources?: SourceId[];
}

/** Tries each public source in order; throws a combined error when all fail. */
export async function runSync(cache: Cache | null, opts: SyncOptions = {}): Promise<Cache> {
  const errors: string[] = [];
  for (const source of opts.sources ?? (["toncenter", "tonapi"] as SourceId[])) {
    try {
      return await syncWith(source, cache, opts);
    } catch (e) {
      if (isAbort(e)) throw e;
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(errors.join(" · "));
}