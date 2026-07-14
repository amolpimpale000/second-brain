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

export type VaultAccount = {
  id: string;
  name: string;
  username: string;
  category: "Banking" | "Email" | "Social Media" | "Shopping" | "Business" | "Entertainment";
  lastUsed: string;
  favorite: boolean;
  color: string; // avatar background (fallback)
  initial: string; // avatar letter (fallback)
  domain: string; // used to fetch the real brand logo
  secret: string;
  strength: "strong" | "medium" | "weak";
  twoFactor: boolean;
  trashed?: boolean;
};

export const vaultAccounts: VaultAccount[] = [
  { id: "a1",  name: "HDFC Bank",         username: "amit.sharma@hdfcbank",     category: "Banking",       lastUsed: "2 mins ago",  favorite: true,  color: "#1e40af", initial: "H",  domain: "hdfcbank.com",  secret: "H&dfc#2026!secure", strength: "strong", twoFactor: true },
  { id: "a2",  name: "ICICI Net Banking", username: "amit.icici@gmail.com",     category: "Banking",       lastUsed: "1 hour ago",  favorite: false, color: "#ea580c", initial: "I",  domain: "icicibank.com", secret: "Ic!ci$Biz9021",     strength: "strong", twoFactor: true },
  { id: "a3",  name: "Gmail Personal",    username: "amitsharma@gmail.com",     category: "Email",         lastUsed: "3 hours ago", favorite: false, color: "#ea4335", initial: "G",  domain: "gmail.com",     secret: "G##mail_pass_88",   strength: "strong", twoFactor: true },
  { id: "a4",  name: "Outlook Email",     username: "amit.sharma@outlook.com",  category: "Email",         lastUsed: "5 hours ago", favorite: false, color: "#0078d4", initial: "O",  domain: "outlook.com",   secret: "0utl00k!mail",      strength: "medium", twoFactor: false },
  { id: "a5",  name: "LinkedIn",          username: "amit.sharma@linkedin.com", category: "Social Media",  lastUsed: "1 day ago",   favorite: false, color: "#0a66c2", initial: "in", domain: "linkedin.com",  secret: "L!nked1n_2026",     strength: "strong", twoFactor: true },
  { id: "a6",  name: "Instagram",         username: "amit_sharma_23",           category: "Social Media",  lastUsed: "1 day ago",   favorite: false, color: "#e1306c", initial: "ig", domain: "instagram.com", secret: "1nsta#gram99",      strength: "medium", twoFactor: false },
  { id: "a7",  name: "Amazon",            username: "amit.amazon@gmail.com",    category: "Shopping",      lastUsed: "2 days ago",  favorite: false, color: "#f59e0b", initial: "a",  domain: "amazon.in",     secret: "Am@zon_shop21",     strength: "strong", twoFactor: true },
  { id: "a8",  name: "Flipkart",          username: "amit.flipkart@gmail.com",  category: "Shopping",      lastUsed: "2 days ago",  favorite: false, color: "#2563eb", initial: "F",  domain: "flipkart.com",  secret: "Fl!pkart_88",       strength: "weak",   twoFactor: false },
  { id: "a9",  name: "YouTube",           username: "amit.sharma.youtube",      category: "Entertainment", lastUsed: "3 days ago",  favorite: false, color: "#ff0000", initial: "Y",  domain: "youtube.com",   secret: "Y0uTube!watch",     strength: "medium", twoFactor: true },
  { id: "a10", name: "WordPress Admin",   username: "admin@mywebsite.com",      category: "Business",      lastUsed: "3 days ago",  favorite: false, color: "#334155", initial: "W",  domain: "wordpress.org", secret: "Wp!Admin_secure",   strength: "strong", twoFactor: true },
];

export type VaultCategory = {
  name: string;
  count: number;
  icon: string;
  color: string;
};

