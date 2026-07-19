"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn, inr } from "@/lib/utils";
import { AnchoredPopup } from "@/components/anchored-popup";

type JournalIncome = { code: string; income: number };
type MonthlyPnL = { month: string; label: string; income: number; expenses: number; profit: number; byJournal: JournalIncome[] };

const JOURNAL_COLOR: Record<string, string> = {
  IJPS: "#6366f1", IJSRT: "#0ea5e9", IJMPS: "#14b8a6", IJES: "#f59e0b", JPS: "#ec4899",
};

const PERIODS = ["This Month", "Last Month", "This Quarter", "This Year"] as const;
type Period = (typeof PERIODS)[number];

function monthsInPeriod(months: MonthlyPnL[], period: Period): { current: MonthlyPnL[]; previous: MonthlyPnL[] } {
  // `months` is newest-first (idx 0 = current calendar month), same shape the API always returns.
  if (months.length === 0) return { current: [], previous: [] };
  switch (period) {
    case "This Month":
      return { current: months.slice(0, 1), previous: months.slice(1, 2) };
    case "Last Month":
      return { current: months.slice(1, 2), previous: months.slice(2, 3) };
    case "This Quarter": {
      // Calendar quarter containing the current month (only months that have occurred are present anyway).
      const now = new Date();
      const qStartMonth = Math.floor(now.getUTCMonth() / 3) * 3; // 0, 3, 6, 9
      const inQuarter = (m: MonthlyPnL) => {
        const [y, mo] = m.month.split("-").map(Number);
        return y === now.getUTCFullYear() && mo - 1 >= qStartMonth && mo - 1 < qStartMonth + 3;
      };
      const current = months.filter(inQuarter);
      const prevQStart = new Date(Date.UTC(now.getUTCFullYear(), qStartMonth - 3, 1));
      const inPrevQuarter = (m: MonthlyPnL) => {
        const [y, mo] = m.month.split("-").map(Number);
        return y === prevQStart.getUTCFullYear() && mo - 1 >= prevQStart.getUTCMonth() && mo - 1 < prevQStart.getUTCMonth() + 3;
      };
      return { current, previous: months.filter(inPrevQuarter) };
    }
    case "This Year": {
      const now = new Date();
      const current = months.filter((m) => m.month.startsWith(String(now.getUTCFullYear())));
      const previous = months.filter((m) => m.month.startsWith(String(now.getUTCFullYear() - 1)));
      return { current, previous };
    }
  }
}

function sumIncome(list: MonthlyPnL[]): number {
  return list.reduce((s, m) => s + m.income, 0);
}
function sumByJournal(list: MonthlyPnL[]): JournalIncome[] {
  const map = new Map<string, number>();
  for (const m of list) for (const j of m.byJournal) map.set(j.code, (map.get(j.code) ?? 0) + j.income);
  return Array.from(map.entries()).map(([code, income]) => ({ code, income }));
}

/**
 * Revenue Overview — real Razorpay-sourced income (same source and API as
 * Consolidated P&L above it), with a working period selector and a
 * by-journal breakdown donut. Self-loads via /api/journals/pnl (cached
 * server-side, so this costs nothing extra even though Consolidated P&L
 * already fetches the same endpoint).
 */
export function RevenueOverview() {
  const [months, setMonths] = useState<MonthlyPnL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("This Month");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const fetched = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/journals/pnl?months=12", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to load");
      setMonths([...(json.pnl ?? [])].reverse()); // newest first
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

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-faint">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading revenue…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium text-rose-500">Couldn&apos;t load revenue</p>
        <p className="text-xs text-faint">{error}</p>
        <button onClick={load} className="mt-1 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-border">Retry</button>
      </div>
    );
  }

  const { current, previous } = monthsInPeriod(months, period);
  const total = sumIncome(current);
  const prevTotal = sumIncome(previous);
  const delta = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : 0;
  const byJournal = sumByJournal(current)
    .filter((j) => j.income > 0)
    .sort((a, b) => b.income - a.income);
  const donutData = byJournal.map((j) => ({ name: j.code, value: j.income, color: JOURNAL_COLOR[j.code] ?? "#94a3b8" }));

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted">Total Revenue</p>
        <div className="relative">
          <button
            ref={menuBtnRef}
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            {period} <ChevronDown className={cn("h-3.5 w-3.5 text-faint transition-transform", menuOpen && "rotate-180")} />
          </button>
          <AnchoredPopup open={menuOpen} onClose={() => setMenuOpen(false)} anchorEl={menuBtnRef.current} align="right" className="w-36 p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setMenuOpen(false); }}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-surface-2",
                  p === period ? "font-semibold text-ink" : "text-muted"
                )}
              >
                {p}
              </button>
            ))}
          </AnchoredPopup>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold text-ink">{inr(total)}</p>
        {delta !== 0 && (
          <span className={cn("text-xs font-semibold", delta > 0 ? "text-emerald-600" : "text-rose-500")}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
          </span>
        )}
      </div>

      {donutData.length === 0 ? (
        <p className="mt-6 py-4 text-center text-sm text-faint">No revenue recorded for this period.</p>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none">
                  {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {donutData.map((d) => {
              const pct = total ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={d.name} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted">{d.name}</span>
                    <span className="ml-auto text-xs font-medium text-faint">{pct}%</span>
                  </div>
                  <p className="pl-[18px] font-medium text-ink">{inr(d.value)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
