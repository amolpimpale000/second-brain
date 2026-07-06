/* ═══════════════════════════════════════════════════════════════════════════
   Dashboard data — redesigned to match the reference dashboard image
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── KPI cards (top row) ──────────────────────────────────────────────────── */
export const kpiCards = [
  {
    label: "Total Balance",
    value: 1245300,
    delta: 8.2,
    deltaLabel: "from last month",
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: "wallet" as const,
    spark: [42, 45, 43, 48, 52, 50, 55, 58, 56, 60, 63, 65],
  },
  {
    label: "Monthly Income",
    value: 185000,
    delta: 15.4,
    deltaLabel: "from last month",
    color: "#22c55e",
    bg: "#dcfce7",
    icon: "income" as const,
    spark: [30, 35, 38, 36, 42, 45, 48, 52, 55, 58, 62, 65],
  },
  {
    label: "Monthly Expenses",
    value: 68250,
    delta: -3.7,
    deltaLabel: "from last month",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "expense" as const,
    spark: [38, 36, 35, 37, 34, 33, 35, 32, 34, 31, 33, 32],
  },
  {
    label: "Total Investments",
    value: 875650,
    delta: 11.6,
    deltaLabel: "from last month",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "investment" as const,
    spark: [45, 47, 50, 49, 53, 55, 58, 60, 63, 66, 69, 72],
  },
];

/* ── Accounts overview (right sidebar top) ────────────────────────────────── */
export const accountsOverview = [
  {
    id: "a1",
    bank: "HDFC Bank",
    type: "Savings Account",
    balance: 325450,
    accountNumber: "7890",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "landmark" as const,
  },
  {
    id: "a2",
    bank: "SBI Bank",
    type: "Salary Account",
    balance: 210750,
    accountNumber: "4567",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "landmark" as const,
  },
];

/* ── Cash flow (Jan-Dec monthly) ──────────────────────────────────────────── */
export const cashFlowMonthly = [
  { month: "Jan", income: 85000, expenses: 48000, savings: 37000 },
  { month: "Feb", income: 92000, expenses: 52000, savings: 40000 },
  { month: "Mar", income: 88000, expenses: 50000, savings: 38000 },
  { month: "Apr", income: 95000, expenses: 55000, savings: 40000 },
  { month: "May", income: 120000, expenses: 60000, savings: 60000 },
  { month: "Jun", income: 105000, expenses: 58000, savings: 47000 },
  { month: "Jul", income: 98000, expenses: 54000, savings: 44000 },
  { month: "Aug", income: 110000, expenses: 62000, savings: 48000 },
  { month: "Sep", income: 115000, expenses: 59000, savings: 56000 },
  { month: "Oct", income: 100000, expenses: 56000, savings: 44000 },
  { month: "Nov", income: 125000, expenses: 65000, savings: 60000 },
  { month: "Dec", income: 118000, expenses: 60000, savings: 58000 },
];

/* ── Expense categories (donut chart) ─────────────────────────────────────── */
export const expenseCategories = [
  { name: "Housing", value: 20475, pct: 30, color: "#22c55e" },
  { name: "Food & Dining", value: 13650, pct: 20, color: "#8b5cf6" },
  { name: "Transportation", value: 10238, pct: 15, color: "#f59e0b" },
  { name: "Shopping", value: 6825, pct: 10, color: "#3b82f6" },
  { name: "Entertainment", value: 5460, pct: 8, color: "#ef4444" },
  { name: "Others", value: 11602, pct: 17, color: "#94a3b8" },
];

/* ── Upcoming tasks (right sidebar) ───────────────────────────────────────── */
export const upcomingTasks = [
  {
    id: "t1",
    title: "Review monthly expenses",
    category: "Finance",
    completed: true,
    due: "Today",
    categoryColor: "#22c55e",
    categoryBg: "#dcfce7",
  },
  {
    id: "t2",
    title: "Client meeting at 4 PM",
    category: "Business",
    completed: false,
    due: "Today",
    categoryColor: "#f59e0b",
    categoryBg: "#fef3c7",
  },
  {
    id: "t3",
    title: "Investment portfolio review",
    category: "Investments",
    completed: false,
    due: "Tomorrow",
    categoryColor: "#3b82f6",
    categoryBg: "#dbeafe",
  },
  {
    id: "t4",
    title: "Plan trip to Manali",
    category: "Personal",
    completed: true,
    due: "24 May",
    categoryColor: "#8b5cf6",
    categoryBg: "#ede9fe",
  },
];

/* ── Savings goals ────────────────────────────────────────────────────────── */
export const savingsGoals = [
  {
    id: "sg1",
    name: "New Car",
    current: 245000,
    target: 800000,
    pct: 30,
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "car" as const,
  },
  {
    id: "sg2",
    name: "Wedding",
    current: 180000,
    target: 1000000,
    pct: 18,
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "gift" as const,
  },
  {
    id: "sg3",
    name: "Europe Trip",
    current: 95000,
    target: 300000,
    pct: 32,
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "plane" as const,
  },
  {
    id: "sg4",
    name: "Emergency Fund",
    current: 125000,
    target: 500000,
    pct: 25,
    color: "#b45309",
    bg: "#fef3c7",
    icon: "shield" as const,
  },
];