export const vaultCategories: VaultCategory[] = [
  { name: "All Passwords",  count: 128, icon: "lock",     color: "var(--c-green)" },
  { name: "Banking",        count: 8,   icon: "landmark", color: "#4f46e5" },
  { name: "Email",          count: 12,  icon: "mail",     color: "#ef4444" },
  { name: "Social Media",   count: 15,  icon: "share",    color: "#3b82f6" },
  { name: "Shopping",       count: 10,  icon: "bag",      color: "#f59e0b" },
  { name: "Business",       count: 18,  icon: "briefcase", color: "#a855f7" },
  { name: "Entertainment",  count: 8,   icon: "play",     color: "#ec4899" },
  { name: "Education",      count: 6,   icon: "cap",      color: "#14b8a6" },
  { name: "Crypto Wallets", count: 4,   icon: "wallet",   color: "#eab308" },
  { name: "Other",          count: 47,  icon: "circle",   color: "#94a3b8" },
];

export type CardNetwork = "VISA" | "Mastercard" | "RuPay" | "Amex";
export type CardTheme = "blue" | "orange" | "dark" | "purple" | "green" | "rose";

export type VaultCard = {
  id: string;
  bank: string;
  label: string; // e.g. "HDFC Debit Card"
  type: "Credit" | "Debit";
  network: CardNetwork;
  number: string; // full number, masked in UI
  holder: string;
  expiry: string; // MM/YY
  cvv: string;
  pin: string;
  theme: CardTheme;
};

export const vaultCards: VaultCard[] = [
  { id: "c1", bank: "HDFC Bank",  label: "HDFC Debit Card",   type: "Debit",  network: "VISA",       number: "4111 5678 9012 1234", holder: "Amit Sharma", expiry: "08/27", cvv: "412", pin: "1234",  theme: "blue" },
  { id: "c2", bank: "ICICI Bank", label: "ICICI Credit Card", type: "Credit", network: "Mastercard", number: "5238 4102 7745 5678", holder: "Amit Sharma", expiry: "11/26", cvv: "833", pin: "56789", theme: "orange" },
  { id: "c3", bank: "SBI",        label: "SBI Debit Card",    type: "Debit",  network: "RuPay",      number: "6070 2233 8890 9012", holder: "Amit Sharma", expiry: "03/28", cvv: "290", pin: "90123", theme: "dark" },
  { id: "c4", bank: "Axis Bank",  label: "Axis Credit Card",  type: "Credit", network: "VISA",       number: "4915 6621 0034 4402", holder: "Amit Sharma", expiry: "06/29", cvv: "551", pin: "4402",  theme: "purple" },
];

export const vaultStats = [
  { label: "Total Passwords", value: "128", sub: "All accounts",        icon: "lock",   tone: "green" },
  { label: "Categories",      value: "12",  sub: "Active groups",       icon: "folder", tone: "purple" },
  { label: "Security Score",  value: "92%", sub: "Strong",              icon: "shield", tone: "green" },
  { label: "Compromised",     value: "0",   sub: "Accounts at risk",    icon: "check",  tone: "amber" },
  { label: "Weak Passwords",  value: "3",   sub: "Update recommended",  icon: "alert",  tone: "red" },
] as const;

export const vaultSecurity = {
  score: 92,
  breakdown: [
    { label: "Strong Passwords",   value: 115 },
    { label: "Two-Factor Enabled", value: 96 },
    { label: "No Compromised",     value: 0 },
    { label: "Regularly Updated",  value: 89 },
  ],
  dashboard: [
    { label: "Password Health",  value: "92%", note: "Strong",      icon: "shield",  tone: "green" },
    { label: "Two-Factor Auth",  value: "96%", note: "Enabled",     icon: "lock",    tone: "green" },
    { label: "Reused Passwords", value: "2",   note: "Accounts",    icon: "refresh", tone: "amber" },
    { label: "Old Passwords",    value: "5",   note: "Need Update", icon: "clock",   tone: "red" },
  ],
} as const;

// ---------------------------------- NOTES ----------------------------------

export type ChecklistItem = { id: string; text: string; done: boolean };

export type RichNote = {
  id: string;
  title: string;
  body?: string;
  itemsLabel?: string;
  items?: ChecklistItem[];
  listStyle?: "bullet" | "check";
  category: string;
  tags: string[];
  color: "yellow" | "green" | "pink" | "white";
  time: string;
  pinned: boolean;
  starred: boolean;
  sort?: number;
};

const ci = (text: string, done = false): ChecklistItem => ({ id: Math.random().toString(36).slice(2, 8), text, done });

