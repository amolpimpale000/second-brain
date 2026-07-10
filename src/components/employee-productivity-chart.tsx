"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { Loader2, Award, FileText, TrendingUp, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DailyPublished = { date: string; series: Record<string, number>; total: number };
type JournalProductivity = {
  code: string;
  name: string;
  seriesKeys: string[];
  color: Record<string, string>;
  days: DailyPublished[];
  totalInPeriod: number;
};
type ApiResponse = { days: number; journals: JournalProductivity[] };

const axis = { tick: { fill: "var(--faint)", fontSize: 10 }, axisLine: false, tickLine: false } as const;

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-card-lg">{children}</div>;
}

/** Derives a single-employee card from a multi-employee journal's existing data — no extra fetch needed. */
function deriveEmployeeCard(journal: JournalProductivity, employeeName: string): JournalProductivity {
  const days = journal.days.map((d) => {
    const count = d.series[employeeName] ?? 0;
    return { date: d.date, series: { [employeeName]: count }, total: count };
  });
  return {
    code: journal.code,
    name: `${employeeName} (${journal.code})`,
    seriesKeys: [employeeName],
    color: { [employeeName]: journal.color[employeeName] ?? "#64748b" },
    days,
    totalInPeriod: days.reduce((s, d) => s + d.total, 0),
  };
}

function JournalChartCard({ journal, tickInterval }: { journal: JournalProductivity; tickInterval: number }) {
  const chartData = useMemo(
    () => journal.days.map((d) => ({ date: d.date, label: fmtDate(d.date), total: d.total, ...d.series })),
    [journal.days]
  );
  const isSingleSeries = journal.seriesKeys.length === 1;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-xs font-bold text-white"
            style={{ background: Object.values(journal.color)[0] ?? "#64748b" }}
          >
            {journal.code}
          </span>
          <span className="text-xs text-faint">
            {isSingleSeries ? journal.seriesKeys[0] : journal.seriesKeys.join(" · ")}
          </span>
        </div>
        <span className="text-sm font-bold text-ink">{journal.totalInPeriod}</span>
      </div>

      {journal.totalInPeriod === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-xs text-faint">No papers published in this period.</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ left: 0, right: 4, top: 18 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" {...axis} interval={tickInterval} />
            <YAxis {...axis} width={24} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <Box>
                    <p className="mb-1 font-medium text-ink">{label}</p>
                    {journal.seriesKeys.map((k) => {
                      const v = payload.find((p) => p.dataKey === k)?.value;
                      return v == null || Number(v) === 0 ? null : (
                        <p key={k} className="flex items-center gap-1.5 text-muted">
                          <span className="h-2 w-2 rounded-full" style={{ background: journal.color[k] }} />
                          {k}: <span className="font-medium text-ink">{v}</span>
                        </p>
                      );
                    })}
                    <p className="mt-1 border-t border-border pt-1 font-semibold text-ink">Total: {payload[0]?.payload?.total ?? 0}</p>
                  </Box>
                ) : null
              }
            />
            {journal.seriesKeys.map((key, i) => {
              const isTop = i === journal.seriesKeys.length - 1;
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={journal.color[key]}
                  radius={isTop ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={12}
                  isAnimationActive={false}
                >
                  {isTop && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      style={{ fontSize: 9, fill: "var(--muted)" }}
                      formatter={(v: number) => (v > 0 ? v : "")}
                    />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      )}

      {!isSingleSeries && (
        <div className="mt-2 flex flex-wrap gap-2.5 border-t border-border pt-2">
          {journal.seriesKeys.map((k) => (
            <span key={k} className="inline-flex items-center gap-1 text-[11px] text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: journal.color[k] }} />
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmployeeProductivityPanel() {
  const [days, setDays] = useState<30 | 45>(30);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((d: number) => {
    setLoading(true);
    setError(null);
    fetch(`/api/journals/employee-productivity?days=${d}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const journals = data?.journals ?? [];
  const totalPublished = journals.reduce((s, j) => s + j.totalInPeriod, 0);
  const dailyAvg = journals.length ? Math.round((totalPublished / days) * 10) / 10 : 0;

  const mostActive = useMemo(() => {
    let best: { name: string; journal: string; count: number } | null = null;
    for (const j of journals) {
      for (const key of j.seriesKeys) {
        const count = j.days.reduce((s, d) => s + (d.series[key] ?? 0), 0);
        if (!best || count > best.count) best = { name: key, journal: j.code, count };
      }
    }
    return best;
  }, [journals]);

  const tickInterval = Math.max(0, Math.ceil(days / 8) - 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">Employee Productivity</h3>
          <p className="text-xs text-faint">Real papers published per day, by tracked employee</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          {([30, 45] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                days === d ? "bg-brand text-white" : "text-muted hover:text-ink"
              )}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-faint">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading productivity data…
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-rose-500">Couldn&apos;t load productivity data</p>
          <p className="text-xs text-faint">{error}</p>
          <button onClick={() => load(days)} className="mt-1 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-border">Retry</button>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><FileText className="h-5 w-5" /></div>
              <div><p className="text-lg font-bold text-ink">{totalPublished}</p><p className="text-xs text-muted">Published ({days}d)</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
              <div><p className="text-lg font-bold text-ink">{dailyAvg}</p><p className="text-xs text-muted">Daily Average</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-500"><Award className="h-5 w-5" /></div>
              <div>
                <p className="truncate text-lg font-bold text-ink">{mostActive?.name ?? "—"}</p>
                <p className="text-xs text-muted">{mostActive ? `Top (${mostActive.journal}, ${mostActive.count})` : "Top Performer"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Users2 className="h-5 w-5" /></div>
              <div><p className="text-lg font-bold text-ink">{journals.length}</p><p className="text-xs text-muted">Journals Tracked</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {journals.flatMap((j) => [
              <JournalChartCard key={j.code} journal={j} tickInterval={tickInterval} />,
              ...(j.seriesKeys.length > 1
                ? j.seriesKeys.map((emp) => (
                    <JournalChartCard key={`${j.code}-${emp}`} journal={deriveEmployeeCard(j, emp)} tickInterval={tickInterval} />
                  ))
                : []),
            ])}
          </div>
        </>
      )}
    </div>
  );
}
