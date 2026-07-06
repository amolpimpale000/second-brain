/* Data for the Personal Finance page (/finances). */

/* ── KPI cards ─────────────────────────────────────────────────────────────── */
export const kpis = [
  { label: "Total Income", value: 125000, delta: 8.6, vs: "vs Apr 2025", color: "#22c55e", spark: [40, 42, 38, 45, 50, 48, 55, 52, 58, 60, 62, 65] },
  { label: "Total Expenses", value: 68420, delta: 5.2, vs: "vs Apr 2025", color: "#ef4444", spark: [30, 32, 35, 33, 36, 38, 34, 37, 35, 38, 36, 34] },
  { label: "Net Savings", value: 56580, delta: 15.3, vs: "vs Apr 2025", color: "#3b82f6", spark: [20, 22, 25, 28, 30, 32, 28, 35, 38, 40, 42, 45] },
  { label: "Total Investments", value: 875000, delta: 11.2, vs: "vs Apr 2025", color: "#8b5cf6", spark: [50, 52, 55, 54, 58, 60, 62, 64, 66, 68, 70, 72] },
  { label: "Total Loans", value: 325000, delta: -2.1, vs: "vs Apr 2025", color: "#f59e0b", spark: [60, 58, 56, 55, 53, 52, 50, 49, 48, 47, 46, 45] },
  { label: "Net Worth", value: 1875450, delta: 12.4, vs: "vs Apr 2025", color: "#22c55e", spark: [30, 35, 38, 40, 42, 45, 48, 50, 55, 58, 62, 68] },
];

/* ── Cash flow (weekly, May 2025) ─────────────────────────────────────────── */
export const cashFlowWeekly = [
  { week: "1-7 May", income: 65000, expenses: 42000, savings: 23000 },
  { week: "8-14 May", income: 95000, expenses: 48000, savings: 47000 },
  { week: "15-21 May", income: 110000, expenses: 55000, savings: 55000 },
  { week: "22-28 May", income: 140000, expenses: 62000, savings: 78000 },
  { week: "29-31 May", income: 125000, expenses: 68000, savings: 57000 },
];

/* ── Expense breakdown ────────────────────────────────────────────────────── */
export const expenseBreakdown = [
  { name: "Housing", value: 21560, pct: 31.5, color: "#22c55e" },
  { name: "Food & Dining", value: 12800, pct: 18.7, color: "#f59e0b" },
  { name: "Transport", value: 8420, pct: 12.3, color: "#3b82f6" },
  { name: "Shopping", value: 6700, pct: 9.8, color: "#ec4899" },
  { name: "Utilities", value: 5200, pct: 7.6, color: "#8b5cf6" },
  { name: "Entertainment", value: 3700, pct: 5.4, color: "#06b6d4" },
  { name: "Others", value: 10040, pct: 14.7, color: "#94a3b8" },
];

/* ── Savings goals ────────────────────────────────────────────────────────── */
export const savingsGoals = [
  { id: "sg1", name: "Europe Trip", saved: 75000, target: 200000, pct: 38, color: "#8b5cf6", icon: "plane" },
  { id: "sg2", name: "New Bike", saved: 50000, target: 150000, pct: 33, color: "#3b82f6", icon: "bike" },
  { id: "sg3", name: "Emergency Fund", saved: 100000, target: 300000, pct: 33, color: "#22c55e", icon: "shield" },
];

/* ── Recent transactions ──────────────────────────────────────────────────── */
export const recentTxns = [
  { id: "t1", name: "Salary", category: "May Salary", amount: 125000, type: "credit", date: "31 May 2025", icon: "salary" },
  { id: "t2", name: "BigBasket", category: "Groceries", amount: 1250, type: "debit", date: "30 May 2025", icon: "grocery" },
  { id: "t3", name: "Uber Ride", category: "Transport", amount: 320, type: "debit", date: "29 May 2025", icon: "transport" },
  { id: "t4", name: "Electricity Bill", category: "Utilities", amount: 2450, type: "debit", date: "28 May 2025", icon: "bill" },
  { id: "t5", name: "Netflix", category: "Entertainment", amount: 649, type: "debit", date: "27 May 2025", icon: "netflix" },
];