export const noteCategories = [
  { name: "Personal", icon: "lock", color: "#ec4899" },
  { name: "Finance", icon: "wallet", color: "#22c55e" },
  { name: "Business", icon: "briefcase", color: "#8b5cf6" },
  { name: "Ideas", icon: "bulb", color: "#f59e0b" },
  { name: "Health", icon: "heart", color: "#ef4444" },
  { name: "Travel", icon: "plane", color: "#3b82f6" },
  { name: "Work", icon: "folder", color: "#f59e0b" },
  { name: "Education", icon: "cap", color: "#14b8a6" },
  { name: "Others", icon: "circle", color: "#94a3b8" },
];

export const noteTags = [
  { name: "Important", color: "#ef4444" },
  { name: "Meeting", color: "#f59e0b" },
  { name: "Project", color: "#22c55e" },
  { name: "To-Do", color: "#3b82f6" },
  { name: "Ideas", color: "#8b5cf6" },
];

export const sampleNotes: RichNote[] = [
  { id: "note1", title: "Business Plan Ideas", color: "yellow", body: "Explore SaaS based solutions for healthcare industry. Focus on EMR, patient management and analytics.", category: "Business", tags: ["Important", "Ideas"], time: "Today, 10:30 AM", pinned: true, starred: true },
  { id: "note2", title: "Book Recommendations", color: "white", listStyle: "bullet", items: [ci("Atomic Habits"), ci("Deep Work"), ci("The Psychology of Money"), ci("Thinking, Fast and Slow")], category: "Personal", tags: ["Ideas"], time: "20 May, 08:20 PM", pinned: false, starred: true },
  { id: "note3", title: "Investment Strategy", color: "white", body: "Focus on long term SIP in index funds. Diversify in equity and debt based on risk appetite.", category: "Finance", tags: ["Important"], time: "17 May, 02:30 PM", pinned: false, starred: false },
  { id: "note4", title: "Monthly Budget Plan", color: "green", listStyle: "check", items: [ci("House Rent", true), ci("Groceries", true), ci("Transportation", true), ci("Utilities"), ci("Entertainment")], category: "Finance", tags: ["To-Do"], time: "Today, 09:15 AM", pinned: true, starred: true },
  { id: "note5", title: "Project Meeting Notes", color: "pink", body: "Discussed the new module requirements and timeline.", itemsLabel: "Key Points:", listStyle: "bullet", items: [ci("User authentication"), ci("Dashboard design"), ci("Report generation")], category: "Work", tags: ["Meeting", "Project"], time: "19 May, 03:10 PM", pinned: true, starred: false },
  { id: "note6", title: "Workout Routine", color: "white", listStyle: "bullet", items: [ci("30 min Cardio"), ci("Upper Body Strength"), ci("Core Exercises"), ci("Cool Down & Stretch")], category: "Health", tags: ["To-Do"], time: "16 May, 06:20 AM", pinned: false, starred: true },
  { id: "note7", title: "Travel Checklist", color: "white", listStyle: "bullet", items: [ci("Passport"), ci("Flight Tickets"), ci("Hotel Booking"), ci("Travel Insurance"), ci("Local Currency")], category: "Travel", tags: ["To-Do"], time: "Yesterday, 06:45 PM", pinned: false, starred: true },
  { id: "note8", title: "Daily Affirmations", color: "white", body: "I am focused and productive. I choose positivity and peace. I attract success and happiness every day.", category: "Personal", tags: [], time: "18 May, 07:00 AM", pinned: false, starred: true },
  { id: "note9", title: "Learning Goals", color: "white", listStyle: "bullet", items: [ci("Learn UI/UX Design"), ci("Improve Communication"), ci("Read 12 Books a Year")], category: "Education", tags: ["Project", "Ideas"], time: "15 May, 11:45 AM", pinned: false, starred: false },
];

export type Reminder = { id: string; title: string; time: string; color: string; done: boolean; sort?: number };

export const sampleReminders: Reminder[] = [
  { id: "rem1", title: "Team meeting notes", time: "Today, 11:00 AM", color: "#3b82f6", done: false },
  { id: "rem2", title: "Pay credit card bill", time: "Tomorrow, 09:00 AM", color: "#f59e0b", done: false },
  { id: "rem3", title: "Project deadline", time: "24 May, 05:00 PM", color: "#ef4444", done: false },
  { id: "rem4", title: "Renew insurance", time: "28 May, 11:30 AM", color: "#8b5cf6", done: false },
];

