/**
 * Normalisation and classification of raw blockchain transactions.
 * Everything here is pure and covered by tests.
 */
export interface RawTx {
  /** transaction hash, lowercase hex */
  hash: string;
  lt: string;
  prevLt: string;
  /** unix seconds (UTC) */
  utime: number;
  aborted: boolean;
  /** raw account address the transaction belongs to */
  account: string | null;
  inMsg: null | {
    source: string | null;
    /** native value in nano units, decimal string */
    value: string;
    bounced: boolean;
    /** decoded text comment, when the body is a text comment */
    comment: string | null;
  };
}

export type RowKind = "fee" | "marker";

/** A qualifying Pepegun transfer. Compact keys because rows are cached locally. */
export interface Row {
  h: string; // tx hash (hex)
  lt: string;
  t: number; // unix seconds
  s: string; // full raw sender address, lowercase
  v: string; // nano units, decimal string (BigInt-safe)
  c: string; // comment
  k: RowKind;
  d: string; // venue label parsed from the comment
}

export type ExclusionReason =
  | "failed"
  | "bounced"
  | "no_sender"
  | "self_transfer"
  | "zero_value"
  | "bad_address";

export type Classified =
  | { type: "row"; row: Row }
  | { type: "excluded"; reason: ExclusionReason }
  | { type: "irrelevant" };

const RAW_ADDRESS = /^-?\d+:[0-9a-f]{64}$/;

/** Lowercases a raw `workchain:hex` address; returns null for anything else. */
export function normalizeAddress(addr: unknown): string | null {
  if (typeof addr !== "string") return null;
  const a = addr.trim().toLowerCase();
  return RAW_ADDRESS.test(a) ? a : null;
}

export function base64ToHex(b64: string): string {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  let out = "";
  for (let i = 0; i < bin.length; i++) out += bin.charCodeAt(i).toString(16).padStart(2, "0");
  return out;
}

export const isPepegunComment = (c: string) => c.toLowerCase().includes("pepegun");
export const isFeeComment = (c: string) => c.toLowerCase().includes("pepegun fee");

/** "🔫 Pepegun fee · STON.fi · <id>" -> "STON.fi" */
export function venueFromComment(c: string): string {
  const parts = c.split("·").map((p) => p.trim());
  return parts[1] && parts[1].length > 0 ? parts[1].slice(0, 48) : "Unlabelled";
}

export function classify(tx: RawTx, selfRaw: string): Classified {
  const m = tx.inMsg;
  if (!m || m.comment == null || !isPepegunComment(m.comment)) return { type: "irrelevant" };
  if (tx.aborted) return { type: "excluded", reason: "failed" };
  if (m.bounced) return { type: "excluded", reason: "bounced" };
  if (m.source == null) return { type: "excluded", reason: "no_sender" };
  const sender = normalizeAddress(m.source);
  if (!sender) return { type: "excluded", reason: "bad_address" };
  if (sender === selfRaw || sender === normalizeAddress(tx.account))
    return { type: "excluded", reason: "self_transfer" };
  let value: bigint;
  try {
    value = BigInt(m.value);
  } catch {
    return { type: "excluded", reason: "zero_value" };
  }
  if (value <= 0n) return { type: "excluded", reason: "zero_value" };
  return {
    type: "row",
    row: {
      h: tx.hash,
      lt: tx.lt,
      t: tx.utime,
      s: sender,
      v: value.toString(),
      c: m.comment,
      k: isFeeComment(m.comment) ? "fee" : "marker",
      d: venueFromComment(m.comment),
    },
  };
}

export const compareLt = (a: string, b: string) => {
  const x = BigInt(a);
  const y = BigInt(b);
  return x < y ? -1 : x > y ? 1 : 0;
};

/** Deduplicates by transaction hash and returns rows ordered oldest to newest. */
export function mergeRows(existing: Row[], incoming: Row[]): Row[] {
  const byHash = new Map<string, Row>();
  for (const r of existing) byHash.set(r.h, r);
  for (const r of incoming) byHash.set(r.h, r);
  return [...byHash.values()].sort((a, b) => compareLt(a.lt, b.lt));
}

export function dedupeTxs(txs: RawTx[]): RawTx[] {
  const byHash = new Map<string, RawTx>();
  for (const t of txs) byHash.set(t.hash, t);
  return [...byHash.values()].sort((a, b) => compareLt(a.lt, b.lt));
}

