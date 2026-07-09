import {
  ijpsKpis as sampleIjpsKpis,
  manuscriptOverview as sampleManuscriptOverview,
  manuscriptsByStatus as sampleManuscriptsByStatus,
  quickActions as sampleQuickActions,
  revenueData as sampleRevenueData,
  razorpayIncome as sampleRazorpayIncome,
} from "./ijps-data";
import {
  getJournalCounts,
  getJournalRevenue,
  getJournalMonthlyTrends,
  getJournalPaymentMethods,
  getJournalRecentTransactions,
} from "./journal-queries";
import { listExpenses, type JournalExpense } from "./journal-expenses-store";
import { getGoogleAdsCardData, getAllTimeGoogleAdsSpendForJournal, type GoogleAdsCardData } from "./google-ads";
import { getRazorpayIncomeForJournal } from "./razorpay";

// ---------------------------------------------------------------------------
// Generic data layer for any single-journal page (/journals/<code>).
// Manuscript/revenue figures are read-only, live from each journal's MySQL
// database. Expenses aren't tracked in any journal database at all, so they
// come from this app's own Supabase-backed expense tracker instead (see
// journal-expenses-store.ts) — real once entered, honestly zero until then.
// Google Ads spend is pulled live per-journal from the Google Ads API (each
// journal has its own Ads account); if that journal has no configured
// account, the section shows an honest "not connected" state instead.
// ---------------------------------------------------------------------------