export const sampleNoteTrash: RichNote[] = [
  { id: "tn1", title: "Old Meeting Notes", color: "white", body: "Legacy sprint retro notes.", category: "Work", tags: [], time: "10 May, 04:00 PM", pinned: false, starred: false },
  { id: "tn2", title: "Draft Ideas", color: "yellow", body: "Rough app concepts to revisit.", category: "Ideas", tags: [], time: "08 May, 01:20 PM", pinned: false, starred: false },
  { id: "tn3", title: "Shopping List", color: "white", listStyle: "bullet", items: [ci("Milk"), ci("Eggs"), ci("Coffee")], category: "Others", tags: [], time: "05 May, 09:00 AM", pinned: false, starred: false },
];

// -------------------------------- DOCUMENTS --------------------------------

export type DocCategory = { name: string; count: number; icon: string; color: string };

export const docStats = [
  { label: "Total Documents", value: "568", sub: "+36 this month", subTone: "green", icon: "folder", tone: "violet" },
  { label: "Categories", value: "12", sub: "No change", subTone: "muted", icon: "grid", tone: "amber" },
  { label: "Total Size", value: "12.4 GB", sub: "1.2 GB this month", subTone: "green", icon: "drive", tone: "green" },
  { label: "Shared with Family", value: "28", sub: "5 this month", subTone: "green", icon: "users", tone: "blue" },
  { label: "Expiring Soon", value: "7", sub: "View all", subTone: "violet", icon: "clock", tone: "red" },
] as const;

export const docCategories: DocCategory[] = [
  { name: "Important Docs", count: 45, icon: "folder", color: "#8b5cf6" },
  { name: "Personal Docs", count: 86, icon: "user", color: "#22c55e" },
  { name: "Certificates", count: 72, icon: "award", color: "#f59e0b" },
  { name: "Educational Docs", count: 68, icon: "cap", color: "#3b82f6" },
  { name: "ID Cards", count: 56, icon: "id", color: "#f43f5e" },
  { name: "Family - ID Cards", count: 48, icon: "users", color: "#06b6d4" },
  { name: "Family - Certificates", count: 62, icon: "badge", color: "#8b5cf6" },
  { name: "Images / Photos", count: 131, icon: "image", color: "#eab308" },
  { name: "Insurance Docs", count: 24, icon: "shield", color: "#ef4444" },
];

export const storageOverview = {
  usedLabel: "12.4 GB",
  totalLabel: "50 GB",
  breakdown: [
    { name: "Documents", value: 8.2, color: "#8b5cf6" },
    { name: "Images", value: 3.1, color: "#3b82f6" },
    { name: "Others", value: 1.1, color: "#f59e0b" },
  ],
};

export type DocItem = {
  id: string;
  name: string;
  category: string;
  ext: string;
  size: string;
  date: string;
  kind: "doc" | "image";
  gradient?: string;
  thumb?: string;
  url?: string;
  trashed?: boolean;
};

export const sampleDocs: DocItem[] = [
  { id: "d1", name: "Aadhaar Card", category: "ID Cards", ext: "PDF", size: "1.2 MB", date: "20 May 2025", kind: "doc" },
  { id: "d2", name: "PAN Card", category: "ID Cards", ext: "PDF", size: "780 KB", date: "18 May 2025", kind: "doc" },
  { id: "d3", name: "Passport", category: "ID Cards", ext: "PDF", size: "2.3 MB", date: "10 May 2025", kind: "doc" },
  { id: "d4", name: "Income Certificate", category: "Personal Docs", ext: "PDF", size: "890 KB", date: "18 May 2025", kind: "doc" },
  { id: "d5", name: "10th Marksheet", category: "Educational Docs", ext: "PDF", size: "1.5 MB", date: "15 May 2025", kind: "doc" },
  { id: "d6", name: "Family Photo", category: "Images / Photos", ext: "JPG", size: "2.4 MB", date: "12 May 2025", kind: "image", gradient: "from-orange-300 via-rose-300 to-purple-300" },
  { id: "d7", name: "Caste Certificate", category: "Personal Docs", ext: "PDF", size: "1.1 MB", date: "16 May 2025", kind: "doc" },
  { id: "d8", name: "Goa Trip", category: "Images / Photos", ext: "JPG", size: "3.6 MB", date: "09 May 2025", kind: "image", gradient: "from-sky-300 via-cyan-200 to-emerald-200" },
];

