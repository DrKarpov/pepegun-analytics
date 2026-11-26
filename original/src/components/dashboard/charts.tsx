import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { UNIT } from "@/lib/pepegun/config";
import { fmtInt } from "@/lib/pepegun/format";

export interface ChartPoint {
  date: string;
  short: string;
  status: string;
  newWallets?: number;
  returning?: number;
  active?: number;
  paying?: number;
  fee?: number;
  feeExact?: string;
  feeCount?: number;
  markers?: number;
  cumWallets?: number;
  cumPaying?: number;
}

const COLORS = {
  green: "var(--chart-1)",
  cyan: "var(--chart-2)",
  yellow: "var(--chart-3)",
  grey: "var(--chart-4)",
};

interface Series {
  key: keyof ChartPoint;
  name: string;
  color: string;
}

export function ChartCard({
  title,
  note,
  series,
  children,
}: {
  title: string;
  note?: string;
  series: Series[];
  children: ReactNode;
}) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              {s.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="h-56 w-full sm:h-64">{children}</div>
    </section>
  );
}

interface TipEntry {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
  payload?: ChartPoint;
}

function Tip({ active, payload }: { active?: boolean; payload?: TipEntry[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !payload || !point) return null;
  return (
    <div className="min-w-40 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="mb-1.5 font-medium">
        {point.date} <span className="text-muted-foreground">UTC</span>
        {point.status !== "complete" && <span className="text-warning"> · {point.status}</span>}
      </div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="num text-foreground">
            {p.dataKey === "fee" ? `${point.feeExact ?? p.value} ${UNIT}` : fmtInt(Number(p.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

const axis = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
} as const;
const margin = { top: 6, right: 4, bottom: 0, left: -14 };
const cursor = { fill: "var(--accent)", opacity: 0.5 };
const compact = (v: number) => (v >= 10000 ? `${Math.round(v / 1000)}k` : String(v));

function Frame({ data, children, right }: { data: ChartPoint[]; children: ReactNode; right?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={right ? { ...margin, right: -18 } : margin} barCategoryGap="18%">
        <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="short" {...axis} minTickGap={22} axisLine={false} />
        <YAxis yAxisId="l" {...axis} axisLine={false} allowDecimals={false} tickFormatter={compact} width={48} />
        {right && (
          <YAxis yAxisId="r" orientation="right" {...axis} axisLine={false} allowDecimals={false} width={44} />
        )}
        <Tooltip content={<Tip />} cursor={cursor} />
        {children}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const cells = (data: ChartPoint[]) =>
  data.map((d) => <Cell key={d.date} fillOpacity={d.status === "complete" ? 1 : 0.45} />);

const S = {
  newWallets: { key: "newWallets", name: "New", color: COLORS.green },
  returning: { key: "returning", name: "Returning", color: COLORS.cyan },
  paying: { key: "paying", name: "Paying", color: COLORS.yellow },
  fee: { key: "fee", name: "Fee revenue", color: COLORS.green },
  feeCount: { key: "feeCount", name: "Fee payments", color: COLORS.yellow },
  feeCountBar: { key: "feeCount", name: "Fee payments", color: COLORS.green },
  markers: { key: "markers", name: "Micro markers", color: COLORS.grey },
  cumWallets: { key: "cumWallets", name: "All wallets", color: COLORS.cyan },
  cumPaying: { key: "cumPaying", name: "Paying wallets", color: COLORS.green },
  active: { key: "active", name: "Active", color: COLORS.cyan },
  payingBar: { key: "paying", name: "Paying", color: COLORS.green },
} satisfies Record<string, Series>;

const bar = (s: Series, data: ChartPoint[], stackId?: string, top = true) => (
  <Bar
    yAxisId="l"
    dataKey={s.key}
    name={s.name}
    fill={s.color}
    {...(stackId ? { stackId } : {})}
    radius={top ? [3, 3, 0, 0] : 0}
    maxBarSize={28}
    isAnimationActive={false}
  >
    {cells(data)}
  </Bar>
);
const line = (s: Series, yAxisId = "l") => (
  <Line
    yAxisId={yAxisId}
    dataKey={s.key}
    name={s.name}
    stroke={s.color}
    strokeWidth={2}
    dot={false}
    activeDot={{ r: 3 }}
    isAnimationActive={false}
  />
);

export function ActiveWalletsChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard
      title="Daily active wallets"
      note="Distinct sender addresses per UTC day, split by first appearance"
      series={[S.newWallets, S.returning, S.paying]}
    >
      <Frame data={data}>
        {bar(S.returning, data, "w", false)}
        {bar(S.newWallets, data, "w")}
        {line(S.paying)}
      </Frame>
    </ChartCard>
  );
}

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard
      title={`Daily fee revenue (${UNIT})`}
      note="Only transfers whose comment contains “Pepegun fee”"
      series={[S.fee, S.feeCount]}
    >
      <Frame data={data} right>
        {bar(S.fee, data)}
        {line(S.feeCount, "r")}
      </Frame>
    </ChartCard>
  );
}

export function TransfersChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard
      title="Fee payments vs micro markers"
      note="Markers are other Pepegun comments, usually 0.0001, not trading fees"
      series={[S.feeCountBar, S.markers]}
    >
      <Frame data={data}>
        {bar(S.markers, data, "t", false)}
        {bar(S.feeCountBar, data, "t")}
      </Frame>
    </ChartCard>
  );
}

export function WeeklyChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard
      title="Weekly active wallets"
      note="Distinct addresses per Monday-start UTC week"
      series={[S.active, S.payingBar]}
    >
      <Frame data={data}>
        {bar(S.active, data)}
        {bar(S.payingBar, data)}
      </Frame>
    </ChartCard>
  );
}

export function CumulativeChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard
      title="Cumulative distinct wallets"
      note="Counted since the first Pepegun transfer, regardless of the selected range"
      series={[S.cumWallets, S.cumPaying]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id="cumA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={COLORS.cyan} stopOpacity={0.3} />
              <stop offset="1" stopColor={COLORS.cyan} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cumB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={COLORS.green} stopOpacity={0.35} />
              <stop offset="1" stopColor={COLORS.green} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="short" {...axis} minTickGap={22} axisLine={false} />
          <YAxis {...axis} axisLine={false} allowDecimals={false} width={48} />
          <Tooltip content={<Tip />} cursor={{ stroke: "var(--input)" }} />
          <Area
            dataKey="cumWallets"
            name="All wallets"
            stroke={COLORS.cyan}
            strokeWidth={2}
            fill="url(#cumA)"
            isAnimationActive={false}
          />
          <Area
            dataKey="cumPaying"
            name="Paying wallets"
            stroke={COLORS.green}
            strokeWidth={2}
            fill="url(#cumB)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}