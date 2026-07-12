"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet, PiggyBank, BarChart3, Users, Home, CalendarDays, CheckSquare, Car, Plane, Shield,
  ShoppingBag, UtensilsCrossed, Lightbulb, LayoutGrid, Zap, CreditCard, ArrowRight, ArrowUpRight,
  ArrowDownRight, ChevronDown, Plus, Landmark, Receipt, User, Check, CheckCircle2,
  Pencil, Trash2, Search, TrendingUp, Target, GraduationCap, Gift, Clapperboard, HeartPulse,
  BookOpen, IndianRupee, X, Upload, Loader2, FileText, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { cn, inr } from "@/lib/utils";
import { INVESTMENT_TYPES } from "@/lib/investment-types";
import { Logo } from "@/components/logo";
import type {
  FinanceData, FinanceEntity, FinAccount, FinTransaction, FinGoal, FinLoan, FinInvestment,
  FinBill, FinDue, FinBudget,
} from "@/lib/finance-store";

/* ═══════════════════════════════════════════════════════════════════════════
   Bank logo domain guessing — real company favicons via the shared Logo
   component (Clearbit → Google favicon → monogram), same pattern as bills.
   Guessed from the account NAME first (users often rename "Kotak Bank" while
   leaving institution set to something else), falling back to institution.
   ═══════════════════════════════════════════════════════════════════════════ */
const BANK_DOMAIN_HINTS: { pattern: RegExp; domain: string }[] = [
  { pattern: /hdfc/i, domain: "hdfcbank.com" },
  { pattern: /\bsbi\b|state bank/i, domain: "sbi.co.in" },
  { pattern: /icici/i, domain: "icicibank.com" },
  { pattern: /kotak/i, domain: "kotak.com" },
  { pattern: /axis/i, domain: "axisbank.com" },
  { pattern: /\bpnb\b|punjab national/i, domain: "pnbindia.in" },
  { pattern: /yes bank/i, domain: "yesbank.in" },
  { pattern: /idfc/i, domain: "idfcfirstbank.com" },
  { pattern: /indusind/i, domain: "indusind.com" },
  { pattern: /\bbob\b|bank of baroda/i, domain: "bankofbaroda.in" },
  { pattern: /canara/i, domain: "canarabank.com" },
  { pattern: /union bank/i, domain: "unionbankofindia.co.in" },
  { pattern: /paytm/i, domain: "paytmbank.com" },
  { pattern: /idbi/i, domain: "idbibank.in" },
  { pattern: /federal bank/i, domain: "federalbank.co.in" },
  { pattern: /rbl/i, domain: "rblbank.com" },
];
const INSTITUTION_DOMAIN: Record<string, string> = { hdfc: "hdfcbank.com", sbi: "sbi.co.in", icici: "icicibank.com" };

function guessBankDomain(name: string, institution: string): string | undefined {
  return BANK_DOMAIN_HINTS.find((h) => h.pattern.test(name))?.domain ?? INSTITUTION_DOMAIN[institution];
}

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

// Auto-guessed domain for common bills/subscriptions, so most entries get a
// real company favicon (via the shared Logo component — Clearbit → Google
// favicon → monogram) with zero setup. The bill form's "Logo Website" field
// overrides this for anything not covered here.
const BILL_DOMAIN_HINTS: { pattern: RegExp; domain: string }[] = [
  { pattern: /netflix/i, domain: "netflix.com" },
  { pattern: /amazon|prime ?video/i, domain: "amazon.in" },
  { pattern: /spotify/i, domain: "spotify.com" },
  { pattern: /hotstar|disney/i, domain: "hotstar.com" },
  { pattern: /youtube/i, domain: "youtube.com" },
  { pattern: /jio\b/i, domain: "jio.com" },
  { pattern: /airtel/i, domain: "airtel.in" },
  { pattern: /vodafone|\bvi\b/i, domain: "myvi.in" },
  { pattern: /bsnl/i, domain: "bsnl.co.in" },
  { pattern: /act fibernet/i, domain: "actcorp.in" },
  { pattern: /google/i, domain: "google.com" },
  { pattern: /apple|icloud/i, domain: "apple.com" },
  { pattern: /gym|fitness|cult\.?fit/i, domain: "cult.fit" },
  { pattern: /electric|power ?bill|bses|mahavitaran/i, domain: "bijlibachao.com" },
];

