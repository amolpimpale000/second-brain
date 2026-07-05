import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function inr(n: number, opts?: { compact?: boolean; decimals?: number }) {
  if (opts?.compact) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
    if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  }
  return `₹${n.toLocaleString("en-IN", {
    maximumFractionDigits: opts?.decimals ?? 0,
    minimumFractionDigits: opts?.decimals ?? 0,
  })}`;
}

export function pct(n: number) {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}