export const expiringDocs = [
  { id: "e1", name: "Passport.pdf", date: "Expires on 09 May 2030", days: "5 days", tone: "red" },
  { id: "e2", name: "Income Certificate.pdf", date: "Expires on 18 May 2026", days: "14 days", tone: "amber" },
  { id: "e3", name: "Insurance Policy.pdf", date: "Expires on 01 Jun 2026", days: "28 days", tone: "green" },
];

export const docActivity = [
  { id: "act1", name: "Aadhaar Card.pdf", action: "Uploaded by you", time: "2 hours ago", color: "#f43f5e" },
  { id: "act2", name: "Family Photo.jpg", action: "Shared with Family", time: "5 hours ago", color: "#22c55e" },
  { id: "act3", name: "Caste Certificate.pdf", action: "Uploaded by you", time: "1 day ago", color: "#f59e0b" },
  { id: "act4", name: "10th Marksheet.pdf", action: "Uploaded by you", time: "2 days ago", color: "#3b82f6" },
];

export const docFolders = [
  { id: "f1", name: "Bank Documents", count: 24, color: "#8b5cf6" },
  { id: "f2", name: "Property Papers", count: 12, color: "#22c55e" },
  { id: "f3", name: "Medical Records", count: 31, color: "#ef4444" },
  { id: "f4", name: "Tax Filings", count: 18, color: "#f59e0b" },
];

// --------------------------- JOURNAL MANAGEMENT ----------------------------

export const jmStats = [
  { label: "Total Journals", value: "5", sub: "Active Journals", subTone: "muted", icon: "book", tone: "indigo" },
  { label: "Total Manuscripts", value: "1,248", sub: "18.7% vs Apr 2025", subTone: "green", icon: "file", tone: "blue" },
  { label: "Published Papers", value: "842", sub: "16.2% vs Apr 2025", subTone: "green", icon: "check", tone: "green" },
  { label: "Under Review", value: "406", sub: "5.2% vs Apr 2025", subTone: "red", icon: "review", tone: "amber" },
  { label: "Total Users", value: "12,540", sub: "22.1% vs Apr 2025", subTone: "green", icon: "users", tone: "pink" },
  { label: "Total Revenue", value: "₹18,75,450", sub: "24.8% vs Apr 2025", subTone: "green", icon: "rupee", tone: "emerald" },
];

export const JCOL = { IJPS: "#22c55e", IJSRT: "#3b82f6", IJMPS: "#8b5cf6", IJES: "#f59e0b", JPS: "#06b6d4" };

export const submissionsTrend = [
  { label: "May 01", total: 210, review: 120, accepted: 90, rejected: 45 },
  { label: "May 04", total: 245, review: 140, accepted: 105, rejected: 52 },
  { label: "May 07", total: 268, review: 150, accepted: 118, rejected: 48 },
  { label: "May 10", total: 300, review: 172, accepted: 130, rejected: 60 },
  { label: "May 13", total: 285, review: 165, accepted: 140, rejected: 55 },
  { label: "May 16", total: 330, review: 190, accepted: 152, rejected: 64 },
  { label: "May 19", total: 355, review: 205, accepted: 168, rejected: 58 },
  { label: "May 22", total: 372, review: 210, accepted: 176, rejected: 70 },
  { label: "May 25", total: 390, review: 225, accepted: 188, rejected: 66 },
  { label: "May 28", total: 410, review: 238, accepted: 200, rejected: 72 },
  { label: "May 31", total: 435, review: 250, accepted: 215, rejected: 68 },
];

export const submissionsByJournal = [
  { name: "IJPS", value: 437, pct: 35, color: JCOL.IJPS },
  { name: "IJSRT", value: 312, pct: 25, color: JCOL.IJSRT },
  { name: "IJMPS", value: 225, pct: 18, color: JCOL.IJMPS },
  { name: "IJES", value: 150, pct: 12, color: JCOL.IJES },
  { name: "JPS", value: 124, pct: 10, color: JCOL.JPS },
];