/* ── Investments portfolio ────────────────────────────────────────────────── */
export const investmentsPortfolio = {
  totalValue: 875650,
  delta: 11.6,
  spark: [40, 42, 41, 45, 48, 52, 50, 55, 58, 62, 66, 70],
  items: [
    {
      name: "Mutual Funds",
      value: 525390,
      pct: 60,
      color: "#22c55e",
      bg: "#dcfce7",
      icon: "barChart" as const,
    },
    {
      name: "Stocks",
      value: 218720,
      pct: 25,
      color: "#3b82f6",
      bg: "#dbeafe",
      icon: "trendingUp" as const,
    },
    {
      name: "Gold",
      value: 87565,
      pct: 10,
      color: "#f59e0b",
      bg: "#fef3c7",
      icon: "circle" as const,
    },
    {
      name: "Others",
      value: 43975,
      pct: 5,
      color: "#94a3b8",
      bg: "#f1f5f9",
      icon: "moreHorizontal" as const,
    },
  ],
};

/* ── Loans overview ───────────────────────────────────────────────────────── */
export const loansOverview = [
  {
    id: "l1",
    name: "Home Loan",
    balance: 2575000,
    rate: 8.5,
    color: "#8b5cf6",
    bg: "#ede9fe",
    icon: "home" as const,
    progress: 65,
  },
  {
    id: "l2",
    name: "Personal Loan",
    balance: 325000,
    rate: 11.5,
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "user" as const,
    progress: 45,
  },
  {
    id: "l3",
    name: "Car Loan",
    balance: 439750,
    rate: 9.2,
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "car" as const,
    progress: 55,
  },
];

/* ── Quick notes (right sidebar) ──────────────────────────────────────────── */
export const quickNotes = [
  { id: "n1", text: "Ideas for new business", time: "2h ago" },
  { id: "n2", text: "Buy gift for sister wedding", time: "Yesterday" },
  { id: "n3", text: "Plan Europe trip budget", time: "2 days ago" },
];

/* ── Business overview ────────────────────────────────────────────────────── */
export const businessOverview = {
  metrics: [
    { label: "Revenue", value: 1275000, delta: 18.2, color: "#8b5cf6", bg: "#ede9fe" },
    { label: "Expenses", value: 725000, delta: -6.1, color: "#ef4444", bg: "#fee2e2" },
    { label: "Profit", value: 550000, delta: 26.5, color: "#22c55e", bg: "#dcfce7" },
    { label: "Clients", value: 128, delta: 15.4, color: "#3b82f6", bg: "#dbeafe" },
  ],
  sparklines: [
    [42, 45, 43, 48, 52, 50, 55, 58, 62, 66],
    [38, 36, 35, 37, 34, 33, 35, 32, 34, 31],
    [30, 35, 38, 42, 45, 50, 55, 60, 65, 70],
    [20, 25, 28, 32, 35, 38, 42, 45, 48, 52],
  ],
};

/* ── Recent transactions ──────────────────────────────────────────────────── */
export const recentTransactions = [
  {
    id: "rt1",
    name: "Salary Credited",
    category: "Bank Transfer",
    amount: 125000,
    type: "credit" as const,
    date: "Today",
    color: "#22c55e",
    bg: "#dcfce7",
    icon: "wallet" as const,
  },
  {
    id: "rt2",
    name: "Amazon Purchase",
    category: "Shopping",
    amount: 2450,
    type: "debit" as const,
    date: "Yesterday",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "shoppingBag" as const,
  },
  {
    id: "rt3",
    name: "Electricity Bill",
    category: "Utilities",
    amount: 1250,
    type: "debit" as const,
    date: "13 May 2025",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "zap" as const,
  },
  {
    id: "rt4",
    name: "Freelance Payment",
    category: "Bank Transfer",
    amount: 25000,
    type: "credit" as const,
    date: "12 May 2025",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "briefcase" as const,
  },
];

/* ── Passwords manager ────────────────────────────────────────────────────── */
export const passwordsManager = [
  {
    id: "p1",
    name: "HDFC Bank",
    username: "amol@hdfcbank",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "lock" as const,
  },
  {
    id: "p2",
    name: "ICICI Bank",
    username: "amol@icici",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "lock" as const,
  },
  {
    id: "p3",
    name: "Gmail",
    username: "amolpatil@gmail.com",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "mail" as const,
  },
  {
    id: "p4",
    name: "Instagram",
    username: "amol_pimpale",
    color: "#c026d3",
    bg: "#fae8ff",
    icon: "instagram" as const,
  },
];

/* ── Quick actions (right sidebar bottom) ─────────────────────────────────── */
export const quickActions = [
  { id: "qa1", label: "Add Expense", color: "#8b5cf6", bg: "#ede9fe", icon: "calendarPlus" as const },
  { id: "qa2", label: "Add Income", color: "#22c55e", bg: "#dcfce7", icon: "plusCircle" as const },
  { id: "qa3", label: "Transfer Money", color: "#f59e0b", bg: "#fef3c7", icon: "arrowRightLeft" as const },
  { id: "qa4", label: "Add Goal", color: "#3b82f6", bg: "#dbeafe", icon: "target" as const },
];