/* ── Budget vs actual ─────────────────────────────────────────────────────── */
export const budgetVsActual = [
  { category: "Housing", budget: 25000, actual: 21560, pct: 86 },
  { category: "Food & Dining", budget: 15000, actual: 12800, pct: 85 },
  { category: "Transport", budget: 10000, actual: 8420, pct: 84 },
  { category: "Utilities", budget: 6000, actual: 5200, pct: 87 },
  { category: "Entertainment", budget: 5000, actual: 3700, pct: 74 },
];

/* ── Top spending categories ──────────────────────────────────────────────── */
export const topSpending = [
  { name: "Housing", value: 21560, pct: 31.5, color: "#22c55e" },
  { name: "Food & Dining", value: 12800, pct: 18.7, color: "#f59e0b" },
  { name: "Transport", value: 8420, pct: 12.3, color: "#3b82f6" },
  { name: "Shopping", value: 6700, pct: 9.8, color: "#ec4899" },
  { name: "Utilities", value: 5200, pct: 7.6, color: "#8b5cf6" },
  { name: "Others", value: 10040, pct: 14.7, color: "#94a3b8" },
];

/* ── Accounts overview ────────────────────────────────────────────────────── */
export const accounts = [
  { id: "a1", name: "HDFC Bank", type: "Savings", balance: 125430, color: "#1e40af", icon: "hdfc" },
  { id: "a2", name: "SBI Bank", type: "Salary", balance: 215600, color: "#22c55e", icon: "sbi" },
  { id: "a3", name: "ICICI Bank", type: "FD", balance: 100000, color: "#ea580c", icon: "icici" },
  { id: "a4", name: "Cash In Hand", type: "", balance: 44200, color: "#16a34a", icon: "cash" },
];

/* ── Upcoming bills ───────────────────────────────────────────────────────── */
export const upcomingBills = [
  { id: "b1", name: "Netflix Subscription", amount: 649, date: "05 Jun 2025", icon: "netflix", color: "#e50914", brand: true },
  { id: "b2", name: "Amazon Prime", amount: 179, date: "07 Jun 2025", icon: "amazon", color: "#ff9900", brand: true },
  { id: "b3", name: "Spotify Premium", amount: 119, date: "15 Jun 2025", icon: "spotify", color: "#1db954", brand: true },
  { id: "b4", name: "Mobile Postpaid", amount: 799, date: "20 Jun 2025", icon: "mobile", color: "#3b82f6" },
  { id: "b5", name: "Internet Bill", amount: 999, date: "25 Jun 2025", icon: "internet", color: "#6366f1" },
];

/* ── Loans overview ───────────────────────────────────────────────────────── */
export const loans = [
  { id: "l1", name: "Home Loan", principal: 2000000, rate: 8.5, remaining: 1250000, color: "#6366f1", icon: "home" },
  { id: "l2", name: "Personal Loan", principal: 500000, rate: 11.5, remaining: 225000, color: "#ef4444", icon: "user" },
];

/* ── I owe (to others) ────────────────────────────────────────────────────── */
export const iOwe = [
  { id: "o1", name: "Rohan Sharma", amount: 12000, due: "10 Jun 2025", status: "Pending" },
  { id: "o2", name: "Sneha Patil", amount: 5500, due: "15 Jun 2025", status: "Pending" },
  { id: "o3", name: "Amit Verma", amount: 3000, due: "20 Jun 2025", status: "Pending" },
];

/* ── Financial health score ───────────────────────────────────────────────── */
export const healthScore = {
  score: 85,
  max: 100,
  label: "Excellent",
  metrics: [
    { name: "Spending", status: "Good", color: "#22c55e" },
    { name: "Savings Rate", status: "Excellent", color: "#22c55e" },
    { name: "Debt Management", status: "Good", color: "#22c55e" },
    { name: "Investments", status: "Excellent", color: "#22c55e" },
    { name: "Financial Discipline", status: "Excellent", color: "#22c55e" },
  ],
};
