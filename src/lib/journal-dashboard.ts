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
  submissionsTrend as sampleSubmissionsTrend,
  JCOL,
  type JournalPerf,
  type Employee,
} from "./data";
import {
  getIjpsCounts,
  getIjpsRevenue,
  getIjpsMonthlyTrends,
  getIjpsArticleTypes,
  getIjpsRecentActivity,
  getIjpsEmployees,
} from "./journal-queries";

// ---------------------------------------------------------------------------
// Aggregates real IJPS data with placeholder data for the other four journals.
// When credentials for IJSRT / IJMPS / IJES / JPS are added, their sample
// placeholders can be replaced with real queries without touching the UI.
// ---------------------------------------------------------------------------

export type JournalDashboardData = {
  jmStats: typeof sampleJmStats;
  submissionsTrend: typeof sampleSubmissionsTrend;
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
};

const IJPS_CODE = "IJPS";
const IJPS_NAME = "International Journal of Pharmaceutical Sciences";

export async function getJournalDashboardData(): Promise<JournalDashboardData> {
  const counts = await getIjpsCounts();
  const revenue = await getIjpsRevenue();
  const monthly = await getIjpsMonthlyTrends();
  const articleTypes = await getIjpsArticleTypes();
  const recentActivity = await getIjpsRecentActivity();
  const employees = await getIjpsEmployees();

  // --- journal performance table: replace IJPS with real data, keep others sample ---
  const journalPerformance: JournalPerf[] = sampleJournalPerformance.map((j) => {
    if (j.code === IJPS_CODE) {
      return {
        ...j,
        name: IJPS_NAME,
        manuscripts: counts.totalManuscripts,
        published: counts.publishedArticles,
        acceptance: round1(
          (counts.publishedArticles / Math.max(counts.totalManuscripts, 1)) * 100
        ),
        revenue: revenue.total,
        growth: j.growth, // keep sample growth until we can compute YoY
      };
    }
    return j;
  });

  // --- submissions by journal donut ---
  const submissionsByJournal = sampleSubmissionsByJournal.map((j) =>
    j.name === IJPS_CODE
      ? { ...j, value: counts.totalManuscripts }
      : j
  );
  normalizePercentages(submissionsByJournal);

  // --- article status donut ---
  const articleStatus = [
    {
      name: "Under Review",
      value: counts.underReview,
      pct: 0,
      color: "#22c55e",
    },
    {
      name: "Revision",
      value: counts.revisionRequired,
      pct: 0,
      color: "#3b82f6",
    },
    {
      name: "Accepted",
      value: counts.accepted + counts.paid,
      pct: 0,
      color: "#8b5cf6",
    },
    {
      name: "Published",
      value: counts.publishedArticles,
      pct: 0,
      color: "#f59e0b",
    },
    {
      name: "Rejected",
      value: counts.rejected,
      pct: 0,
      color: "#ef4444",
    },
  ];
  normalizePercentages(articleStatus);

  // --- monthly submissions trend for chart ---
  const submissionsTrend = monthly.map((m) => ({
    label: m.month,
    total: m.submissions,
    review: 0,
    accepted: m.accepted,
    rejected: 0,
  }));

  // If IJPS has fewer than sample months, pad so the chart doesn't look empty.
  const trend = submissionsTrend.length
    ? submissionsTrend
    : sampleSubmissionsTrend;

  // --- recent activities: prepend real IJPS logs, keep sample rest ---
  const jmActivities = [
    ...recentActivity.map((a) => ({
      id: a.id,
      text: a.text,
      meta: a.meta,
      time: a.time,
      icon: "file" as const,
      color: JCOL.IJPS,
    })),
    ...sampleJmActivities.slice(0, Math.max(0, 5 - recentActivity.length)),
  ];

  // --- revenue breakdown ---
  const revenueBreakdown = [
    {
      name: "Article Processing Charges",
      value: revenue.apc,
      pct: 0,
      color: "#6366f1",
    },
    {
      name: "Plagiarism / Other Income",
      value: revenue.plagiarism,
      pct: 0,
      color: "#f59e0b",
    },
    {
      name: "Subscription",
      value: Math.max(
        0,
        sampleRevenueBreakdown.reduce((s, r) => s + r.value, 0) -
          revenue.apc -
          revenue.plagiarism
      ),
      pct: 0,
      color: "#22c55e",
    },
  ];
  normalizePercentages(revenueBreakdown);

  // --- financial summary ---
  const totalRevenue = revenue.total;
  // Expenses are not tracked in the IJPS DB; keep the sample ratio for now.
  const sampleRevenueTotal = sampleFinancialSummary.find(
    (f) => f.label === "Total Revenue"
  )?.value ?? "₹18,75,450";
  const sampleExpense = sampleFinancialSummary.find(
    (f) => f.label === "Total Expenses"
  )?.value ?? "₹7,25,300";
  const sampleExpenseNum = parseIndianNumber(sampleExpense);
  const sampleRevenueNum = parseIndianNumber(sampleRevenueTotal);
  const expenseRatio = sampleExpenseNum / Math.max(sampleRevenueNum, 1);
  const totalExpenses = Math.round(totalRevenue * expenseRatio);
  const netProfit = totalRevenue - totalExpenses;

  const financialSummary = [
    {
      label: "Total Revenue" as const,
      value: formatInr(totalRevenue),
      growth: 24.8,
      color: "var(--c-green)" as const,
      spark: sampleFinancialSummary[0].spark,
    },
    {
      label: "Total Expenses" as const,
      value: formatInr(totalExpenses),
      growth: 9.3,
      color: "var(--c-rose)" as const,
      spark: sampleFinancialSummary[1].spark,
    },
    {
      label: "Net Profit" as const,
      value: formatInr(netProfit),
      growth: 21.3,
      color: "var(--c-green)" as const,
      spark: sampleFinancialSummary[2].spark,
    },
  ];

  // --- subject areas from real article types ---
  const totalTypeCount = articleTypes.reduce((s, t) => s + t.count, 0);
  const subjectAreas = articleTypes.map((t) => ({
    name: t.name,
    pct: Math.round((t.count / Math.max(totalTypeCount, 1)) * 100),
    color: sampleSubjectAreas.find((s) =>
      s.name.toLowerCase().includes(t.name.toLowerCase().slice(0, 4))
    )?.color ?? "#94a3b8",
  }));

  // --- subscription: use real IJPS subscriber count ---
  const subscription = sampleSubscription.map((s) =>
    s.label === "Active Subscribers"
      ? { ...s, value: counts.totalSubscribers.toLocaleString("en-IN") }
      : s
  );

  // --- publication trend ---
  const publicationTrend = monthly.map((m) => ({
    label: m.month,
    published: m.articles,
    accepted: m.accepted,
  }));

  // --- top stat cards ---
  const totalManuscripts = journalPerformance.reduce(
    (s, j) => s + j.manuscripts,
    0
  );
  const totalPublished = journalPerformance.reduce(
    (s, j) => s + j.published,
    0
  );
  const totalUnderReview = counts.underReview + sampleArticleStatus[0].value; // rough until others connected
  const totalUsers =
    counts.totalAuthors +
    sampleJournalPerformance
      .filter((j) => j.code !== IJPS_CODE)
      .reduce((s, j) => s + Math.round(j.manuscripts * 8.5), 0);
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

  // --- employees: use real IJPS staff with sample productivity metrics ---
  const employeesOut: Employee[] = employees.map((e, idx) => {
    const sample = sampleEmployees[idx % sampleEmployees.length];
    return {
      id: `ijps-emp-${e.id}`,
      name: e.name,
      role: e.role,
      journal: IJPS_CODE,
      initials: getInitials(e.name),
      color: JCOL.IJPS,
      handled: sample.handled,
      completed: sample.completed,
      pending: sample.pending,
      turnaround: sample.turnaround,
      score: sample.score,
      trend: sample.trend,
    };
  });

  return {
    jmStats,
    submissionsTrend: trend,
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
    publicationTrend: publicationTrend.length
      ? publicationTrend
      : samplePublicationTrend,
    jmAlerts: sampleJmAlerts,
    quickActionsJM: sampleQuickActionsJM,
    employees: employeesOut,
  };
}

function normalizePercentages(
  items: { name: string; value: number; pct: number; color: string }[]
) {
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
  return Number(
    s.replace(/[₹,]/g, "").trim()
  );
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
