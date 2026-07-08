import {
  jmStats as sampleJmStats,
  submissionsByJournal as sampleSubmissionsByJournal,
  jmActivities as sampleJmActivities,
  journalPerformance as sampleJournalPerformance,
  revenueBreakdown as sampleRevenueBreakdown,
  articleStatus as sampleArticleStatus,
  submissionSource as sampleSubmissionSource,
  financialSummary as sampleFinancialSummary,
  keyMetrics as sampleKeyMetrics,
  subjectAreas as sampleSubjectAreas,
  subscription as sampleSubscription,
  publicationTrend as samplePublicationTrend,
  jmAlerts as sampleJmAlerts,
  quickActionsJM as sampleQuickActionsJM,
  employees as sampleEmployees,
  JCOL,
  type JournalPerf,
  type Employee,
} from "./data";
import {
  getJournalCounts,
  getJournalRevenue,
  getJournalMonthlyTrends,
  getJournalArticleTypes,
  getJournalRecentActivity,
  getJournalEmployees,
  type IjpsCounts,
  type IjpsRevenue,
  type MonthlyPoint,
  type ArticleTypeStat,
  type IjpsActivity,
  type IjpsEmployee,
} from "./journal-queries";
import {
  getJpsCounts,
  getJpsRevenue,
  getJpsMonthlyTrends,
  getJpsTypeBreakdown,
  getJpsRecentActivity,
  getJpsEmployees,
} from "./jps-queries";
import { listCombinedExpenses, type JournalExpense } from "./journal-expenses-store";
import { getGoogleAdsSpend, type GoogleAdsSpend } from "./google-ads";

// ---------------------------------------------------------------------------
// Aggregates real data for every connected journal: IJPS/IJSRT/IJMPS/IJES
// (MySQL, via journal-queries.ts) plus JPS (Postgres on its own VPS, via
// jps-queries.ts — structurally different schema, so it gets its own
// fetch/adapter below that reshapes it into the same RealJournalData shape).
// ---------------------------------------------------------------------------

export type JournalDashboardData = {
  jmStats: typeof sampleJmStats;
  submissionsByJournalTrend: { data: Record<string, number | string>[]; series: { key: string; name: string; color: string }[] };
  submissionsByJournal: typeof sampleSubmissionsByJournal;
  jmActivities: typeof sampleJmActivities;
  journalPerformance: JournalPerf[];
  revenueBreakdown: typeof sampleRevenueBreakdown;
  articleStatus: typeof sampleArticleStatus;
  submissionSource: typeof sampleSubmissionSource;
  financialSummary: typeof sampleFinancialSummary;
  keyMetrics: typeof sampleKeyMetrics;
  subjectAreas: typeof sampleSubjectAreas;
  subscription: typeof sampleSubscription;
  publicationTrend: typeof samplePublicationTrend;
  jmAlerts: typeof sampleJmAlerts;
  quickActionsJM: typeof sampleQuickActionsJM;
  employees: Employee[];
  businessExpenses: JournalExpense[];
  googleAdsSpend: GoogleAdsSpend;
};

const CONNECTED_JOURNALS: { code: string; prefix: string; name: string }[] = [
  { code: "IJPS", prefix: "ijps", name: "International Journal of Pharmaceutical Sciences" },
  { code: "IJSRT", prefix: "ijsrt", name: "International Journal of Scientific Research & Technology" },
  { code: "IJMPS", prefix: "ijmps", name: "International Journal of Medical & Pharmaceutical Sciences" },
  { code: "IJES", prefix: "ijes", name: "International Journal of Engineering & Science" },
];

type RealJournalData = {
  code: string;
  counts: IjpsCounts;
  revenue: IjpsRevenue;
  monthly: MonthlyPoint[];
  articleTypes: ArticleTypeStat[];
  recentActivity: IjpsActivity[];
  employees: IjpsEmployee[];
};

async function fetchJournal(code: string, prefix: string): Promise<RealJournalData> {
  // counts + revenue are the core numbers this journal contributes to the
  // aggregate dashboard, so let those two failures propagate (the journal
  // falls back to sample data entirely). The rest are supplementary — a
  // schema quirk in one journal's employee/activity table shouldn't blank
  // out its otherwise-good manuscript/revenue numbers, so those degrade to
  // empty arrays independently instead of failing the whole fetch.
  const [counts, revenue] = await Promise.all([
    getJournalCounts(code, prefix),
    getJournalRevenue(code, prefix),
  ]);
  const [monthly, articleTypes, recentActivity, employees] = await Promise.all([
    getJournalMonthlyTrends(code, prefix).catch((err) => { console.error(`${code} monthly trends failed:`, err.message); return []; }),
    getJournalArticleTypes(code, prefix).catch((err) => { console.error(`${code} article types failed:`, err.message); return []; }),
    getJournalRecentActivity(code, prefix).catch((err) => { console.error(`${code} recent activity failed:`, err.message); return []; }),
    getJournalEmployees(code, prefix).catch((err) => { console.error(`${code} employees failed:`, err.message); return []; }),
  ]);
  return { code, counts, revenue, monthly, articleTypes, recentActivity, employees };
}