function guessBillDomain(name: string): string | undefined {
  return BILL_DOMAIN_HINTS.find((h) => h.pattern.test(name))?.domain;
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

const fmtMoney2 = (v: number) => v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  datalist?: string[]; // free-text input with autocomplete suggestions (e.g. known account/SIP names)
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
            <>
              <input
                type={f.type || "text"}
                step={f.type === "number" ? "0.01" : undefined}
                placeholder={f.placeholder}
                required={f.required !== false}
                value={data[f.name]}
                onChange={(e) => setData((p) => ({ ...p, [f.name]: e.target.value }))}
                className={inputCls}
                list={f.datalist ? `${f.name}-datalist` : undefined}
              />
              {f.datalist && (
                <datalist id={`${f.name}-datalist`}>
                  {f.datalist.map((opt) => <option key={opt} value={opt} />)}
                </datalist>
              )}
            </>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={busy}
        className="col-span-2 mt-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

type ImportedTxn = {
  date: string; description: string; amount: number;
  direction: "debit" | "credit"; category: string; likelyTransfer: boolean; selected: boolean;
};

function ImportStatementModal({ open, onClose, onImport, busy }: {
  open: boolean; onClose: () => void;
  onImport: (items: Record<string, unknown>[]) => Promise<unknown>;
  busy: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportedTxn[] | null>(null);

  function reset() {
    setFile(null); setParsing(false); setError(null); setRows(null);
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/finance/import-statement", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to parse statement");
      if (json.error) { setError(json.error); setRows([]); return; }
      const parsed: ImportedTxn[] = (json.transactions ?? []).map((t: Omit<ImportedTxn, "selected">) => ({ ...t, selected: !t.likelyTransfer }));
      setRows(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse statement");
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!rows) return;
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) return;
    const items = selected.map((r) => ({
      type: r.direction === "credit" ? "income" : "expense",
      category: r.category,
      description: r.description,
      amount: r.amount,
      date: r.date,
      mode: "UPI",
      accountId: null,
    }));
    await onImport(items);
    reset();
    onClose();
  }

  const selectedCount = rows?.filter((r) => r.selected).length ?? 0;
  const selectedExpenseTotal = rows?.filter((r) => r.selected && r.direction === "debit").reduce((s, r) => s + r.amount, 0) ?? 0;

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Import from Statement">
      {!rows ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Upload a PhonePe or bank PDF statement. Transactions get pulled out with a guessed category —
            you pick which ones to actually add before anything is saved. Payments to personal names/accounts
            start unchecked since those are usually transfers, not expenses.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-2/30 py-10 text-center hover:border-brand/40 hover:bg-brand-soft/10 transition-colors">
            <Upload className="h-6 w-6 text-faint" />
            <span className="text-sm font-medium text-ink">{file ? file.name : "Click to choose a PDF"}</span>
            <span className="text-xs text-faint">PhonePe statement or bank statement (PDF)</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={handleParse}
            disabled={!file || parsing}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {parsing ? <span className="inline-flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Reading statement…</span> : "Parse Statement"}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="space-y-3 py-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-faint" />
          <p className="text-sm text-muted">No transactions were found in this file.</p>
          <button onClick={reset} className="text-xs font-medium text-brand hover:underline">Try another file</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{rows.length} transactions found</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setRows((r) => r!.map((x) => ({ ...x, selected: true })))} className="font-medium text-brand hover:underline">Select all</button>
              <button onClick={() => setRows((r) => r!.map((x) => ({ ...x, selected: false })))} className="font-medium text-muted hover:underline">Deselect all</button>
            </div>
          </div>
          <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
            {rows.map((r, i) => (
              <div key={i} className={cn("flex items-start gap-2.5 rounded-lg border p-2.5 transition-opacity", r.selected ? "border-border bg-surface" : "border-border/50 bg-surface-2/30 opacity-60")}>
                <input
                  type="checkbox"
                  checked={r.selected}
                  onChange={(e) => setRows((rs) => rs!.map((x, xi) => (xi === i ? { ...x, selected: e.target.checked } : x)))}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-blue-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-ink">{r.description}</p>
                    <span className={cn("shrink-0 text-[13px] font-semibold", r.direction === "credit" ? "text-green-600" : "text-red-500")}>
                      {r.direction === "credit" ? "+" : "-"}₹{r.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                    <span>{new Date(r.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    {r.direction === "debit" && (
                      <select
                        value={r.category}
                        onChange={(e) => setRows((rs) => rs!.map((x, xi) => (xi === i ? { ...x, category: e.target.value } : x)))}
                        className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink"
                      >
                        {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    )}
                    {r.likelyTransfer && (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-600">Looks like a personal transfer</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="text-xs text-muted">
              <span className="font-semibold text-ink">{selectedCount}</span> selected · <span className="font-semibold text-ink">₹{selectedExpenseTotal.toLocaleString("en-IN")}</span> in expenses
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-2">Start Over</button>
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Add {selectedCount} Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
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
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60">
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Loan form — EMI auto-calculates from principal + rate + tenure (standard
   amortization formula) but stays a normal editable field, so a bank-quoted
   EMI that doesn't match the formula exactly can just be typed over it.
   ═══════════════════════════════════════════════════════════════════════════ */
function calcEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (!principal || !tenureMonths) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return Math.round(principal / tenureMonths);
  const factor = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * factor) / (factor - 1));
}

function LoanForm({
  initial, submitLabel, onSubmit, busy,
}: {
  initial?: Partial<FinLoan>;
  submitLabel: string;
  onSubmit: (data: Record<string, unknown>) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "personal");
  const [lender, setLender] = useState(initial?.lender ?? "");
  const [principal, setPrincipal] = useState(initial?.principal != null ? String(initial.principal) : "");
  const [outstanding, setOutstanding] = useState(initial?.outstanding != null ? String(initial.outstanding) : "");
  const [rate, setRate] = useState(initial?.rate != null ? String(initial.rate) : "");
  const [tenureMonths, setTenureMonths] = useState(initial?.tenureMonths != null ? String(initial.tenureMonths) : "");
  const [emi, setEmi] = useState(initial?.emi != null ? String(initial.emi) : "");
  // Editing an existing loan keeps its saved EMI untouched by default — only
  // a brand-new loan (or an explicit "Auto-calculate" click) live-follows
  // principal/rate/tenure changes.
  const [emiAuto, setEmiAuto] = useState(!initial);

  useEffect(() => {
    if (!emiAuto) return;
    const p = Number(principal) || 0;
    const r = Number(rate) || 0;
    const n = Number(tenureMonths) || 0;
    if (p > 0 && n > 0) setEmi(String(calcEmi(p, r, n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principal, rate, tenureMonths, emiAuto]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name, kind, lender,
          principal: Number(principal) || 0,
          outstanding: Number(outstanding) || 0,
          rate: Number(rate) || 0,
          tenureMonths: tenureMonths.trim() ? Number(tenureMonths) : null,
          emi: Number(emi) || 0,
        });
      }}
      className="grid grid-cols-2 gap-3"
    >
      <div className="col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted">Loan Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home Loan" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Loan Type</label>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
          {LOAN_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Lender</label>
        <input value={lender} onChange={(e) => setLender(e.target.value)} placeholder="e.g. HDFC" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Principal (₹)</label>
        <input required type="number" step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="0" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Outstanding (₹)</label>
        <input required type="number" step="0.01" value={outstanding} onChange={(e) => setOutstanding(e.target.value)} placeholder="0" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Interest Rate (% p.a.)</label>
        <input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="8.5" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Tenure (months)</label>
        <input type="number" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} placeholder="e.g. 240" className={inputCls} />
      </div>
      <div className="col-span-2">
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-medium text-muted">Monthly EMI (₹)</label>
          {!emiAuto && Number(principal) > 0 && Number(tenureMonths) > 0 && (
            <button type="button" onClick={() => setEmiAuto(true)} className="text-[10px] font-medium text-brand hover:underline">
              Auto-calculate
            </button>
          )}
        </div>
        <input
          type="number" step="0.01" value={emi}
          onChange={(e) => { setEmiAuto(false); setEmi(e.target.value); }}
          placeholder="0" className={inputCls}
        />
        <p className="mt-1 text-[10px] text-faint">
          {emiAuto ? "Auto-calculated from principal, rate & tenure." : "Edited manually — click \"Auto-calculate\" to recompute from the formula."}
        </p>
      </div>
      <button type="submit" disabled={busy} className="col-span-2 mt-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60">
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
    { name: "Financial Discipline", status: grade(discScore, 15), good: discScore >= 10, detail: budgetRows.length ? (withinBudget > 0 ? "Within monthly budget" : "Over monthly budget") : "No budget set yet" },
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
  | { kind: "txn" | "account" | "goal" | "loan" | "bill" | "due" | "budget"; editing?: Record<string, unknown> }
  | { kind: "goalMoney"; goal: FinGoal }
  | { kind: "loanPayment"; loan: FinLoan }
  | { kind: "healthReport" }
  | { kind: "import" }
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
    const qa = searchParams.get("quickAdd");
    if (qa === "budget") openBudgetModal();
    else if (qa === "txn" || qa === "account" || qa === "goal" || qa === "loan" || qa === "bill" || qa === "due") {
      setModal({ kind: qa });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Topbar global search lands here with ?q= — applied whenever the URL
  // changes (not just on mount) so searching while already on this page works.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setTab("Expenses");
      setTxnSearch(q);
    }
  }, [searchParams]);

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
  async function apiMutate(entity: FinanceEntity, action: "create" | "bulkCreate" | "update" | "delete", payload: { id?: string; data?: Record<string, unknown>; items?: Record<string, unknown>[] }) {
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

  async function bulkCreateRows(entity: FinanceEntity, items: Record<string, unknown>[], msg = "Imported") {
    setBusy(true);
    try {
      const { rows } = await apiMutate(entity, "bulkCreate", { items });
      setDb((p) => ({ ...p, [entity]: [...(p[entity] as unknown[]), ...rows] } as FinanceData));
      flash(msg);
      return rows;
    } catch (err) {
      flash(err instanceof Error ? err.message : "Import failed");
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

  // There's only ever one overall monthly budget (not per-category) — this
  // opens the modal pre-filled with it if it already exists, so the same
  // button always behaves like an upsert instead of creating duplicates.
  function openBudgetModal() {
    const existing = db.budgets[0];
    setModal({ kind: "budget", editing: existing as unknown as Record<string, unknown> | undefined });
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

    // Single overall monthly budget (not per-category) — at most one row exists.
    const budgetRow = budgets[0];
    const overallBudget = budgetRow
      ? { ...budgetRow, actual: Math.round(expenseTotal), pctUsed: budgetRow.amount > 0 ? Math.round((expenseTotal / budgetRow.amount) * 100) : 0 }
      : null;

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
    const health = computeHealth(sel.income, sel.expense, assets, liabilities, investCurrent, netWorth, overallBudget ? [{ budget: overallBudget.amount, actual: overallBudget.actual }] : []);

    const investByType = INVESTMENT_TYPES.map((t) => ({
      name: t.value,
      color: t.color,
      value: investments.filter((i) => i.type === t.value).reduce((s, i) => s + i.currentValue, 0),
    })).filter((t) => t.value > 0);

    const monthOptions = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort().reverse();

    return {
      selKey, sel, selSavings, kpis, cashFlowWeekly, expenseBreakdown, expenseTotal, overallBudget,
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
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-semibold tracking-tight text-ink">Net Worth Overview</span>
        <MonthSel value={overviewMonth} onChange={setOverviewMonth} />
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight text-ink">₹ {fmtMoney2(M.netWorth)}</p>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {M.nwDelta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5 text-green-500" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
        <span className={cn("font-semibold", M.nwDelta >= 0 ? "text-green-600" : "text-red-500")}>{Math.abs(M.nwDelta)}%</span>
        <span className="text-muted">{M.vsLabel}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted"><Wallet className="h-3.5 w-3.5 text-emerald-500" /> Total Assets</p>
          <p className="mt-1 text-base font-semibold text-ink">₹ {fmtMoney2(M.assets)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted"><Landmark className="h-3.5 w-3.5 text-red-400" /> Total Liabilities</p>
          <p className="mt-1 text-base font-semibold text-ink">₹ {fmtMoney2(M.liabilities)}</p>
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
          return (
            <div key={a.id} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2/60">
              <Logo domain={a.logoDomain || guessBankDomain(a.name, a.institution)} label={a.name} size={40} rounded="rounded-xl" />
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
            <div key={g.id} className="group flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ background: `linear-gradient(135deg, ${g.color}20, ${g.color}08)` }}>
                <GI className="h-3.5 w-3.5" style={{ color: g.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-ink">{g.name}</p>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ink">{pct}%</span>
                    <RowActions
                      onEdit={() => setModal({ kind: "goal", editing: g as unknown as Record<string, unknown> })}
                      onDelete={() => deleteRow("goals", g.id, `Delete goal "${g.name}"?`)}
                    />
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted">₹ {g.saved.toLocaleString("en-IN")} of ₹ {g.target.toLocaleString("en-IN")}{g.savedAt ? ` · saved in ${g.savedAt}` : ""}</p>
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
      <Head title="Monthly Budget" right={<MonthSel value={overviewMonth} onChange={setOverviewMonth} />} />
      {!M.overallBudget ? (
        <EmptyHint text="No monthly budget set yet." cta="Set a Budget" onClick={openBudgetModal} />
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[20px] font-semibold text-ink">₹ {M.overallBudget.actual.toLocaleString("en-IN")}</span>
            <span className="text-[12px] text-muted">of ₹ {M.overallBudget.amount.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div className={cn("h-full rounded-full", M.overallBudget.pctUsed > 100 ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-green-500 to-emerald-400")} style={{ width: `${Math.min(100, M.overallBudget.pctUsed)}%` }} />
          </div>
          <p className={cn("mt-1.5 text-[11px] font-medium", M.overallBudget.pctUsed > 100 ? "text-red-500" : "text-green-600")}>
            {M.overallBudget.pctUsed}% used{M.overallBudget.pctUsed > 100 ? " — over budget" : ""}
          </p>
        </div>
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
            return (
              <div key={b.id} className="group flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
                <Logo domain={b.logoDomain || guessBillDomain(b.name)} label={b.name} size={32} rounded="rounded-[10px]" />
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
        <EmptyHint text="No investments tracked." cta="Add Investment" onClick={() => router.push("/investments")} />
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
        <div className="space-y-4">
          {netWorthCard}
          {savingsGoalsCard}
        </div>
        <div className="space-y-4">
          {cashFlowCard}
          {expenseBreakdownCard}
        </div>
        {accountsCard}
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
            <button onClick={() => setModal({ kind: "import" })} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2 transition-colors">
              <Upload className="h-3.5 w-3.5" /> Import Statement
            </button>
            <button onClick={() => setModal({ kind: "txn" })} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
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
          <Head title="Monthly Budget" right={
            <button onClick={openBudgetModal} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
              <Plus className="h-3 w-3" /> {M.overallBudget ? "Edit Budget" : "Set Budget"}
            </button>
          } />
          {!M.overallBudget ? (
            <EmptyHint text="Set one overall monthly spending limit to track discipline." cta="Set a Budget" onClick={openBudgetModal} />
          ) : (
            <div className="group">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-ink">This Month</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted">₹ {M.overallBudget.actual.toLocaleString("en-IN")} / ₹ {M.overallBudget.amount.toLocaleString("en-IN")}</span>
                  <span className={cn("font-semibold", M.overallBudget.pctUsed > 100 ? "text-red-500" : "text-green-600")}>{M.overallBudget.pctUsed}%</span>
                  <RowActions
                    onEdit={openBudgetModal}
                    onDelete={() => deleteRow("budgets", M.overallBudget!.id, "Remove the monthly budget?")}
                  />
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className={cn("h-full rounded-full", M.overallBudget.pctUsed > 100 ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-green-500 to-emerald-400")} style={{ width: `${Math.min(100, M.overallBudget.pctUsed)}%` }} />
              </div>
              {M.overallBudget.pctUsed > 100 && (
                <p className="mt-1.5 text-[11px] font-medium text-red-500">Over budget by ₹ {(M.overallBudget.actual - M.overallBudget.amount).toLocaleString("en-IN")}</p>
              )}
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
                return (
                  <div key={b.id} className="group flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
                    <Logo domain={b.logoDomain || guessBillDomain(b.name)} label={b.name} size={32} rounded="rounded-[10px]" />
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
                    <p className="text-[11px] text-muted">{meta.label}{l.lender && ` · ${l.lender}`}{l.tenureMonths ? ` · ${l.tenureMonths}mo tenure` : ""}</p>
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
                  {g.savedAt && (
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-faint"><Landmark className="h-3 w-3" /> Saved in {g.savedAt}</p>
                  )}
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
      <ImportStatementModal
        open={modal?.kind === "import"}
        onClose={() => setModal(null)}
        busy={busy}
        onImport={(items) => bulkCreateRows("transactions", items, `${items.length} transaction${items.length === 1 ? "" : "s"} imported`)}
      />

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
            { name: "logoDomain", label: "Logo Website (optional)", placeholder: "e.g. hdfcbank.com — auto-detected for common banks", required: false },
          ]}
          initial={editing ? { name: String(editing.name), institution: String(editing.institution), type: String(editing.type), last4: String(editing.last4 ?? ""), balance: String(editing.balance), logoDomain: String(editing.logoDomain ?? "") } : undefined}
          submitLabel={editing ? "Save Changes" : "Add Account"}
          busy={busy}
          onSubmit={(d) => {
            const domain = (d.logoDomain || "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
            const data = { name: d.name, institution: d.institution, type: d.type, last4: d.last4, balance: Number(d.balance) || 0, logoDomain: domain || guessBankDomain(d.name, d.institution) || null };
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
            {
              name: "savedAt", label: "Where is it saved? (optional)", required: false,
              placeholder: "e.g. HDFC Savings, a SIP, or anything else",
              datalist: [...db.accounts.map((a) => a.name), ...db.investments.map((i) => i.name)],
            },
          ]}
          initial={editing ? { name: String(editing.name), icon: String(editing.icon), target: String(editing.target), saved: String(editing.saved), savedAt: String(editing.savedAt ?? "") } : undefined}
          submitLabel={editing ? "Save Changes" : "Save Goal"}
          busy={busy}
          onSubmit={(d) => {
            const meta = goalMeta(d.icon);
            const data = { name: d.name, icon: d.icon, color: meta.color, target: Number(d.target) || 0, saved: Number(d.saved) || 0, savedAt: d.savedAt?.trim() || null };
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
        <LoanForm
          key={String((editing as { id?: string })?.id ?? "new")}
          initial={editing as Partial<FinLoan> | undefined}
          submitLabel={editing ? "Save Changes" : "Add Loan"}
          busy={busy}
          onSubmit={(data) => {
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

      <Modal open={modal?.kind === "bill"} onClose={() => setModal(null)} title={editing ? "Edit Bill" : "Add Bill / Subscription"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "name", label: "Name", placeholder: "e.g. Netflix Subscription" },
            { name: "amount", label: "Amount (₹)", type: "number", placeholder: "0", half: true },
            { name: "dueDay", label: "Due Day of Month (1-31)", type: "number", placeholder: "5", half: true },
            { name: "logoDomain", label: "Logo Website (optional)", placeholder: "e.g. netflix.com — auto-detected for common services", required: false },
          ]}
          initial={editing ? { name: String(editing.name), amount: String(editing.amount), dueDay: String(editing.dueDay), logoDomain: String(editing.logoDomain ?? "") } : undefined}
          submitLabel={editing ? "Save Changes" : "Add Bill"}
          busy={busy}
          onSubmit={(d) => {
            const data: Record<string, unknown> = { name: d.name, amount: Number(d.amount) || 0, dueDay: Math.min(31, Math.max(1, Number(d.dueDay) || 1)) };
            const domain = (d.logoDomain || "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
            data.logoDomain = domain || guessBillDomain(d.name) || null;
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

      <Modal open={modal?.kind === "budget"} onClose={() => setModal(null)} title={editing ? "Edit Monthly Budget" : "Set Monthly Budget"}>
        <EntityForm
          key={String((editing as { id?: string })?.id ?? "new")}
          fields={[
            { name: "amount", label: "Monthly Budget (₹)", placeholder: "e.g. 50000", type: "number" },
          ]}
          initial={editing ? { amount: String(editing.amount) } : undefined}
          submitLabel={editing ? "Save Changes" : "Set Budget"}
          busy={busy}
          onSubmit={(d) => {
            const data = { category: "Overall", amount: Number(d.amount) || 0 };
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
                  tab === t ? "border border-blue-200 bg-blue-50 text-blue-700 shadow-sm" : "text-muted hover:bg-surface-2 hover:text-ink"
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
            className="mr-1 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Quick Add <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", quickOpen && "rotate-180")} />
          </button>
          {quickOpen && (
            <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-border bg-card p-1 shadow-card-lg">
              {QUICK_ADDS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => { setQuickOpen(false); if (q.kind === "budget") openBudgetModal(); else setModal({ kind: q.kind } as ModalState); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-ink"
                >
                  {q.label}
                </button>
              ))}
              <button
                onClick={() => { setQuickOpen(false); router.push("/investments"); }}
                className="block w-full rounded-lg px-3 py-2 text-left text-[13px] text-muted hover:bg-surface-2 hover:text-ink"
              >
                Investment
              </button>
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
