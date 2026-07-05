// ============================================================================
// Second Brain — sample data layer
// Replace these exports with real DB queries when your database is connected.
// Every module below maps 1:1 to a page in the dashboard.
// ============================================================================

export const owner = {
  name: "Amol Pimpale",
  handle: "@amol",
  email: "amolpimpale000@gmail.com",
  role: "Founder · 5 Journals",
};

// -------------------------------- OVERVIEW ---------------------------------

export const netWorth = {
  total: 8452000,
  change: 12.4,
  assets: 11240000,
  liabilities: 2788000,
  breakdown: [
    { name: "Cash & Bank", value: 1840000, color: "var(--c-green)" },
    { name: "Investments", value: 4260000, color: "var(--c-teal)" },
    { name: "Business Equity", value: 3900000, color: "var(--c-lime)" },
    { name: "Real Estate", value: 1240000, color: "var(--c-sky)" },
  ],
};

export const cashflow = [
  { month: "Jan", income: 620000, expenses: 410000 },
  { month: "Feb", income: 580000, expenses: 390000 },
  { month: "Mar", income: 710000, expenses: 460000 },
  { month: "Apr", income: 690000, expenses: 420000 },
  { month: "May", income: 830000, expenses: 510000 },
  { month: "Jun", income: 910000, expenses: 470000 },
  { month: "Jul", income: 1020000, expenses: 540000 },
];

export const quickStats = [
  { label: "Total Income", value: 5360000, change: 8.2, kind: "income" as const },
  { label: "Total Expenses", value: 3200000, change: -4.1, kind: "expense" as const },
  { label: "Net Savings", value: 2160000, change: 15.6, kind: "saving" as const },
  { label: "Investments", value: 4260000, change: 11.2, kind: "invest" as const },
];

// ------------------------------ TRANSACTIONS -------------------------------

export type Txn = {
  id: string;
  name: string;
  category: string;
  account: string;
  date: string;
  amount: number; // negative = expense
  status: "completed" | "pending";
};

export const transactions: Txn[] = [
  { id: "t1", name: "IJSRT — Publication Fees", category: "Business Income", account: "HDFC Current", date: "05 Jul", amount: 184000, status: "completed" },
  { id: "t2", name: "AWS Cloud Hosting", category: "Infrastructure", account: "ICICI Business", date: "04 Jul", amount: -42600, status: "completed" },
  { id: "t3", name: "IJPS — Article Processing", category: "Business Income", account: "HDFC Current", date: "04 Jul", amount: 96500, status: "completed" },
  { id: "t4", name: "Mutual Fund SIP", category: "Investment", account: "Zerodha", date: "03 Jul", amount: -50000, status: "completed" },
  { id: "t5", name: "Editorial Team Payroll", category: "Salaries", account: "ICICI Business", date: "02 Jul", amount: -128000, status: "completed" },
  { id: "t6", name: "IJMPS — Publication Fees", category: "Business Income", account: "HDFC Current", date: "01 Jul", amount: 142000, status: "completed" },
  { id: "t7", name: "Car Loan EMI", category: "Loan Payment", account: "SBI Savings", date: "01 Jul", amount: -34500, status: "pending" },
  { id: "t8", name: "Wedding Fund Transfer", category: "Savings Goal", account: "SBI Savings", date: "30 Jun", amount: -75000, status: "completed" },
];

export const spendingByCategory = [
  { name: "Infrastructure", value: 720000, color: "var(--c-green)" },
  { name: "Salaries", value: 1180000, color: "var(--c-teal)" },
  { name: "Marketing", value: 340000, color: "var(--c-lime)" },
  { name: "Software", value: 210000, color: "var(--c-sky)" },
  { name: "Loan EMIs", value: 414000, color: "var(--c-amber)" },
  { name: "Personal", value: 336000, color: "var(--c-violet)" },
];

// ------------------------------ INVESTMENTS --------------------------------

export type Holding = {
  name: string;
  type: string;
  invested: number;
  current: number;
  units?: string;
};

export const portfolio = {
  invested: 3480000,
  current: 4260000,
  dayChange: 1.8,
  totalReturn: 22.4,
};

export const holdings: Holding[] = [
  { name: "Nifty 50 Index Fund", type: "Mutual Fund", invested: 900000, current: 1148000 },
  { name: "Parag Parikh Flexi Cap", type: "Mutual Fund", invested: 640000, current: 812000 },
  { name: "US S&P 500 FoF", type: "Mutual Fund", invested: 520000, current: 690000 },
  { name: "Reliance Industries", type: "Stock", invested: 340000, current: 398000 },
  { name: "Gold ETF", type: "ETF", invested: 380000, current: 452000 },
  { name: "Fixed Deposit", type: "FD", invested: 500000, current: 540000 },
  { name: "Bitcoin", type: "Crypto", invested: 200000, current: 220000 },
];

