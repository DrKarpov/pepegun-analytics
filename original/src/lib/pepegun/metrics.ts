/**
 * All aggregations. Pure functions over qualifying rows; every distinct count
 * is computed from the actual rows of its interval (never summed from parts).
 * All bucketing is UTC.
 */
import type { Row } from "./parse";

export const DAY = 86_400_000;
export const dayIndex = (ms: number) => Math.floor(ms / DAY);
export const dayKey = (idx: number) => new Date(idx * DAY).toISOString().slice(0, 10);
/** Monday-start UTC weeks (1970-01-05 was a Monday). */
export const weekIndex = (day: number) => Math.floor((day + 3) / 7);
export const weekStartDay = (week: number) => week * 7 - 3;

export type Preset = "all" | "30d" | "7d" | "24h" | "custom";
/** Half-open interval in ms: from <= t < to */
export interface Range {
  from: number;
  to: number;
  label: string;
}

export function resolveRange(
  preset: Preset,
  now: number,
  custom?: { from: string; to: string },
): Range | { error: string } {
  const today = dayIndex(now);
  const to = now + 1;
  switch (preset) {
    case "all":
      return { from: -Infinity, to, label: "All time" };
    case "24h":
      return { from: now - DAY, to, label: "Last 24 hours" };
    case "7d":
      return { from: (today - 6) * DAY, to, label: "Last 7 UTC days" };
    case "30d":
      return { from: (today - 29) * DAY, to, label: "Last 30 UTC days" };
    case "custom": {
      const f = Date.parse(`${custom?.from ?? ""}T00:00:00Z`);
      const t = Date.parse(`${custom?.to ?? ""}T00:00:00Z`);
      if (!Number.isFinite(f) || !Number.isFinite(t)) return { error: "Pick a start and an end date." };
      if (f > t) return { error: "The start date is after the end date." };
      return { from: f, to: t + DAY, label: `${custom?.from} to ${custom?.to} (UTC)` };
    }
  }
}

export type DayStatus = "complete" | "incomplete" | "partial";

export interface DailyPoint {
  date: string;
  status: DayStatus;
  active: number;
  newWallets: number;
  returning: number;
  paying: number;
  feeCount: number;
  feeNano: bigint;
  markers: number;
  /** distinct wallets since inception, up to the end of this day */
  cumWallets: number;
  cumPaying: number;
}

export interface WeeklyPoint {
  weekStart: string;
  partial: boolean;
  active: number;
  paying: number;
  feeCount: number;
  feeNano: bigint;
}

export interface VenueStat {
  venue: string;
  feeNano: bigint;
  feeCount: number;
  markers: number;
  wallets: number;
  paying: number;
}

export interface Cohort {
  weekStart: string;
  size: number;
  /** distinct cohort wallets active in week +k (index 0 is the cohort week) */
  active: number[];
}

export interface Metrics {
  rowCount: number;
  wallets: number;
  paying: number;
  newWallets: number;
  returning: number;
  newPaying: number;
  feeNano: bigint;
  feeCount: number;
  markers: number;
  markerNano: bigint;
  largestFeeNano: bigint;
  firstFeeAt: number | null;
  daily: DailyPoint[];
  weekly: WeeklyPoint[];
  venues: VenueStat[];
  activity: {
    anchorDate: string;
    anchorIncomplete: boolean;
    dau: number;
    dauPrev: number;
    prevDate: string;
    wau: number;
    mau: number;
  };
  cohorts: Cohort[];
  lastCohortWeekIncomplete: boolean;
}

const ms = (r: Row) => r.t * 1000;