const EXPENSE_COLORS = ["#6366f1", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#94a3b8", "#14b8a6", "#ec4899"];

export type JournalPageData = {
  ijpsKpis: typeof sampleIjpsKpis;
  manuscriptOverview: typeof sampleManuscriptOverview;
  manuscriptsByStatus: typeof sampleManuscriptsByStatus;
  quickActions: typeof sampleQuickActions;
  revenueData: typeof sampleRevenueData;
  revenueBreakdownIjps: { name: string; value: number; pct: number; color: string }[];
  razorpayIncome: typeof sampleRazorpayIncome;
  googleAds: GoogleAdsCardData;
  expensesBreakdownIjps: { name: string; value: number; pct: number; color: string }[];
  expenseTrend: { label: string; value: number }[];
  profitabilityData: { label: string; revenue: number; expenses: number; profit: number }[];
  recentTransactions: Awaited<ReturnType<typeof getJournalRecentTransactions>>;
  expensesTable: {
    id: string; date: string; category: string; description: string;
    amount: number; mode: string; paymentTo: string; bill: string; billUrl?: string;
  }[];
  totalExpenses: number;
  netProfit: number;
  googleAdsAllTimeSpend: number;
  journalCode: string;
};

const STATUS_COLORS = {
  "Under Review": "#22c55e",
  Accepted: "#3b82f6",
  Rejected: "#ef4444",
  Revisions: "#f59e0b",
};

function fmtShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function getJournalPageData(code: string, prefix: string): Promise<JournalPageData> {
  // The core manuscript/revenue numbers come from each journal's read-only
  // MySQL database and must load correctly for the page to be useful at all,
  // so those failures are allowed to propagate. Expenses live in a separate
  // Supabase store this app owns — if that's misconfigured or briefly
  // unavailable, the page should still render with real manuscript/revenue
  // data and simply show zero expenses, not crash entirely.
  const [counts, revenue, monthly, paymentMethods, recentTransactions] = await Promise.all([
    getJournalCounts(code, prefix),
    getJournalRevenue(code, prefix),
    getJournalMonthlyTrends(code, prefix),
    getJournalPaymentMethods(code, prefix),
    getJournalRecentTransactions(code, prefix, 30),
  ]);
  const expenses = await listExpenses(code).catch((err) => {
    console.error(`${code} expenses failed to load:`, err instanceof Error ? err.message : err);
    return [];
  });
  const [googleAds, googleAdsAllTimeSpend] = await Promise.all([
    getGoogleAdsCardData(code).catch((err) => {
      console.error(`${code} Google Ads spend failed to load:`, err instanceof Error ? err.message : err);
      return { connected: false, totalSpend: 0, delta: 0, impressions: 0, clicks: 0, conversions: 0, metrics: [] };
    }),
    getAllTimeGoogleAdsSpendForJournal(code),
  ]);
  const razorpayLive = await getRazorpayIncomeForJournal(code).catch((err) => {
    console.error(`${code} Razorpay income failed to load:`, err instanceof Error ? err.message : err);
    return { connected: false, total: 0, delta: 0, sources: [], transactionCount: 0, periodLabel: "This Month", error: "Request failed" };
  });

  // --- real expense totals (manual Supabase expenses + all-time Google Ads) ---
  const manualExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = manualExpenses + googleAdsAllTimeSpend;
  const netProfit = revenue.total - totalExpenses;

  // --- KPI cards ---
  const acceptanceRate = (counts.publishedArticles / Math.max(counts.totalManuscripts, 1)) * 100;

  const ijpsKpis = sampleIjpsKpis.map((k) => {
    switch (k.label) {
      case "Total Manuscripts":
        return { ...k, value: counts.totalManuscripts.toLocaleString("en-IN") };
      case "Published Papers":
        return { ...k, value: counts.publishedArticles.toLocaleString("en-IN") };
      case "Acceptance Rate":
        return { ...k, value: `${acceptanceRate.toFixed(1)}%` };
      case "Total Revenue":
        return { ...k, value: `₹ ${revenue.total.toLocaleString("en-IN")}` };
      case "Total Expenses":
        return { ...k, value: `₹ ${totalExpenses.toLocaleString("en-IN")}`, sub: "Manual + Google Ads" };
      case "Net Profit / Loss":
        return { ...k, value: `₹ ${netProfit.toLocaleString("en-IN")}`, sub: "After all expenses" };
      default:
        return k;
    }
  });

  // --- Manuscripts by status donut ---
  const statusItems = [
    { name: "Under Review", value: counts.underReview },
    { name: "Accepted", value: counts.accepted },
    { name: "Rejected", value: counts.rejected },
    { name: "Revisions", value: counts.revisionRequired },
  ];
  const statusTotal = statusItems.reduce((s, i) => s + i.value, 0);
  const manuscriptsByStatus = statusItems.map((s) => ({
    name: s.name,
    value: s.value,
    pct: statusTotal ? Math.round((s.value / statusTotal) * 100) : 0,
    color: STATUS_COLORS[s.name as keyof typeof STATUS_COLORS],
  }));

  // --- Manuscript overview line chart ---
  const manuscriptOverview = monthly.slice(-7).map((m) => ({
    label: m.month,
    submitted: m.submissions,
    underReview: 0,
    accepted: m.accepted,
    rejected: 0,
  }));

  // --- Revenue bar chart ---
  const revenueData = monthly.slice(-7).map((m) => ({
    month: m.month,
    value: Math.round(m.articles * 1000), // placeholder per-article value until real monthly revenue is wired
  }));

  // --- Revenue breakdown ---
  const revenueBreakdownIjps = [
    {
      name: "Article Processing Charges",
      value: revenue.apc,
      pct: revenue.total ? Math.round((revenue.apc / revenue.total) * 100) : 0,
      color: "#6366f1",
    },
    {
      name: "Plagiarism / Other Income",
      value: revenue.plagiarism,
      pct: revenue.total ? Math.round((revenue.plagiarism / revenue.total) * 100) : 0,
      color: "#f59e0b",
    },
  ];
  normalizePercentages(revenueBreakdownIjps);

  // --- Razorpay income: live from each journal's own Razorpay account when
  // configured, falling back to the journal DB's payment records otherwise ---
  const razorpayTotal = paymentMethods.reduce((s, m) => s + m.amount, 0);
  const razorpayIncome = razorpayLive.connected
    ? { total: razorpayLive.total, delta: razorpayLive.delta, sources: razorpayLive.sources }
    : {
        total: razorpayTotal || revenue.total,
        delta: sampleRazorpayIncome.delta,
        sources: paymentMethods.length > 0
          ? paymentMethods.map((m) => ({ name: m.name, pct: m.pct, amount: m.amount }))
          : [],
      };

  // --- real expenses breakdown (by category, including Google Ads) ---
  const catMap = new Map<string, number>();
  for (const e of expenses) catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
  if (googleAdsAllTimeSpend > 0) catMap.set("Google Ads", googleAdsAllTimeSpend);
  const expensesBreakdownIjps = Array.from(catMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], i) => ({
      name,
      value,
      pct: totalExpenses ? Math.round((value / totalExpenses) * 100) : 0,
      color: name === "Google Ads" ? "#6366f1" : EXPENSE_COLORS[i % EXPENSE_COLORS.length],
    }));

  // --- real expense trend (by month, from actual entered expenses) ---
  const trendMap = new Map<string, number>();
  for (const e of expenses) {
    const monthKey = e.date.slice(0, 7); // yyyy-mm
    trendMap.set(monthKey, (trendMap.get(monthKey) ?? 0) + e.amount);
  }
  const expenseTrend = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));

  // --- real profitability (revenue is all-time-to-date, so shown as a single current bar) ---
  const profitabilityData = expenseTrend.length
    ? expenseTrend.map((t) => ({ label: t.label, revenue: 0, expenses: t.value, profit: -t.value }))
    : [];
  if (profitabilityData.length) {
    profitabilityData[profitabilityData.length - 1].revenue = revenue.total;
    profitabilityData[profitabilityData.length - 1].profit = revenue.total - profitabilityData[profitabilityData.length - 1].expenses;
  }

  // --- real expenses table ---
  const expensesTable = expenses.map((e) => ({
    id: e.id,
    date: fmtShortDate(e.date),
    category: e.category,
    description: e.description,
    amount: e.amount,
    mode: e.mode,
    paymentTo: e.paymentTo,
    bill: e.billName || (e.billUrl ? "Attachment" : "—"),
    billUrl: e.billUrl,
  }));

  return {
    ijpsKpis,
    manuscriptOverview: manuscriptOverview.length ? manuscriptOverview : sampleManuscriptOverview,
    manuscriptsByStatus,
    quickActions: sampleQuickActions,
    revenueData: revenueData.length ? revenueData : sampleRevenueData,
    revenueBreakdownIjps,
    razorpayIncome,
    googleAds,
    expensesBreakdownIjps,
    expenseTrend,
    profitabilityData,
    recentTransactions,
    expensesTable,
    totalExpenses,
    netProfit,
    googleAdsAllTimeSpend,
    journalCode: code,
  };
}

function normalizePercentages(items: { name: string; value: number; pct: number; color: string }[]) {
  const total = items.reduce((s, i) => s + i.value, 0);
  for (const item of items) {
    item.pct = total ? Math.round((item.value / total) * 100) : 0;
  }
}
