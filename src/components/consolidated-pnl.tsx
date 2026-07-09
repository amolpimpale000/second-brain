"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, ChevronLeft,
  ChevronRight, ChevronDown, Loader2, Landmark, Scale,
} from "lucide-react";
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

function Delta({ v, invert }: { v: number; invert?: boolean }) {
  if (!v) return <span className="text-[11px] font-medium text-faint">—</span>;
  // For expenses, "up" is bad, so color inverts.
  const good = invert ? v < 0 : v > 0;
  const up = v > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", good ? "text-emerald-600" : "text-rose-500")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(v).toFixed(1)}%
    </span>
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

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>
      {/* Header + month toggle */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
            <Scale className="h-5 w-5" />
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
        <div className="flex h-40 items-center justify-center text-sm text-faint">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading consolidated figures…
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-rose-500">Couldn&apos;t load P&amp;L</p>
          <p className="text-xs text-faint">{error}</p>
          <button onClick={load} className="mt-1 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-border">Retry</button>
        </div>
      ) : cur ? (
        <>
          {/* Three headline tiles */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              label="Total Income"
              value={cur.income}
              delta={deltas.income}
              icon={<TrendingUp className="h-5 w-5" />}
              gradient="from-emerald-50 to-teal-50"
              ring="ring-emerald-100"
              iconBg="bg-emerald-500"
              valueColor="text-emerald-700"
            />
            <StatTile
              label="Total Expenses"
              value={cur.expenses}
              delta={deltas.expenses}
              deltaInvert
              icon={<TrendingDown className="h-5 w-5" />}
              gradient="from-rose-50 to-orange-50"
              ring="ring-rose-100"
              iconBg="bg-rose-500"
              valueColor="text-rose-600"
            />
            <StatTile
              label="Net Profit"
              value={cur.profit}
              delta={deltas.profit}
              icon={<Wallet className="h-5 w-5" />}
              gradient={cur.profit >= 0 ? "from-indigo-50 to-violet-50" : "from-rose-50 to-rose-50"}
              ring={cur.profit >= 0 ? "ring-indigo-100" : "ring-rose-100"}
              iconBg={cur.profit >= 0 ? "bg-indigo-500" : "bg-rose-500"}
              valueColor={cur.profit >= 0 ? "text-indigo-700" : "text-rose-600"}
              badge={<span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", cur.profit >= 0 ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-600")}>{margin.toFixed(1)}% margin</span>}
            />
          </div>

          {/* Income by journal */}
          <div className="mt-5">
            <div className="mb-2.5 flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-faint" />
              <p className="text-xs font-medium text-muted">Income by journal · {cur.label}</p>
            </div>
            <div className="space-y-2">
              {cur.byJournal.map((j) => (
                <div key={j.code} className="flex items-center gap-2.5">
                  <span className="w-12 shrink-0 text-xs font-bold" style={{ color: JOURNAL_COLOR[j.code] ?? "#64748b" }}>{j.code}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(j.income / maxJournalIncome) * 100}%`, background: JOURNAL_COLOR[j.code] ?? "#64748b" }} />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-medium text-ink">{inr(j.income)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-faint">No data available.</div>
      )}
    </div>
  );
}

function StatTile({
  label, value, delta, deltaInvert, icon, gradient, ring, iconBg, valueColor, badge,
}: {
  label: string; value: number; delta: number; deltaInvert?: boolean;
  icon: React.ReactNode; gradient: string; ring: string; iconBg: string; valueColor: string; badge?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br p-4 ring-1", gradient, ring)}>
      <div className="flex items-center justify-between">
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl text-white", iconBg)}>{icon}</div>
        <Delta v={delta} invert={deltaInvert} />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className={cn("mt-0.5 text-2xl font-bold tracking-tight", valueColor)}>{inr(value)}</p>
      {badge && <div className="mt-1.5">{badge}</div>}
    </div>
  );
}