export const jmActivities = [
  { id: "a1", text: "New submission in IJPS Journal", meta: "By Dr. Rahul Verma", time: "10 mins ago", icon: "file", color: "#3b82f6" },
  { id: "a2", text: "Article accepted in IJSRT Journal", meta: "“AI in Healthcare”", time: "1 hour ago", icon: "check", color: "#22c55e" },
  { id: "a3", text: "Payment received", meta: "₹15,000 from Dr. Neha Patel", time: "2 hours ago", icon: "rupee", color: "#f59e0b" },
  { id: "a4", text: "New reviewer registered", meta: "Prof. Amit Kumar", time: "3 hours ago", icon: "user", color: "#8b5cf6" },
  { id: "a5", text: "Issue published", meta: "IJMPS Journal – Vol 12 Issue 5", time: "5 hours ago", icon: "book", color: "#ef4444" },
];

export type JournalPerf = {
  code: string; name: string; manuscripts: number; published: number;
  acceptance: number; impact: number; revenue: number; growth: number; color: string;
  paid?: number; revisionRequired?: number;
};
export const journalPerformance: JournalPerf[] = [
  { code: "IJPS", name: "International Journal of Pharmaceutical Sciences", manuscripts: 437, published: 312, acceptance: 71.4, impact: 4.892, revenue: 625450, growth: 28.6, color: JCOL.IJPS },
  { code: "IJSRT", name: "International Journal of Scientific Research & Technology", manuscripts: 312, published: 215, acceptance: 68.9, impact: 3.721, revenue: 450200, growth: 22.4, color: JCOL.IJSRT },
  { code: "IJMPS", name: "International Journal of Medical & Pharmaceutical Sciences", manuscripts: 225, published: 156, acceptance: 69.3, impact: 2.986, revenue: 315600, growth: 15.3, color: JCOL.IJMPS },
  { code: "IJES", name: "International Journal of Engineering & Science", manuscripts: 150, published: 98, acceptance: 65.3, impact: 2.456, revenue: 210300, growth: 10.1, color: JCOL.IJES },
  { code: "JPS", name: "Journal of Pharmaceutical Sciences", manuscripts: 124, published: 61, acceptance: 49.2, impact: 1.923, revenue: 173900, growth: 8.7, color: JCOL.JPS },
];

export const revenueBreakdown = [
  { name: "Article Processing Charges", value: 1525300, pct: 81.3, color: "#6366f1" },
  { name: "Subscription", value: 245600, pct: 13.1, color: "#22c55e" },
  { name: "Other Income", value: 104550, pct: 5.6, color: "#f59e0b" },
];

export const articleStatus = [
  { name: "Under Review", value: 425, pct: 34.1, color: "#22c55e" },
  { name: "Revision", value: 312, pct: 25.0, color: "#3b82f6" },
  { name: "Accepted", value: 289, pct: 23.2, color: "#8b5cf6" },
  { name: "Published", value: 152, pct: 12.2, color: "#f59e0b" },
  { name: "Rejected", value: 70, pct: 5.6, color: "#ef4444" },
];

export const submissionSource = [
  { name: "Direct Website", value: 524, pct: 42, color: "#3b82f6" },
  { name: "Email", value: 312, pct: 25, color: "#8b5cf6" },
  { name: "Editorial Manager", value: 225, pct: 18, color: "#22c55e" },
  { name: "Referral", value: 125, pct: 10, color: "#f59e0b" },
  { name: "Other", value: 62, pct: 5, color: "#94a3b8" },
];

export const financialSummary = [
  { label: "Total Revenue", value: "₹18,75,450", growth: 24.8, color: "var(--c-green)", spark: [12, 15, 13, 18, 20, 19, 24, 26, 25, 30] },
  { label: "Total Expenses", value: "₹7,25,300", growth: 9.3, color: "var(--c-rose)", spark: [8, 9, 11, 10, 12, 11, 13, 12, 14, 13] },
  { label: "Net Profit", value: "₹11,50,150", growth: 21.3, color: "var(--c-green)", spark: [6, 7, 8, 9, 10, 11, 12, 13, 14, 16] },
];

