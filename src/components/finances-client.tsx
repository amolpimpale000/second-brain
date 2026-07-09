"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet, PiggyBank, BarChart3, Users, Home, CalendarDays, CheckSquare, Car, Plane, Shield,
  ShoppingBag, UtensilsCrossed, Lightbulb, LayoutGrid, Zap, CreditCard, ArrowRight, ArrowUpRight,
  ArrowDownRight, ChevronDown, Plus, Landmark, Smartphone, Wifi, Receipt, User, Check, CheckCircle2,
  Pencil, Trash2, Search, TrendingUp, Target, GraduationCap, Gift, Clapperboard, HeartPulse,
  BookOpen, IndianRupee, X,
} from "lucide-react";
import { FaAmazon, FaSpotify } from "react-icons/fa";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { cn, inr } from "@/lib/utils";
import { INVESTMENT_TYPES } from "@/lib/investment-types";
import type {
  FinanceData, FinanceEntity, FinAccount, FinTransaction, FinGoal, FinLoan, FinInvestment,
  FinBill, FinDue, FinBudget,
} from "@/lib/finance-store";

/* ═══════════════════════════════════════════════════════════════════════════
   Brand icons
   ═══════════════════════════════════════════════════════════════════════════ */
function NetflixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z" />
    </svg>
  );
}
function HdfcIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#ED232A" />
      <text x="20" y="25" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">HDFC</text>
    </svg>
  );
}
function SbiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#0052CC" />
      <circle cx="20" cy="15" r="4.5" stroke="white" strokeWidth="2" />
      <path d="M20 19.5V29M15 25H25" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IciciIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#EF4123" />
      <path d="M20 8L32 32H8L20 8Z" fill="white" />
    </svg>
  );
}
function CashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#0F172A" />
      <rect x="8" y="13" width="24" height="14" rx="2.5" stroke="white" strokeWidth="2" />
      <circle cx="20" cy="20" r="3.5" stroke="white" strokeWidth="2" />
    </svg>
  );
}
function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#6366F1" />
      <path d="M20 9l12 6H8l12-6zM11 18v10M16.5 18v10M23.5 18v10M29 18v10M8 30h24" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const bankLogo: Record<string, React.ElementType> = {
  hdfc: HdfcIcon, sbi: SbiIcon, icici: IciciIcon, cash: CashIcon, other: BankIcon,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Category / entity constants
   ═══════════════════════════════════════════════════════════════════════════ */
const EXPENSE_CATEGORIES = ["Housing", "Food & Dining", "Transport", "Shopping", "Utilities", "Entertainment", "Health", "Education", "Loan EMI", "Others"];
const INCOME_CATEGORIES = ["Salary", "Business", "Freelance", "Interest", "Refund", "Other Income"];
const PAYMENT_MODES = ["UPI", "Card", "Bank Transfer", "Cash", "Auto-debit"];

const CAT_COLOR: Record<string, string> = {
  Housing: "#22c55e", "Food & Dining": "#f59e0b", Transport: "#3b82f6", Shopping: "#ec4899",
  Utilities: "#8b5cf6", Entertainment: "#ef4444", Health: "#14b8a6", Education: "#6366f1",
  "Loan EMI": "#f97316", Others: "#94a3b8",
};
const catColor = (c: string) => CAT_COLOR[c] ?? "#94a3b8";

const catIcon: Record<string, { icon: React.ElementType; bg: string; fg: string }> = {
  Housing: { icon: Home, bg: "bg-emerald-50", fg: "text-emerald-500" },
  "Food & Dining": { icon: UtensilsCrossed, bg: "bg-amber-50", fg: "text-amber-500" },
  Transport: { icon: Car, bg: "bg-blue-50", fg: "text-blue-500" },
  Shopping: { icon: ShoppingBag, bg: "bg-pink-50", fg: "text-pink-500" },
  Utilities: { icon: Lightbulb, bg: "bg-purple-50", fg: "text-purple-500" },
  Entertainment: { icon: Clapperboard, bg: "bg-red-50", fg: "text-red-500" },
  Health: { icon: HeartPulse, bg: "bg-teal-50", fg: "text-teal-600" },
  Education: { icon: BookOpen, bg: "bg-indigo-50", fg: "text-indigo-500" },
  "Loan EMI": { icon: Landmark, bg: "bg-orange-50", fg: "text-orange-500" },
  Others: { icon: LayoutGrid, bg: "bg-slate-100", fg: "text-slate-500" },
  Salary: { icon: Wallet, bg: "bg-emerald-50", fg: "text-emerald-600" },
  Business: { icon: BarChart3, bg: "bg-emerald-50", fg: "text-emerald-600" },
  Freelance: { icon: Zap, bg: "bg-emerald-50", fg: "text-emerald-600" },
  Interest: { icon: PiggyBank, bg: "bg-emerald-50", fg: "text-emerald-600" },
  Refund: { icon: ArrowDownRight, bg: "bg-emerald-50", fg: "text-emerald-600" },
  "Other Income": { icon: IndianRupee, bg: "bg-emerald-50", fg: "text-emerald-600" },
};
const iconForCat = (c: string) => catIcon[c] ?? { icon: CreditCard, bg: "bg-slate-100", fg: "text-slate-500" };

const GOAL_ICONS = [
  { value: "plane", label: "Travel", icon: Plane, color: "#8b5cf6" },
  { value: "bike", label: "Vehicle", icon: Car, color: "#3b82f6" },
  { value: "shield", label: "Emergency", icon: Shield, color: "#22c55e" },
  { value: "home", label: "Home", icon: Home, color: "#f59e0b" },
  { value: "gift", label: "Gift", icon: Gift, color: "#ec4899" },
  { value: "piggy", label: "Savings", icon: PiggyBank, color: "#14b8a6" },
];
const goalMeta = (icon: string) => GOAL_ICONS.find((g) => g.value === icon) ?? GOAL_ICONS[5];

const LOAN_KINDS = [
  { value: "home", label: "Home Loan", icon: Home, color: "#6366f1" },
  { value: "personal", label: "Personal Loan", icon: User, color: "#8b5cf6" },
  { value: "vehicle", label: "Vehicle Loan", icon: Car, color: "#3b82f6" },
  { value: "education", label: "Education Loan", icon: GraduationCap, color: "#14b8a6" },
];
const loanMeta = (kind: string) => LOAN_KINDS.find((k) => k.value === kind) ?? LOAN_KINDS[1];


const INSTITUTIONS = [
  { value: "hdfc", label: "HDFC Bank" },
  { value: "sbi", label: "SBI Bank" },
  { value: "icici", label: "ICICI Bank" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other Bank" },
];

function billIconFor(name: string): { icon: React.ElementType; color: string } {
  const n = name.toLowerCase();
  if (n.includes("netflix")) return { icon: NetflixIcon, color: "#E50914" };
  if (n.includes("amazon") || n.includes("prime")) return { icon: FaAmazon, color: "#FF9900" };
  if (n.includes("spotify")) return { icon: FaSpotify, color: "#1DB954" };
  if (n.includes("mobile") || n.includes("phone") || n.includes("postpaid") || n.includes("jio") || n.includes("airtel")) return { icon: Smartphone, color: "#3b82f6" };
  if (n.includes("internet") || n.includes("wifi") || n.includes("broadband")) return { icon: Wifi, color: "#8b5cf6" };
  if (n.includes("rent") || n.includes("house")) return { icon: Home, color: "#22c55e" };
  if (n.includes("electric") || n.includes("power")) return { icon: Zap, color: "#f59e0b" };
  return { icon: Receipt, color: "#64748b" };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Date helpers
   ═══════════════════════════════════════════════════════════════════════════ */
const mk = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const NOW = () => new Date();
const thisMonthKey = () => mk(NOW());
const monthKeyOffset = (offset: number) => {
  const n = NOW();
  return mk(new Date(n.getFullYear(), n.getMonth() + offset, 1));
};
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};
const monthShort = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
};
const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const todayISO = () => {
  const n = NOW();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Shared primitives
   ═══════════════════════════════════════════════════════════════════════════ */
const axis = { tick: { fill: "#9ca3af", fontSize: 11 }, axisLine: false, tickLine: false } as const;

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04),0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)] hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

