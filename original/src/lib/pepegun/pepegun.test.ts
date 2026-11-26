import { describe, expect, it } from "vitest";
import { classify, mapToncenterTx, mergeRows, verifyChain, type RawTx, type Row } from "./parse";
import { computeMetrics, DAY, resolveRange, weekIndex, weekStartDay, dayIndex } from "./metrics";
import { formatGram } from "./format";
import { dailyCsv } from "./export";
import { fetchTransactions, getJson, runSync } from "./api";

const SELF = `0:${"f".repeat(64)}`;
const A = `0:${"a".repeat(64)}`;
const B = `0:${"b".repeat(64)}`;
const C = `0:${"c".repeat(64)}`;

const tx = (o: Partial<RawTx["inMsg"] & object> & { aborted?: boolean } = {}): RawTx => ({
  hash: "h1",
  lt: "10",
  prevLt: "0",
  utime: 1,
  aborted: o.aborted ?? false,
  account: SELF,
  inMsg: {
    source: "source" in o ? (o.source ?? null) : A.toUpperCase(),
    value: o.value ?? "15000000",
    bounced: o.bounced ?? false,
    comment: "comment" in o ? (o.comment ?? null) : "🔫 Pepegun fee · STON.fi · id",
  },
});

describe("classification rules", () => {
  it("counts a transfer as a fee only when the comment contains 'Pepegun fee'", () => {
    const fee = classify(tx(), SELF);
    expect(fee.type === "row" && fee.row.k).toBe("fee");
    const marker = classify(tx({ comment: "🔫 Pepegun · Stonks", value: "100000" }), SELF);
    expect(marker.type === "row" && marker.row.k).toBe("marker");
    expect(marker.type === "row" && marker.row.d).toBe("Stonks");
  });
  it("normalises the full raw sender address to lowercase", () => {
    const r = classify(tx(), SELF);
    expect(r.type === "row" && r.row.s).toBe(A);
  });
  it("ignores comments without Pepegun", () => {
    expect(classify(tx({ comment: "cheap stars" }), SELF).type).toBe("irrelevant");
    expect(classify(tx({ comment: null }), SELF).type).toBe("irrelevant");
  });
  it("excludes self transfers, bounced, failed, sender-less and zero-value messages", () => {
    const reason = (t: RawTx) => {
      const c = classify(t, SELF);
      return c.type === "excluded" ? c.reason : c.type;
    };
    expect(reason(tx({ source: SELF.toUpperCase() }))).toBe("self_transfer");
    expect(reason(tx({ bounced: true }))).toBe("bounced");
    expect(reason(tx({ aborted: true }))).toBe("failed");
    expect(reason(tx({ source: null }))).toBe("no_sender");
    expect(reason(tx({ value: "0" }))).toBe("zero_value");
  });
});

const row = (h: string, day: number, s: string, k: Row["k"], v: string, d = "DeDust", secs = 3600): Row => ({
  h,
  lt: String(day * 1000 + secs),
  t: day * 86400 + secs,
  s,
  v,
  c: "",
  k,
  d,
});

describe("merge and coverage", () => {
  it("deduplicates rows by transaction hash", () => {
    const a = row("x", 1, A, "fee", "5");
    expect(mergeRows([a], [a, row("y", 2, B, "fee", "5")])).toHaveLength(2);
  });
  it("detects a gap in the transaction chain", () => {
    expect(verifyChain([{ lt: "5", prevLt: "0" }, { lt: "9", prevLt: "5" }], "0").ok).toBe(true);
    expect(verifyChain([{ lt: "5", prevLt: "0" }, { lt: "9", prevLt: "7" }], "0").ok).toBe(false);
    expect(verifyChain([{ lt: "5", prevLt: "3" }], "0").ok).toBe(false);
  });
});