export function computeMetrics(rowsAsc: Row[], range: Range, now: number): Metrics {
  const end = Math.min(range.to, now + 1);
  const firstSeen = new Map<string, number>();
  const firstPaid = new Map<string, number>();
  let firstFeeAt: number | null = null;
  for (const r of rowsAsc) {
    const t = ms(r);
    const seen = firstSeen.get(r.s);
    if (seen === undefined || t < seen) firstSeen.set(r.s, t);
    if (r.k === "fee") {
      const paid = firstPaid.get(r.s);
      if (paid === undefined || t < paid) firstPaid.set(r.s, t);
      if (firstFeeAt === null || t < firstFeeAt) firstFeeAt = t;
    }
  }

  const inRange = rowsAsc.filter((r) => ms(r) >= range.from && ms(r) < end);
  const wallets = new Set<string>();
  const paying = new Set<string>();
  let feeNano = 0n;
  let markerNano = 0n;
  let largestFeeNano = 0n;
  let feeCount = 0;
  let markers = 0;

  type DayAgg = { active: Set<string>; paying: Set<string>; feeNano: bigint; feeCount: number; markers: number };
  const days = new Map<number, DayAgg>();
  type WeekAgg = { active: Set<string>; paying: Set<string>; feeNano: bigint; feeCount: number };
  const weeks = new Map<number, WeekAgg>();
  type VenueAgg = { feeNano: bigint; feeCount: number; markers: number; wallets: Set<string>; paying: Set<string> };
  const venues = new Map<string, VenueAgg>();

  for (const r of inRange) {
    const v = BigInt(r.v);
    const d = dayIndex(ms(r));
    const w = weekIndex(d);
    let da = days.get(d);
    if (!da) days.set(d, (da = { active: new Set(), paying: new Set(), feeNano: 0n, feeCount: 0, markers: 0 }));
    let wa = weeks.get(w);
    if (!wa) weeks.set(w, (wa = { active: new Set(), paying: new Set(), feeNano: 0n, feeCount: 0 }));
    let va = venues.get(r.d);
    if (!va) venues.set(r.d, (va = { feeNano: 0n, feeCount: 0, markers: 0, wallets: new Set(), paying: new Set() }));
    wallets.add(r.s);
    da.active.add(r.s);
    wa.active.add(r.s);
    va.wallets.add(r.s);
    if (r.k === "fee") {
      feeNano += v;
      feeCount++;
      if (v > largestFeeNano) largestFeeNano = v;
      paying.add(r.s);
      da.paying.add(r.s);
      da.feeNano += v;
      da.feeCount++;
      wa.paying.add(r.s);
      wa.feeNano += v;
      wa.feeCount++;
      va.paying.add(r.s);
      va.feeNano += v;
      va.feeCount++;
    } else {
      markers++;
      markerNano += v;
      da.markers++;
      va.markers++;
    }
  }

  let newWallets = 0;
  for (const w of wallets) {
    const t = firstSeen.get(w);
    if (t !== undefined && t >= range.from && t < end) newWallets++;
  }
  let newPaying = 0;
  for (const w of paying) {
    const t = firstPaid.get(w);
    if (t !== undefined && t >= range.from && t < end) newPaying++;
  }

  /* ---- daily series, zero-filled ---- */
  const daily: DailyPoint[] = [];
  const weekly: WeeklyPoint[] = [];
  const firstRow = rowsAsc[0];
  if (firstRow && end > range.from) {
    const startDay = dayIndex(Math.max(range.from, ms(firstRow)));
    const endDay = dayIndex(end - 1);
    const seenTimes = [...firstSeen.values()].sort((a, b) => a - b);
    const paidTimes = [...firstPaid.values()].sort((a, b) => a - b);
    let si = 0;
    let pi = 0;
    for (let d = startDay; d <= endDay; d++) {
      const dayStart = d * DAY;
      const dayEnd = Math.min(dayStart + DAY, end);
      const from = Math.max(dayStart, range.from);
      let newToday = 0;
      for (const t of seenTimes) if (t >= from && t < dayEnd) newToday++;
      while (si < seenTimes.length && (seenTimes[si] ?? Infinity) < dayEnd) si++;
      while (pi < paidTimes.length && (paidTimes[pi] ?? Infinity) < dayEnd) pi++;
      const a = days.get(d);
      const active = a ? a.active.size : 0;
      const status: DayStatus =
        dayStart + DAY > now ? "incomplete" : dayStart < range.from || dayStart + DAY > range.to ? "partial" : "complete";
      daily.push({
        date: dayKey(d),
        status,
        active,
        newWallets: newToday,
        returning: active - newToday,
        paying: a ? a.paying.size : 0,
        feeCount: a ? a.feeCount : 0,
        feeNano: a ? a.feeNano : 0n,
        markers: a ? a.markers : 0,
        cumWallets: si,
        cumPaying: pi,
      });
    }
    for (let w = weekIndex(startDay); w <= weekIndex(endDay); w++) {
      const a = weeks.get(w);
      const ws = weekStartDay(w) * DAY;
      weekly.push({
        weekStart: dayKey(weekStartDay(w)),
        partial: ws < range.from || ws + 7 * DAY > Math.min(range.to, now),
        active: a ? a.active.size : 0,
        paying: a ? a.paying.size : 0,
        feeCount: a ? a.feeCount : 0,
        feeNano: a ? a.feeNano : 0n,
      });
    }
  }

  /* ---- DAU / WAU / MAU anchored at the end of the range ---- */
  const anchorDay = dayIndex(end - 1);
  const dau = new Set<string>();
  const dauPrev = new Set<string>();
  const wau = new Set<string>();
  const mau = new Set<string>();
  /* ---- weekly retention cohorts, all history up to the range end ---- */
  const walletWeeks = new Map<string, Set<number>>();
  for (const r of rowsAsc) {
    const t = ms(r);
    if (t >= end) continue;
    const d = dayIndex(t);
    if (d === anchorDay) dau.add(r.s);
    if (d === anchorDay - 1) dauPrev.add(r.s);
    if (d > anchorDay - 7) wau.add(r.s);
    if (d > anchorDay - 30) mau.add(r.s);
    let set = walletWeeks.get(r.s);
    if (!set) walletWeeks.set(r.s, (set = new Set()));
    set.add(weekIndex(d));
  }
  const lastWeek = weekIndex(anchorDay);
  const cohortMap = new Map<number, Set<number>[]>();
  for (const set of walletWeeks.values()) {
    const cohort = Math.min(...set);
    let list = cohortMap.get(cohort);
    if (!list) cohortMap.set(cohort, (list = []));
    list.push(set);
  }
  const cohorts: Cohort[] = [...cohortMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, members]) => {
      const active: number[] = [];
      for (let k = 0; week + k <= lastWeek; k++)
        active.push(members.reduce((n, s) => n + (s.has(week + k) ? 1 : 0), 0));
      return { weekStart: dayKey(weekStartDay(week)), size: members.length, active };
    });

  return {
    rowCount: inRange.length,
    wallets: wallets.size,
    paying: paying.size,
    newWallets,
    returning: wallets.size - newWallets,
    newPaying,
    feeNano,
    feeCount,
    markers,
    markerNano,
    largestFeeNano,
    firstFeeAt,
    daily,
    weekly,
    venues: [...venues.entries()]
      .map(([venue, a]) => ({
        venue,
        feeNano: a.feeNano,
        feeCount: a.feeCount,
        markers: a.markers,
        wallets: a.wallets.size,
        paying: a.paying.size,
      }))
      .sort((a, b) => (a.feeNano === b.feeNano ? b.markers - a.markers : a.feeNano < b.feeNano ? 1 : -1)),
    activity: {
      anchorDate: dayKey(anchorDay),
      anchorIncomplete: (anchorDay + 1) * DAY > now,
      dau: dau.size,
      dauPrev: dauPrev.size,
      prevDate: dayKey(anchorDay - 1),
      wau: wau.size,
      mau: mau.size,
    },
    cohorts,
    lastCohortWeekIncomplete: (weekStartDay(lastWeek) + 7) * DAY > now,
  };
}