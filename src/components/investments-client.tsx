"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, X, Wallet,
  LineChart as LineChartIcon, IndianRupee, Landmark, Globe2, Coins, Banknote, Bitcoin, LayoutGrid,
  Layers, ScrollText, Building2, ShieldCheck, Download, Repeat, Sparkles, MoreVertical, Target,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { cn, inr } from "@/lib/utils";
import { INVESTMENT_TYPES, investColor } from "@/lib/investment-types";
import type { FinInvestment } from "@/lib/finance-store";

/* ═══════════════════════════════════════════════════════════════════════════
   Type metadata
   ═══════════════════════════════════════════════════════════════════════════ */
const TYPE_ICON: Record<string, React.ElementType> = {
  Stocks: LineChartIcon, "US Stocks": Globe2, "Mutual Funds": Landmark, ETFs: Layers,
  Gold: Coins, Bonds: ScrollText, REITs: Building2, NPS: ShieldCheck, PPF: Banknote,
  FD: Wallet, Crypto: Bitcoin, Other: LayoutGrid,
};

// Sub-tabs, in the reference order. Each maps to the underlying type(s) it filters.
const SUB_TABS: { label: string; types?: string[]; sipOnly?: boolean }[] = [
  { label: "Overview" },
  { label: "Holdings" },
  { label: "Mutual Funds", types: ["Mutual Funds"] },
  { label: "Stocks", types: ["Stocks", "US Stocks"] },
  { label: "Bonds", types: ["Bonds"] },
  { label: "SIPs", sipOnly: true },
  { label: "NPS", types: ["NPS"] },
  { label: "ETFs", types: ["ETFs"] },
  { label: "REITs", types: ["REITs"] },
  { label: "Gold", types: ["Gold"] },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Shared primitives
   ═══════════════════════════════════════════════════════════════════════════ */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04),0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}

