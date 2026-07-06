export const ijpsKpis = [
  { label: "Total Manuscripts", value: "437", delta: 18.7, icon: "file", color: "#6366f1" },
  { label: "Published Papers", value: "312", delta: 16.3, icon: "papers", color: "#3b82f6" },
  { label: "Acceptance Rate", value: "71.4%", delta: 5.2, icon: "check", color: "#22c55e" },
  { label: "Total Revenue", value: "₹ 6,25,450", delta: 28.6, icon: "revenue", color: "#10b981" },
  { label: "Total Expenses", value: "₹ 1,82,340", delta: 15.3, icon: "expense", color: "#f59e0b" },
  { label: "Net Profit / Loss", value: "₹ 4,43,110", delta: 33.7, icon: "profit", color: "#8b5cf6" },
];

export const manuscriptOverview = [
  { label: "01 May", submitted: 180, underReview: 100, accepted: 60, rejected: 20 },
  { label: "06 May", submitted: 250, underReview: 140, accepted: 80, rejected: 25 },
  { label: "11 May", submitted: 320, underReview: 200, accepted: 120, rejected: 30 },
  { label: "16 May", submitted: 520, underReview: 310, accepted: 210, rejected: 60 },
  { label: "21 May", submitted: 450, underReview: 280, accepted: 180, rejected: 45 },
  { label: "26 May", submitted: 380, underReview: 240, accepted: 160, rejected: 35 },
  { label: "31 May", submitted: 400, underReview: 260, accepted: 190, rejected: 40 },
];

export const manuscriptsByStatus = [
  { name: "Under Review", value: 310, pct: 70.9, color: "#22c55e" },
  { name: "Accepted", value: 210, pct: 48.0, color: "#3b82f6" },
  { name: "Rejected", value: 60, pct: 13.7, color: "#ef4444" },
  { name: "Revisions", value: 45, pct: 10.3, color: "#f59e0b" },
];

export const quickActions = [
  { label: "Submit New Manuscript", icon: "submit" },
  { label: "Add Expense", icon: "expense" },
  { label: "Import Income (Razorpay)", icon: "import" },
  { label: "View Financial Report", icon: "report" },
  { label: "Google Ads Dashboard", icon: "ads" },
  { label: "Download Report", icon: "download" },
];

export const revenueData = [
  { month: "01 May", value: 3200 },
  { month: "06 May", value: 4800 },
  { month: "11 May", value: 5200 },
  { month: "16 May", value: 7200 },
  { month: "21 May", value: 6400 },
  { month: "26 May", value: 5800 },
  { month: "31 May", value: 6800 },
];

export const revenueBreakdownIjps = [
  { name: "Article Processing Charges", value: 425200, pct: 68.0, color: "#6366f1" },
  { name: "Subscription Fees", value: 145300, pct: 23.2, color: "#22c55e" },
  { name: "Other Income", value: 54950, pct: 8.8, color: "#f59e0b" },
];

export const razorpayIncome = {
  total: 625450,
  delta: 28.6,
  sources: [
    { name: "Online Payments", pct: 96.3, amount: 602450 },
    { name: "UPI", pct: 2.5, amount: 15600 },
    { name: "Cards", pct: 1.2, amount: 7400 },
  ],
};

export const googleAds = {
  totalSpend: 52430,
  delta: 14.7,
  metrics: [
    { label: "Impressions", value: "248,451", delta: 18.5 },
    { label: "Clicks", value: "3,645", delta: 21.3 },
    { label: "CTR", value: "1.47%", delta: 2.3 },
    { label: "Conversions", value: "215", delta: 16.2 },
    { label: "Cost / Conversion", value: "₹ 243.86", delta: 4.5 },
    { label: "ROAS", value: "7.82x", delta: 19.1 },
  ],
};