// JPS runs on a separate Postgres database with a different schema, so it's
// reshaped here into the same RealJournalData shape the MySQL journals use.
async function fetchJps(): Promise<RealJournalData> {
  const [counts, revenue] = await Promise.all([getJpsCounts(), getJpsRevenue()]);
  const [monthlyRaw, articleTypes, recentActivity, jpsEmployees] = await Promise.all([
    getJpsMonthlyTrends().catch((err) => { console.error("JPS monthly trends failed:", err.message); return []; }),
    getJpsTypeBreakdown().catch((err) => { console.error("JPS article types failed:", err.message); return []; }),
    getJpsRecentActivity().catch((err) => { console.error("JPS recent activity failed:", err.message); return []; }),
    getJpsEmployees().catch((err) => { console.error("JPS employees failed:", err.message); return []; }),
  ]);

  const mappedCounts: IjpsCounts = {
    totalManuscripts: counts.totalManuscripts,
    publishedArticles: counts.publishedArticles,
    received: counts.submitted,
    accepted: counts.accepted,
    paid: counts.paid,
    published: counts.published,
    rejected: counts.rejected,
    revisionRequired: counts.revisionRequired,
    underReview: counts.underReview,
    totalAuthors: counts.totalAuthors,
    totalSubscribers: counts.totalSubscribers,
    totalEmployees: counts.totalEmployees,
  };
  const mappedRevenue: IjpsRevenue = { apc: revenue.completed, plagiarism: 0, total: revenue.completed };
  const monthly: MonthlyPoint[] = monthlyRaw.map((m) => ({
    month: m.month,
    submissions: m.submissions,
    articles: 0,
    accepted: 0,
  }));

  return {
    code: "JPS",
    counts: mappedCounts,
    revenue: mappedRevenue,
    monthly,
    articleTypes,
    recentActivity,
    employees: jpsEmployees,
  };
}

