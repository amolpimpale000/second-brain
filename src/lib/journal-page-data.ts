import {
  ijpsKpis as sampleIjpsKpis,
  manuscriptOverview as sampleManuscriptOverview,
  manuscriptsByStatus as sampleManuscriptsByStatus,
  quickActions as sampleQuickActions,
  revenueData as sampleRevenueData,
  revenueBreakdownIjps as sampleRevenueBreakdownIjps,
  razorpayIncome as sampleRazorpayIncome,
  googleAds as sampleGoogleAds,
  expensesBreakdownIjps as sampleExpensesBreakdownIjps,
  expenseTrend as sampleExpenseTrend,
  profitabilityData as sampleProfitabilityData,
  recentTransactions as sampleRecentTransactions,
  expensesTable as sampleExpensesTable,
} from "./ijps-data";
import {
  getJournalCounts,
  getJournalRevenue,
  getJournalMonthlyTrends,
  getJournalPaymentMethods,
  getJournalRecentTransactions,
} from "./journal-queries";

// ---------------------------------------------------------------------------
// Generic data layer for any single-journal page (/journals/<code>).
// All values are read-only. Expenses / Google Ads are not tracked in any of
// these journal databases, so those sections keep sample placeholders until
// a real expense-tracking data source is connected.
// ---------------------------------------------------------------------------

export type JournalPageData = {
  ijpsKpis: typeof sampleIjpsKpis;
  manuscriptOverview: typeof sampleManuscriptOverview;
  manuscriptsByStatus: typeof sampleManuscriptsByStatus;
  quickActions: typeof sampleQuickActions;
  revenueData: typeof sampleRevenueData;
  revenueBreakdownIjps: typeof sampleRevenueBreakdownIjps;
  razorpayIncome: typeof sampleRazorpayIncome;
  googleAds: typeof sampleGoogleAds;
  expensesBreakdownIjps: typeof sampleExpensesBreakdownIjps;
  expenseTrend: typeof sampleExpenseTrend;
  profitabilityData: typeof sampleProfitabilityData;
  recentTransactions: typeof sampleRecentTransactions;
  expensesTable: typeof sampleExpensesTable;
};

const STATUS_COLORS = {
  "Under Review": "#22c55e",
  Accepted: "#3b82f6",
  Rejected: "#ef4444",
  Revisions: "#f59e0b",
};

export async function getJournalPageData(code: string, prefix: string): Promise<JournalPageData> {
  const counts = await getJournalCounts(code, prefix);
  const revenue = await getJournalRevenue(code, prefix);
  const monthly = await getJournalMonthlyTrends(code, prefix);
  const paymentMethods = await getJournalPaymentMethods(code, prefix);
  const recentTransactions = await getJournalRecentTransactions(code, prefix, 8);

  // --- KPI cards ---
  const acceptanceRate = (counts.publishedArticles / Math.max(counts.totalManuscripts, 1)) * 100;

  // Expenses are not tracked in the DB; keep sample ratio relative to real revenue.
  const sampleRevenue = 625450;
  const sampleExpenses = 182340;
  const expenseRatio = sampleExpenses / sampleRevenue;
  const totalExpenses = Math.round(revenue.total * expenseRatio);
  const netProfit = revenue.total - totalExpenses;

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
        return { ...k, value: `₹ ${totalExpenses.toLocaleString("en-IN")}` };
      case "Net Profit / Loss":
        return { ...k, value: `₹ ${netProfit.toLocaleString("en-IN")}` };
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
    {
      name: "Subscription Fees",
      value: Math.max(0, revenue.total - revenue.apc - revenue.plagiarism),
      pct: 0,
      color: "#22c55e",
    },
  ];
  normalizePercentages(revenueBreakdownIjps);

  // --- Razorpay income ---
  const razorpayTotal = paymentMethods.reduce((s, m) => s + m.amount, 0);
  const razorpayIncome = {
    total: razorpayTotal || revenue.total,
    delta: sampleRazorpayIncome.delta,
    sources: paymentMethods.length > 0
      ? paymentMethods.map((m) => ({ name: m.name, pct: m.pct, amount: m.amount }))
      : sampleRazorpayIncome.sources,
  };

  return {
    ijpsKpis,
    manuscriptOverview: manuscriptOverview.length ? manuscriptOverview : sampleManuscriptOverview,
    manuscriptsByStatus,
    quickActions: sampleQuickActions,
    revenueData: revenueData.length ? revenueData : sampleRevenueData,
    revenueBreakdownIjps,
    razorpayIncome,
    googleAds: sampleGoogleAds,
    expensesBreakdownIjps: sampleExpensesBreakdownIjps,
    expenseTrend: sampleExpenseTrend,
    profitabilityData: sampleProfitabilityData,
    recentTransactions: recentTransactions.length > 0 ? recentTransactions : sampleRecentTransactions,
    expensesTable: sampleExpensesTable,
  };
}

function normalizePercentages(items: { name: string; value: number; pct: number; color: string }[]) {
  const total = items.reduce((s, i) => s + i.value, 0);
  for (const item of items) {
    item.pct = total ? Math.round((item.value / total) * 100) : 0;
  }
}
