"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, ChevronLeft,
  ChevronRight, ChevronDown, Loader2, Landmark, LineChart as LineChartIcon,
  FileText, Building2, Coins, FlaskConical,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn, inr } from "@/lib/utils";

type JournalIncome = { code: string; income: number };
type MonthlyPnL = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  profit: number;
  byJournal: JournalIncome[];
};

const JOURNAL_COLOR: Record<string, string> = {
  IJPS: "#6366f1", IJSRT: "#0ea5e9", IJMPS: "#14b8a6", IJES: "#f59e0b", JPS: "#ec4899",
};
const JOURNAL_ICON: Record<string, React.ElementType> = {
  IJPS: LineChartIcon, IJSRT: FileText, IJMPS: Building2, IJES: Coins, JPS: FlaskConical,
};

function Delta({ v, invert, size = "sm" }: { v: number; invert?: boolean; size?: "sm" | "xs" }) {
  if (!v) return <span className={cn("font-medium text-faint", size === "sm" ? "text-xs" : "text-[11px]")}>—</span>;
  const good = invert ? v < 0 : v > 0;
  const up = v > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-semibold", size === "sm" ? "text-xs" : "text-[11px]", good ? "text-emerald-600" : "text-rose-500")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

/** Renders a small filled dot only on the sparkline's last (most recent) point. */
function makeEndDot(color: string, lastIndex: number) {
  const EndDot = (props: any) => {
    const { cx, cy, index } = props;
    if (index !== lastIndex || cx == null || cy == null) return <g key={`d${index}`} />;
    return <circle key={`d${index}`} cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />;
  };
  return EndDot;
}

function Sparkline({ data, color, gradientId, height = "100%" }: { data: { value: number }[]; color: string; gradientId: string; height?: number | string }) {
  if (data.length < 2) return <div className="h-full w-full" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          dot={makeEndDot(color, data.length - 1)}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Consolidated P&L summary with a month toggle. Self-loads from
 * /api/journals/pnl so host pages stay fast. All months are fetched once, so
 * the toggle switches instantly without re-fetching.
 */
export function ConsolidatedPnL({ className }: { className?: string }) {
  const [months, setMonths] = useState<MonthlyPnL[]>([]);
  const [idx, setIdx] = useState(0); // index into `months` (0 = latest)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [byJournalMetric, setByJournalMetric] = useState<"Total Income">("Total Income");
  const [metricMenuOpen, setMetricMenuOpen] = useState(false);
  const fetched = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/journals/pnl?months=12", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to load");
      // Newest first so idx 0 = current month.
      const list: MonthlyPnL[] = [...(json.pnl ?? [])].reverse();
      setMonths(list);
      setIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      load();
    }
  }, [load]);

  const cur = months[idx];
  const prev = months[idx + 1]; // older month

  const deltas = useMemo(() => {
    if (!cur || !prev) return { income: 0, expenses: 0, profit: 0 };
    const d = (a: number, b: number) => (b !== 0 ? Math.round(((a - b) / Math.abs(b)) * 1000) / 10 : 0);
    return { income: d(cur.income, prev.income), expenses: d(cur.expenses, prev.expenses), profit: d(cur.profit, prev.profit) };
  }, [cur, prev]);

  const margin = cur && cur.income > 0 ? Math.round((cur.profit / cur.income) * 1000) / 10 : 0;
  const maxJournalIncome = cur ? Math.max(1, ...cur.byJournal.map((j) => j.income)) : 1;

  // Every month available (oldest → newest), ending at the selected month — the full trend
  // "since all time" for however much history the API has loaded (currently 12 months).
  const trailing = useMemo(() => months.slice(idx).reverse(), [months, idx]);
  const incomeSpark = trailing.map((m) => ({ value: m.income }));
  const expensesSpark = trailing.map((m) => ({ value: m.expenses }));
  const profitSpark = trailing.map((m) => ({ value: m.profit }));
  const journalSpark = (code: string) => trailing.map((m) => ({ value: m.byJournal.find((j) => j.code === code)?.income ?? 0 }));

  const journalDelta = (code: string): number => {
    const c = cur?.byJournal.find((j) => j.code === code)?.income ?? 0;
    const p = prev?.byJournal.find((j) => j.code === code)?.income ?? 0;
    return p !== 0 ? Math.round(((c - p) / Math.abs(p)) * 1000) / 10 : 0;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header + month toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
            <LineChartIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-ink">Consolidated P&amp;L — All Journals</h3>
            <p className="text-xs text-faint">Income (Razorpay), expenses &amp; net profit combined</p>
          </div>
        </div>

        {/* Month toggle: ◀ dropdown ▶ */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIdx((i) => Math.min(months.length - 1, i + 1))}
            disabled={loading || idx >= months.length - 1}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              disabled={loading || !cur}
              className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
            >
              {cur?.label ?? "—"} <ChevronDown className={cn("h-3.5 w-3.5 text-faint transition-transform", menuOpen && "rotate-180")} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-50 mt-1 max-h-64 w-44 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-card-lg">
                  {months.map((m, i) => (
                    <button
                      key={m.month}
                      onClick={() => { setIdx(i); setMenuOpen(false); }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2",
                        i === idx ? "font-semibold text-ink" : "text-muted"
                      )}
                    >
                      <span>{m.label}</span>
                      <span className={cn("text-xs", m.profit >= 0 ? "text-emerald-600" : "text-rose-500")}>{inr(m.profit, { compact: true })}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={loading || idx <= 0}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card text-sm text-faint">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading consolidated figures…
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card text-center text-sm">
          <p className="font-medium text-rose-500">Couldn&apos;t load P&amp;L</p>
          <p className="text-xs text-faint">{error}</p>
          <button onClick={load} className="mt-1 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-border">Retry</button>
        </div>
      ) : cur ? (
        <>
          {/* Three headline tiles */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile
              label="Total Income"
              value={cur.income}
              delta={deltas.income}
              monthLabel={prev?.label ?? "—"}
              icon={<TrendingUp className="h-5 w-5" />}
              color="#22c55e"
              bg="#dcfce7"
              sparkData={incomeSpark}
              gradientId="pnl-grad-income"
            />
            <StatTile
              label="Total Expenses"
              value={cur.expenses}
              delta={deltas.expenses}
              deltaInvert
              monthLabel={prev?.label ?? "—"}
              icon={<TrendingDown className="h-5 w-5" />}
              color="#ef4444"
              bg="#fee2e2"
              sparkData={expensesSpark}
              gradientId="pnl-grad-expenses"
            />
            <StatTile
              label="Net Profit"
              value={cur.profit}
              delta={deltas.profit}
              monthLabel={prev?.label ?? "—"}
              icon={<Wallet className="h-5 w-5" />}
              color={cur.profit >= 0 ? "#6366f1" : "#ef4444"}
              bg={cur.profit >= 0 ? "#ede9fe" : "#fee2e2"}
              sparkData={profitSpark}
              gradientId="pnl-grad-profit"
              badge={
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", cur.profit >= 0 ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-600")}>
                  {margin.toFixed(1)}% margin
                </span>
              }
            />
          </div>

          {/* Income by journal */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
                  <Landmark className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-ink">
                  Income by Journal <span className="font-normal text-faint">· {cur.label}</span>
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMetricMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
                >
                  {byJournalMetric} <ChevronDown className={cn("h-3.5 w-3.5 text-faint transition-transform", metricMenuOpen && "rotate-180")} />
                </button>
                {metricMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMetricMenuOpen(false)} />
                    <div className="absolute right-0 z-50 mt-1 w-40 rounded-xl border border-border bg-card p-1 shadow-card-lg">
                      <button
                        onClick={() => { setByJournalMetric("Total Income"); setMetricMenuOpen(false); }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-surface-2"
                      >
                        Total Income
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3.5">
              {cur.byJournal.map((j) => {
                const Icon = JOURNAL_ICON[j.code] ?? Landmark;
                const color = JOURNAL_COLOR[j.code] ?? "#64748b";
                const pct = (j.income / maxJournalIncome) * 100;
                return (
                  <div key={j.code} className="grid grid-cols-[52px_1fr_64px_40px] items-center gap-2 sm:grid-cols-[92px_1fr_110px_100px_64px] sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{ background: color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate text-sm font-bold text-ink">{j.code}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, j.income > 0 ? 2 : 0)}%`, background: color }} />
                    </div>
                    <div className="hidden h-8 sm:block">
                      <Sparkline data={journalSpark(j.code)} color={color} gradientId={`pnl-grad-${j.code}`} />
                    </div>
                    <span className="text-right text-sm font-semibold text-ink">{inr(j.income)}</span>
                    <div className="flex justify-end">
                      <Delta v={journalDelta(j.code)} size="xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card text-sm text-faint">No data available.</div>
      )}
    </div>
  );
}

function StatTile({
  label, value, delta, deltaInvert, monthLabel, icon, color, bg, sparkData, gradientId, badge,
}: {
  label: string; value: number; delta: number; deltaInvert?: boolean; monthLabel: string;
  icon: React.ReactNode; color: string; bg: string; sparkData: { value: number }[]; gradientId: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: bg, color }}>{icon}</div>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
      <p className="mt-3 truncate text-[28px] font-bold leading-none tracking-tight text-ink">{inr(value)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Delta v={delta} invert={deltaInvert} />
        <span className="text-xs text-faint">vs {monthLabel}</span>
      </div>
      {badge && <div className="mt-1.5">{badge}</div>}
      <div className="-mx-1 mt-3">
        <Sparkline data={sparkData} color={color} gradientId={gradientId} height={44} />
      </div>
    </div>
  );
}