export async function getJournalDashboardData(): Promise<JournalDashboardData> {
  const results = await Promise.allSettled([
    ...CONNECTED_JOURNALS.map((j) => fetchJournal(j.code, j.prefix)),
    fetchJps(),
  ]);
  const codes = [...CONNECTED_JOURNALS.map((j) => j.code), "JPS"];
  const real = new Map<string, RealJournalData>();
  results.forEach((r, idx) => {
    if (r.status === "fulfilled") real.set(codes[idx], r.value);
    else console.error(`Failed to load ${codes[idx]} data:`, r.reason);
  });

  // Business expense sheet: real Supabase-tracked expenses (per-journal or
  // combined) plus live Google Ads spend. Isolated from the rest of the
  // dashboard so a Supabase/Google Ads hiccup never blanks the whole page.
  const [businessExpenses, googleAdsSpend] = await Promise.all([
    listCombinedExpenses().catch((err) => { console.error("Business expenses failed to load:", err.message); return []; }),
    getGoogleAdsSpend().catch((err) => ({ connected: false, totalSpend: 0, currency: "INR", byJournal: [], periodLabel: "This Month", error: err.message })),
  ]);

  // --- journal performance table: replace every connected journal with real data ---
  const journalPerformance: JournalPerf[] = sampleJournalPerformance.map((j) => {
    const rj = real.get(j.code);
    if (!rj) return j;
    return {
      ...j,
      manuscripts: rj.counts.totalManuscripts,
      published: rj.counts.publishedArticles,
      acceptance: round1((rj.counts.publishedArticles / Math.max(rj.counts.totalManuscripts, 1)) * 100),
      revenue: rj.revenue.total,
      growth: j.growth, // keep sample growth until YoY history is tracked
    };
  });

  // --- submissions by journal donut ---
  const submissionsByJournal = sampleSubmissionsByJournal.map((j) => {
    const rj = real.get(j.name);
    return rj ? { ...j, value: rj.counts.totalManuscripts } : j;
  });
  normalizePercentages(submissionsByJournal);

  // --- article status donut: summed across every connected journal ---
  const realJournals = Array.from(real.values());
  const sumCounts = (fn: (c: IjpsCounts) => number) => realJournals.reduce((s, r) => s + fn(r.counts), 0);
  const articleStatus = [
    { name: "Under Review", value: sumCounts((c) => c.underReview), pct: 0, color: "#22c55e" },
    { name: "Revision", value: sumCounts((c) => c.revisionRequired), pct: 0, color: "#3b82f6" },
    { name: "Accepted", value: sumCounts((c) => c.accepted + c.paid), pct: 0, color: "#8b5cf6" },
    { name: "Published", value: sumCounts((c) => c.publishedArticles), pct: 0, color: "#f59e0b" },
    { name: "Rejected", value: sumCounts((c) => c.rejected), pct: 0, color: "#ef4444" },
  ];
  normalizePercentages(articleStatus);

  // --- monthly submissions per journal: one line per journal, last 12 months ---
  // Every journal now reports its month key in the same "YYYY-MM" format (a
  // format mismatch between MySQL's "YYYY-MM" and JPS's old "Mon YYYY" used
  // to make merged/sorted months interleave incorrectly on the x-axis).
  const monthKeys = new Set<string>();
  for (const rj of realJournals) for (const m of rj.monthly) monthKeys.add(m.month);
  const sortedMonths = Array.from(monthKeys).sort().slice(-12);
  const submissionsByJournalData = sortedMonths.map((month) => {
    const row: Record<string, number | string> = { label: month };
    for (const rj of realJournals) {
      row[rj.code] = rj.monthly.find((m) => m.month === month)?.submissions ?? 0;
    }
    return row;
  });
  const submissionsByJournalSeries = realJournals.map((rj) => ({
    key: rj.code,
    name: rj.code,
    color: JCOL[rj.code as keyof typeof JCOL] ?? "#94a3b8",
  }));

  // --- recent activities: real logs from every connected journal, newest first ---
  const realActivities = realJournals.flatMap((rj) =>
    rj.recentActivity.map((a) => ({
      id: a.id,
      text: a.text,
      meta: a.meta,
      time: a.time,
      icon: "file" as const,
      color: JCOL[rj.code as keyof typeof JCOL] ?? JCOL.IJPS,
    }))
  );
  const jmActivities = [
    ...realActivities.slice(0, 5),
    ...sampleJmActivities.slice(0, Math.max(0, 5 - realActivities.length)),
  ];

  // --- revenue breakdown: summed APC / plagiarism across connected journals ---
  const totalApc = realJournals.reduce((s, r) => s + r.revenue.apc, 0);
  const totalPlagiarism = realJournals.reduce((s, r) => s + r.revenue.plagiarism, 0);
  const revenueBreakdown = [
    { name: "Article Processing Charges", value: totalApc, pct: 0, color: "#6366f1" },
    { name: "Plagiarism / Other Income", value: totalPlagiarism, pct: 0, color: "#f59e0b" },
    {
      name: "Subscription",
      value: Math.max(0, sampleRevenueBreakdown.reduce((s, r) => s + r.value, 0) - totalApc - totalPlagiarism),
      pct: 0,
      color: "#22c55e",
    },
  ];
  normalizePercentages(revenueBreakdown);

  // --- financial summary ---
  const totalRevenue = realJournals.reduce((s, r) => s + r.revenue.total, 0);
  const sampleRevenueTotal = sampleFinancialSummary.find((f) => f.label === "Total Revenue")?.value ?? "₹18,75,450";
  const sampleExpense = sampleFinancialSummary.find((f) => f.label === "Total Expenses")?.value ?? "₹7,25,300";
  const sampleExpenseNum = parseIndianNumber(sampleExpense);
  const sampleRevenueNum = parseIndianNumber(sampleRevenueTotal);
  const expenseRatio = sampleExpenseNum / Math.max(sampleRevenueNum, 1);
  const totalExpenses = Math.round(totalRevenue * expenseRatio);
  const netProfit = totalRevenue - totalExpenses;

  const financialSummary = [
    { label: "Total Revenue" as const, value: formatInr(totalRevenue), growth: 24.8, color: "var(--c-green)" as const, spark: sampleFinancialSummary[0].spark },
    { label: "Total Expenses" as const, value: formatInr(totalExpenses), growth: 9.3, color: "var(--c-rose)" as const, spark: sampleFinancialSummary[1].spark },
    { label: "Net Profit" as const, value: formatInr(netProfit), growth: 21.3, color: "var(--c-green)" as const, spark: sampleFinancialSummary[2].spark },
  ];

  // --- subject areas: merged article types across connected journals ---
  const typeMap = new Map<string, number>();
  for (const rj of realJournals) {
    for (const t of rj.articleTypes) {
      typeMap.set(t.name, (typeMap.get(t.name) ?? 0) + t.count);
    }
  }
  const totalTypeCount = Array.from(typeMap.values()).reduce((s, c) => s + c, 0);
  const subjectAreas = totalTypeCount
    ? Array.from(typeMap.entries()).map(([name, count]) => ({
        name,
        pct: Math.round((count / totalTypeCount) * 100),
        color: sampleSubjectAreas.find((s) => s.name.toLowerCase().includes(name.toLowerCase().slice(0, 4)))?.color ?? "#94a3b8",
      }))
    : sampleSubjectAreas;

  // --- subscription: summed real subscriber counts ---
  const totalSubscribers = realJournals.reduce((s, r) => s + r.counts.totalSubscribers, 0);
  const subscription = sampleSubscription.map((s) =>
    s.label === "Active Subscribers" ? { ...s, value: totalSubscribers.toLocaleString("en-IN") } : s
  );

  // --- publication trend ---
  const pubMap = new Map<string, { published: number; accepted: number }>();
  for (const rj of realJournals) {
    for (const m of rj.monthly) {
      const existing = pubMap.get(m.month) ?? { published: 0, accepted: 0 };
      existing.published += m.articles;
      existing.accepted += m.accepted;
      pubMap.set(m.month, existing);
    }
  }
  const mergedPubTrend = Array.from(pubMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, published: v.published, accepted: v.accepted }));

  // --- top stat cards ---
  const totalManuscripts = journalPerformance.reduce((s, j) => s + j.manuscripts, 0);
  const totalPublished = journalPerformance.reduce((s, j) => s + j.published, 0);
  const totalUnderReview = realJournals.reduce((s, r) => s + r.counts.underReview, 0);
  const totalAuthors = realJournals.reduce((s, r) => s + r.counts.totalAuthors, 0);
  const totalUsers = totalAuthors;
  const totalRevenueAll = journalPerformance.reduce((s, j) => s + j.revenue, 0);

  const jmStats = sampleJmStats.map((s) => {
    switch (s.label) {
      case "Total Manuscripts":
        return { ...s, value: totalManuscripts.toLocaleString("en-IN") };
      case "Published Papers":
        return { ...s, value: totalPublished.toLocaleString("en-IN") };
      case "Under Review":
        return { ...s, value: totalUnderReview.toLocaleString("en-IN") };
      case "Total Users":
        return { ...s, value: totalUsers.toLocaleString("en-IN") };
      case "Total Revenue":
        return { ...s, value: formatInr(totalRevenueAll) };
      default:
        return s;
    }
  });

  // --- employees: real staff from every connected journal, sample productivity metrics ---
  let sampleIdx = 0;
  const employeesOut: Employee[] = realJournals.flatMap((rj) =>
    rj.employees.map((e) => {
      const sample = sampleEmployees[sampleIdx++ % sampleEmployees.length];
      return {
        id: `${rj.code.toLowerCase()}-emp-${e.id}`,
        name: e.name,
        role: e.role,
        journal: rj.code,
        initials: getInitials(e.name),
        color: JCOL[rj.code as keyof typeof JCOL] ?? JCOL.IJPS,
        handled: sample.handled,
        completed: sample.completed,
        pending: sample.pending,
        turnaround: sample.turnaround,
        score: sample.score,
        trend: sample.trend,
      };
    })
  );

  return {
    jmStats,
    submissionsByJournalTrend: { data: submissionsByJournalData, series: submissionsByJournalSeries },
    submissionsByJournal,
    jmActivities,
    journalPerformance,
    revenueBreakdown,
    articleStatus,
    submissionSource: sampleSubmissionSource,
    financialSummary,
    keyMetrics: sampleKeyMetrics,
    subjectAreas,
    subscription,
    publicationTrend: mergedPubTrend.length ? mergedPubTrend : samplePublicationTrend,
    jmAlerts: sampleJmAlerts,
    quickActionsJM: sampleQuickActionsJM,
    employees: employeesOut.length ? employeesOut : sampleEmployees,
    businessExpenses,
    googleAdsSpend,
  };
}

function normalizePercentages(items: { name: string; value: number; pct: number; color: string }[]) {
  const total = items.reduce((s, i) => s + i.value, 0);
  for (const item of items) {
    item.pct = total ? Math.round((item.value / total) * 100) : 0;
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatInr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function parseIndianNumber(s: string): number {
  return Number(s.replace(/[₹,]/g, "").trim());
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