export const portfolioAllocation = [
  { name: "Equity MF", value: 2650000, color: "var(--c-green)" },
  { name: "Stocks", value: 398000, color: "var(--c-teal)" },
  { name: "Gold", value: 452000, color: "var(--c-amber)" },
  { name: "FD / Debt", value: 540000, color: "var(--c-sky)" },
  { name: "Crypto", value: 220000, color: "var(--c-violet)" },
];

export const portfolioGrowth = [
  { month: "Jan", value: 3350000 },
  { month: "Feb", value: 3480000 },
  { month: "Mar", value: 3410000 },
  { month: "Apr", value: 3720000 },
  { month: "May", value: 3910000 },
  { month: "Jun", value: 4080000 },
  { month: "Jul", value: 4260000 },
];

// --------------------------------- LOANS -----------------------------------

export type Loan = {
  id: string;
  name: string;
  lender: string;
  principal: number;
  outstanding: number;
  emi: number;
  rate: number;
  tenureLeft: number; // months
  nextDue: string;
};

export const loans: Loan[] = [
  { id: "l1", name: "Car Loan — Fortuner", lender: "SBI", principal: 1800000, outstanding: 940000, emi: 34500, rate: 9.2, tenureLeft: 28, nextDue: "05 Aug" },
  { id: "l2", name: "Home Loan", lender: "HDFC", principal: 4200000, outstanding: 1620000, emi: 41800, rate: 8.4, tenureLeft: 46, nextDue: "07 Aug" },
  { id: "l3", name: "Business Line of Credit", lender: "ICICI", principal: 500000, outstanding: 228000, emi: 22000, rate: 11.5, tenureLeft: 11, nextDue: "10 Aug" },
];

// ---------------------------- SAVINGS GOALS --------------------------------

export type Goal = {
  id: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  deadline: string;
  monthly: number;
  color: string;
};

export const goals: Goal[] = [
  { id: "g1", name: "Dream Car — Porsche", icon: "car", target: 6500000, saved: 2340000, deadline: "Dec 2027", monthly: 120000, color: "var(--c-green)" },
  { id: "g2", name: "Wedding", icon: "heart", target: 2500000, saved: 1650000, deadline: "Feb 2027", monthly: 90000, color: "var(--c-rose)" },
  { id: "g3", name: "Europe Travel", icon: "plane", target: 900000, saved: 640000, deadline: "Oct 2026", monthly: 45000, color: "var(--c-sky)" },
  { id: "g4", name: "Emergency Fund", icon: "shield", target: 1500000, saved: 1500000, deadline: "Achieved", monthly: 0, color: "var(--c-teal)" },
];

// -------------------------------- BUSINESSES -------------------------------

export type Business = {
  id: string;
  code: string;
  name: string;
  revenue: number;
  expenses: number;
  submissions: number;
  published: number;
  growth: number;
  color: string;
};

export const businesses: Business[] = [
  { id: "b1", code: "IJSRT", name: "Intl. Journal of Sci. Research & Tech", revenue: 2140000, expenses: 940000, submissions: 1240, published: 820, growth: 18.4, color: "var(--c-green)" },
  { id: "b2", code: "IJPS", name: "Intl. Journal of Physical Sciences", revenue: 1560000, expenses: 680000, submissions: 910, published: 560, growth: 12.1, color: "var(--c-teal)" },
  { id: "b3", code: "JPS", name: "Journal of Pharmaceutical Sciences", revenue: 1180000, expenses: 520000, submissions: 640, published: 390, growth: 9.7, color: "var(--c-lime)" },
  { id: "b4", code: "IJMPS", name: "Intl. Journal of Med. & Pharma Sci", revenue: 1420000, expenses: 610000, submissions: 780, published: 470, growth: 15.3, color: "var(--c-sky)" },
  { id: "b5", code: "IEJS", name: "Intl. Engineering Journal of Science", revenue: 980000, expenses: 430000, submissions: 520, published: 310, growth: 7.2, color: "var(--c-amber)" },
];

export const businessMonthly = [
  { month: "Jan", IJSRT: 150, IJPS: 110, JPS: 82, IJMPS: 98, IEJS: 64 },
  { month: "Feb", IJSRT: 168, IJPS: 118, JPS: 88, IJMPS: 104, IEJS: 70 },
  { month: "Mar", IJSRT: 182, IJPS: 126, JPS: 92, IJMPS: 116, IEJS: 74 },
  { month: "Apr", IJSRT: 176, IJPS: 132, JPS: 96, IJMPS: 122, IEJS: 79 },
  { month: "May", IJSRT: 198, IJPS: 138, JPS: 104, IJMPS: 128, IEJS: 82 },
  { month: "Jun", IJSRT: 214, IJPS: 146, JPS: 108, IJMPS: 134, IEJS: 88 },
];

