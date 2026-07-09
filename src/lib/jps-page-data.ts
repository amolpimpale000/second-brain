import { unstable_cache } from "next/cache";
import {
  ijpsKpis as sampleIjpsKpis,
  manuscriptOverview as sampleManuscriptOverview,
  quickActions as sampleQuickActions,
  revenueData as sampleRevenueData,
  razorpayIncome as sampleRazorpayIncome,
} from "./ijps-data";
import {
  getJpsCounts,
  getJpsRevenue,
  getJpsMonthlyTrends,
  getJpsMonthlyRevenue,
  getJpsPaymentMethods,
  getJpsRecentTransactions,
} from "./jps-queries";
import { listExpenses } from "./journal-expenses-store";
import { getGoogleAdsCardData, getAllTimeGoogleAdsSpendForJournal } from "./google-ads";
import { getRazorpayIncomeForJournal } from "./razorpay";
import type { JournalPageData } from "./journal-page-data";

// ---------------------------------------------------------------------------
// Page data for /journals/jps. JPS runs on its own Postgres database (a
// Hostinger VPS the user owns), structurally different from the four
// MySQL-backed journals, so it gets its own read-only query layer
// (jps-queries.ts) instead of reusing journal-queries.ts. Expenses still
// come from the shared Supabase-backed tracker (journal-expenses-store.ts),
// same as every other journal — real once entered, honestly zero until then.
// ---------------------------------------------------------------------------

const EXPENSE_COLORS = ["#6366f1", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#94a3b8", "#14b8a6", "#ec4899"];

const STATUS_COLORS: Record<string, string> = {
  Published: "#10b981",
  Accepted: "#3b82f6",
  "Under Review": "#22c55e",
  Rejected: "#ef4444",
  Revisions: "#f59e0b",
  "New Submissions": "#8b5cf6",
};

function normalizePercentages(items: { name: string; value: number; pct: number; color: string }[]) {
  const total = items.reduce((s, i) => s + i.value, 0);
  for (const item of items) item.pct = total ? Math.round((item.value / total) * 100) : 0;
}

async function fetchJpsPageData(): Promise<JournalPageData> {
  const [counts, revenue, monthly, monthlyRevenue, paymentMethods, recentTransactions] = await Promise.all([
    getJpsCounts(),
    getJpsRevenue(),
    getJpsMonthlyTrends(),
    getJpsMonthlyRevenue(),
    getJpsPaymentMethods(),
    getJpsRecentTransactions(30),
  ]);
  const expenses = await listExpenses("JPS").catch((err) => {
    console.error("JPS expenses failed to load:", err instanceof Error ? err.message : err);
    return [];
  });
  const [googleAds, googleAdsAllTimeSpend] = await Promise.all([
    getGoogleAdsCardData("JPS").catch((err) => {
      console.error("JPS Google Ads spend failed to load:", err instanceof Error ? err.message : err);
      return { connected: false, totalSpend: 0, delta: 0, impressions: 0, clicks: 0, conversions: 0, metrics: [] };
    }),
    getAllTimeGoogleAdsSpendForJournal("JPS"),
  ]);
  const razorpayLive = await getRazorpayIncomeForJournal("JPS").catch((err) => {
    console.error("JPS Razorpay income failed to load:", err instanceof Error ? err.message : err);
    return { connected: false, total: 0, delta: 0, sources: [], transactionCount: 0, periodLabel: "This Month", error: "Request failed" };
  });

  const manualExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = manualExpenses + googleAdsAllTimeSpend;
  const netProfit = revenue.completed - totalExpenses;
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
        return { ...k, value: `₹ ${revenue.completed.toLocaleString("en-IN")}` };
      case "Total Expenses":
        return { ...k, value: `₹ ${totalExpenses.toLocaleString("en-IN")}`, sub: "Manual + Google Ads" };
      case "Net Profit / Loss":
        return { ...k, value: `₹ ${netProfit.toLocaleString("en-IN")}`, sub: "After all expenses" };
      default:
        return k;
    }
  });

  const statusItems = [
    { name: "Published", value: counts.published },
    { name: "Accepted", value: counts.accepted },
    { name: "Under Review", value: counts.underReview },
    { name: "Rejected", value: counts.rejected },
    { name: "Revisions", value: counts.revisionRequired },
    { name: "New Submissions", value: counts.submitted + counts.paid },
  ];
  const statusTotal = statusItems.reduce((s, i) => s + i.value, 0);
  const manuscriptsByStatus = statusItems
    .filter((s) => s.value > 0)
    .map((s) => ({
      name: s.name,
      value: s.value,
      pct: statusTotal ? Math.round((s.value / statusTotal) * 100) : 0,
      color: STATUS_COLORS[s.name],
    }));

  const manuscriptOverview = monthly.slice(-7).map((m) => ({
    label: m.month,
    submitted: m.submissions,
    underReview: 0,
    accepted: 0,
    rejected: 0,
  }));

  const revenueData = monthlyRevenue.slice(-7).map((m) => ({ month: m.month, value: m.amount }));

  const revenueBreakdownIjps = [
    {
      name: "Article Processing Charges",
      value: revenue.completed,
      pct: 100,
      color: "#6366f1",
    },
  ];

  const razorpayTotal = paymentMethods.reduce((s, m) => s + m.amount, 0);
  const razorpayIncome = razorpayLive.connected
    ? { total: razorpayLive.total, delta: razorpayLive.delta, sources: razorpayLive.sources }
    : {
        total: razorpayTotal || revenue.completed,
        delta: sampleRazorpayIncome.delta,
        sources: paymentMethods.length > 0 ? paymentMethods.map((m) => ({ name: m.name, pct: m.pct, amount: m.amount })) : [],
      };

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

  const trendMap = new Map<string, number>();
  for (const e of expenses) {
    const monthKey = e.date.slice(0, 7);
    trendMap.set(monthKey, (trendMap.get(monthKey) ?? 0) + e.amount);
  }
  const expenseTrend = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));

  const profitabilityData = expenseTrend.length
    ? expenseTrend.map((t) => ({ label: t.label, revenue: 0, expenses: t.value, profit: -t.value }))
    : [];
  if (profitabilityData.length) {
    profitabilityData[profitabilityData.length - 1].revenue = revenue.completed;
    profitabilityData[profitabilityData.length - 1].profit =
      revenue.completed - profitabilityData[profitabilityData.length - 1].expenses;
  }

  function fmtShortDate(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

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
    journalCode: "JPS",
  };
}

// Live Postgres + Google Ads + Razorpay reads for JPS — cached briefly, same
// rationale as journal-page-data.ts's cache.
const cachedJpsPageData = unstable_cache(fetchJpsPageData, ["jps-page-data"], { revalidate: 90 });

export async function getJpsPageData(): Promise<JournalPageData> {
  return cachedJpsPageData();
}
