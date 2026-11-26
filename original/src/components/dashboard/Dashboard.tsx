import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Download, ExternalLink, ImageDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePepegun } from "@/hooks/use-pepegun";
import { COLLECTOR_FRIENDLY, SOURCES, SOURCE_URL, STALE_MS, UNIT } from "@/lib/pepegun/config";
import { dailyCsv, downloadBlob, renderSummaryPng } from "@/lib/pepegun/export";
import { exactGram, fmtAgo, fmtInt, fmtPct, fmtUtc, formatGram, nanoToNumber } from "@/lib/pepegun/format";
import { computeMetrics, dayKey, dayIndex, resolveRange, type Metrics, type Preset } from "@/lib/pepegun/metrics";
import { cn } from "@/lib/utils";
import {
  ActiveWalletsChart,
  CumulativeChart,
  RevenueChart,
  TransfersChart,
  WeeklyChart,
  type ChartPoint,
} from "./charts";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "30d", label: "30d" },
  { id: "7d", label: "7d" },
  { id: "24h", label: "24h" },
  { id: "custom", label: "Custom" },
];

const EXCLUSION_LABEL: Record<string, string> = {
  self_transfer: "self transfers",
  bounced: "bounced",
  failed: "failed",
  no_sender: "without sender",
  zero_value: "zero value",
  bad_address: "unreadable sender",
};

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 shrink-0 text-primary" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 4v6M16 22v6M4 16h6M22 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}

