import { unstable_cache } from "next/cache";
import { getRazorpayMonthlyIncomeForJournal, RAZORPAY_JOURNAL_CODES } from "./razorpay";
import { listCombinedExpenses } from "./journal-expenses-store";
import { getGoogleAdsSpendByMonth } from "./google-ads";

// ---------------------------------------------------------------------------
// Consolidated month-by-month P&L across every journal, for the summary
// section on /journal-management and the landing dashboard.
//
//   income   = real Razorpay captured payments, summed across all 5 journals
//              (the accurate "money collected" figure — same source the
//              per-journal Razorpay card reconciles against).
//   expenses = this app's own tracked journal expenses (Supabase) + live
//              Google Ads spend, summed across all journals.
//   profit   = income - expenses.
//
// All reads are read-only. Cached for 30 min since a monthly P&L doesn't need
// per-request freshness and the Razorpay windowed fetch is relatively heavy.
// ---------------------------------------------------------------------------

export type JournalIncome = { code: string; income: number };

export type MonthlyPnL = {
  month: string; // "YYYY-MM"
  label: string; // "Jul 2026"
  income: number;
  expenses: number;
  profit: number;
  byJournal: JournalIncome[];
};

function lastNMonthKeys(n: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function labelFor(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

async function fetchConsolidatedPnL(months: number): Promise<MonthlyPnL[]> {
  const keys = lastNMonthKeys(months);
  const codes = RAZORPAY_JOURNAL_CODES;

  const [incomeMaps, expenses, adsMaps] = await Promise.all([
    // Razorpay income per journal (each a Map<month, rupees>)
    Promise.all(codes.map((c) => getRazorpayMonthlyIncomeForJournal(c, months).catch(() => new Map<string, number>()))),
    // Tracked journal expenses (Supabase)
    listCombinedExpenses().catch(() => []),
    // Google Ads spend per journal
    Promise.all(
      codes.map((c) =>
        getGoogleAdsSpendByMonth(c, { start: `${keys[0]}-01`, end: new Date().toISOString().slice(0, 10) })
          .then((rows) => {
            const m = new Map<string, number>();
            for (const r of rows) m.set(r.month, (m.get(r.month) ?? 0) + r.spend);
            return m;
          })
          .catch(() => new Map<string, number>())
      )
    ),
  ]);

  // Manual expenses bucketed by month
  const manualByMonth = new Map<string, number>();
  for (const e of expenses) {
    const k = e.date.slice(0, 7);
    manualByMonth.set(k, (manualByMonth.get(k) ?? 0) + e.amount);
  }
  // Google Ads bucketed by month (across all journals)
  const adsByMonth = new Map<string, number>();
  for (const m of adsMaps) for (const [k, v] of m) adsByMonth.set(k, (adsByMonth.get(k) ?? 0) + v);

  return keys.map((key) => {
    const byJournal: JournalIncome[] = codes.map((c, i) => ({ code: c, income: Math.round(incomeMaps[i].get(key) ?? 0) }));
    const income = byJournal.reduce((s, j) => s + j.income, 0);
    const expensesTotal = Math.round((manualByMonth.get(key) ?? 0) + (adsByMonth.get(key) ?? 0));
    return {
      month: key,
      label: labelFor(key),
      income,
      expenses: expensesTotal,
      profit: income - expensesTotal,
      byJournal,
    };
  });
}

const cachedConsolidatedPnL = unstable_cache(fetchConsolidatedPnL, ["consolidated-pnl"], { revalidate: 1800 });

export async function getConsolidatedPnL(months = 12): Promise<MonthlyPnL[]> {
  return cachedConsolidatedPnL(months);
}
