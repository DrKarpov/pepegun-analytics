import { COLLECTOR_FRIENDLY, UNIT } from "./config";
import { exactGram, fmtInt, fmtUtc, formatGram, nanoToNumber } from "./format";
import type { DailyPoint, Metrics } from "./metrics";

export function dailyCsv(daily: DailyPoint[]): string {
  const head = [
    "date_utc",
    "day_status",
    "active_wallets",
    "new_wallets",
    "returning_wallets",
    "paying_wallets",
    "fee_count",
    `fee_revenue_${UNIT.toLowerCase()}`,
    "fee_revenue_nano",
    "micro_markers",
    "cumulative_wallets",
    "cumulative_paying_wallets",
  ];
  const lines = daily.map((d) =>
    [
      d.date,
      d.status,
      d.active,
      d.newWallets,
      d.returning,
      d.paying,
      d.feeCount,
      exactGram(d.feeNano),
      d.feeNano.toString(),
      d.markers,
      d.cumWallets,
      d.cumPaying,
    ].join(","),
  );
  return [head.join(","), ...lines].join("\r\n") + "\r\n";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Canvas palette mirrors the design tokens in src/styles.css. */
const C = {
  bg: "#0b0d0c",
  card: "#141716",
  line: "#252a27",
  text: "#eef3ee",
  dim: "#8b958e",
  green: "#3dff6e",
};

export interface SummaryInput {
  metrics: Metrics;
  rangeLabel: string;
  lastSuccess: number;
  sourceLabel: string;
}

/** Draws a 1200x675 share card (rendered at 2x). */
export async function renderSummaryPng(input: SummaryInput): Promise<Blob> {
  const { metrics: m } = input;
  if (document.fonts?.ready) await document.fonts.ready;
  const W = 1200;
  const H = 675;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");
  ctx.scale(2, 2);
  const sans = '"Space Grotesk", system-ui, sans-serif';
  const mono = '"JetBrains Mono", ui-monospace, monospace';

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W - 120, -40, 0, W - 120, -40, 520);
  glow.addColorStop(0, "rgba(61,255,110,0.16)");
  glow.addColorStop(1, "rgba(61,255,110,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const text = (s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left") => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(s, x, y);
  };
  const box = (x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  ctx.fillStyle = C.green;
  ctx.fillRect(56, 50, 6, 44);
  text("Pepegun Analytics", 78, 76, `700 34px ${sans}`, C.text);
  text("Independent on-chain dashboard · not an official Pepegun product", 78, 100, `400 15px ${sans}`, C.dim);
  text(input.rangeLabel, W - 56, 76, `600 18px ${sans}`, C.green, "right");
  text(`Updated ${fmtUtc(input.lastSuccess)}`, W - 56, 100, `400 15px ${sans}`, C.dim, "right");

  const tiles: [string, string, string][] = [
    ["Fee revenue", formatGram(m.feeNano, 2), UNIT],
    ["Fee payments", fmtInt(m.feeCount), "transfers"],
    ["Unique wallets", fmtInt(m.wallets), "addresses"],
    ["Paying wallets", fmtInt(m.paying), "addresses"],
    ["Micro markers", fmtInt(m.markers), "transfers"],
    ["WAU / MAU", `${fmtInt(m.activity.wau)} / ${fmtInt(m.activity.mau)}`, `as of ${m.activity.anchorDate}`],
  ];
  const tw = (W - 112 - 5 * 16) / 6;
  tiles.forEach(([label, value, sub], i) => {
    const x = 56 + i * (tw + 16);
    box(x, 136, tw, 128);
    text(label.toUpperCase(), x + 16, 166, `500 12px ${sans}`, C.dim);
    let size = 30;
    ctx.font = `600 ${size}px ${mono}`;
    while (ctx.measureText(value).width > tw - 32 && size > 14) ctx.font = `600 ${--size}px ${mono}`;
    text(value, x + 16, 212, `600 ${size}px ${mono}`, i === 0 ? C.green : C.text);
    text(sub, x + 16, 240, `400 13px ${sans}`, C.dim);
  });

  // daily fee revenue bars
  const cx = 56;
  const cy = 292;
  const cw = W - 112;
  const ch = 290;
  box(cx, cy, cw, ch);
  text(`Daily fee revenue (${UNIT}, UTC days)`, cx + 20, cy + 32, `600 15px ${sans}`, C.text);
  const data = m.daily.map((d) => nanoToNumber(d.feeNano));
  const max = Math.max(...data, 0);
  const px = cx + 20;
  const pw = cw - 40;
  const py = cy + 56;
  const ph = ch - 100;
  if (data.length === 0 || max === 0) {
    text("No fee payments in this range", cx + cw / 2, cy + ch / 2 + 10, `400 16px ${sans}`, C.dim, "center");
  } else {
    text(`peak ${max.toFixed(2)}`, cx + cw - 20, cy + 32, `400 13px ${mono}`, C.dim, "right");
    const step = pw / data.length;
    const bw = Math.max(1, Math.min(28, step * 0.72));
    data.forEach((v, i) => {
      const h = Math.max(v > 0 ? 2 : 0, (v / max) * ph);
      const incomplete = m.daily[i]?.status !== "complete";
      ctx.fillStyle = incomplete ? "rgba(61,255,110,0.4)" : C.green;
      ctx.fillRect(px + i * step + (step - bw) / 2, py + ph - h, bw, h);
    });
    ctx.fillStyle = C.line;
    ctx.fillRect(px, py + ph, pw, 1);
    const first = m.daily[0];
    const last = m.daily[m.daily.length - 1];
    if (first) text(first.date, px, py + ph + 22, `400 12px ${mono}`, C.dim);
    if (last) text(last.date, px + pw, py + ph + 22, `400 12px ${mono}`, C.dim, "right");
  }

  text(
    `Source: public TON address ${COLLECTOR_FRIENDLY} · ${input.sourceLabel}`,
    56,
    H - 46,
    `400 13px ${mono}`,
    C.dim,
  );
  text(
    "Wallets are addresses, not people. Only comments containing “Pepegun fee” count as fees.",
    56,
    H - 24,
    `400 13px ${sans}`,
    C.dim,
  );

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png"),
  );
}