function Spark({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const d = data.length ? data.map((v, i) => ({ i, v })) : [{ i: 0, v: 0 }, { i: 1, v: 0 }];
  return (
    <ResponsiveContainer width="100%" height={height} debounce={200}>
      <LineChart data={d} margin={{ top: 6, bottom: 4, left: 2, right: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const MONO = ["#6366f1", "#22c55e", "#0ea5e9", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6"];
function monoColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return MONO[h % MONO.length];
}

/* Real favicon/logo with graceful fallback: Clearbit → Google favicon → monogram. */
function Logo({ domain, label, size = 36, rounded = "rounded-xl" }: { domain?: string; label: string; size?: number; rounded?: string }) {
  const [stage, setStage] = useState(0);
  const letter = (label.trim()[0] || "?").toUpperCase();
  useEffect(() => setStage(0), [domain]);
  if (!domain || stage >= 2) {
    return (
      <div className={cn("grid shrink-0 place-items-center font-bold text-white", rounded)} style={{ width: size, height: size, background: monoColor(label), fontSize: size * 0.42 }}>
        {letter}
      </div>
    );
  }
  const src = stage === 0 ? `https://logo.clearbit.com/${domain}` : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden border border-border/60 bg-white", rounded)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} width={size} height={size} className="h-full w-full object-contain p-0.5" onError={() => setStage((s) => s + 1)} referrerPolicy="no-referrer" />
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (open) document.documentElement.classList.add("overflow-hidden");
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [open]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-card-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

type InvInput = { name: string; type: string; invested: number; currentValue: number; subtitle?: string; logoDomain?: string; sipAmount?: number };

function InvestmentForm({ initial, submitLabel, onSubmit, busy }: {
  initial?: Partial<FinInvestment>; submitLabel: string; onSubmit: (d: InvInput) => void; busy: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "Stocks");
  const [invested, setInvested] = useState(initial?.invested != null ? String(initial.invested) : "");
  const [currentValue, setCurrentValue] = useState(initial?.currentValue != null ? String(initial.currentValue) : "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [logoDomain, setLogoDomain] = useState(initial?.logoDomain ?? "");
  const [sipAmount, setSipAmount] = useState(initial?.sipAmount != null ? String(initial.sipAmount) : "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const out: InvInput = { name: name.trim(), type, invested: Number(invested) || 0, currentValue: Number(currentValue) || 0 };
        if (subtitle.trim()) out.subtitle = subtitle.trim();
        if (logoDomain.trim()) out.logoDomain = logoDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        if (sipAmount.trim()) out.sipAmount = Number(sipAmount) || 0;
        onSubmit(out);
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IRFC" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {INVESTMENT_TYPES.map((t) => <option key={t.value}>{t.value}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Logo Website <span className="text-faint">(optional)</span></label>
          <input value={logoDomain} onChange={(e) => setLogoDomain(e.target.value)} placeholder="e.g. tatamotors.com" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Details <span className="text-faint">(optional — e.g. "548 qty · avg ₹153.36")</span></label>
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Equity · Flexi Cap" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Invested (₹)</label>
          <input required type="number" step="0.01" value={invested} onChange={(e) => setInvested(e.target.value)} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Current Value (₹)</label>
          <input required type="number" step="0.01" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="0" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Monthly SIP (₹) <span className="text-faint">(optional)</span></label>
        <input type="number" step="0.01" value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} placeholder="0" className={inputCls} />
      </div>
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════════ */
type ModalState =
  | { kind: "add" }
  | { kind: "edit"; investment: FinInvestment }
  | { kind: "value"; investment: FinInvestment }
  | null;

const gainPctOf = (inv: number, cur: number) => (inv > 0 ? Math.round(((cur - inv) / inv) * 1000) / 10 : 0);

export function InvestmentsClient({ initial }: { initial: FinInvestment[] }) {
  const [items, setItems] = useState<FinInvestment[]>(initial);
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [subTab, setSubTab] = useState("Overview");
  const [perfBy, setPerfBy] = useState<"type" | "holding">("type");
  const [rowMenu, setRowMenu] = useState<string | null>(null);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function apiMutate(action: "create" | "update" | "delete", payload: { id?: string; data?: Record<string, unknown> }) {
    const res = await fetch("/api/finance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "investments", action, ...payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Save failed");
    return json;
  }
  async function save(action: "create" | "update", data: Record<string, unknown>, id?: string, msg = "Saved") {
    setBusy(true);
    try {
      const { row } = await apiMutate(action, action === "create" ? { data } : { id, data });
      setItems((p) => (action === "create" ? [...p, row] : p.map((r) => (r.id === id ? row : r))));
      setModal(null); flash(msg);
    } catch (err) { flash(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  async function remove(i: FinInvestment) {
    if (!window.confirm(`Delete "${i.name}"?`)) return;
    setRowMenu(null);
    try { await apiMutate("delete", { id: i.id }); setItems((p) => p.filter((r) => r.id !== i.id)); flash("Deleted"); }
    catch (err) { flash(err instanceof Error ? err.message : "Delete failed"); }
  }

  const M = useMemo(() => {
    const invested = items.reduce((s, i) => s + i.invested, 0);
    const current = items.reduce((s, i) => s + i.currentValue, 0);
    const gain = current - invested;
    const gainPct = gainPctOf(invested, current);

    const byType = INVESTMENT_TYPES.map((t) => {
      const list = items.filter((i) => i.type === t.value).sort((a, b) => b.currentValue - a.currentValue);
      const inv = list.reduce((s, i) => s + i.invested, 0);
      const cur = list.reduce((s, i) => s + i.currentValue, 0);
      return { type: t.value, color: t.color, list, invested: inv, current: cur, gain: cur - inv, gainPct: gainPctOf(inv, cur) };
    }).filter((t) => t.list.length > 0);

    const donut = byType.map((t) => ({ name: t.type, value: Math.round(t.current), color: t.color, pct: current > 0 ? Math.round((t.current / current) * 1000) / 10 : 0 }));
    const sorted = [...items].sort((a, b) => gainPctOf(b.invested, b.currentValue) - gainPctOf(a.invested, a.currentValue));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const highest = [...items].sort((a, b) => b.invested - a.invested)[0];
    const lowest = [...items].sort((a, b) => a.invested - b.invested)[0];

    // real "sparkline" series = cumulative distribution across holdings (monotonic, honest)
    const cvSorted = [...items].sort((a, b) => b.currentValue - a.currentValue).map((i) => i.currentValue);
    const cum = (arr: number[]) => arr.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);
    const valueSpark = cum(cvSorted);
    const investedSpark = cum([...items].sort((a, b) => b.invested - a.invested).map((i) => i.invested));
    const gainSpark = cum([...items].map((i) => i.currentValue - i.invested).sort((a, b) => b - a));

    const sips = items.filter((i) => (i.sipAmount ?? 0) > 0);
    const monthlySip = sips.reduce((s, i) => s + (i.sipAmount ?? 0), 0);

    // performance chart series
    const perfType = byType.map((t) => ({ label: t.type, Invested: Math.round(t.invested), Current: Math.round(t.current) }));
    const perfHolding = [...items].sort((a, b) => b.currentValue - a.currentValue).slice(0, 12)
      .map((i) => ({ label: i.name.length > 10 ? i.name.slice(0, 10) + "…" : i.name, Invested: Math.round(i.invested), Current: Math.round(i.currentValue) }));

    return { invested, current, gain, gainPct, byType, donut, best, worst, highest, lowest, valueSpark, investedSpark, gainSpark, sips, monthlySip, perfType, perfHolding };
  }, [items]);

  const activeTab = SUB_TABS.find((t) => t.label === subTab)!;
  const visibleItems = useMemo(() => {
    if (activeTab.sipOnly) return items.filter((i) => (i.sipAmount ?? 0) > 0);
    if (activeTab.types) return items.filter((i) => activeTab.types!.includes(i.type));
    return items;
  }, [items, activeTab]);

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  function exportCsv() {
    const header = ["Name", "Type", "Details", "Invested", "Current Value", "Gain/Loss", "Return %", "Monthly SIP"];
    const rows = items.map((i) => [i.name, i.type, i.subtitle ?? "", i.invested, i.currentValue, i.currentValue - i.invested, gainPctOf(i.invested, i.currentValue), i.sipAmount ?? 0]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "investments.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Holdings table (used by several tabs) ─────────────────────────────── */
  function HoldingsTable({ list }: { list: FinInvestment[] }) {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-faint">No holdings here yet.</p>
          <button onClick={() => setModal({ kind: "add" })} className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
            <Plus className="h-4 w-4" /> Add Investment
          </button>
        </div>
      );
    }
    return (
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-faint">
              <th className="pb-2.5">Asset</th>
              <th className="pb-2.5">Type</th>
              <th className="pb-2.5 text-right">Invested</th>
              <th className="pb-2.5 text-right">Current Value</th>
              <th className="pb-2.5 text-right">Gain / Loss</th>
              <th className="pb-2.5 text-right">Return</th>
              <th className="pb-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => {
              const g = i.currentValue - i.invested;
              const gp = gainPctOf(i.invested, i.currentValue);
              return (
                <tr key={i.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <Logo domain={i.logoDomain} label={i.name} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{i.name}</p>
                        {i.subtitle && <p className="truncate text-[11px] text-muted">{i.subtitle}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ background: `${investColor(i.type)}18`, color: investColor(i.type) }}>{i.type}</span>
                  </td>
                  <td className="py-3 text-right text-[12px] text-muted whitespace-nowrap">₹ {Math.round(i.invested).toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right text-[13px] font-semibold text-ink whitespace-nowrap">₹ {Math.round(i.currentValue).toLocaleString("en-IN")}</td>
                  <td className={cn("py-3 text-right text-[12px] font-semibold whitespace-nowrap", g >= 0 ? "text-green-600" : "text-red-500")}>
                    {g >= 0 ? "+" : "−"}₹ {Math.abs(Math.round(g)).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold", gp >= 0 ? "text-green-600" : "text-red-500")}>
                      {gp >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(gp)}%
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="relative flex justify-end">
                      <button onClick={() => setRowMenu(rowMenu === i.id ? null : i.id)} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-ink">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {rowMenu === i.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setRowMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-border bg-card p-1 shadow-card-lg">
                            <button onClick={() => { setRowMenu(null); setModal({ kind: "value", investment: i }); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-ink"><TrendingUp className="h-3.5 w-3.5" /> Update Value</button>
                            <button onClick={() => { setRowMenu(null); setModal({ kind: "edit", investment: i }); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-ink"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                            <button onClick={() => remove(i)} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── KPI cards ─────────────────────────────────────────────────────────── */
  const kpis = [
    { label: "Total Investment Value", value: `₹ ${Math.round(M.current).toLocaleString("en-IN")}`, sub: `${M.gainPct >= 0 ? "+" : ""}${M.gainPct}% overall`, up: M.gainPct >= 0, color: "#22c55e", icon: Wallet, spark: M.valueSpark },
    { label: "Total Gains / Loss", value: `${M.gain >= 0 ? "+" : "−"}₹ ${Math.abs(Math.round(M.gain)).toLocaleString("en-IN")}`, sub: `${M.gainPct >= 0 ? "+" : ""}${M.gainPct}%`, up: M.gain >= 0, color: M.gain >= 0 ? "#8b5cf6" : "#ef4444", icon: M.gain >= 0 ? TrendingUp : TrendingDown, spark: M.gainSpark },
    { label: "Overall Return", value: `${M.gainPct >= 0 ? "+" : ""}${M.gainPct}%`, sub: M.best ? `Top: ${M.best.name}` : "—", up: M.gainPct >= 0, color: "#f59e0b", icon: Target, spark: M.gainSpark },
    { label: "Invested Amount", value: `₹ ${Math.round(M.invested).toLocaleString("en-IN")}`, sub: `${items.length} holdings`, up: true, color: "#3b82f6", icon: IndianRupee, spark: M.investedSpark },
    { label: "Monthly SIP", value: `₹ ${Math.round(M.monthlySip).toLocaleString("en-IN")}`, sub: `${M.sips.length} active SIP${M.sips.length === 1 ? "" : "s"}`, up: true, color: "#14b8a6", icon: Repeat, spark: M.investedSpark },
  ];

  const kpiRow = (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((k) => (
        <Card key={k.label} className="!p-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: `linear-gradient(135deg, ${k.color}20, ${k.color}08)` }}>
              <k.icon className="h-[18px] w-[18px]" style={{ color: k.color }} />
            </div>
            <p className="text-[11px] font-medium leading-tight text-muted">{k.label}</p>
          </div>
          <p className="mt-2.5 text-[18px] font-semibold leading-none text-ink">{k.value}</p>
          <div className="mt-2 flex items-center gap-1">
            {k.up ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
            <span className="truncate text-[10px] text-faint">{k.sub}</span>
          </div>
          <div className="-mx-1.5 mt-1.5"><Spark data={k.spark} color={k.color} /></div>
        </Card>
      ))}
    </div>
  );

  /* ── Overview panels ───────────────────────────────────────────────────── */
  const performancePanel = (
    <Card className="xl:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">Invested vs Current Value</h3>
          <p className="text-[11px] text-muted">Live comparison across your portfolio</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-surface-2 p-0.5">
          {(["type", "holding"] as const).map((v) => (
            <button key={v} onClick={() => setPerfBy(v)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors", perfBy === v ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}>
              By {v === "type" ? "Type" : "Holding"}
            </button>
          ))}
        </div>
      </div>
      {M.byType.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-faint">Add investments to see the breakdown.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260} debounce={200}>
          <BarChart data={perfBy === "type" ? M.perfType : M.perfHolding} margin={{ left: -6, right: 4, top: 5 }} barCategoryGap="26%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={perfBy === "holding" ? -25 : 0} textAnchor={perfBy === "holding" ? "end" : "middle"} height={perfBy === "holding" ? 50 : 24} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => inr(v, { compact: true })} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }} content={({ active, payload, label }) =>
              active && payload?.length ? (
                <Tip>
                  <p className="mb-1 font-medium text-ink">{label}</p>
                  {payload.map((p) => (
                    <p key={String(p.name)} className="flex items-center gap-1.5 text-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: String(p.color) }} />{p.name}: <span className="font-medium text-ink">{inr(Number(p.value))}</span>
                    </p>
                  ))}
                </Tip>
              ) : null
            } />
            <Bar dataKey="Invested" fill="#c7d2fe" radius={[3, 3, 0, 0]} maxBarSize={26} />
            <Bar dataKey="Current" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );

  const allocationPanel = (
    <Card>
      <h3 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">Asset Allocation</h3>
      {M.donut.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">No allocation yet.</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <ResponsiveContainer width={190} height={190} debounce={200}>
              <PieChart>
                <Pie data={M.donut} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="96%" paddingAngle={2} stroke="none">
                  {M.donut.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (<Tip><p className="font-medium text-ink">{String(payload[0].name)}</p><p className="text-muted">{inr(Number(payload[0].value))}</p></Tip>) : null} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[15px] font-bold text-ink">{inr(Math.round(M.current), { compact: true })}</p>
              <p className="text-[10px] text-faint">Total Value</p>
            </div>
          </div>
          <div className="w-full space-y-1.5">
            {M.donut.map((t) => (
              <div key={t.name} className="flex items-center gap-2 text-[12px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: t.color }} />
                <span className="flex-1 truncate text-muted">{t.name}</span>
                <span className="text-faint">{t.pct}%</span>
                <span className="w-[72px] text-right font-medium text-ink">₹ {t.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  const topMoversPanel = (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">Top Movers</h3>
        <button onClick={() => setSubTab("Holdings")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View all</button>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-faint">No holdings yet.</p>
      ) : (
        <div className="space-y-2.5">
          {[...items].sort((a, b) => gainPctOf(b.invested, b.currentValue) - gainPctOf(a.invested, a.currentValue)).slice(0, 5).map((i) => {
            const gp = gainPctOf(i.invested, i.currentValue);
            return (
              <div key={i.id} className="flex items-center gap-2.5">
                <Logo domain={i.logoDomain} label={i.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-ink">{i.name}</p>
                  <p className="text-[10px] text-muted">{i.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold text-ink">₹ {Math.round(i.currentValue).toLocaleString("en-IN")}</p>
                  <p className={cn("text-[10px] font-semibold", gp >= 0 ? "text-green-600" : "text-red-500")}>{gp >= 0 ? "▲" : "▼"} {Math.abs(gp)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const performanceCard = (
    <Card>
      <h3 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">Investment Performance</h3>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-faint">No data yet.</p>
      ) : (
        <div className="space-y-2.5">
          {[
            { label: "Best Performing", i: M.best, val: M.best ? `${gainPctOf(M.best.invested, M.best.currentValue) >= 0 ? "+" : ""}${gainPctOf(M.best.invested, M.best.currentValue)}%` : "—", good: true },
            { label: "Worst Performing", i: M.worst, val: M.worst ? `${gainPctOf(M.worst.invested, M.worst.currentValue) >= 0 ? "+" : ""}${gainPctOf(M.worst.invested, M.worst.currentValue)}%` : "—", good: false },
            { label: "Highest Investment", i: M.highest, val: M.highest ? `₹ ${Math.round(M.highest.currentValue).toLocaleString("en-IN")}` : "—", neutral: true },
            { label: "Lowest Investment", i: M.lowest, val: M.lowest ? `₹ ${Math.round(M.lowest.currentValue).toLocaleString("en-IN")}` : "—", neutral: true },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5">
              <div className="min-w-0">
                <p className="text-[10px] text-muted">{r.label}</p>
                <p className="truncate text-[13px] font-medium text-ink">{r.i?.name ?? "—"}</p>
              </div>
              <span className={cn("shrink-0 text-[13px] font-semibold", r.neutral ? "text-ink" : r.good ? "text-green-600" : "text-red-500")}>{r.val}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl bg-surface-2/60 p-2.5">
            <span className="text-[12px] font-medium text-muted">Overall Return (All Assets)</span>
            <span className={cn("text-[14px] font-bold", M.gainPct >= 0 ? "text-green-600" : "text-red-500")}>{M.gainPct >= 0 ? "+" : ""}{M.gainPct}%</span>
          </div>
        </div>
      )}
    </Card>
  );

  const sipPanel = (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">SIP Summary</h3>
        <button onClick={() => setSubTab("SIPs")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View all</button>
      </div>
      {M.sips.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-faint">No SIPs yet.</p>
          <p className="mt-1 text-[11px] text-muted">Add a Monthly SIP amount when creating a mutual fund.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2/60 p-2.5"><p className="text-[10px] text-muted">Active SIPs</p><p className="text-[16px] font-bold text-ink">{M.sips.length}</p></div>
            <div className="rounded-xl bg-surface-2/60 p-2.5"><p className="text-[10px] text-muted">Monthly SIP</p><p className="text-[16px] font-bold text-ink">₹ {Math.round(M.monthlySip).toLocaleString("en-IN")}</p></div>
          </div>
          <div className="mt-3 space-y-2">
            {M.sips.map((i) => (
              <div key={i.id} className="flex items-center gap-2.5">
                <Logo domain={i.logoDomain} label={i.name} size={30} />
                <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">{i.name}</p>
                <p className="text-[12px] font-semibold text-ink">₹ {Math.round(i.sipAmount ?? 0).toLocaleString("en-IN")}<span className="text-[10px] font-normal text-faint">/mo</span></p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );

  const promoCard = (
    <Card className="!bg-gradient-to-br !from-emerald-50 !to-teal-50/40 !border-emerald-100">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15"><Sparkles className="h-5 w-5 text-emerald-600" /></div>
        <div>
          <p className="text-[14px] font-semibold text-ink">Stay diversified, stay ahead</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {M.donut.length >= 4 ? "Nicely spread across asset classes." : "Consider spreading across more asset classes to reduce risk."}
          </p>
        </div>
      </div>
      <button onClick={() => setSubTab("Holdings")} className="mt-3 w-full rounded-xl bg-emerald-500 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600 transition-colors">Review Portfolio</button>
    </Card>
  );

  const overviewBody = (
    <div className="space-y-4">
      {kpiRow}
      <div className="grid items-start gap-4 xl:grid-cols-3">
        {performancePanel}
        {allocationPanel}
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold tracking-tight text-ink">Your Holdings</h3>
            <button onClick={() => setSubTab("Holdings")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View all ({items.length})</button>
          </div>
          <HoldingsTable list={[...items].sort((a, b) => b.currentValue - a.currentValue).slice(0, 6)} />
        </Card>
        {performanceCard}
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-3">
        {topMoversPanel}
        {sipPanel}
        {promoCard}
      </div>
    </div>
  );

  // focused sub-tab body (Holdings / Stocks / MFs / …)
  const focusedBody = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(() => {
          const inv = visibleItems.reduce((s, i) => s + i.invested, 0);
          const cur = visibleItems.reduce((s, i) => s + i.currentValue, 0);
          return [
            { label: "Holdings", value: String(visibleItems.length), color: "#6366f1" },
            { label: "Invested", value: `₹ ${Math.round(inv).toLocaleString("en-IN")}`, color: "#3b82f6" },
            { label: "Current Value", value: `₹ ${Math.round(cur).toLocaleString("en-IN")}`, color: "#22c55e" },
            { label: "Return", value: `${gainPctOf(inv, cur) >= 0 ? "+" : ""}${gainPctOf(inv, cur)}%`, color: gainPctOf(inv, cur) >= 0 ? "#22c55e" : "#ef4444" },
          ];
        })().map((k) => (
          <Card key={k.label} className="!p-4">
            <p className="text-[11px] font-medium text-muted">{k.label}</p>
            <p className="mt-1 text-[20px] font-semibold" style={{ color: k.color }}>{k.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">{subTab === "SIPs" ? "Active SIPs" : subTab}</h3>
          <button onClick={() => setModal({ kind: "add" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"><Plus className="h-3.5 w-3.5" /> Add</button>
        </div>
        {activeTab.sipOnly ? (
          visibleItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-faint">No SIPs yet — add a Monthly SIP amount to a mutual fund.</div>
          ) : (
            <div className="space-y-2">
              {visibleItems.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Logo domain={i.logoDomain} label={i.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{i.name}</p>
                    {i.subtitle && <p className="truncate text-[11px] text-muted">{i.subtitle}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-semibold text-ink">₹ {Math.round(i.sipAmount ?? 0).toLocaleString("en-IN")}<span className="text-[10px] font-normal text-faint">/mo</span></p>
                    <p className="text-[10px] text-muted">Current ₹ {Math.round(i.currentValue).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setModal({ kind: "edit", investment: i })} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(i)} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <HoldingsTable list={visibleItems} />
        )}
      </Card>
    </div>
  );

  return (
    <div className="animate-fade-up space-y-4">
      {toast && (
        <div className="fixed right-6 top-6 z-[110] rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-card-lg animate-fade-up">{toast}</div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Investments</h1>
          <p className="mt-1 text-sm text-muted">Your full portfolio — Indian & US stocks, mutual funds, SIPs and more.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted sm:inline">As of {today}</span>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink transition-colors"><Download className="h-4 w-4" /> Export</button>
          <button onClick={() => setModal({ kind: "add" })} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600 transition-colors"><Plus className="h-4 w-4" /> Add Investment</button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
        {SUB_TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setSubTab(t.label)}
            className={cn(
              "relative whitespace-nowrap px-3.5 py-2.5 text-[13px] font-medium transition-colors",
              subTab === t.label ? "text-emerald-600" : "text-muted hover:text-ink"
            )}
          >
            {t.label}
            {subTab === t.label && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-emerald-500" />}
          </button>
        ))}
      </div>

      {subTab === "Overview" ? overviewBody : focusedBody}

      {/* Modals */}
      <Modal open={modal?.kind === "add"} onClose={() => setModal(null)} title="Add Investment">
        <InvestmentForm submitLabel="Add Investment" busy={busy} onSubmit={(d) => save("create", d, undefined, "Investment added")} />
      </Modal>

      {modal?.kind === "edit" && (
        <Modal open onClose={() => setModal(null)} title="Edit Investment">
          <InvestmentForm initial={modal.investment} submitLabel="Save Changes" busy={busy} onSubmit={(d) => save("update", d, modal.investment.id, "Investment updated")} />
        </Modal>
      )}

      {modal?.kind === "value" && (
        <Modal open onClose={() => setModal(null)} title={`Update Value — ${modal.investment.name}`}>
          <form
            onSubmit={(e) => { e.preventDefault(); const v = Number((e.currentTarget.elements.namedItem("cv") as HTMLInputElement).value) || 0; save("update", { currentValue: v }, modal.investment.id, "Value updated"); }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Current Value (₹)</label>
              <input name="cv" required type="number" step="0.01" defaultValue={modal.investment.currentValue} className={inputCls} />
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">{busy ? "Saving…" : "Update Value"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