function Head({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
      {right}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}

function Spark({ data, color, height = 44 }: { data: number[]; color: string; height?: number }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height} debounce={200}>
      <LineChart data={d} margin={{ top: 6, bottom: 4, left: 2, right: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function yFmt(v: number) {
  if (v === 0) return "₹0";
  if (Math.abs(v) < 1000) return `₹${v}`;
  if (Math.abs(v) < 100000) return `₹${Math.round(v / 1000)}K`;
  const l = v / 100000;
  return `₹${Number.isInteger(l) ? l : l.toFixed(1)}L`;
}

function AddButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-2/50 py-2 text-[11px] font-medium text-muted hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand-ink transition-all"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function EmptyHint({ text, cta, onClick }: { text: string; cta?: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <p className="text-[12px] text-faint">{text}</p>
      {cta && (
        <button onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink transition-colors">
          <Plus className="h-3 w-3" /> {cta}
        </button>
      )}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={onEdit} className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-ink"><Pencil className="h-3 w-3" /></button>
      <button onClick={onDelete} className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
    </span>
  );
}

function MonthSel({ value, onChange }: { value: "this" | "last"; onChange: (v: "this" | "last") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors"
      >
        {value === "this" ? "This Month" : "Last Month"} <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-xl border border-border bg-card p-1 shadow-card-lg">
          {([["this", "This Month"], ["last", "Last Month"]] as const).map(([v, label]) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }} className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted hover:bg-surface-2 hover:text-ink">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Modal + form primitives (controlled, real submits)
   ═══════════════════════════════════════════════════════════════════════════ */
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
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-card-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

const inputCls = "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

type FieldDef = {
  name: string; label: string; type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[]; placeholder?: string; required?: boolean; half?: boolean;
};

function EntityForm({
  fields, initial, submitLabel, onSubmit, busy,
}: {
  fields: FieldDef[];
  initial?: Record<string, string>;
  submitLabel: string;
  onSubmit: (data: Record<string, string>) => void;
  busy: boolean;
}) {
  const [data, setData] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const f of fields) d[f.name] = initial?.[f.name] ?? (f.type === "select" ? f.options?.[0]?.value ?? "" : "");
    return d;
  });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(data); }}
      className="grid grid-cols-2 gap-3"
    >
      {fields.map((f) => (
        <div key={f.name} className={f.half ? "" : "col-span-2"}>
          <label className="mb-1 block text-xs font-medium text-muted">{f.label}</label>
          {f.type === "select" ? (
            <select value={data[f.name]} onChange={(e) => setData((p) => ({ ...p, [f.name]: e.target.value }))} className={inputCls}>
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input
              type={f.type || "text"}
              step={f.type === "number" ? "0.01" : undefined}
              placeholder={f.placeholder}
              required={f.required !== false}
              value={data[f.name]}
              onChange={(e) => setData((p) => ({ ...p, [f.name]: e.target.value }))}
              className={inputCls}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={busy}
        className="col-span-2 mt-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function TxnForm({
  initial, submitLabel, onSubmit, busy, accounts,
}: {
  initial?: Partial<FinTransaction>;
  submitLabel: string;
  onSubmit: (data: Omit<FinTransaction, "id" | "createdAt">) => void;
  busy: boolean;
  accounts: FinAccount[];
}) {
  const [type, setType] = useState<"income" | "expense">(initial?.type ?? "expense");
  const cats = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const [category, setCategory] = useState(initial?.category && cats.includes(initial.category) ? initial.category : cats[0]);
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [mode, setMode] = useState(initial?.mode ?? "UPI");
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");

  useEffect(() => {
    const list = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!list.includes(category)) setCategory(list[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const amt = Number(amount);
        if (!amt || amt <= 0) return;
        onSubmit({ type, category, description, amount: amt, date, mode, accountId: accountId || null });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t} type="button" onClick={() => setType(t)}
            className={cn(
              "rounded-lg py-1.5 text-sm font-medium capitalize transition-colors",
              type === t
                ? t === "income" ? "bg-emerald-500 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                : "text-muted hover:text-ink"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Amount (₹)</label>
          <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Date</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Payment Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
            {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "income" ? "e.g. May Salary" : "e.g. BigBasket groceries"} className={inputCls} />
      </div>
      {accounts.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Account (optional)</label>
          <select value={accountId ?? ""} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Health gauge (semicircle speedometer)
   ═══════════════════════════════════════════════════════════════════════════ */
function HealthGauge({ score, label, max = 100 }: { score: number; label: string; max?: number }) {
  const size = 150, cx = size / 2, cy = 74, r = 60, sw = 13;
  const polar = (ang: number, rad: number) => {
    const a = (ang * Math.PI) / 180;
    return { x: cx + rad * Math.cos(a), y: cy - rad * Math.sin(a) };
  };
  const arc = (a1: number, a2: number) => {
    const p1 = polar(a1, r), p2 = polar(a2, r);
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
  };
  const segs = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  const valAng = 180 - (score / max) * 180;
  const tip = polar(valAng, r - 15);

  return (
    <div className="relative mx-auto shrink-0" style={{ width: size, height: 96 }}>
      <svg width={size} height={96} viewBox={`0 0 ${size} 96`}>
        {segs.map((c, i) => {
          const a1 = 180 - i * 36 - 1.5;
          const a2 = 180 - (i + 1) * 36 + 1.5;
          return <path key={i} d={arc(a1, a2)} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />;
        })}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#334155" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4.5} fill="#334155" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
        <p className="text-xl font-bold leading-none text-ink">
          {score} <span className="text-[11px] font-normal text-faint">/ {max}</span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> {label}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Derived metrics
   ═══════════════════════════════════════════════════════════════════════════ */
type HealthMetric = { name: string; status: string; good: boolean; detail: string };

function computeHealth(income: number, expense: number, assets: number, liabilities: number, investTotal: number, netWorth: number, budgetRows: { budget: number; actual: number }[]) {
  const savings = income - expense;
  const sr = income > 0 ? savings / income : 0;
  const spendRatio = income > 0 ? expense / income : 1;
  const debtRatio = assets > 0 ? liabilities / assets : liabilities > 0 ? 1 : 0;
  const investRatio = netWorth > 0 ? investTotal / netWorth : 0;
  const withinBudget = budgetRows.filter((b) => b.actual <= b.budget).length;
  const discipline = budgetRows.length > 0 ? withinBudget / budgetRows.length : 0.5;

  const srScore = sr >= 0.3 ? 25 : sr >= 0.2 ? 20 : sr >= 0.1 ? 12 : sr > 0 ? 6 : 0;
  const spendScore = spendRatio <= 0.5 ? 20 : spendRatio <= 0.7 ? 15 : spendRatio <= 0.9 ? 9 : 3;
  const debtScore = debtRatio <= 0.1 ? 20 : debtRatio <= 0.3 ? 15 : debtRatio <= 0.5 ? 9 : 3;
  const investScore = investRatio >= 0.4 ? 20 : investRatio >= 0.25 ? 15 : investRatio >= 0.1 ? 8 : 3;
  const discScore = Math.round(discipline * 15);
  const score = Math.min(100, srScore + spendScore + debtScore + investScore + discScore);

  const grade = (v: number, max: number) => (v >= max * 0.9 ? "Excellent" : v >= max * 0.65 ? "Good" : v >= max * 0.4 ? "Fair" : "Low");
  const metrics: HealthMetric[] = [
    { name: "Spending", status: grade(spendScore, 20), good: spendScore >= 13, detail: income > 0 ? `${Math.round(spendRatio * 100)}% of income spent` : "No income recorded" },
    { name: "Savings Rate", status: grade(srScore, 25), good: srScore >= 16, detail: income > 0 ? `Saving ${Math.round(sr * 100)}% of income` : "No income recorded" },
    { name: "Debt Management", status: grade(debtScore, 20), good: debtScore >= 13, detail: `Liabilities are ${Math.round(debtRatio * 100)}% of assets` },
    { name: "Investments", status: grade(investScore, 20), good: investScore >= 13, detail: `${Math.round(investRatio * 100)}% of net worth invested` },
    { name: "Financial Discipline", status: grade(discScore, 15), good: discScore >= 10, detail: budgetRows.length ? `${withinBudget}/${budgetRows.length} budgets on track` : "No budgets set yet" },
  ];
  const label = score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Fair" : "Needs Work";
  return { score, label, metrics };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════════ */
const TABS = ["Overview", "Expenses", "Loans", "Savings Goals"] as const;
type Tab = (typeof TABS)[number];
const TAB_ICONS: Record<Tab, React.ElementType> = {
  Overview: LayoutGrid, Expenses: Receipt, Loans: Landmark, "Savings Goals": Target,
};
// Investments lives on its own page (/investments) but appears in this tab
// bar for a seamless section switcher; same data (finance_investments) feeds
// the KPIs and the Investments Summary card here.
const NAV_ITEMS: ({ tab: Tab } | { href: string; label: string; icon: React.ElementType })[] = [
  { tab: "Overview" },
  { tab: "Expenses" },
  { tab: "Loans" },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { tab: "Savings Goals" },
];

type ModalState =
  | { kind: "txn" | "account" | "goal" | "loan" | "investment" | "bill" | "due" | "budget"; editing?: Record<string, unknown> }
  | { kind: "goalMoney"; goal: FinGoal }
  | { kind: "loanPayment"; loan: FinLoan }
  | { kind: "healthReport" }
  | null;

export function FinancesClient({ initial }: { initial: FinanceData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [db, setDb] = useState<FinanceData>(initial);
  const [tab, setTab] = useState<Tab>("Overview");
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const quickRef = useRef<HTMLDivElement>(null);
  const [overviewMonth, setOverviewMonth] = useState<"this" | "last">("this");

  // Expenses tab controls
  const [txnSearch, setTxnSearch] = useState("");
  const [txnType, setTxnType] = useState<"all" | "income" | "expense">("all");
  const [txnCat, setTxnCat] = useState("All");
  const [txnMonth, setTxnMonth] = useState("All");
  const [showAllTxns, setShowAllTxns] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && (TABS as readonly string[]).includes(t)) setTab(t as Tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickOpen(false);
    }
    if (quickOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [quickOpen]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  /* ── API plumbing ─────────────────────────────────────────────────────── */
  async function apiMutate(entity: FinanceEntity, action: "create" | "update" | "delete", payload: { id?: string; data?: Record<string, unknown> }) {
    const res = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, action, ...payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Save failed");
    return json;
  }

  async function createRow(entity: FinanceEntity, data: Record<string, unknown>, msg = "Saved") {
    setBusy(true);
    try {
      const { row } = await apiMutate(entity, "create", { data });
      setDb((p) => ({ ...p, [entity]: [...(p[entity] as unknown[]), row] } as FinanceData));
      setModal(null);
      flash(msg);
      return row;
    } catch (err) {
      flash(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function updateRow(entity: FinanceEntity, id: string, data: Record<string, unknown>, msg = "Updated") {
    setBusy(true);
    try {
      const { row } = await apiMutate(entity, "update", { id, data });
      setDb((p) => ({ ...p, [entity]: (p[entity] as { id: string }[]).map((r) => (r.id === id ? row : r)) } as FinanceData));
      setModal(null);
      flash(msg);
      return row;
    } catch (err) {
      flash(err instanceof Error ? err.message : "Update failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function deleteRow(entity: FinanceEntity, id: string, confirmMsg = "Delete this?") {
    if (!window.confirm(confirmMsg)) return;
    try {
      await apiMutate(entity, "delete", { id });
      setDb((p) => ({ ...p, [entity]: (p[entity] as { id: string }[]).filter((r) => r.id !== id) } as FinanceData));
      flash("Deleted");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Delete failed");
    }
  }

  /* ── Derived metrics ──────────────────────────────────────────────────── */
  const M = useMemo(() => {
    const { accounts, transactions, goals, loans, investments, bills, dues, budgets } = db;

    const monthsAgg = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const key = t.date.slice(0, 7);
      const agg = monthsAgg.get(key) ?? { income: 0, expense: 0 };
      if (t.type === "income") agg.income += t.amount;
      else agg.expense += t.amount;
      monthsAgg.set(key, agg);
    }
    const aggFor = (key: string) => monthsAgg.get(key) ?? { income: 0, expense: 0 };

    const selKey = overviewMonth === "this" ? thisMonthKey() : monthKeyOffset(-1);
    const prevKey = overviewMonth === "this" ? monthKeyOffset(-1) : monthKeyOffset(-2);
    const sel = aggFor(selKey);
    const prev = aggFor(prevKey);
    const selSavings = sel.income - sel.expense;
    const prevSavings = prev.income - prev.expense;

    const delta = (cur: number, before: number) => (before !== 0 ? Math.round(((cur - before) / Math.abs(before)) * 1000) / 10 : cur > 0 ? 100 : 0);

    const accountsTotal = accounts.reduce((s, a) => s + a.balance, 0);
    const investInvested = investments.reduce((s, i) => s + i.invested, 0);
    const investCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
    const investGainPct = investInvested > 0 ? Math.round(((investCurrent - investInvested) / investInvested) * 1000) / 10 : 0;
    const loansOutstanding = loans.reduce((s, l) => s + l.outstanding, 0);
    const loansPrincipal = loans.reduce((s, l) => s + l.principal, 0);
    const assets = accountsTotal + investCurrent;
    const liabilities = loansOutstanding;
    const netWorth = assets - liabilities;

    // last-6-month keys ending at the selected month
    const last6: string[] = [];
    {
      const [y, m] = selKey.split("-").map(Number);
      for (let i = 5; i >= 0; i--) last6.push(mk(new Date(y, m - 1 - i, 1)));
    }
    const incomeSpark = last6.map((k) => aggFor(k).income);
    const expenseSpark = last6.map((k) => aggFor(k).expense);
    const savingsSpark = last6.map((k) => aggFor(k).income - aggFor(k).expense);
    // net worth trend walking backwards from the current figure
    const netWorthTrend: number[] = new Array(last6.length).fill(netWorth);
    for (let i = last6.length - 2; i >= 0; i--) {
      const flowNext = aggFor(last6[i + 1]);
      netWorthTrend[i] = netWorthTrend[i + 1] - (flowNext.income - flowNext.expense);
    }
    const investSpark = last6.map((_, i) => investInvested + ((investCurrent - investInvested) * i) / Math.max(last6.length - 1, 1));
    const loansSpark = last6.map(() => loansOutstanding);
    const nwDelta = netWorthTrend[netWorthTrend.length - 2] !== 0
      ? Math.round(((netWorth - netWorthTrend[netWorthTrend.length - 2]) / Math.abs(netWorthTrend[netWorthTrend.length - 2])) * 1000) / 10
      : 0;

    const vsLabel = `vs ${monthLabel(prevKey)}`;
    const kpis = [
      { label: "Total Income", value: sel.income, delta: delta(sel.income, prev.income), vs: vsLabel, color: "#22c55e", spark: incomeSpark },
      { label: "Total Expenses", value: sel.expense, delta: delta(sel.expense, prev.expense), vs: vsLabel, color: "#ef4444", spark: expenseSpark },
      { label: "Net Savings", value: selSavings, delta: delta(selSavings, prevSavings), vs: vsLabel, color: "#3b82f6", spark: savingsSpark },
      { label: "Total Investments", value: investCurrent, delta: investGainPct, vs: "overall gain", color: "#8b5cf6", spark: investSpark },
      { label: "Total Loans", value: loansOutstanding, delta: loansPrincipal > 0 ? -Math.round(((loansPrincipal - loansOutstanding) / loansPrincipal) * 1000) / 10 : 0, vs: "of principal paid", color: "#f59e0b", spark: loansSpark },
      { label: "Net Worth", value: netWorth, delta: nwDelta, vs: vsLabel, color: "#10b981", spark: netWorthTrend },
    ];

    // weekly cash flow for the selected month
    const [sy, sm] = selKey.split("-").map(Number);
    const daysInMonth = new Date(sy, sm, 0).getDate();
    const buckets = [
      { from: 1, to: 7 }, { from: 8, to: 14 }, { from: 15, to: 21 }, { from: 22, to: 28 },
      ...(daysInMonth > 28 ? [{ from: 29, to: daysInMonth }] : []),
    ];
    const mShort = monthShort(selKey);
    const cashFlowWeekly = buckets.map((b) => ({ week: `${b.from}-${b.to} ${mShort}`, income: 0, expenses: 0, savings: 0 }));
    for (const t of transactions) {
      if (t.date.slice(0, 7) !== selKey) continue;
      const day = Number(t.date.slice(8, 10));
      const bi = buckets.findIndex((b) => day >= b.from && day <= b.to);
      if (bi === -1) continue;
      if (t.type === "income") cashFlowWeekly[bi].income += t.amount;
      else cashFlowWeekly[bi].expenses += t.amount;
    }
    for (const w of cashFlowWeekly) w.savings = Math.max(0, w.income - w.expenses);

    // expense breakdown by category (selected month)
    const catMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || t.date.slice(0, 7) !== selKey) continue;
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount);
    }
    const expenseTotal = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
    const expenseBreakdown = Array.from(catMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value: Math.round(value), pct: expenseTotal ? Math.round((value / expenseTotal) * 1000) / 10 : 0, color: catColor(name) }));

    const budgetRows = budgets.map((b) => {
      const actual = Math.round(catMap.get(b.category) ?? 0);
      return { ...b, actual, pctUsed: b.amount > 0 ? Math.round((actual / b.amount) * 100) : 0 };
    });

    const topSpending = expenseBreakdown.slice(0, 5);
    const recentTxns = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

    // upcoming bills — next occurrence of each bill's due day
    const today = NOW();
    const upcomingBills = bills
      .map((b) => {
        const dueThis = new Date(today.getFullYear(), today.getMonth(), Math.min(b.dueDay, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()));
        const due = dueThis >= new Date(today.getFullYear(), today.getMonth(), today.getDate())
          ? dueThis
          : new Date(today.getFullYear(), today.getMonth() + 1, Math.min(b.dueDay, new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate()));
        const days = Math.round((due.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
        return { ...b, due, days };
      })
      .sort((a, b) => a.days - b.days);

    const pendingDues = dues.filter((d) => d.status === "pending");
    const health = computeHealth(sel.income, sel.expense, assets, liabilities, investCurrent, netWorth, budgetRows.map((b) => ({ budget: b.amount, actual: b.actual })));

    const investByType = INVESTMENT_TYPES.map((t) => ({
      name: t.value,
      color: t.color,
      value: investments.filter((i) => i.type === t.value).reduce((s, i) => s + i.currentValue, 0),
    })).filter((t) => t.value > 0);

    const monthOptions = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort().reverse();

    return {
      selKey, sel, selSavings, kpis, cashFlowWeekly, expenseBreakdown, expenseTotal, budgetRows,
      topSpending, recentTxns, upcomingBills, pendingDues, health, accountsTotal, assets, liabilities,
      netWorth, netWorthTrend, investInvested, investCurrent, investGainPct, loansOutstanding,
      loansPrincipal, investByType, monthOptions, nwDelta, vsLabel,
    };
  }, [db, overviewMonth]);

  /* ── Filtered transactions for the Expenses tab ───────────────────────── */
  const filteredTxns = useMemo(() => {
    let list = [...db.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    if (txnType !== "all") list = list.filter((t) => t.type === txnType);
    if (txnCat !== "All") list = list.filter((t) => t.category === txnCat);
    if (txnMonth !== "All") list = list.filter((t) => t.date.slice(0, 7) === txnMonth);
    if (txnSearch.trim()) {
      const q = txnSearch.trim().toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list;
  }, [db.transactions, txnType, txnCat, txnMonth, txnSearch]);

  const accountName = (id: string | null) => db.accounts.find((a) => a.id === id)?.name ?? "—";

  function switchTab(t: Tab) {
    setTab(t);
    router.replace(t === "Overview" ? "/finances" : `/finances?tab=${encodeURIComponent(t)}`, { scroll: false });
  }

  /* ═════════════════════════════ Sections ═════════════════════════════ */

  const kpiIconMap: Record<string, React.ElementType> = {
    "Total Income": CheckSquare, "Total Expenses": CalendarDays, "Net Savings": PiggyBank,
    "Total Investments": BarChart3, "Total Loans": Users, "Net Worth": Home,
  };

  const kpiCards = (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {M.kpis.map((k) => {
        const Icon = kpiIconMap[k.label] ?? Wallet;
        const up = k.delta >= 0;
        return (
          <Card key={k.label} className="!p-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: `linear-gradient(135deg, ${k.color}20, ${k.color}08)` }}>
                <Icon className="h-[18px] w-[18px]" style={{ color: k.color }} />
              </div>
              <p className="text-[11px] font-medium text-muted leading-tight">{k.label}</p>
            </div>
            <p className="mt-2.5 text-[18px] font-semibold leading-none text-ink">₹ {k.value.toLocaleString("en-IN")}</p>
            <div className="mt-2 flex items-center gap-1">
              {up ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
              <span className={cn("text-[10px] font-medium", up ? "text-green-500" : "text-red-500")}>{Math.abs(k.delta)}%</span>
              <span className="text-[10px] text-faint">{k.vs}</span>
            </div>
            <div className="-mx-1.5 mt-1.5">
              <Spark data={k.spark} color={k.color} />
            </div>
          </Card>
        );
      })}
    </div>
  );

  const netWorthCard = (
    <Card className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft">
          <Home className="h-5 w-5 text-brand-ink" />
        </div>
        <span className="text-sm font-medium text-muted">Net Worth Overview</span>
      </div>
      <p className="mt-3 text-[32px] font-semibold tracking-tight text-ink">₹ {M.netWorth.toLocaleString("en-IN")}</p>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium", M.nwDelta >= 0 ? "bg-emerald-50 text-green-600" : "bg-red-50 text-red-500")}>
          {M.nwDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {Math.abs(M.nwDelta)}%
        </span>
        <span className="text-muted">{M.vsLabel}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted"><Wallet className="h-3.5 w-3.5 text-emerald-500" /> Total Assets</p>
          <p className="mt-1 text-base font-semibold text-ink">₹ {M.assets.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted"><Landmark className="h-3.5 w-3.5 text-red-400" /> Total Liabilities</p>
          <p className="mt-1 text-base font-semibold text-ink">₹ {M.liabilities.toLocaleString("en-IN")}</p>
        </div>
      </div>
      <div className="mt-4 flex-1 rounded-xl border border-border/60 bg-surface-2/30 p-3">
        <p className="text-xs font-medium text-muted">Net Worth Trend</p>
        <div className="mt-1 h-[140px]">
          <Spark data={M.netWorthTrend} color="#22c55e" height={140} />
        </div>
      </div>
    </Card>
  );

  const cashFlowCard = (
    <Card>
      <Head title="Cash Flow Overview" right={<MonthSel value={overviewMonth} onChange={setOverviewMonth} />} />
      <div className="mb-2 flex gap-4 text-[11px]">
        {[{ n: "Income", c: "#22c55e" }, { n: "Expenses", c: "#ef4444" }, { n: "Savings", c: "#3b82f6" }].map((s) => (
          <span key={s.n} className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.c }} />{s.n}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={230} debounce={200}>
        <BarChart data={M.cashFlowWeekly} margin={{ left: -6, right: 4, top: 5 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="week" {...axis} interval={0} />
          <YAxis {...axis} width={48} tickFormatter={yFmt} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Tip>
                <p className="mb-1 font-medium text-ink">{label}</p>
                {payload.map((p) => (
                  <p key={String(p.name)} className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: String(p.color) }} />
                    {p.name}: <span className="font-medium text-ink">{inr(Number(p.value))}</span>
                  </p>
                ))}
              </Tip>
            ) : null
          } />
          <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={15} />
          <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={15} />
          <Bar dataKey="savings" name="Savings" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={15} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const expenseBreakdownCard = (
    <Card>
      <Head title="Expense Breakdown" right={<MonthSel value={overviewMonth} onChange={setOverviewMonth} />} />
      {M.expenseBreakdown.length === 0 ? (
        <EmptyHint text="No expenses recorded for this month yet." cta="Add Expense" onClick={() => setModal({ kind: "txn" })} />
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <ResponsiveContainer width={180} height={180} debounce={200}>
              <PieChart>
                <Pie data={M.expenseBreakdown} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="92%" paddingAngle={2} stroke="none">
                  {M.expenseBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) =>
                  active && payload?.length ? (
                    <Tip><p className="font-medium text-ink">{String(payload[0].name)}</p><p className="text-muted">{inr(Number(payload[0].value))}</p></Tip>
                  ) : null
                } />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm font-bold text-ink">₹ {M.expenseTotal.toLocaleString("en-IN")}</p>
              <p className="text-[10px] text-faint">Total</p>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {M.expenseBreakdown.slice(0, 7).map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-[12px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                <span className="flex-1 truncate text-muted">{c.name}</span>
                <span className="w-[40px] text-right text-faint">{c.pct}%</span>
                <span className="w-[64px] text-right font-medium text-ink">₹ {c.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  const accountsCard = (
    <Card className="flex h-full flex-col">
      <Head title="Accounts Overview" right={<button onClick={() => switchTab("Overview")} className="hidden" />} />
      <div className="flex-1 space-y-1">
        {db.accounts.length === 0 && <EmptyHint text="No accounts added yet." />}
        {db.accounts.map((a) => {
          const Icon = bankLogo[a.institution] ?? BankIcon;
          return (
            <div key={a.id} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2/60">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                <Icon className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">{a.name}</p>
                <p className="text-[11px] text-muted">{a.type}{a.last4 && <> • ****{a.last4}</>}</p>
              </div>
              <p className="shrink-0 text-[13px] font-semibold text-ink">₹ {a.balance.toLocaleString("en-IN")}</p>
              <RowActions
                onEdit={() => setModal({ kind: "account", editing: a as unknown as Record<string, unknown> })}
                onDelete={() => deleteRow("accounts", a.id, `Delete account "${a.name}"?`)}
              />
            </div>
          );
        })}
      </div>
      <AddButton label="Add Account" onClick={() => setModal({ kind: "account" })} />
    </Card>
  );

  const savingsGoalsCard = (
    <Card>
      <Head title="Savings Goals" right={<button onClick={() => switchTab("Savings Goals")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View All</button>} />
      <div className="space-y-3">
        {db.goals.length === 0 && <EmptyHint text="No savings goals yet." />}
        {db.goals.map((g) => {
          const meta = goalMeta(g.icon);
          const GI = meta.icon;
          const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
          return (
            <div key={g.id} className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ background: `linear-gradient(135deg, ${g.color}20, ${g.color}08)` }}>
                <GI className="h-3.5 w-3.5" style={{ color: g.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-ink">{g.name}</p>
                  <span className="text-[11px] font-semibold text-ink">{pct}%</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted">₹ {g.saved.toLocaleString("en-IN")} of ₹ {g.target.toLocaleString("en-IN")}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${g.color}, ${g.color}cc)` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <AddButton label="Add New Goal" onClick={() => setModal({ kind: "goal" })} />
    </Card>
  );

  const recentTxnsCard = (
    <Card>
      <Head title="Recent Transactions" right={<button onClick={() => switchTab("Expenses")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View All</button>} />
      {M.recentTxns.length === 0 ? (
        <EmptyHint text="No transactions yet." cta="Add Transaction" onClick={() => setModal({ kind: "txn" })} />
      ) : (
        <div className="space-y-0.5">
          {M.recentTxns.map((t) => {
            const s = iconForCat(t.category);
            const Icon = s.icon;
            const credit = t.type === "income";
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 hover:bg-surface-2/50 transition-colors -mx-1.5">
                <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[10px]", s.bg)}>
                  <Icon className={cn("h-4 w-4", s.fg)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-ink">{t.description || t.category}</p>
                  <p className="text-[10px] text-muted">{t.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-[12px] font-semibold", credit ? "text-green-600" : "text-red-500")}>
                    {credit ? "+" : "-"} ₹ {t.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-faint">{fmtDate(t.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const budgetCard = (
    <Card>
      <Head title="Budget vs Actual" right={<MonthSel value={overviewMonth} onChange={setOverviewMonth} />} />
      {M.budgetRows.length === 0 ? (
        <EmptyHint text="No budgets set yet." cta="Set a Budget" onClick={() => setModal({ kind: "budget" })} />
      ) : (
        <>
          <div className="mb-2 grid grid-cols-[1fr_52px_52px_48px] gap-1 text-[10px] font-medium uppercase tracking-wide text-faint">
            <span>Category</span><span className="text-right">Budget</span><span className="text-right">Actual</span><span className="text-right">Status</span>
          </div>
          <div className="space-y-2">
            {M.budgetRows.map((b) => (
              <div key={b.id} className="grid grid-cols-[1fr_52px_52px_48px] items-center gap-1">
                <span className="truncate text-[11px] font-medium text-ink">{b.category}</span>
                <span className="text-right text-[10px] text-muted">₹ {b.amount.toLocaleString("en-IN")}</span>
                <span className="text-right text-[10px] font-semibold text-ink">₹ {b.actual.toLocaleString("en-IN")}</span>
                <div className="flex items-center justify-end gap-1">
                  <div className="h-1.5 w-6 overflow-hidden rounded-full bg-surface-2">
                    <div className={cn("h-full rounded-full", b.pctUsed > 100 ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-green-500 to-emerald-400")} style={{ width: `${Math.min(100, b.pctUsed)}%` }} />
                  </div>
                  <span className="w-[26px] text-right text-[10px] font-medium text-muted">{b.pctUsed}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <button onClick={() => switchTab("Expenses")} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View Full Budget Report <ArrowRight className="h-3 w-3" />
      </button>
    </Card>
  );

  const topSpendingCard = (
    <Card>
      <Head title="Top Spending Categories" right={<MonthSel value={overviewMonth} onChange={setOverviewMonth} />} />
      {M.topSpending.length === 0 ? (
        <EmptyHint text="No spending recorded this month." />
      ) : (
        <div className="space-y-2">
          {M.topSpending.map((c) => {
            const s = iconForCat(c.name);
            const Icon = s.icon;
            return (
              <div key={c.name} className="flex items-center gap-2.5">
                <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[10px]", s.bg)}>
                  <Icon className={cn("h-4 w-4", s.fg)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-ink">{c.name}</p>
                  <p className="text-[10px] text-muted">{c.pct}% of total</p>
                </div>
                <span className="text-[12px] font-semibold text-ink">₹ {c.value.toLocaleString("en-IN")}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const billsCard = (
    <Card>
      <Head title="Upcoming Bills & Subscriptions" right={<button onClick={() => switchTab("Expenses")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View All</button>} />
      {M.upcomingBills.length === 0 ? (
        <EmptyHint text="No recurring bills added." cta="Add Bill" onClick={() => setModal({ kind: "bill" })} />
      ) : (
        <div className="space-y-2">
          {M.upcomingBills.slice(0, 5).map((b) => {
            const s = billIconFor(b.name);
            const Icon = s.icon;
            return (
              <div key={b.id} className="group flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ background: `linear-gradient(135deg, ${s.color}16, ${s.color}05)` }}>
                  <Icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <p className="flex-1 truncate text-[12px] font-medium text-ink">{b.name}</p>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] font-semibold text-ink">₹ {b.amount.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-faint">{b.days === 0 ? "Due today" : `Due in ${b.days}d`} · {b.due.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                </div>
                <RowActions
                  onEdit={() => setModal({ kind: "bill", editing: b as unknown as Record<string, unknown> })}
                  onDelete={() => deleteRow("bills", b.id, `Delete bill "${b.name}"?`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  const loansCard = (
    <Card>
      <Head title="Loans Overview" right={<button onClick={() => switchTab("Loans")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View All</button>} />
      {db.loans.length === 0 ? (
        <EmptyHint text="No loans tracked." cta="Add Loan" onClick={() => setModal({ kind: "loan" })} />
      ) : (
        <div className="space-y-3">
          {db.loans.slice(0, 3).map((l) => {
            const meta = loanMeta(l.kind);
            const Icon = meta.icon;
            const paidPct = l.principal > 0 ? Math.round(((l.principal - l.outstanding) / l.principal) * 100) : 0;
            return (
              <div key={l.id}>
                <div className="flex items-start gap-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: `linear-gradient(135deg, ${meta.color}16, ${meta.color}05)` }}>
                    <Icon className="h-4 w-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-ink">{l.name}</p>
                    <p className="text-[14px] font-semibold text-ink">₹ {l.principal.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted">Interest Rate {l.rate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted">Remaining</p>
                    <p className="text-[12px] font-semibold text-ink">₹ {l.outstanding.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${paidPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={() => switchTab("Loans")} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View All Loans <ArrowRight className="h-3 w-3" />
      </button>
    </Card>
  );

  const investmentsCard = (
    <Card>
      <Head title="Investments Summary" right={<button onClick={() => router.push("/investments")} className="text-xs font-medium text-muted hover:text-ink transition-colors">View All</button>} />
      {db.investments.length === 0 ? (
        <EmptyHint text="No investments tracked." cta="Add Investment" onClick={() => setModal({ kind: "investment" })} />
      ) : (
        <>
          <p className="text-[11px] text-muted">Total Investments</p>
          <div className="flex items-center gap-2">
            <p className="text-[18px] font-semibold text-ink">₹ {M.investCurrent.toLocaleString("en-IN")}</p>
            <span className={cn("text-[10px] font-medium", M.investGainPct >= 0 ? "text-green-500" : "text-red-500")}>
              {M.investGainPct >= 0 ? "▲" : "▼"} {Math.abs(M.investGainPct)}% {M.vsLabel === "" ? "" : "overall"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative shrink-0">
              <ResponsiveContainer width={110} height={110} debounce={200}>
                <PieChart>
                  <Pie data={M.investByType} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
                    {M.investByType.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {M.investByType.map((t) => {
                const pctOf = M.investCurrent > 0 ? Math.round((t.value / M.investCurrent) * 100) : 0;
                return (
                  <div key={t.name} className="flex items-center gap-2 text-[11px]">
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: t.color }} />
                    <span className="flex-1 truncate text-muted">{t.name}</span>
                    <span className="text-faint">{pctOf}%</span>
                    <span className="w-[60px] text-right font-medium text-ink">₹ {t.value.toLocaleString("en-IN")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Card>
  );

  const duesCard = (
    <Card>
      <Head title="Money Due To / From" right={<button onClick={() => setModal({ kind: "due" })} className="text-xs font-medium text-muted hover:text-ink transition-colors">Add New</button>} />
      {M.pendingDues.length === 0 ? (
        <EmptyHint text="Nothing pending — all settled." cta="Add New" onClick={() => setModal({ kind: "due" })} />
      ) : (
        <div className="space-y-1">
          {M.pendingDues.slice(0, 4).map((o) => (
            <div key={o.id} className="group flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
              <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", o.direction === "from" ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50" : "bg-gradient-to-br from-amber-50 to-amber-100/50")}>
                <User className={cn("h-4 w-4", o.direction === "from" ? "text-emerald-600" : "text-amber-600")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-ink">{o.person}</p>
                <p className="text-[10px] text-muted">
                  {o.direction === "from" ? "Owes you" : "You owe"}{o.dueDate ? ` · Due ${fmtDate(o.dueDate)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-[12px] font-semibold text-ink">₹ {o.amount.toLocaleString("en-IN")}</p>
                <button
                  onClick={() => updateRow("dues", o.id, { status: "settled" }, "Marked settled")}
                  title="Mark settled"
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                >
                  Pending
                </button>
                <button onClick={() => deleteRow("dues", o.id, `Delete due for "${o.person}"?`)} className="grid h-6 w-6 place-items-center rounded-md text-faint opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddButton label="Add New" onClick={() => setModal({ kind: "due" })} />
    </Card>
  );

  const healthCard = (
    <Card>
      <Head title="Financial Health Score" />
      <div className="flex items-center gap-3">
        <HealthGauge score={M.health.score} label={M.health.label} />
        <div className="flex-1 space-y-2">
          {M.health.metrics.map((m) => (
            <div key={m.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <CheckCircle2 className={cn("h-3.5 w-3.5", m.good ? "text-green-500" : "text-amber-400")} /> {m.name}
              </span>
              <span className={cn("text-[11px] font-semibold", m.status === "Excellent" || m.status === "Good" ? "text-green-600" : "text-amber-500")}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => setModal({ kind: "healthReport" })} className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View Full Report <ArrowRight className="h-3 w-3" />
      </button>
    </Card>
  );

  /* ═════════════════════════════ Tab bodies ═════════════════════════════ */

  const overviewTab = (
    <div className="space-y-4">
      {kpiCards}
      <div className="grid items-start gap-4 xl:grid-cols-[1.25fr_1.25fr_0.95fr]">
        {netWorthCard}
        <div className="space-y-4">
          {cashFlowCard}
          {expenseBreakdownCard}
        </div>
        <div className="space-y-4">
          {accountsCard}
          {savingsGoalsCard}
        </div>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {recentTxnsCard}
        {budgetCard}
        {topSpendingCard}
        {billsCard}
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loansCard}
        {investmentsCard}
        {duesCard}
        {healthCard}
      </div>
    </div>
  );

  const expensesTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Income", value: M.sel.income, color: "#22c55e", icon: ArrowDownRight },
          { label: "Expenses", value: M.sel.expense, color: "#ef4444", icon: ArrowUpRight },
          { label: "Net Savings", value: M.selSavings, color: "#3b82f6", icon: PiggyBank },
        ].map((k) => (
          <Card key={k.label} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted">{k.label} · {monthLabel(M.selKey)}</p>
                <p className="mt-1 text-[20px] font-semibold text-ink">₹ {k.value.toLocaleString("en-IN")}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${k.color}14` }}>
                <k.icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">All Transactions <span className="text-xs font-normal text-faint">({filteredTxns.length})</span></h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input
                value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)}
                placeholder="Search…"
                className="w-40 rounded-lg border border-border bg-surface py-1.5 pl-8 pr-2 text-xs text-ink placeholder:text-faint outline-none focus:border-brand"
              />
            </div>
            <select value={txnType} onChange={(e) => setTxnType(e.target.value as typeof txnType)} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-muted outline-none">
              <option value="all">All Types</option><option value="income">Income</option><option value="expense">Expense</option>
            </select>
            <select value={txnCat} onChange={(e) => setTxnCat(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-muted outline-none">
              <option>All</option>
              {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={txnMonth} onChange={(e) => setTxnMonth(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-muted outline-none">
              <option>All</option>
              {M.monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
            <button onClick={() => setModal({ kind: "txn" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Transaction
            </button>
          </div>
        </div>
        {filteredTxns.length === 0 ? (
          <EmptyHint text="No transactions match." cta="Add Transaction" onClick={() => setModal({ kind: "txn" })} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-faint">
                  <th className="pb-2">Date</th><th className="pb-2">Description</th><th className="pb-2">Category</th>
                  <th className="pb-2">Account</th><th className="pb-2">Mode</th><th className="pb-2 text-right">Amount</th><th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(showAllTxns ? filteredTxns : filteredTxns.slice(0, 25)).map((t) => {
                  const s = iconForCat(t.category);
                  const Icon = s.icon;
                  return (
                    <tr key={t.id} className="group border-b border-border last:border-0 hover:bg-surface-2/40">
                      <td className="py-2.5 text-[12px] text-muted whitespace-nowrap">{fmtDate(t.date)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", s.bg)}><Icon className={cn("h-3.5 w-3.5", s.fg)} /></div>
                          <span className="text-[13px] font-medium text-ink">{t.description || t.category}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-[12px] text-muted">{t.category}</td>
                      <td className="py-2.5 text-[12px] text-muted">{accountName(t.accountId)}</td>
                      <td className="py-2.5 text-[12px] text-muted">{t.mode}</td>
                      <td className={cn("py-2.5 text-right text-[13px] font-semibold whitespace-nowrap", t.type === "income" ? "text-green-600" : "text-red-500")}>
                        {t.type === "income" ? "+" : "-"} ₹ {t.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end">
                          <RowActions
                            onEdit={() => setModal({ kind: "txn", editing: t as unknown as Record<string, unknown> })}
                            onDelete={() => deleteRow("transactions", t.id, "Delete this transaction?")}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTxns.length > 25 && (
              <button onClick={() => setShowAllTxns((v) => !v)} className="mt-3 w-full rounded-xl bg-surface-2 py-2 text-xs font-medium text-muted hover:text-ink transition-colors">
                {showAllTxns ? "Show Less" : `Show All (${filteredTxns.length})`}
              </button>
            )}
          </div>
        )}
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <Card>
          <Head title="Monthly Budgets" right={
            <button onClick={() => setModal({ kind: "budget" })} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
              <Plus className="h-3 w-3" /> Add Budget
            </button>
          } />
          {M.budgetRows.length === 0 ? (
            <EmptyHint text="Set monthly budgets per category to track discipline." cta="Set a Budget" onClick={() => setModal({ kind: "budget" })} />
          ) : (
            <div className="space-y-3">
              {M.budgetRows.map((b) => (
                <div key={b.id} className="group">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink">{b.category}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-muted">₹ {b.actual.toLocaleString("en-IN")} / ₹ {b.amount.toLocaleString("en-IN")}</span>
                      <span className={cn("font-semibold", b.pctUsed > 100 ? "text-red-500" : "text-green-600")}>{b.pctUsed}%</span>
                      <RowActions
                        onEdit={() => setModal({ kind: "budget", editing: b as unknown as Record<string, unknown> })}
                        onDelete={() => deleteRow("budgets", b.id, `Remove budget for "${b.category}"?`)}
                      />
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                    <div className={cn("h-full rounded-full", b.pctUsed > 100 ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-green-500 to-emerald-400")} style={{ width: `${Math.min(100, b.pctUsed)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <Head title="Bills & Subscriptions" right={
            <button onClick={() => setModal({ kind: "bill" })} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
              <Plus className="h-3 w-3" /> Add Bill
            </button>
          } />
          {M.upcomingBills.length === 0 ? (
            <EmptyHint text="Track recurring bills — Netflix, rent, mobile…" cta="Add Bill" onClick={() => setModal({ kind: "bill" })} />
          ) : (
            <div className="space-y-1.5">
              {M.upcomingBills.map((b) => {
                const s = billIconFor(b.name);
                const Icon = s.icon;
                return (
                  <div key={b.id} className="group flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ background: `linear-gradient(135deg, ${s.color}16, ${s.color}05)` }}>
                      <Icon className="h-4 w-4" style={{ color: s.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-ink">{b.name}</p>
                      <p className="text-[10px] text-muted">Every month on day {b.dueDay}</p>
                    </div>
                    <p className="text-[12px] font-semibold text-ink">₹ {b.amount.toLocaleString("en-IN")}</p>
                    <RowActions
                      onEdit={() => setModal({ kind: "bill", editing: b as unknown as Record<string, unknown> })}
                      onDelete={() => deleteRow("bills", b.id, `Delete bill "${b.name}"?`)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  const loansTab = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Outstanding", value: M.loansOutstanding, color: "#ef4444" },
          { label: "Total Principal", value: M.loansPrincipal, color: "#6366f1" },
          { label: "Repaid So Far", value: M.loansPrincipal - M.loansOutstanding, color: "#22c55e" },
          { label: "Monthly EMI", value: db.loans.reduce((s, l) => s + l.emi, 0), color: "#f59e0b" },
        ].map((k) => (
          <Card key={k.label} className="!p-4">
            <p className="text-[11px] font-medium text-muted">{k.label}</p>
            <p className="mt-1 text-[20px] font-semibold" style={{ color: k.color }}>₹ {k.value.toLocaleString("en-IN")}</p>
          </Card>
        ))}
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {db.loans.map((l) => {
          const meta = loanMeta(l.kind);
          const Icon = meta.icon;
          const paidPct = l.principal > 0 ? Math.round(((l.principal - l.outstanding) / l.principal) * 100) : 0;
          return (
            <Card key={l.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${meta.color}20, ${meta.color}08)` }}>
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{l.name}</p>
                    <p className="text-[11px] text-muted">{meta.label}{l.lender && ` · ${l.lender}`}</p>
                  </div>
                </div>
                <RowActions
                  onEdit={() => setModal({ kind: "loan", editing: l as unknown as Record<string, unknown> })}
                  onDelete={() => deleteRow("loans", l.id, `Delete loan "${l.name}"?`)}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-surface-2/60 p-2.5">
                  <p className="text-[10px] text-muted">Principal</p>
                  <p className="text-[14px] font-semibold text-ink">₹ {l.principal.toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl bg-surface-2/60 p-2.5">
                  <p className="text-[10px] text-muted">Outstanding</p>
                  <p className="text-[14px] font-semibold text-red-500">₹ {l.outstanding.toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl bg-surface-2/60 p-2.5">
                  <p className="text-[10px] text-muted">Interest Rate</p>
                  <p className="text-[14px] font-semibold text-ink">{l.rate}%</p>
                </div>
                <div className="rounded-xl bg-surface-2/60 p-2.5">
                  <p className="text-[10px] text-muted">EMI</p>
                  <p className="text-[14px] font-semibold text-ink">₹ {l.emi.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-muted"><span>{paidPct}% repaid</span><span>{100 - paidPct}% remaining</span></div>
                <div className="mt-1 h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${paidPct}%` }} />
                </div>
              </div>
              <button
                onClick={() => setModal({ kind: "loanPayment", loan: l })}
                className="mt-3 w-full rounded-xl bg-ink py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Record Payment
              </button>
            </Card>
          );
        })}
        <button
          onClick={() => setModal({ kind: "loan" })}
          className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-2/30 text-muted hover:border-brand/40 hover:bg-brand-soft/20 hover:text-brand-ink transition-all"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Add Loan</span>
        </button>
      </div>
    </div>
  );

  const goalsTab = (
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
      {db.goals.map((g) => {
        const meta = goalMeta(g.icon);
        const GI = meta.icon;
        const pctDone = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
        return (
          <Card key={g.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${g.color}20, ${g.color}08)` }}>
                  <GI className="h-5 w-5" style={{ color: g.color }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{g.name}</p>
                  <p className="text-[11px] text-muted">{meta.label}</p>
                </div>
              </div>
              <RowActions
                onEdit={() => setModal({ kind: "goal", editing: g as unknown as Record<string, unknown> })}
                onDelete={() => deleteRow("goals", g.id, `Delete goal "${g.name}"?`)}
              />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-muted">Saved</p>
                <p className="text-[20px] font-semibold text-ink">₹ {g.saved.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted">Target</p>
                <p className="text-[14px] font-semibold text-muted">₹ {g.target.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted"><span>{pctDone}% there</span><span>₹ {Math.max(0, g.target - g.saved).toLocaleString("en-IN")} to go</span></div>
              <div className="mt-1 h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pctDone}%`, background: `linear-gradient(90deg, ${g.color}, ${g.color}cc)` }} />
              </div>
            </div>
            <button
              onClick={() => setModal({ kind: "goalMoney", goal: g })}
              className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: g.color }}
            >
              Add Money
            </button>
          </Card>
        );
      })}
      <button
        onClick={() => setModal({ kind: "goal" })}
        className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-2/30 text-muted hover:border-brand/40 hover:bg-brand-soft/20 hover:text-brand-ink transition-all"
      >
        <Plus className="h-6 w-6" />
        <span className="text-sm font-medium">Add New Goal</span>
      </button>
    </div>
  );

  /* ═════════════════════════════ Modals ═════════════════════════════ */

  const editing = modal && "editing" in modal ? modal.editing : undefined;

  const modals = (
    <>
      <Modal open={modal?.kind === "txn"} onClose={() => setModal(null)} title={editing ? "Edit Transaction" : "Add Transaction"}>
        <TxnForm
          key={String((editing as { id?: string })?.id ?? "new")}
          initial={editing as Partial<FinTransaction> | undefined}
          accounts={db.accounts}
          submitLabel={editing ? "Save Changes" : "Add Transaction"}
          busy={busy}
          onSubmit={(data) => {
            if (editing) updateRow("transactions", String((editing as { id: string }).id), data, "Transaction updated");
            else createRow("transactions", data, "Transaction added");
          }}
        />
      </Modal>

      <Modal open={modal?.kind === "account"} onClose={() => setModal(null)} title={editing ? "Edit Account" : "Add Account"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "name", label: "Account Name", placeholder: "e.g. HDFC Bank" },
            { name: "institution", label: "Institution", type: "select", options: INSTITUTIONS },
            { name: "type", label: "Account Type", type: "select", options: ["Savings", "Salary", "Current", "FD", "Cash"].map((v) => ({ value: v, label: v })), half: true },
            { name: "last4", label: "Last 4 Digits", placeholder: "5678", required: false, half: true },
            { name: "balance", label: "Current Balance (₹)", type: "number", placeholder: "0" },
          ]}
          initial={editing ? { name: String(editing.name), institution: String(editing.institution), type: String(editing.type), last4: String(editing.last4 ?? ""), balance: String(editing.balance) } : undefined}
          submitLabel={editing ? "Save Changes" : "Add Account"}
          busy={busy}
          onSubmit={(d) => {
            const data = { name: d.name, institution: d.institution, type: d.type, last4: d.last4, balance: Number(d.balance) || 0 };
            if (editing) updateRow("accounts", String((editing as { id: string }).id), data, "Account updated");
            else createRow("accounts", data, "Account added");
          }}
        />
      </Modal>

      <Modal open={modal?.kind === "goal"} onClose={() => setModal(null)} title={editing ? "Edit Goal" : "Add New Goal"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "name", label: "Goal Name", placeholder: "e.g. Europe Trip" },
            { name: "icon", label: "Type", type: "select", options: GOAL_ICONS.map((g) => ({ value: g.value, label: g.label })) },
            { name: "target", label: "Target Amount (₹)", type: "number", placeholder: "0", half: true },
            { name: "saved", label: "Saved So Far (₹)", type: "number", placeholder: "0", required: false, half: true },
          ]}
          initial={editing ? { name: String(editing.name), icon: String(editing.icon), target: String(editing.target), saved: String(editing.saved) } : undefined}
          submitLabel={editing ? "Save Changes" : "Save Goal"}
          busy={busy}
          onSubmit={(d) => {
            const meta = goalMeta(d.icon);
            const data = { name: d.name, icon: d.icon, color: meta.color, target: Number(d.target) || 0, saved: Number(d.saved) || 0 };
            if (editing) updateRow("goals", String((editing as { id: string }).id), data, "Goal updated");
            else createRow("goals", data, "Goal added");
          }}
        />
      </Modal>

      {modal?.kind === "goalMoney" && (
        <Modal open onClose={() => setModal(null)} title={`Add Money — ${modal.goal.name}`}>
          <EntityForm
            fields={[{ name: "amount", label: "Amount to Add (₹)", type: "number", placeholder: "0" }]}
            submitLabel="Add to Goal"
            busy={busy}
            onSubmit={(d) => {
              const amt = Number(d.amount) || 0;
              if (amt <= 0) return;
              updateRow("goals", modal.goal.id, { saved: modal.goal.saved + amt }, `Added ${inr(amt)} to ${modal.goal.name}`);
            }}
          />
        </Modal>
      )}

      <Modal open={modal?.kind === "loan"} onClose={() => setModal(null)} title={editing ? "Edit Loan" : "Add Loan"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "name", label: "Loan Name", placeholder: "e.g. Home Loan" },
            { name: "kind", label: "Loan Type", type: "select", options: LOAN_KINDS.map((k) => ({ value: k.value, label: k.label })), half: true },
            { name: "lender", label: "Lender", placeholder: "e.g. HDFC", required: false, half: true },
            { name: "principal", label: "Principal (₹)", type: "number", placeholder: "0", half: true },
            { name: "outstanding", label: "Outstanding (₹)", type: "number", placeholder: "0", half: true },
            { name: "rate", label: "Interest Rate (%)", type: "number", placeholder: "8.5", required: false, half: true },
            { name: "emi", label: "Monthly EMI (₹)", type: "number", placeholder: "0", required: false, half: true },
          ]}
          initial={editing ? { name: String(editing.name), kind: String(editing.kind), lender: String(editing.lender ?? ""), principal: String(editing.principal), outstanding: String(editing.outstanding), rate: String(editing.rate), emi: String(editing.emi) } : undefined}
          submitLabel={editing ? "Save Changes" : "Add Loan"}
          busy={busy}
          onSubmit={(d) => {
            const data = { name: d.name, kind: d.kind, lender: d.lender, principal: Number(d.principal) || 0, outstanding: Number(d.outstanding) || 0, rate: Number(d.rate) || 0, emi: Number(d.emi) || 0 };
            if (editing) updateRow("loans", String((editing as { id: string }).id), data, "Loan updated");
            else createRow("loans", data, "Loan added");
          }}
        />
      </Modal>

      {modal?.kind === "loanPayment" && (
        <Modal open onClose={() => setModal(null)} title={`Record Payment — ${modal.loan.name}`}>
          <EntityForm
            fields={[
              { name: "amount", label: "Payment Amount (₹)", type: "number", placeholder: String(modal.loan.emi || "") },
              { name: "date", label: "Date", type: "date" },
            ]}
            initial={{ date: todayISO() }}
            submitLabel="Record Payment"
            busy={busy}
            onSubmit={async (d) => {
              const amt = Number(d.amount) || 0;
              if (amt <= 0) return;
              setBusy(true);
              try {
                const { row } = await apiMutate("loans", "update", { id: modal.loan.id, data: { outstanding: Math.max(0, modal.loan.outstanding - amt) } });
                const { row: txn } = await apiMutate("transactions", "create", {
                  data: { type: "expense", category: "Loan EMI", description: `Payment — ${modal.loan.name}`, amount: amt, date: d.date || todayISO(), mode: "Bank Transfer", accountId: null },
                });
                setDb((p) => ({
                  ...p,
                  loans: p.loans.map((l) => (l.id === modal.loan.id ? row : l)),
                  transactions: [...p.transactions, txn],
                }));
                setModal(null);
                flash("Payment recorded (loan reduced + expense logged)");
              } catch (err) {
                flash(err instanceof Error ? err.message : "Failed to record payment");
              } finally {
                setBusy(false);
              }
            }}
          />
        </Modal>
      )}

      <Modal open={modal?.kind === "investment"} onClose={() => setModal(null)} title={editing ? "Edit Investment" : "Add Investment"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "name", label: "Name", placeholder: "e.g. Nifty 50 Index Fund" },
            { name: "type", label: "Type", type: "select", options: INVESTMENT_TYPES.map((t) => ({ value: t.value, label: t.value })) },
            { name: "invested", label: "Amount Invested (₹)", type: "number", placeholder: "0", half: true },
            { name: "currentValue", label: "Current Value (₹)", type: "number", placeholder: "0", half: true },
          ]}
          initial={editing ? { name: String(editing.name), type: String(editing.type), invested: String(editing.invested), currentValue: String(editing.currentValue) } : undefined}
          submitLabel={editing ? "Save Changes" : "Add Investment"}
          busy={busy}
          onSubmit={(d) => {
            const data = { name: d.name, type: d.type, invested: Number(d.invested) || 0, currentValue: Number(d.currentValue) || 0 };
            if (editing) updateRow("investments", String((editing as { id: string }).id), data, "Investment updated");
            else createRow("investments", data, "Investment added");
          }}
        />
      </Modal>

      <Modal open={modal?.kind === "bill"} onClose={() => setModal(null)} title={editing ? "Edit Bill" : "Add Bill / Subscription"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "name", label: "Name", placeholder: "e.g. Netflix Subscription" },
            { name: "amount", label: "Amount (₹)", type: "number", placeholder: "0", half: true },
            { name: "dueDay", label: "Due Day of Month (1-31)", type: "number", placeholder: "5", half: true },
          ]}
          initial={editing ? { name: String(editing.name), amount: String(editing.amount), dueDay: String(editing.dueDay) } : undefined}
          submitLabel={editing ? "Save Changes" : "Add Bill"}
          busy={busy}
          onSubmit={(d) => {
            const data = { name: d.name, amount: Number(d.amount) || 0, dueDay: Math.min(31, Math.max(1, Number(d.dueDay) || 1)) };
            if (editing) updateRow("bills", String((editing as { id: string }).id), data, "Bill updated");
            else createRow("bills", data, "Bill added");
          }}
        />
      </Modal>

      <Modal open={modal?.kind === "due"} onClose={() => setModal(null)} title={editing ? "Edit Due" : "Add Money Due"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "person", label: "Person", placeholder: "e.g. Rohan Sharma" },
            { name: "direction", label: "Direction", type: "select", options: [{ value: "from", label: "They owe me" }, { value: "to", label: "I owe them" }], half: true },
            { name: "amount", label: "Amount (₹)", type: "number", placeholder: "0", half: true },
            { name: "dueDate", label: "Due Date", type: "date", required: false },
          ]}
          initial={editing ? { person: String(editing.person), direction: String(editing.direction), amount: String(editing.amount), dueDate: String(editing.dueDate ?? "") } : undefined}
          submitLabel={editing ? "Save Changes" : "Save"}
          busy={busy}
          onSubmit={(d) => {
            const data = { person: d.person, direction: d.direction, amount: Number(d.amount) || 0, dueDate: d.dueDate || null, status: "pending" };
            if (editing) updateRow("dues", String((editing as { id: string }).id), data, "Due updated");
            else createRow("dues", data, "Due added");
          }}
        />
      </Modal>

      <Modal open={modal?.kind === "budget"} onClose={() => setModal(null)} title={editing ? "Edit Budget" : "Set Monthly Budget"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "category", label: "Category", type: "select", options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })) },
            { name: "amount", label: "Monthly Budget (₹)", type: "number", placeholder: "0" },
          ]}
          initial={editing ? { category: String(editing.category), amount: String(editing.amount) } : undefined}
          submitLabel={editing ? "Save Changes" : "Set Budget"}
          busy={busy}
          onSubmit={(d) => {
            const data = { category: d.category, amount: Number(d.amount) || 0 };
            if (editing) updateRow("budgets", String((editing as { id: string }).id), data, "Budget updated");
            else createRow("budgets", data, "Budget set");
          }}
        />
      </Modal>

      {modal?.kind === "healthReport" && (
        <Modal open onClose={() => setModal(null)} title="Financial Health Report">
          <div className="mb-4 flex justify-center"><HealthGauge score={M.health.score} label={M.health.label} /></div>
          <div className="space-y-3">
            {M.health.metrics.map((m) => (
              <div key={m.name} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{m.name}</span>
                  <span className={cn("text-xs font-semibold", m.good ? "text-green-600" : "text-amber-500")}>{m.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{m.detail}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );

  /* ═════════════════════════════ Render ═════════════════════════════ */

  const QUICK_ADDS: { label: string; kind: Extract<ModalState, { kind: string }>["kind"] }[] = [
    { label: "Transaction", kind: "txn" },
    { label: "Account", kind: "account" },
    { label: "Savings Goal", kind: "goal" },
    { label: "Loan", kind: "loan" },
    { label: "Investment", kind: "investment" },
    { label: "Bill / Subscription", kind: "bill" },
    { label: "Money Due", kind: "due" },
    { label: "Budget", kind: "budget" },
  ];

  return (
    <div className="animate-fade-up space-y-4">
      {toast && (
        <div className="fixed right-6 top-6 z-[110] rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-card-lg animate-fade-up">
          {toast}
        </div>
      )}

      {/* Tab bar + Quick Add */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map((item) => {
            if ("href" in item) {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-muted transition-all hover:bg-surface-2 hover:text-ink"
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            }
            const t = item.tab;
            const Icon = TAB_ICONS[t];
            return (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all",
                  tab === t ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm" : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" /> {t}
              </button>
            );
          })}
        </div>
        <div className="relative" ref={quickRef}>
          <button
            onClick={() => setQuickOpen(!quickOpen)}
            className="mr-1 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            <Plus className="h-4 w-4" /> Quick Add <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", quickOpen && "rotate-180")} />
          </button>
          {quickOpen && (
            <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-border bg-card p-1 shadow-card-lg">
              {QUICK_ADDS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => { setQuickOpen(false); setModal({ kind: q.kind } as ModalState); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-ink"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {tab === "Overview" && overviewTab}
      {tab === "Expenses" && expensesTab}
      {tab === "Loans" && loansTab}
      {tab === "Savings Goals" && goalsTab}

      {modals}
    </div>
  );
}