export const keyMetrics = [
  { label: "Unique Visitors", value: "45,230", growth: 12.4, color: "var(--c-green)", spark: [20, 22, 21, 25, 27, 26, 30, 32, 31, 35] },
  { label: "Downloads", value: "12,450", growth: 8.7, color: "var(--c-violet)", spark: [10, 12, 11, 13, 14, 13, 15, 16, 15, 18] },
  { label: "Citations", value: "2,345", growth: 15.5, color: "var(--c-amber)", spark: [5, 6, 7, 6, 8, 9, 8, 10, 11, 12] },
  { label: "Altmetric Score", value: "1,890", growth: 10.2, color: "var(--c-sky)", spark: [4, 5, 6, 7, 6, 8, 9, 8, 10, 11] },
];

export const subjectAreas = [
  { name: "Pharmaceutical Sciences", pct: 45, color: "#22c55e" },
  { name: "Engineering & Technology", pct: 25, color: "#3b82f6" },
  { name: "Medical Sciences", pct: 15, color: "#8b5cf6" },
  { name: "Management & Social Sci.", pct: 10, color: "#f59e0b" },
  { name: "Others", pct: 5, color: "#94a3b8" },
];

export const subscription = [
  { label: "Active Subscribers", value: "2,350", growth: 14.2, icon: "users" },
  { label: "Institutional Subscribers", value: "320", growth: 8.6, icon: "building" },
  { label: "Active Plans", value: "12", growth: 5.3, icon: "card" },
];

export const publicationTrend = [
  { label: "Jan", published: 120, accepted: 60 },
  { label: "Feb", published: 150, accepted: 72 },
  { label: "Mar", published: 175, accepted: 88 },
  { label: "Apr", published: 200, accepted: 95 },
  { label: "May", published: 215, accepted: 110 },
];

export const jmAlerts = [
  { id: "al1", text: "12 manuscripts require reviewer invitation", tone: "red" },
  { id: "al2", text: "5 payment receipts pending", tone: "amber" },
  { id: "al3", text: "3 journals have low balance", tone: "red" },
];

export const quickActionsJM = [
  { label: "Add New Journal", icon: "add" },
  { label: "View All Manuscripts", icon: "file" },
  { label: "Generate Report", icon: "report" },
  { label: "Manage Users", icon: "users" },
  { label: "Add Announcement", icon: "megaphone" },
];

// ------------------------- EMPLOYEE PRODUCTIVITY ---------------------------

export type Employee = {
  id: string; name: string; role: string; journal: string; initials: string; color: string;
  handled: number; completed: number; pending: number; turnaround: number; score: number; trend: number;
};
export const employees: Employee[] = [
  { id: "emp1", name: "Priya Sharma", role: "Managing Editor", journal: "IJPS", initials: "PS", color: "#22c55e", handled: 48, completed: 42, pending: 6, turnaround: 3.2, score: 94, trend: 6.2 },
  { id: "emp2", name: "Rahul Verma", role: "Section Editor", journal: "IJSRT", initials: "RV", color: "#3b82f6", handled: 36, completed: 33, pending: 3, turnaround: 4.1, score: 88, trend: 3.4 },
  { id: "emp3", name: "Neha Patel", role: "Copy Editor", journal: "IJMPS", initials: "NP", color: "#8b5cf6", handled: 52, completed: 50, pending: 2, turnaround: 2.8, score: 96, trend: 8.1 },
  { id: "emp4", name: "Amit Kumar", role: "Reviewer", journal: "IJES", initials: "AK", color: "#f59e0b", handled: 28, completed: 24, pending: 4, turnaround: 5.5, score: 81, trend: -2.3 },
  { id: "emp5", name: "Sanjay Gupta", role: "Production Lead", journal: "JPS", initials: "SG", color: "#06b6d4", handled: 40, completed: 38, pending: 2, turnaround: 3.9, score: 90, trend: 4.7 },
  { id: "emp6", name: "Kavita Rao", role: "Reviewer", journal: "IJPS", initials: "KR", color: "#ec4899", handled: 31, completed: 29, pending: 2, turnaround: 4.8, score: 85, trend: 1.9 },
  { id: "emp7", name: "Vikram Singh", role: "Layout Editor", journal: "IJMPS", initials: "VS", color: "#14b8a6", handled: 44, completed: 41, pending: 3, turnaround: 3.5, score: 92, trend: 5.5 },
];
