import { NANO } from "./config";

/** Exact decimal rendering of nano units, rounded half-up to `digits` places. */
export function formatGram(nano: bigint, digits = 2): string {
  const d = Math.max(0, Math.min(9, digits));
  const unit = 10n ** BigInt(9 - d);
  const scaled = (nano + unit / 2n) / unit;
  const base = 10n ** BigInt(d);
  const whole = (scaled / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (d === 0) return whole;
  return `${whole}.${(scaled % base).toString().padStart(d, "0")}`;
}

/** Lossy conversion for chart axes only. Totals always use BigInt. */
export const nanoToNumber = (nano: bigint) => Number(nano / 1000n) / 1_000_000;

export const exactGram = (nano: bigint) =>
  `${nano / NANO}.${(nano % NANO).toString().padStart(9, "0")}`;

export const fmtInt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const fmtUtc = (ms: number) =>
  `${new Date(ms).toISOString().slice(0, 16).replace("T", " ")} UTC`;

export const fmtPct = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toFixed(part === whole ? 0 : 1)}%` : "n/a";

export function fmtAgo(ms: number, now: number): string {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
}