function Kpi({
  label,
  value,
  unit,
  hint,
  accent,
  state,
}: {
  label: string;
  value: string | null;
  unit?: string;
  hint?: ReactNode;
  accent?: boolean;
  state: "ready" | "loading" | "unavailable";
}) {
  return (
    <div className={cn("panel min-w-0 p-4", accent && "border-primary/40 glow")}>
      <div className="eyebrow">{label}</div>
      {state === "ready" && value !== null ? (
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={cn("num truncate text-2xl font-semibold sm:text-[1.75rem]", accent && "text-primary")}>
            {value}
          </span>
          {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
        </div>
      ) : state === "loading" ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded-md bg-muted" />
      ) : (
        <div className="mt-2 text-base font-medium text-muted-foreground">Unavailable</div>
      )}
      {hint && state === "ready" && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function SectionTitle({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-3 mt-10 flex flex-wrap items-end justify-between gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

const th = "whitespace-nowrap px-3 py-2.5 text-right font-medium first:text-left";
const td = "num whitespace-nowrap px-3 py-2 text-right first:text-left";

function StatusTag({ status }: { status: string }) {
  if (status === "complete") return null;
  return (
    <span className="ml-2 rounded-full border border-warning/40 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wide text-warning">
      {status}
    </span>
  );
}

function VenueTable({ m }: { m: Metrics }) {
  const max = m.venues.reduce((a, v) => (v.feeNano > a ? v.feeNano : a), 0n);
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className={th}>Label in comment</th>
            <th className={th}>Fee revenue ({UNIT})</th>
            <th className={th}>Share</th>
            <th className={th}>Fee payments</th>
            <th className={th}>Micro markers</th>
            <th className={th}>Wallets</th>
            <th className={th}>Paying</th>
          </tr>
        </thead>
        <tbody>
          {m.venues.map((v) => (
            <tr key={v.venue} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2">
                <div className="font-medium">{v.venue}</div>
                <div className="mt-1 h-1 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${max > 0n ? Number((v.feeNano * 1000n) / max) / 10 : 0}%` }}
                  />
                </div>
              </td>
              <td className={td} title={`${exactGram(v.feeNano)} ${UNIT}`}>
                {formatGram(v.feeNano, 3)}
              </td>
              <td className={cn(td, "text-muted-foreground")}>
                {m.feeNano > 0n ? `${(Number((v.feeNano * 10000n) / m.feeNano) / 100).toFixed(1)}%` : "n/a"}
              </td>
              <td className={td}>{fmtInt(v.feeCount)}</td>
              <td className={td}>{fmtInt(v.markers)}</td>
              <td className={td}>{fmtInt(v.wallets)}</td>
              <td className={td}>{fmtInt(v.paying)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Retention({ m }: { m: Metrics }) {
  const width = Math.max(...m.cohorts.map((c) => c.active.length), 0);
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className={th}>First seen (week of)</th>
            <th className={th}>Wallets</th>
            {Array.from({ length: width }, (_, k) => (
              <th key={k} className={cn(th, "text-center")}>
                W{k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {m.cohorts.map((c) => (
            <tr key={c.weekStart} className="border-b border-border/60 last:border-0">
              <td className={td}>{c.weekStart}</td>
              <td className={td}>{c.size}</td>
              {Array.from({ length: width }, (_, k) => {
                const n = c.active[k];
                if (n === undefined) return <td key={k} />;
                const share = c.size > 0 ? n / c.size : 0;
                const last = k === c.active.length - 1 && m.lastCohortWeekIncomplete;
                return (
                  <td key={k} className="p-1 text-center">
                    <div
                      className={cn("num rounded-md px-2 py-1.5 text-xs", last && "outline-dashed outline-1 outline-warning/50")}
                      style={{ background: `color-mix(in oklab, var(--primary) ${Math.round(share * 55)}%, var(--muted))` }}
                      title={`${n} of ${c.size} wallets${last ? " (week still in progress)" : ""}`}
                    >
                      {Math.round(share * 100)}%
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DailyTable({ m }: { m: Metrics }) {
  const [all, setAll] = useState(false);
  const rows = [...m.daily].reverse();
  const shown = all ? rows : rows.slice(0, 14);
  return (
    <div className="panel overflow-hidden">
      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-card text-xs text-muted-foreground">
            <tr>
              <th className={th}>Date (UTC)</th>
              <th className={th}>Active</th>
              <th className={th}>New</th>
              <th className={th}>Returning</th>
              <th className={th}>Paying</th>
              <th className={th}>Fee payments</th>
              <th className={th}>Fee revenue ({UNIT})</th>
              <th className={th}>Micro markers</th>
              <th className={th}>Cum. wallets</th>
              <th className={th}>Cum. paying</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.date} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                <td className={td}>
                  {d.date}
                  <StatusTag status={d.status} />
                </td>
                <td className={td}>{d.active}</td>
                <td className={td}>{d.newWallets}</td>
                <td className={td}>{d.returning}</td>
                <td className={td}>{d.paying}</td>
                <td className={td}>{d.feeCount}</td>
                <td className={cn(td, d.feeNano > 0n && "text-primary")} title={`${exactGram(d.feeNano)} ${UNIT}`}>
                  {formatGram(d.feeNano, 3)}
                </td>
                <td className={td}>{d.markers}</td>
                <td className={td}>{d.cumWallets}</td>
                <td className={td}>{d.cumPaying}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 14 && (
        <div className="border-t border-border p-2 text-center">
          <Button variant="ghost" size="sm" onClick={() => setAll((v) => !v)}>
            {all ? "Show the latest 14 days" : `Show all ${rows.length} days`}
          </Button>
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { cache, booted, syncing, progress, error, persisted, now, refresh } = usePepegun();
  const [preset, setPreset] = useState<Preset>("all");
  const [custom, setCustom] = useState<{ from: string; to: string } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const today = now ? dayKey(dayIndex(now)) : "";
  const firstRow = cache?.rows[0];
  const firstDate = firstRow ? dayKey(dayIndex(firstRow.t * 1000)) : today;
  const customValue = custom ?? { from: firstDate, to: today };

  const range = useMemo(() => (now ? resolveRange(preset, now, customValue) : null), [preset, now, customValue.from, customValue.to]);
  const rangeError = range && "error" in range ? range.error : null;
  const metrics = useMemo(
    () => (cache && now && range && !("error" in range) ? computeMetrics(cache.rows, range, now) : null),
    [cache, now, range],
  );
  const rangeLabel = range && !("error" in range) ? range.label : "";

  const daily: ChartPoint[] = useMemo(
    () =>
      (metrics?.daily ?? []).map((d) => ({
        date: d.date,
        short: d.date.slice(5),
        status: d.status,
        newWallets: d.newWallets,
        returning: d.returning,
        paying: d.paying,
        fee: nanoToNumber(d.feeNano),
        feeExact: formatGram(d.feeNano, 4),
        feeCount: d.feeCount,
        markers: d.markers,
        cumWallets: d.cumWallets,
        cumPaying: d.cumPaying,
      })),
    [metrics],
  );
  const weekly: ChartPoint[] = useMemo(
    () =>
      (metrics?.weekly ?? []).map((w) => ({
        date: `Week of ${w.weekStart}`,
        short: w.weekStart.slice(5),
        status: w.partial ? "partial week" : "complete",
        active: w.active,
        paying: w.paying,
      })),
    [metrics],
  );

  const stale = !!cache && !!now && (!!error || now - cache.lastSuccess > STALE_MS);
  const kpiState: "ready" | "loading" | "unavailable" = metrics ? "ready" : !booted || syncing ? "loading" : "unavailable";
  const status = !cache
    ? syncing || !booted
      ? { text: "Loading history", tone: "text-muted-foreground", dot: "bg-muted-foreground animate-pulse" }
      : { text: "Data unavailable", tone: "text-destructive", dot: "bg-destructive" }
    : syncing
      ? { text: "Refreshing", tone: "text-primary", dot: "bg-primary animate-pulse" }
      : stale
        ? { text: "Stale cache", tone: "text-warning", dot: "bg-warning" }
        : { text: "Up to date", tone: "text-primary", dot: "bg-primary" };

  const excludedTotal = Object.values(cache?.excluded ?? {}).reduce((a, n) => a + (n ?? 0), 0);
  const excludedText = Object.entries(cache?.excluded ?? {})
    .map(([k, n]) => `${n} ${EXCLUSION_LABEL[k] ?? k}`)
    .join(", ");

  const exportCsv = () => {
    if (!metrics) return;
    downloadBlob(
      new Blob([dailyCsv(metrics.daily)], { type: "text/csv;charset=utf-8" }),
      `pepegun-daily-${preset}-${today}.csv`,
    );
  };
  const exportPng = async () => {
    if (!metrics || !cache) return;
    setExportError(null);
    try {
      const blob = await renderSummaryPng({
        metrics,
        rangeLabel,
        lastSuccess: cache.lastSuccess,
        sourceLabel: SOURCES[cache.source].label,
      });
      downloadBlob(blob, `pepegun-summary-${preset}-${today}.png`);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PNG export failed");
    }
  };

  const m = metrics;
  const a = m?.activity;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">Pepegun Analytics</h1>
            <p className="text-xs text-muted-foreground">Independent on-chain dashboard · not affiliated with Pepegun</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className={cn("flex items-center justify-end gap-1.5 font-medium", status.tone)}>
              <span className={cn("size-2 rounded-full", status.dot)} />
              {status.text}
            </div>
            <div className="mt-0.5 text-muted-foreground">
              {cache && now ? (
                <span title={`Last successful update ${fmtUtc(cache.lastSuccess)}`}>
                  Updated {fmtUtc(cache.lastSuccess)} · {fmtAgo(cache.lastSuccess, now)}
                </span>
              ) : (
                "No successful update yet"
              )}
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => void refresh()} disabled={syncing} aria-label="Refresh data">
            <RefreshCw className={cn(syncing && "animate-spin")} />
          </Button>
        </div>
      </header>

      {syncing && (
        <div className="panel mt-5 p-4" role="status" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              {progress?.mode === "incremental"
                ? "Checking for new transactions"
                : "Downloading the full transaction history"}
              {progress && <span className="text-muted-foreground"> · {SOURCES[progress.source].label}</span>}
            </span>
            <span className="num text-xs text-muted-foreground">
              {progress && progress.pages > 0
                ? `${progress.pages} page${progress.pages === 1 ? "" : "s"} · ${fmtInt(progress.txs)} transactions${
                    progress.mode === "full" && progress.oldestUtime
                      ? ` · back to ${new Date(progress.oldestUtime * 1000).toISOString().slice(0, 10)}`
                      : ""
                  }`
                : "Connecting"}
            </span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
            <div className="bar-indeterminate h-full w-2/5 rounded-full bg-primary" />
          </div>
          {progress?.waiting && (
            <p className="mt-2 text-xs text-warning">
              {progress.waiting.reason}: retry {progress.waiting.attempt} in about {progress.waiting.seconds}s
            </p>
          )}
        </div>
      )}

      {error && !syncing && (
        <div className="mt-5 flex flex-wrap items-start gap-3 rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 p-4 text-sm" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {cache
                ? `The last refresh failed. Showing cached data from ${fmtUtc(cache.lastSuccess)}.`
                : "The blockchain data could not be loaded. No figures are shown rather than guessed ones."}
            </p>
            <p className="mt-1 break-words text-xs text-muted-foreground">{error}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      )}
      {!persisted && (
        <p className="mt-3 text-xs text-warning">
          This browser refused local storage, so the history will be downloaded again on the next visit.
        </p>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-card p-1" role="group" aria-label="Time range">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  preset === p.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2 text-sm">
              <input
                type="date"
                aria-label="Start date (UTC)"
                value={customValue.from}
                max={today}
                onChange={(e) => setCustom({ ...customValue, from: e.target.value })}
                className="num h-9 rounded-md border border-input bg-card px-2 text-sm"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                aria-label="End date (UTC)"
                value={customValue.to}
                max={today}
                onChange={(e) => setCustom({ ...customValue, to: e.target.value })}
                className="num h-9 rounded-md border border-input bg-card px-2 text-sm"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!m}>
            <Download /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportPng()} disabled={!m}>
            <ImageDown /> PNG summary
          </Button>
        </div>
      </div>
      {rangeError && <p className="mt-2 text-sm text-warning">{rangeError}</p>}
      {exportError && <p className="mt-2 text-sm text-destructive">{exportError}</p>}
      <p className="mt-2 text-xs text-muted-foreground">
        {rangeLabel && `${rangeLabel}. `}All dates are UTC. Today is still in progress and marked incomplete.
      </p>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          state={kpiState}
          accent
          label="Fee revenue"
          value={m ? formatGram(m.feeNano, 2) : null}
          unit={UNIT}
          hint={m && <span className="num">{exactGram(m.feeNano)} exact</span>}
        />
        <Kpi
          state={kpiState}
          label="Fee payments"
          value={m ? fmtInt(m.feeCount) : null}
          hint={m && m.feeCount > 0 ? `avg ${formatGram(m.feeNano / BigInt(m.feeCount), 4)} ${UNIT}` : "none in range"}
        />
        <Kpi
          state={kpiState}
          label="Unique wallets"
          value={m ? fmtInt(m.wallets) : null}
          hint="distinct sender addresses"
        />
        <Kpi
          state={kpiState}
          label="Paying wallets"
          value={m ? fmtInt(m.paying) : null}
          hint={m ? `${fmtPct(m.paying, m.wallets)} of unique wallets` : undefined}
        />
        <Kpi state={kpiState} label="New wallets" value={m ? fmtInt(m.newWallets) : null} hint="first seen in this range" />
        <Kpi state={kpiState} label="Returning wallets" value={m ? fmtInt(m.returning) : null} hint="first seen before this range" />
        <Kpi
          state={kpiState}
          label="Micro markers"
          value={m ? fmtInt(m.markers) : null}
          hint={m ? `${formatGram(m.markerNano, 4)} ${UNIT}, not counted as fees` : undefined}
        />
        <Kpi
          state={kpiState}
          label="Largest fee"
          value={m ? formatGram(m.largestFeeNano, 3) : null}
          unit={UNIT}
          hint="single payment"
        />
      </div>

      <SectionTitle note={a ? `Distinct addresses, windows end on ${a.anchorDate} UTC` : undefined}>Active wallets</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          state={kpiState}
          label={a?.anchorIncomplete ? "DAU today" : "DAU"}
          value={a ? fmtInt(a.dau) : null}
          hint={a && (a.anchorIncomplete ? <span className="text-warning">{a.anchorDate}, incomplete day</span> : a.anchorDate)}
        />
        <Kpi state={kpiState} label="DAU previous day" value={a ? fmtInt(a.dauPrev) : null} hint={a?.prevDate} />
        <Kpi state={kpiState} label="WAU" value={a ? fmtInt(a.wau) : null} hint="last 7 UTC days" />
        <Kpi state={kpiState} label="MAU" value={a ? fmtInt(a.mau) : null} hint="last 30 UTC days" />
      </div>

      {m && m.daily.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <RevenueChart data={daily} />
            <ActiveWalletsChart data={daily} />
            <WeeklyChart data={weekly} />
            <CumulativeChart data={daily} />
            <div className="lg:col-span-2">
              <TransfersChart data={daily} />
            </div>
          </div>

          <SectionTitle note="Second segment of the transfer comment, exactly as written on-chain">
            Breakdown by comment label
          </SectionTitle>
          {m.venues.length > 0 ? <VenueTable m={m} /> : <Empty>No Pepegun transfers in this range.</Empty>}

          <SectionTitle note="Share of each weekly cohort active again in later weeks, all history up to the range end">
            Retention cohorts
          </SectionTitle>
          {m.cohorts.length > 0 ? <Retention m={m} /> : <Empty>Not enough history for cohorts.</Empty>}

          <SectionTitle note="Newest first">Daily detail</SectionTitle>
          <DailyTable m={m} />
        </>
      ) : m ? (
        <Empty>No Pepegun transfers in this range.</Empty>
      ) : kpiState === "unavailable" ? (
        <Empty>Charts and tables are unavailable until the blockchain data loads.</Empty>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="panel h-72 animate-pulse" />
          ))}
        </div>
      )}

      <SectionTitle>Methodology</SectionTitle>
      <div className="panel space-y-3 p-4 text-sm leading-relaxed text-muted-foreground sm:p-5">
        <ul className="list-disc space-y-2 pl-5 marker:text-primary">
          <li>
            <b className="font-medium text-foreground">Source.</b> Every transaction of the public fee collector address{" "}
            <a className="num break-all text-primary underline-offset-4 hover:underline" href={SOURCE_URL} target="_blank" rel="noreferrer">
              {COLLECTOR_FRIENDLY}
            </a>
            , read in your browser from the public {SOURCES.toncenter.label} (with {SOURCES.tonapi.label} as a fallback). Nothing is hardcoded or estimated.
          </li>
          <li>
            <b className="font-medium text-foreground">What counts.</b> Incoming, successful, non-bounced native {UNIT} transfers whose decoded text comment contains “Pepegun”. Transfers sent by the collector to itself are excluded and transactions are deduplicated by hash.
          </li>
          <li>
            <b className="font-medium text-foreground">Fees vs markers.</b> Only comments containing “Pepegun fee” are fee revenue. Other Pepegun comments (typically 0.0001 {UNIT}) are counted separately as micro markers and never added to revenue. Both count towards wallet activity.
          </li>
          <li>
            <b className="font-medium text-foreground">Wallets are not people.</b> A wallet is one distinct sender address. One person can use many addresses and one address can serve many people, so these numbers are not user counts.
          </li>
          <li>
            <b className="font-medium text-foreground">Distinct counts.</b> DAU, WAU, MAU, weekly and range totals are each counted from the transfers inside that interval, never by adding up days. Amounts are summed in whole nano units.
          </li>
          <li>
            <b className="font-medium text-foreground">Time.</b> Days and weeks (Monday start) are UTC. 7d and 30d include today plus the previous 6 or 29 full UTC days; 24h is a rolling window, so its first day is partial.
          </li>
          <li>
            <b className="font-medium text-foreground">Refresh.</b> Data refreshes when you open the page, every 15 minutes while it stays open, and when you press refresh. There is no server job: nothing updates while nobody has the page open, and the last successful result is kept only in your browser.
          </li>
          <li>
            <b className="font-medium text-foreground">Completeness.</b> Each load pages back to the account’s first transaction and checks that the transactions form an unbroken chain; if a gap is found the data is rejected instead of shown.
          </li>
        </ul>
        {cache && (
          <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-3 text-xs sm:grid-cols-2">
            <Fact k="Last successful update" v={fmtUtc(cache.lastSuccess)} />
            <Fact k="Data source used" v={SOURCES[cache.source].label} />
            <Fact k="Transactions inspected" v={`${fmtInt(cache.txScanned)}, chain verified back to inception`} />
            <Fact k="Qualifying Pepegun transfers" v={fmtInt(cache.rows.length)} />
            <Fact k="Pepegun-comment transfers excluded" v={excludedTotal > 0 ? `${excludedTotal} (${excludedText})` : "0"} />
            <Fact
              k="First fee payment observed"
              v={m?.firstFeeAt ? fmtUtc(m.firstFeeAt) : "none yet"}
            />
            <Fact k="Collector's first transaction" v={cache.firstTxUtime ? fmtUtc(cache.firstTxUtime * 1000) : "n/a"} />
            <Fact k="Last full history download" v={fmtUtc(cache.lastFullSync)} />
          </dl>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild variant="outline" size="sm">
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">
              View the address on Tonviewer <ExternalLink />
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void refresh(true)} disabled={syncing}>
            Re-download full history
          </Button>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Pepegun Analytics is an independent, read-only community dashboard built from public blockchain data. It is not
        operated or endorsed by Pepegun, asks for no wallet connection, and is not financial advice.
      </footer>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{k}</dt>
      <dd className="num text-right text-foreground">{v}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="panel mt-6 p-8 text-center text-sm text-muted-foreground">{children}</div>;
}