/**
 * Every TON transaction stores the logical time of the previous transaction of
 * the same account. A fetched set is gap-free when each transaction points at
 * the one before it and the oldest points at `expectedOldestPrev`
 * ("0" for the very first transaction of the account).
 */
export function verifyChain(
  txsAsc: Pick<RawTx, "lt" | "prevLt">[],
  expectedOldestPrev: string,
): { ok: boolean; breaks: number } {
  if (txsAsc.length === 0) return { ok: true, breaks: 0 };
  let breaks = 0;
  const first = txsAsc[0];
  if (!first || first.prevLt !== expectedOldestPrev) breaks++;
  for (let i = 1; i < txsAsc.length; i++) {
    const cur = txsAsc[i];
    const prev = txsAsc[i - 1];
    if (!cur || !prev || cur.prevLt !== prev.lt) breaks++;
  }
  return { ok: breaks === 0, breaks };
}

/* ---------- API response mappers (schema checked) ---------- */

export class SchemaError extends Error {}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null;
const numStr = (v: unknown): string | null =>
  typeof v === "string" && /^\d+$/.test(v)
    ? v
    : typeof v === "number" && Number.isSafeInteger(v) && v >= 0
      ? String(v)
      : null;

/** Toncenter v3 `GET /api/v3/transactions` item. */
export function mapToncenterTx(x: unknown): RawTx {
  if (!isObj(x)) throw new SchemaError("Toncenter: transaction is not an object");
  const lt = numStr(x["lt"]);
  const prevLt = numStr(x["prev_trans_lt"]);
  const desc = x["description"];
  if (typeof x["hash"] !== "string" || !lt || !prevLt || typeof x["now"] !== "number" || !isObj(desc))
    throw new SchemaError("Toncenter: unexpected transaction schema");
  if (typeof desc["aborted"] !== "boolean")
    throw new SchemaError("Toncenter: missing description.aborted");
  const im = x["in_msg"];
  let inMsg: RawTx["inMsg"] = null;
  if (isObj(im)) {
    const content = im["message_content"];
    const decoded = isObj(content) ? content["decoded"] : null;
    const comment =
      isObj(decoded) &&
      (decoded["type"] === "text_comment" || decoded["@type"] === "text_comment") &&
      typeof decoded["comment"] === "string"
        ? decoded["comment"]
        : null;
    inMsg = {
      source: typeof im["source"] === "string" ? im["source"] : null,
      value: numStr(im["value"]) ?? "0",
      bounced: im["bounced"] === true,
      comment,
    };
  }
  return {
    hash: base64ToHex(x["hash"]),
    lt,
    prevLt,
    utime: x["now"],
    aborted: desc["aborted"],
    account: typeof x["account"] === "string" ? x["account"] : null,
    inMsg,
  };
}

/** TonAPI v2 `GET /v2/blockchain/accounts/{id}/transactions` item. */
export function mapTonapiTx(x: unknown): RawTx {
  if (!isObj(x)) throw new SchemaError("TonAPI: transaction is not an object");
  const lt = numStr(x["lt"]);
  // TonAPI omits prev_trans_lt on the very first transaction of an account.
  const prevLt = x["prev_trans_lt"] === undefined ? "0" : numStr(x["prev_trans_lt"]);
  if (
    typeof x["hash"] !== "string" ||
    !lt ||
    !prevLt ||
    typeof x["utime"] !== "number" ||
    typeof x["aborted"] !== "boolean" ||
    typeof x["success"] !== "boolean"
  )
    throw new SchemaError("TonAPI: unexpected transaction schema");
  const im = x["in_msg"];
  const acc = x["account"];
  let inMsg: RawTx["inMsg"] = null;
  if (isObj(im)) {
    const src = im["source"];
    const body = im["decoded_body"];
    const comment =
      im["decoded_op_name"] === "text_comment" && isObj(body) && typeof body["text"] === "string"
        ? body["text"]
        : null;
    inMsg = {
      source: isObj(src) && typeof src["address"] === "string" ? src["address"] : null,
      value: numStr(im["value"]) ?? "0",
      bounced: im["bounced"] === true,
      comment,
    };
  }
  return {
    hash: x["hash"].toLowerCase(),
    lt,
    prevLt,
    utime: x["utime"],
    aborted: x["aborted"] || !x["success"],
    account: isObj(acc) && typeof acc["address"] === "string" ? acc["address"] : null,
    inMsg,
  };
}