export const expensesBreakdownIjps = [
  { name: "Google Ads", value: 52430, pct: 28.7, color: "#6366f1" },
  { name: "Salaries", value: 62000, pct: 34.0, color: "#3b82f6" },
  { name: "Hosting & Domain", value: 8900, pct: 4.9, color: "#ef4444" },
  { name: "Software & Tools", value: 12750, pct: 7.0, color: "#f59e0b" },
  { name: "Publication Charges", value: 18900, pct: 10.4, color: "#8b5cf6" },
  { name: "Other Expenses", value: 27360, pct: 15.0, color: "#94a3b8" },
];

export const expenseTrend = [
  { label: "01 May", value: 22000 },
  { label: "08 May", value: 28000 },
  { label: "15 May", value: 32000 },
  { label: "22 May", value: 26000 },
  { label: "31 May", value: 30000 },
];

export const profitabilityData = [
  { label: "01 May", revenue: 3200, expenses: 1800, profit: 1400 },
  { label: "06 May", revenue: 4200, expenses: 2200, profit: 2000 },
  { label: "11 May", revenue: 5600, expenses: 2600, profit: 3000 },
  { label: "16 May", revenue: 7200, expenses: 3400, profit: 3800 },
  { label: "21 May", revenue: 6800, expenses: 3000, profit: 3800 },
  { label: "26 May", revenue: 5400, expenses: 2800, profit: 2600 },
  { label: "31 May", revenue: 6400, expenses: 3200, profit: 3200 },
];

export const recentTransactions = [
  { id: "t1", date: "23 May 2025", type: "Expense", category: "Google Ads", description: "Google Ads Campaign - May 2025", amount: 52430, mode: "UPI", source: "Manual" },
  { id: "t2", date: "22 May 2025", type: "Income", category: "Article Processing", description: "Manuscript ID: UPS-25-1045", amount: 15750, mode: "Online", source: "Razorpay" },
  { id: "t3", date: "21 May 2025", type: "Expense", category: "Salaries", description: "Editorial Assistant - May Salary", amount: 22000, mode: "Bank Transfer", source: "" },
  { id: "t4", date: "20 May 2025", type: "Income", category: "Subscription", description: "Institutional Subscription", amount: 8900, mode: "Online", source: "Razorpay" },
  { id: "t5", date: "19 May 2025", type: "Expense", category: "Hosting & Domain", description: "Hosting Renew - Hostinger", amount: 3600, mode: "UPI", source: "Manual" },
];

export const expensesTable = [
  { id: "e1", date: "23 May 2025", category: "Google Ads", description: "Google Ads Campaign - May 2025", amount: 52430, mode: "UPI", paymentTo: "Google Payments India", bill: "invoice_may.pdf" },
  { id: "e2", date: "21 May 2025", category: "Salaries", description: "Editorial Assistant - May Salary", amount: 22000, mode: "Bank Transfer", paymentTo: "Rahul Sharma", bill: "salary_may.pdf" },
  { id: "e3", date: "21 May 2025", category: "Hosting & Domain", description: "Hosting Renew - Hostinger", amount: 3600, mode: "UPI", paymentTo: "Hostinger", bill: "invoice_hosting.pdf" },
  { id: "e4", date: "19 May 2025", category: "Software & Tools", description: "Grammarly Business Plan", amount: 2950, mode: "Card", paymentTo: "Grammarly", bill: "invoice_grammarly.pdf" },
  { id: "e5", date: "18 May 2025", category: "Publication Charges", description: "DOI Registration Charges", amount: 8500, mode: "UPI", paymentTo: "Crossref", bill: "invoice_doi.pdf" },
  { id: "e6", date: "17 May 2025", category: "Other Expenses", description: "Zoom Meeting - Editorial Meeting", amount: 1250, mode: "Card", paymentTo: "Zoom", bill: "invoice_zoom.pdf" },
  { id: "e7", date: "15 May 2025", category: "Email Marketing", description: "Mailchimp - Email Campaign", amount: 1900, mode: "Card", paymentTo: "Mailchimp", bill: "invoice_mailchimp.pdf" },
];