// ---------------------------------- TASKS ----------------------------------

export type Task = {
  id: string;
  title: string;
  project: string;
  due: string;
  priority: "high" | "medium" | "low";
  done: boolean;
};

export const tasks: Task[] = [
  { id: "k1", title: "Approve IJSRT July issue proofs", project: "IJSRT", due: "Today", priority: "high", done: false },
  { id: "k2", title: "Renew DOI membership (Crossref)", project: "Operations", due: "Tomorrow", priority: "high", done: false },
  { id: "k3", title: "Review 12 pending submissions — IJMPS", project: "IJMPS", due: "08 Jul", priority: "medium", done: false },
  { id: "k4", title: "Q2 GST filing", project: "Finance", due: "12 Jul", priority: "high", done: false },
  { id: "k5", title: "Onboard 2 new peer reviewers", project: "JPS", due: "15 Jul", priority: "low", done: false },
  { id: "k6", title: "Rebalance investment portfolio", project: "Personal", due: "18 Jul", priority: "medium", done: true },
  { id: "k7", title: "Book wedding venue advance", project: "Personal", due: "20 Jul", priority: "medium", done: false },
];

// ---------------------------------- NOTES ----------------------------------

export type Note = {
  id: string;
  title: string;
  preview: string;
  tag: string;
  color: string;
  updated: string;
  pinned?: boolean;
};

export const notes: Note[] = [
  { id: "n1", title: "2026 Growth Strategy", preview: "Expand IJSRT indexing to Scopus. Target 40% YoY submission growth across all journals…", tag: "Strategy", color: "var(--c-green)", updated: "2h ago", pinned: true },
  { id: "n2", title: "Editorial Board Ideas", preview: "Potential invitees for IJMPS medical board — Dr. Rao, Dr. Kulkarni. Draft invite emails.", tag: "IJMPS", color: "var(--c-sky)", updated: "1d ago" },
  { id: "n3", title: "Tax Planning FY26", preview: "Section 80C maxed. Explore 80D + business deductions. Consult CA before 15 Jul.", tag: "Finance", color: "var(--c-amber)", updated: "2d ago", pinned: true },
  { id: "n4", title: "Wedding Checklist", preview: "Venue shortlist, catering quotes, photographer bookings. Budget cap ₹25L.", tag: "Personal", color: "var(--c-rose)", updated: "3d ago" },
  { id: "n5", title: "New Journal Concept — AI & Ethics", preview: "Market gap for an open-access AI ethics journal. Validate demand, pricing model.", tag: "Idea", color: "var(--c-violet)", updated: "4d ago" },
  { id: "n6", title: "Server Migration Plan", preview: "Move OJS instances to managed hosting. Reduce downtime, automate backups.", tag: "Ops", color: "var(--c-teal)", updated: "5d ago" },
];

// -------------------------------- PASSWORDS --------------------------------

export type Vault = {
  id: string;
  name: string;
  category: "Bank" | "ATM / Card" | "Email" | "Business" | "Other";
  identifier: string;
  secret: string;
  updated: string;
  strength: "strong" | "medium" | "weak";
};

export const vault: Vault[] = [
  { id: "v1", name: "HDFC Net Banking", category: "Bank", identifier: "amol.p", secret: "H&dfc#2026!secure", updated: "12 Jun", strength: "strong" },
  { id: "v2", name: "ICICI Business", category: "Bank", identifier: "ijsrt.corp", secret: "Ic!ci$Biz9021", updated: "02 Jul", strength: "strong" },
  { id: "v3", name: "SBI ATM PIN", category: "ATM / Card", identifier: "•••• 4821", secret: "4821", updated: "01 Jan", strength: "weak" },
  { id: "v4", name: "HDFC Debit Card", category: "ATM / Card", identifier: "•••• 7790", secret: "CVV 4-digit vault", updated: "20 May", strength: "medium" },
  { id: "v5", name: "Gmail — Personal", category: "Email", identifier: "amolpimpale000@gmail.com", secret: "G## mail_pass_88", updated: "18 Jun", strength: "strong" },
  { id: "v6", name: "IJSRT Editor Portal", category: "Business", identifier: "editor@ijsrt.org", secret: "Ojs!Editor2026", updated: "28 Jun", strength: "medium" },
  { id: "v7", name: "Crossref DOI Account", category: "Business", identifier: "doi-admin", secret: "Cr0ssRef#Doi", updated: "10 Jun", strength: "strong" },
];
