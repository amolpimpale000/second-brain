"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { inr } from "@/lib/utils";

const axis = {
  tick: { fill: "var(--faint)", fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const;

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-card-lg">
      {children}
    </div>
  );
}

// -------- Income vs Expenses area chart --------
export function CashflowChart({
  data,
}: {
  data: { month: string; income: number; expenses: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260} debounce={200}>
      <AreaChart data={data} margin={{ left: 6, right: 6, top: 10 }}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-green)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--c-green)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-amber)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--c-amber)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => inr(v, { compact: true })} width={52} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Box>
                <p className="mb-1 font-medium text-ink">{label}</p>
                {payload.map((p) => (
                  <p key={p.name} className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <span className="font-medium text-ink">{inr(Number(p.value))}</span>
                  </p>
                ))}
              </Box>
            ) : null
          }
        />
        <Area type="monotone" dataKey="income" name="Income" stroke="var(--c-green)" strokeWidth={2.5} fill="url(#gIncome)" />
        <Area type="monotone" dataKey="expenses" name="Expenses" stroke="var(--c-amber)" strokeWidth={2.5} fill="url(#gExp)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// -------- Donut --------
export function DonutChart({
  data,
  height = 220,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height} debounce={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="62%"
          outerRadius="100%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <Box>
                <p className="font-medium text-ink">{payload[0].name}</p>
                <p className="text-muted">
                  {inr(Number(payload[0].value))} ·{" "}
                  {((Number(payload[0].value) / total) * 100).toFixed(0)}%
                </p>
              </Box>
            ) : null
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// -------- Vertical bar --------
export function BarsChart({
  data,
  dataKey,
  color = "var(--c-green)",
}: {
  data: Record<string, number | string>[];
  dataKey: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240} debounce={200}>
      <BarChart data={data} margin={{ left: 6, right: 6, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => inr(Number(v), { compact: true })} width={52} />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Box>
                <p className="mb-0.5 font-medium text-ink">{label}</p>
                <p className="text-muted">{inr(Number(payload[0].value))}</p>
              </Box>
            ) : null
          }
        />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// -------- Multi-series stacked bar (businesses) --------
export function StackedBars({
  data,
  series,
}: {
  data: Record<string, number | string>[];
  series: { key: string; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300} debounce={200}>
      <BarChart data={data} margin={{ left: 6, right: 6, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} width={40} tickFormatter={(v) => `${v}`} />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Box>
                <p className="mb-1 font-medium text-ink">{label}</p>
                {payload.map((p) => (
                  <p key={p.name} className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <span className="font-medium text-ink">{p.value}</span>
                  </p>
                ))}
              </Box>
            ) : null
          }
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="a"
            fill={s.color}
            radius={i === series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={44}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// -------- Portfolio growth line --------
export function GrowthLine({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240} debounce={200}>
      <LineChart data={data} margin={{ left: 6, right: 6, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => inr(Number(v), { compact: true })} width={54} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Box>
                <p className="mb-0.5 font-medium text-ink">{label}</p>
                <p className="text-muted">{inr(Number(payload[0].value))}</p>
              </Box>
            ) : null
          }
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--c-green)"
          strokeWidth={3}
          dot={{ r: 3, fill: "var(--c-green)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// -------- Radial gauge (financial health) --------
// -------- Half-circle gauge, multiple weighted segments (e.g. article status) --------
export function SegmentedGauge({
  data,
  center,
  sub,
  height = 180,
}: {
  data: { name: string; value: number; color: string }[];
  center: string;
  sub: string;
  height?: number;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height} debounce={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="85%"
            startAngle={180}
            endAngle={0}
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <Box>
                  <p className="font-medium text-ink">{payload[0].name}</p>
                  <p className="text-muted">{payload[0].value}</p>
                </Box>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center justify-end text-center" style={{ height: height * 0.5 }}>
        <p className="text-2xl font-bold text-ink">{center}</p>
        <p className="text-xs text-faint">{sub}</p>
      </div>
    </div>
  );
}

export function Gauge({ value, label }: { value: number; label: string }) {
  const data = [{ name: "score", value, fill: "var(--c-green)" }];
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200} debounce={200}>
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
          barSize={16}
        >
          <RadialBar background={{ fill: "var(--surface-2)" }} dataKey="value" cornerRadius={12} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold text-ink">{value}%</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

// -------- Multi-series line (submissions overview) --------
export function MultiLineChart({
  data,
  series,
  height = 260,
  showDots = false,
}: {
  data: Record<string, number | string>[];
  series: { key: string; name: string; color: string }[];
  height?: number;
  showDots?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height} debounce={200}>
      <LineChart data={data} margin={{ left: 6, right: 6, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={36} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Box>
                <p className="mb-1 font-medium text-ink">{label}</p>
                {payload.map((p) => (
                  <p key={p.name} className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <span className="font-medium text-ink">{p.value}</span>
                  </p>
                ))}
              </Box>
            ) : null
          }
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            dot={showDots ? { r: 4, strokeWidth: 2, stroke: "var(--card)", fill: s.color } : false}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// -------- Mini sparkline --------
export function Sparkline({ data, color = "var(--c-green)" }: { data: number[]; color?: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40} debounce={200}>
      <AreaChart data={d} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#spark-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
