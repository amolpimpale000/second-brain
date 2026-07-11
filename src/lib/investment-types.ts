// Shared investment type constants — used by /investments and the finances
// overview so allocation colors stay consistent everywhere.
export const INVESTMENT_TYPES = [
  { value: "Stocks", color: "#22c55e" },
  { value: "US Stocks", color: "#0ea5e9" },
  { value: "Mutual Funds", color: "#6366f1" },
  { value: "ETFs", color: "#14b8a6" },
  { value: "Physical Gold", color: "#eab308" },
  { value: "Gold Scheme", color: "#ca8a04" },
  { value: "Bonds", color: "#f97316" },
  { value: "REITs", color: "#ec4899" },
  { value: "NPS", color: "#a855f7" },
  { value: "PPF", color: "#f59e0b" },
  { value: "FD", color: "#3b82f6" },
  { value: "Crypto", color: "#8b5cf6" },
  { value: "Other", color: "#94a3b8" },
];

export const investColor = (t: string) => INVESTMENT_TYPES.find((i) => i.value === t)?.color ?? "#94a3b8";
