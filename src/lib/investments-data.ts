/* Data for the Investments page (/investments).
   Replace these with live feeds (Account Aggregator / broker APIs) once wired. */

/* ── KPI cards ─────────────────────────────────────────────────────────────── */
export type InvKpi = {
  label: string;
  value: number;
  isPct?: boolean;
  delta?: number;
  vs?: string;
  color: string;
  icon: string;
  spark?: number[];
};

export const invKpis: InvKpi[] = [
  { label: "Total Investment Value", value: 1260000, delta: 10.8, vs: "vs last month", color: "#22c55e", icon: "value", spark: [78, 80, 84, 82, 88, 92, 90, 96, 100, 98, 104, 110] },
  { label: "Total Gains / Loss", value: 126000, delta: 15.6, vs: "(Max)", color: "#8b5cf6", icon: "gains", spark: [40, 44, 42, 50, 55, 52, 60, 58, 66, 70, 68, 76] },
  { label: "XIRR (All Time)", value: 14.32, isPct: true, delta: 2.34, vs: "vs last month", color: "#f59e0b", icon: "xirr", spark: [30, 34, 32, 38, 36, 42, 40, 46, 44, 50, 48, 54] },
  { label: "Invested Amount", value: 1134000, color: "#3b82f6", icon: "invested" },
  { label: "Available to Invest", value: 125000, color: "#14b8a6", icon: "available" },
];

/* ── Portfolio performance (area chart, May 2025) ─────────────────────────── */
export const portfolioPerformance = [
  { d: "May 01", v: 830000 },
  { d: "May 03", v: 852000 },
  { d: "May 05", v: 878000 },
  { d: "May 07", v: 862000 },
  { d: "May 09", v: 915000 },
  { d: "May 11", v: 968000 },
  { d: "May 13", v: 946000 },
  { d: "May 15", v: 1012000 },
  { d: "May 17", v: 1058000 },
  { d: "May 19", v: 1035000 },
  { d: "May 21", v: 1096000 },
  { d: "May 23", v: 1142000 },
  { d: "May 25", v: 1118000 },
  { d: "May 27", v: 1184000 },
  { d: "May 29", v: 1226000 },
  { d: "May 31", v: 1260000 },
];

/* ── Asset allocation (donut) ─────────────────────────────────────────────── */
export const assetAllocation = [
  { name: "Mutual Funds", pct: 50.0, value: 630000, color: "#22c55e" },
  { name: "Stocks", pct: 25.0, value: 315000, color: "#3b82f6" },
  { name: "Gold", pct: 10.0, value: 126000, color: "#f59e0b" },
  { name: "Bonds", pct: 7.5, value: 94500, color: "#8b5cf6" },
  { name: "Others", pct: 7.5, value: 94500, color: "#cbd5e1" },
];
export const portfolioTotal = 1260000;

/* ── Investment watchlist ─────────────────────────────────────────────────── */
export const watchlist = [
  { name: "SBI Bluechip Fund", sub: "Growth", price: 85.60, delta: 1.24, domain: "sbimf.com", color: "#0a4ea2" },
  { name: "HDFC Top 100 Fund", sub: "Growth", price: 1284.30, delta: 0.98, domain: "hdfcfund.com", color: "#ed232a" },
  { name: "ICICI Prudential Nifty 50", sub: "Index Fund", price: 199.45, delta: 1.10, domain: "icicipruamc.com", color: "#ef4123" },
  { name: "Reliance Industries", sub: "RELIANCE", price: 2891.95, delta: 1.35, domain: "ril.com", color: "#0b3b7a" },
  { name: "Tata Consultancy Serv.", sub: "TCS", price: 3725.10, delta: -0.45, domain: "tcs.com", color: "#004c8c" },
];

/* ── Holdings ─────────────────────────────────────────────────────────────── */
export type Holding = {
  name: string;
  sub: string;
  type: "Mutual Fund" | "Stock" | "Gold" | "Bond" | "ETF";
  invested: number;
  current: number;
  domain: string;
  color: string;
};

export const invHoldings: Holding[] = [
  { name: "SBI Bluechip Fund", sub: "Growth", type: "Mutual Fund", invested: 150000, current: 185600, domain: "sbimf.com", color: "#0a4ea2" },
  { name: "HDFC Top 100 Fund", sub: "Growth", type: "Mutual Fund", invested: 200000, current: 248900, domain: "hdfcfund.com", color: "#ed232a" },
  { name: "Reliance Industries", sub: "RELIANCE", type: "Stock", invested: 180000, current: 215450, domain: "ril.com", color: "#0b3b7a" },
  { name: "Tata Consultancy Serv.", sub: "TCS", type: "Stock", invested: 150000, current: 186255, domain: "tcs.com", color: "#004c8c" },
  { name: "Gold ETF", sub: "Nippon India Gold", type: "Gold", invested: 125000, current: 132800, domain: "nipponindiamf.com", color: "#e3a008" },
];

/* ── Investment performance ───────────────────────────────────────────────── */
export const invPerformance = {
  best: { name: "SBI Bluechip Fund", delta: 23.73 },
  worst: { name: "Tata Motors", delta: -5.12 },
  highest: { name: "HDFC Top 100 Fund", value: 248900 },
  lowest: { name: "Nippon Gold ETF", value: 132800 },
  avgReturn: 14.32,
};

/* ── SIP summary ──────────────────────────────────────────────────────────── */
export const sipSummary = {
  total: 8,
  monthly: 45000,
  invested: 324000,
  gains: 48600,
};

export const invTabs = [
  "Overview", "Holdings", "Mutual Funds", "Stocks", "Bonds", "SIPs", "NPS", "ETFs", "REITs", "Gold",
] as const;
export type InvTab = (typeof invTabs)[number];