describe("metrics", () => {
  // Monday-start weeks: day 20000 is 2024-10-04 (Friday)
  const D = 20000;
  const rows = [
    row("1", D, A, "fee", "9007199254740993000"), // larger than 2^53 nano
    row("2", D, A, "fee", "1"),
    row("3", D, B, "marker", "100000"),
    row("4", D + 1, A, "marker", "100000"),
    row("5", D + 1, C, "fee", "2000000000", "STON.fi"),
    row("6", D + 3, B, "fee", "500000000"),
  ];
  const now = (D + 3) * DAY + 12 * 3600_000;
  const all = computeMetrics(rows, { from: -Infinity, to: now + 1, label: "" }, now);

  it("sums fees exactly in BigInt nano units and keeps markers out of revenue", () => {
    expect(all.feeNano).toBe(9007199254740993000n + 1n + 2000000000n + 500000000n);
    expect(all.feeCount).toBe(4);
    expect(all.markers).toBe(2);
  });
  it("counts distinct wallets per interval from rows, not by adding days", () => {
    expect(all.wallets).toBe(3);
    expect(all.paying).toBe(3);
    expect(all.daily.map((d) => d.active)).toEqual([2, 2, 0, 1]);
    expect(all.daily.map((d) => d.paying)).toEqual([1, 1, 0, 1]);
    expect(all.weekly.map((w) => w.active)).toEqual([3, 1]);
  });
  it("splits new and returning wallets and accumulates distinct wallets", () => {
    expect(all.daily.map((d) => d.newWallets)).toEqual([2, 1, 0, 0]);
    expect(all.daily.map((d) => d.returning)).toEqual([0, 1, 0, 1]);
    expect(all.daily.map((d) => d.cumWallets)).toEqual([2, 3, 3, 3]);
    expect(all.daily.map((d) => d.cumPaying)).toEqual([1, 2, 2, 3]);
  });
  it("labels the current UTC day as incomplete", () => {
    expect(all.daily.map((d) => d.status)).toEqual(["complete", "complete", "complete", "incomplete"]);
    expect(all.daily[0]?.date).toBe("2024-10-04");
  });
  it("computes DAU, WAU and MAU as distinct wallets anchored at the range end", () => {
    expect(all.activity).toMatchObject({ dau: 1, dauPrev: 0, wau: 3, mau: 3, anchorIncomplete: true });
  });
  it("restricts totals to the selected range and marks earlier wallets as returning", () => {
    const r = computeMetrics(rows, { from: (D + 1) * DAY, to: (D + 2) * DAY, label: "" }, now);
    expect(r).toMatchObject({ wallets: 2, paying: 1, newWallets: 1, returning: 1, feeCount: 1, markers: 1 });
    expect(r.feeNano).toBe(2000000000n);
    expect(r.daily).toHaveLength(1);
  });
  it("builds weekly retention cohorts", () => {
    expect(all.cohorts).toEqual([{ weekStart: "2024-09-30", size: 3, active: [3, 1] }]);
  });
  it("breaks fees and markers down by venue", () => {
    const ston = all.venues.find((v) => v.venue === "STON.fi");
    expect(ston).toMatchObject({ feeCount: 1, markers: 0, wallets: 1 });
    expect(all.venues.find((v) => v.venue === "DeDust")).toMatchObject({ feeCount: 3, markers: 2, wallets: 2 });
  });
  it("uses Monday-start UTC weeks", () => {
    const monday = dayIndex(Date.parse("2026-10-12T00:00:00Z"));
    expect(weekStartDay(weekIndex(monday + 6))).toBe(monday);
    expect(weekStartDay(weekIndex(monday - 1))).toBe(monday - 7);
  });
  it("resolves presets on UTC day boundaries", () => {
    const r = resolveRange("7d", now);
    expect("from" in r && r.from).toBe((D - 3) * DAY);
    expect(resolveRange("custom", now, { from: "2024-10-05", to: "2024-10-04" })).toHaveProperty("error");
  });
});

describe("formatting and export", () => {
  it("formats nano units exactly", () => {
    expect(formatGram(63884779447n, 2)).toBe("63.88");
    expect(formatGram(63884779447n, 9)).toBe("63.884779447");
    expect(formatGram(1999999999n, 2)).toBe("2.00");
    expect(formatGram(1234567000000000n, 0)).toBe("1,234,567");
  });
  it("exports one CSV line per day with exact nano amounts", () => {
    const m = computeMetrics([row("1", 20000, A, "fee", "1500000001")], { from: -Infinity, to: 20001 * DAY, label: "" }, 20005 * DAY);
    const lines = dailyCsv(m.daily).trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("2024-10-04,complete,1,1,0,1,1,1.500000001,1500000001,0,1,1");
  });
});

describe("api", () => {
  const item = (lt: number, prev: number) => ({
    account: SELF.toUpperCase(),
    hash: btoa(String(lt)),
    lt: String(lt),
    now: 1790000000 + lt,
    prev_trans_lt: String(prev),
    description: { aborted: false },
    in_msg: {
      source: A.toUpperCase(),
      value: "15000000",
      bounced: false,
      message_content: { decoded: { type: "text_comment", comment: "🔫 Pepegun fee · DeDust · x" } },
    },
  });
  const res = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "retry-after": "0.01" } });

  it("maps the Toncenter v3 schema and rejects unknown shapes", () => {
    expect(mapToncenterTx(item(5, 0))).toMatchObject({ lt: "5", prevLt: "0", aborted: false });
    expect(() => mapToncenterTx({ hash: "x" })).toThrow();
  });
  it("retries after a 429 and then succeeds", async () => {
    let calls = 0;
    const fetchImpl = (async () => (++calls < 3 ? res({}, 429) : res({ ok: 1 }))) as typeof fetch;
    expect(await getJson("https://toncenter.com/x", { fetchImpl })).toEqual({ ok: 1 });
    expect(calls).toBe(3);
  });
  it("does not retry a 4xx that is not a rate limit", async () => {
    let calls = 0;
    const fetchImpl = (async () => (calls++, res({}, 404))) as typeof fetch;
    await expect(getJson("https://toncenter.com/x", { fetchImpl })).rejects.toThrow("404");
    expect(calls).toBe(1);
  });
  it("refuses a history with a gap and accepts a contiguous one", async () => {
    const ok = (async () => res({ transactions: [item(9, 5), item(5, 0)] })) as typeof fetch;
    const cache = await runSync(null, { fetchImpl: ok, sources: ["toncenter"] });
    expect(cache.rows).toHaveLength(2);
    expect(cache.txScanned).toBe(2);
    const gap = (async () => res({ transactions: [item(9, 7), item(5, 0)] })) as typeof fetch;
    await expect(runSync(null, { fetchImpl: gap, sources: ["toncenter"] })).rejects.toThrow("not contiguous");
  });
  it("returns only transactions newer than the cached one on incremental refresh", async () => {
    const f = (async () => res({ transactions: [item(12, 9), item(9, 5)] })) as typeof fetch;
    const txs = await fetchTransactions("toncenter", "9", { fetchImpl: f });
    expect(txs.map((t) => t.lt)).toEqual(["12"]);
  });
});