"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen, FileText, CheckCircle2, Clock, Users, IndianRupee, ArrowUpRight, ArrowDownRight,
  Plus,
  Pencil, Trash2, Eye, ChevronLeft, ChevronRight, MousePointerClick, Target,
  CalendarDays, Wallet, AlertTriangle,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MultiLineChart, SegmentedGauge, GroupedBars } from "@/components/charts";
import { Dropdown, Modal } from "@/components/vault-ui";
import { GoogleAdsLogo } from "@/components/google-ads-logo";
import { Logo } from "@/components/logo";
import { ConsolidatedPnL } from "@/components/consolidated-pnl";
import { RevenueOverview } from "@/components/revenue-overview";
import { EmployeeProductivityPanel } from "@/components/employee-productivity-chart";
import { cn, inr } from "@/lib/utils";
import { type JournalDashboardData } from "@/lib/journal-dashboard";
import { type JournalExpense } from "@/lib/journal-expenses-store";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

const statTone: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600", blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600", amber: "bg-amber-100 text-amber-500",
  pink: "bg-pink-100 text-pink-600", emerald: "bg-emerald-100 text-emerald-600",
};
const statIcon: Record<string, React.ElementType> = {
  book: BookOpen, file: FileText, check: CheckCircle2, review: Clock, users: Users, rupee: IndianRupee,
};

const JOURNAL_OPTIONS = [
  { code: "IJPS", label: "IJPS" },
  { code: "IJSRT", label: "IJSRT" },
  { code: "IJMPS", label: "IJMPS" },
  { code: "IJES", label: "IJES" },
  { code: "JPS", label: "JPS" },
];
const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly", months: 1 },
  { value: "quarterly", label: "Quarterly", months: 3 },
  { value: "yearly", label: "Yearly", months: 12 },
];
const journalLabel = (code: string) => JOURNAL_OPTIONS.find((j) => j.code === code)?.label ?? code;

// Local paths to pre-downloaded journal logos in /public/journal-logos/.
// These small journal sites aren't indexed by Clearbit, so we serve
// static copies instead of relying on external APIs that return blanks.
const JOURNAL_LOGO: Record<string, string> = {
  IJPS: "/journal-logos/ijpsjournal.png",
  IJSRT: "/journal-logos/ijsrtjournal.png",
  IJMPS: "/journal-logos/ijmpsjournal.png",
  IJES: "/journal-logos/ijesjournal.png",
  JPS: "/journal-logos/jpsjournal.jpg",
};

function Delta({ v, className }: { v: number; className?: string }) {
  const up = v >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-green-600" : "text-red-500", className)}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(v)}%
    </span>
  );
}

function Panel({ title, subtitle, action, children, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-faint">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const period = <Dropdown label="This Month" options={["This Month", "Last Month", "This Quarter", "This Year"]} onSelect={() => {}} align="right" />;

function Donut({ data, center, sub }: { data: { name: string; value: number; color: string }[]; center: string; sub: string }) {
  return (
    <div className="relative h-44 w-44 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="70%" outerRadius="100%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink">{center}</span>
        <span className="text-xs text-faint">{sub}</span>
      </div>
    </div>
  );
}

function Legend({ items }: { items: { name: string; value: number; pct?: number; color: string }[] }) {
  return (
    <div className="flex-1 space-y-2.5">
      {items.map((d) => (
        <div key={d.name} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
          <span className="truncate text-muted">{d.name}</span>
          <span className="ml-auto font-medium text-ink">{d.pct != null ? `${d.pct}%` : ""}</span>
          <span className="w-12 text-right text-xs text-faint">({d.value})</span>
        </div>
      ))}
    </div>
  );
}

export function JournalManagementClient({ data }: { data: JournalDashboardData }) {
  const [trendRangeLabel, setTrendRangeLabel] = useState<6 | 12>(12);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const topCountries = data.topCountries;

  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState(
    data.journalPerformance.map((j) => ({ code: j.code, manuscripts: 0 }))
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/journals/snapshot?period=this_month`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled && json.byJournal) setSnapshotData(json.byJournal); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSnapshotLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Aggregates computed from real + placeholder journal data.
  const totalJournalManuscripts = data.journalPerformance.reduce((s, j) => s + j.manuscripts, 0);
  const totalJournalPublished = data.journalPerformance.reduce((s, j) => s + j.published, 0);
  const avgAcceptance = data.journalPerformance.reduce((s, j) => s + j.acceptance, 0) / data.journalPerformance.length || 0;
  const avgImpact = data.journalPerformance.reduce((s, j) => s + j.impact, 0) / data.journalPerformance.length || 0;
  const totalJournalRevenue = data.journalPerformance.reduce((s, j) => s + j.revenue, 0);
  const avgGrowth = data.journalPerformance.reduce((s, j) => s + j.growth, 0) / data.journalPerformance.length || 0;
  const totalSubmissionsByJournal = data.submissionsByJournal.reduce((s, j) => s + j.value, 0);
  const totalArticleStatus = data.articleStatus.reduce((s, a) => s + a.value, 0);

  // -------------------------------------------------------------- expense journal --------------------------------------------------------------
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<JournalExpense[]>(data.businessExpenses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<JournalExpense | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [expShared, setExpShared] = useState(false);
  const [expPeriod, setExpPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [expJournal, setExpJournal] = useState(JOURNAL_OPTIONS[0].code);
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expMode, setExpMode] = useState("UPI");
  const [expPaymentTo, setExpPaymentTo] = useState("");
  const [expDesc, setExpDesc] = useState("");

  useEffect(() => {
    if (searchParams.get("addExpense") === "1") {
      setShowAddModal(true);
      router.replace("/journal-management", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setExpShared(false); setExpPeriod("monthly");
    setExpJournal(JOURNAL_OPTIONS[0].code); setExpCategory(EXPENSE_CATEGORIES[0]); setExpAmount("");
    setExpDate(new Date().toISOString().slice(0, 10)); setExpMode("UPI");
    setExpPaymentTo(""); setExpDesc("");
  }

  async function submitExpense() {
    const amountNum = Number(expAmount);
    if (!amountNum || amountNum <= 0) { flash("Enter a valid amount"); return; }
    if (!expDate) { flash("Enter a date"); return; }
    setSaving(true);
    try {
      if (expShared) {
        const res = await fetch("/api/journals/expenses/split", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: expCategory, totalAmount: amountNum, period: expPeriod, date: expDate,
            mode: expMode, description: expDesc, paymentTo: expPaymentTo,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to add shared expense");
        setExpenses((p) => [...json.expenses, ...p]);
        flash(`Split ${inr(amountNum)} (${expPeriod}) — ${inr(json.perJournalAmount)}/journal/month across ${json.monthsCovered} month${json.monthsCovered > 1 ? "s" : ""}`);
      } else {
        const res = await fetch("/api/journals/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journalCode: expJournal, category: expCategory, amount: amountNum, date: expDate,
            mode: expMode, description: expDesc, paymentTo: expPaymentTo,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to add expense");
        setExpenses((p) => [json.expense, ...p]);
        flash("Expense added");
      }
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setSaving(false);
    }
  }

  async function saveEditedExpense() {
    if (!editingExpense) return;
    setSaving(true);
    try {
      const res = await fetch("/api/journals/expenses/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingExpense.id, journalCode: editingExpense.journalCode, category: editingExpense.category,
          amount: editingExpense.amount, date: editingExpense.date, mode: editingExpense.mode,
          description: editingExpense.description, paymentTo: editingExpense.paymentTo,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update expense");
      setExpenses((p) => p.map((e) => (e.id === json.expense.id ? json.expense : e)));
      setEditingExpense(null);
      flash("Expense updated");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to update expense");
    } finally {
      setSaving(false);
    }
  }

  async function removeExpense(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      const res = await fetch("/api/journals/expenses/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete expense");
      setExpenses((p) => p.filter((e) => e.id !== id));
      flash("Expense deleted");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to delete expense");
    }
  }

  function exportExpensesCsv() {
    const header = ["Journal", "Category", "Date", "Paid To", "Description", "Amount", "Mode"];
    const rows = expenses.map((e) => [journalLabel(e.journalCode), e.category, e.date, e.paymentTo, e.description, e.amount, e.mode]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "business-expenses.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const selectedPeriodMonths = PERIOD_OPTIONS.find((p) => p.value === expPeriod)?.months ?? 1;
  const perJournalPreview = expShared && Number(expAmount) > 0
    ? Math.round((Number(expAmount) / selectedPeriodMonths / JOURNAL_OPTIONS.length) * 100) / 100
    : 0;

  const addExpenseForm = (
    <div className="space-y-4">
      <label className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm">
        <input type="checkbox" checked={expShared} onChange={(e) => setExpShared(e.target.checked)} className="h-4 w-4 rounded border-border accent-blue-600" />
        <span className="font-medium text-ink">Shared cost — split equally across all 5 journals</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        {expShared ? (
          <div>
            <label className="text-xs text-muted mb-1.5 block">Billing Period</label>
            <select
              value={expPeriod}
              onChange={(e) => setExpPeriod(e.target.value as typeof expPeriod)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
            >
              {PERIOD_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs text-muted mb-1.5 block">Journal</label>
            <select
              value={expJournal}
              onChange={(e) => setExpJournal(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
            >
              {JOURNAL_OPTIONS.map((j) => <option key={j.code} value={j.code}>{j.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs text-muted mb-1.5 block">Category</label>
          <select
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
          >
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted mb-1.5 block">{expShared ? `Total Amount (${PERIOD_OPTIONS.find((p) => p.value === expPeriod)?.label})` : "Amount"} (₹)</label>
          <input
            type="number" min={0} step="0.01" placeholder="0.00"
            value={expAmount} onChange={(e) => setExpAmount(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1.5 block">Date</label>
          <input
            type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>
      {expShared && perJournalPreview > 0 && (
        <p className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
          ≈ {inr(perJournalPreview)} per journal per month × {JOURNAL_OPTIONS.length} journals
          {selectedPeriodMonths > 1 && <> — appears in each of the next {selectedPeriodMonths} months starting {new Date(expDate + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</>}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted mb-1.5 block">Payment Mode</label>
          <select
            value={expMode} onChange={(e) => setExpMode(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
          >
            <option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Cash</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted mb-1.5 block">Paid To</label>
          <input
            type="text" value={expPaymentTo} onChange={(e) => setExpPaymentTo(e.target.value)}
            placeholder="e.g. Hostinger, Interakt..."
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted mb-1.5 block">Description</label>
        <textarea
          rows={2} value={expDesc} onChange={(e) => setExpDesc(e.target.value)}
          placeholder="Enter description.."
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand resize-none transition-colors"
        />
      </div>
      <button
        onClick={submitExpense} disabled={saving}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
      >
        {saving ? "Saving…" : "Add Expense"}
      </button>
    </div>
  );

  // -------------------------------------------------------------- expense journal (matrix) --------------------------------------------------------------
  const MATRIX_ROWS = [
    { code: "IJPS", label: "IJPS Journal" },
    { code: "IJSRT", label: "IJSRT Journal" },
    { code: "IJMPS", label: "IJMPS Journal" },
    { code: "IJES", label: "IJES Journal" },
    { code: "JPS", label: "JPS Journal" },
  ];

  const [matrixDate, setMatrixDate] = useState(() => new Date());
  const matrixMonthKey = `${matrixDate.getFullYear()}-${String(matrixDate.getMonth() + 1).padStart(2, "0")}`;
  const matrixMonthLabel = matrixDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isCurrentMonth = matrixMonthKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const [matrixAds, setMatrixAds] = useState(data.googleAdsSpend);
  const [matrixAdsLoading, setMatrixAdsLoading] = useState(false);
  const [detailCell, setDetailCell] = useState<{ journal: string; category: string; label: string } | null>(null);

  function shiftMatrixMonth(delta: number) {
    setMatrixDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  useEffect(() => {
    loadMatrixAds(matrixMonthKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrixMonthKey]);

  async function loadMatrixAds(monthKey: string) {
    if (monthKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`) {
      setMatrixAds(data.googleAdsSpend);
      return;
    }
    setMatrixAdsLoading(true);
    try {
      const res = await fetch(`/api/journals/google-ads?month=${monthKey}`);
      const json = await res.json();
      if (res.ok) setMatrixAds(json);
    } catch {
      // keep previous value on failure
    } finally {
      setMatrixAdsLoading(false);
    }
  }

  function cellAmount(journalCode: string, category: string): number {
    return expenses
      .filter((e) => e.journalCode === journalCode && e.category === category && e.date.slice(0, 7) === matrixMonthKey)
      .reduce((s, e) => s + e.amount, 0);
  }
  function cellEntries(journalCode: string, category: string): JournalExpense[] {
    return expenses.filter((e) => e.journalCode === journalCode && e.category === category && e.date.slice(0, 7) === matrixMonthKey);
  }
  function adsAmount(journalCode: string): number {
    return matrixAds.byJournal.find((j) => j.code === journalCode)?.totalSpend ?? 0;
  }
  function rowTotal(journalCode: string): number {
    return EXPENSE_CATEGORIES.reduce((s, c) => s + cellAmount(journalCode, c), 0) + adsAmount(journalCode);
  }
  function columnTotal(category: string): number {
    return MATRIX_ROWS.reduce((s, r) => s + cellAmount(r.code, category), 0);
  }
  const adsColumnTotal = matrixAds.byJournal.reduce((s, j) => s + j.totalSpend, 0);
  const grandTotal = MATRIX_ROWS.reduce((s, r) => s + rowTotal(r.code), 0);

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Journal Management</h1>
          <p className="mt-1 text-sm text-muted">Complete analytics and insights across all journals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Quick Add Expense
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed right-6 top-6 z-[110] rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-card-lg animate-fade-up">
          {toast}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {data.jmStats.map((s) => {
          const Icon = statIcon[s.icon];
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2">
                <div className={cn("grid h-9 w-9 place-items-center rounded-xl", statTone[s.tone])}><Icon className="h-[18px] w-[18px]" /></div>
                <p className="text-xs font-medium text-muted">{s.label}</p>
              </div>
              <p className="mt-3 text-xl font-bold text-ink">{s.value}</p>
              <p className={cn("mt-0.5 flex items-center gap-1 text-[11px] font-medium",
                s.subTone === "green" ? "text-green-600" : s.subTone === "red" ? "text-red-500" : "text-faint")}>
                {s.subTone === "green" && <ArrowUpRight className="h-3 w-3" />}
                {s.subTone === "red" && <ArrowDownRight className="h-3 w-3" />}
                {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Consolidated P&L across all journals, with month toggle — 3/4 width, Journal Snapshot alongside at 1/4 */}
      <div className="grid gap-5 xl:grid-cols-4">
        <ConsolidatedPnL className="xl:col-span-3" />
        <Panel title="Journal Snapshot">
          <div className={cn("space-y-3", snapshotLoading && "opacity-50 transition-opacity")}>
            {data.journalPerformance.map((j) => {
              const s = snapshotData.find((x) => x.code === j.code);
              return (
                <div key={j.code} className="rounded-xl border border-border p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: j.color }} />
                    <span className="text-xs font-semibold text-ink">{j.code}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div>
                      <p className="text-sm font-semibold text-ink">{(s?.manuscripts ?? 0).toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-faint">Received</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{(j.paid ?? 0).toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-faint">Paid</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{(j.flagged ?? 0).toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-faint">Flagged</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Per-journal identity cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {data.journalPerformance.map((j) => {
          return (
            <div key={j.code} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2.5">
                <Logo src={JOURNAL_LOGO[j.code]} label={j.code} size={40} rounded="rounded-full" />
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: j.color }}>{j.code}</p>
                  <p className="truncate text-[11px] text-faint">{j.name}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[11px]">
                <span className="text-muted">Published: <span className="font-semibold text-ink">{j.published.toLocaleString("en-IN")}</span></span>
                <span className="text-muted">IF/Impact: <span className="font-semibold text-ink">{j.impact.toFixed(3)}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {data.businessProfitability.map((b) => (
            <div
              key={b.code}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-2.5">
                <Logo src={JOURNAL_LOGO[b.code]} label={b.code} size={36} rounded="rounded-lg" />
                <span className="truncate text-sm font-semibold text-ink">{b.name}</span>
              </div>
              <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-faint">Revenue</p>
              <p className="text-xl font-bold text-ink">{inr(b.revenue)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-surface-2 p-2">
                  <p className="text-[10px] text-faint">Expenses</p>
                  <p className="text-sm font-semibold text-ink">{inr(b.expenses)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-2">
                  <p className="text-[10px] text-faint">Profit</p>
                  <p className={cn("text-sm font-semibold", b.profit >= 0 ? "text-emerald-600" : "text-rose-500")}>
                    {inr(b.profit)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-faint">Margin</span>
                  <span className={cn("font-semibold", b.margin >= 0 ? "text-emerald-600" : "text-rose-500")}>
                    {b.margin.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn("h-full rounded-full", b.margin >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                    style={{ width: `${Math.max(0, Math.min(100, Math.abs(b.margin)))}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue by Business */}
      <Panel
        title={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <span>Monthly Revenue by Business</span>
          </div>
        }
        subtitle="Last 10 months revenue across all businesses"
      >
        <GroupedBars data={data.monthlyRevenueByBusiness.data} series={data.monthlyRevenueByBusiness.series} />
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
          {data.monthlyRevenueByBusiness.series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.name} Journal
            </span>
          ))}
        </div>
      </Panel>

      {/* Overview + donut + activities */}
      <div className="grid gap-5 xl:grid-cols-4">
        <Panel
          title="Submissions Trend (All Journals)"
          className="xl:col-span-2"
          action={
            <Dropdown
              label={trendRangeLabel === 6 ? "Last 6 Months" : "Last 12 Months"}
              options={["Last 6 Months", "Last 12 Months"]}
              onSelect={(v) => setTrendRangeLabel(v === "Last 6 Months" ? 6 : 12)}
              align="right"
            />
          }
        >
          <MultiLineChart
            data={data.submissionsByJournalTrend.data.slice(-trendRangeLabel)}
            series={data.submissionsByJournalTrend.series}
            showDots
          />
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
            {data.submissionsByJournalTrend.series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</span>
            ))}
          </div>
        </Panel>

        <Panel title="Manuscripts by Journal">
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <Donut data={data.submissionsByJournal} center={totalSubmissionsByJournal.toLocaleString("en-IN")} sub="Total" />
            </div>
            <Legend items={data.submissionsByJournal} />
          </div>
        </Panel>

        <Panel title="Subject Areas">
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <Donut
                data={data.subjectAreas.map((s) => ({ name: s.name, value: s.pct, color: s.color }))}
                center={String(data.subjectAreas.length)}
                sub="Areas"
              />
            </div>
            <Legend items={data.subjectAreas.map((s) => ({ name: s.name, value: s.pct, pct: s.pct, color: s.color }))} />
          </div>
        </Panel>
      </div>

      {/* Expense Journal — journal x category pivot, month-navigable */}
      <Panel
        title="Expense Journal"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => shiftMatrixMonth(-1)} className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted hover:bg-surface-2 hover:text-ink">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[110px] text-center text-sm font-medium text-ink">{matrixMonthLabel}</span>
            <button onClick={() => shiftMatrixMonth(1)} disabled={isCurrentMonth} className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <Dropdown
              label="This Month"
              options={["This Month", "Last Month"]}
              onSelect={(v) => setMatrixDate(v === "Last Month" ? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1) : new Date())}
              align="right"
            />
            <button onClick={exportExpensesCsv} className="text-xs font-medium text-indigo-600 hover:underline">Export CSV</button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Expense
            </button>
          </div>
        }
      >
        <p className="mb-3 text-xs text-muted">Complete expense breakdown including Google Ads spend — click any amount to see the entries behind it.</p>
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-2/70 text-left text-[11px] font-semibold uppercase tracking-wide text-faint">
                  <th className="py-3 pl-4 pr-3">Business</th>
                  {EXPENSE_CATEGORIES.map((c) => <th key={c} className="py-3 px-3 text-right">{c}</th>)}
                  <th className="py-3 px-3 text-right text-indigo-500">Google Ads {matrixAdsLoading && "…"}</th>
                  <th className="py-3 pl-3 pr-4 text-right text-ink">Total Expense</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row, i) => {
                  const color = data.journalPerformance.find((j) => j.code === row.code)?.color ?? "#64748b";
                  return (
                    <tr
                      key={row.code}
                      className={cn(
                        "border-t border-border transition-colors hover:bg-surface-2/50",
                        i % 2 === 1 && "bg-surface-2/20"
                      )}
                    >
                      <td className="py-3 pl-4 pr-3">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                          <span className="font-medium text-ink">{row.label}</span>
                        </span>
                      </td>
                      {EXPENSE_CATEGORIES.map((c) => {
                        const amt = cellAmount(row.code, c);
                        return (
                          <td key={c} className="py-3 px-3 text-right tabular-nums">
                            {amt > 0 ? (
                              <button onClick={() => setDetailCell({ journal: row.code, category: c, label: `${row.label} — ${c}` })} className="font-medium text-ink hover:text-indigo-600 hover:underline">
                                {inr(amt)}
                              </button>
                            ) : (
                              <span className="text-faint">₹0</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right tabular-nums">
                        {adsAmount(row.code) > 0 ? (
                          <span className="font-medium text-indigo-600">{inr(adsAmount(row.code))}</span>
                        ) : (
                          <span className="text-faint">₹0</span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right font-bold tabular-nums text-ink">{inr(rowTotal(row.code))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-indigo-200 bg-indigo-50/50 font-bold">
                  <td className="py-3.5 pl-4 pr-3 text-indigo-700">Grand Total</td>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <td key={c} className="py-3.5 px-3 text-right tabular-nums text-ink">{inr(columnTotal(c))}</td>
                  ))}
                  <td className="py-3.5 px-3 text-right tabular-nums text-indigo-700">{inr(adsColumnTotal)}</td>
                  <td className="py-3.5 pl-3 pr-4 text-right tabular-nums text-indigo-700">{inr(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Panel>

      {/* Google Ads Spend — separate from the manual expense sheet, live per-journal */}
      <Panel
        title="Google Ads Spend"
        action={
          <div className="flex items-center gap-2">
            <GoogleAdsLogo className="h-5 w-5" />
            <span className={cn("text-xs font-medium", data.googleAdsSpend.connected ? "text-green-600" : "text-faint")}>
              {data.googleAdsSpend.periodLabel}{data.googleAdsSpend.connected ? " · Live" : ""}
            </span>
          </div>
        }
      >
        {!data.googleAdsSpend.connected ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <GoogleAdsLogo className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium text-ink">Google Ads isn't connected</p>
            <p className="max-w-sm text-xs text-muted">{data.googleAdsSpend.error || "Add Google Ads credentials to see live spend per journal here."}</p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {data.googleAdsSpend.byJournal.map((j) => (
              <div key={j.code} className="overflow-hidden rounded-xl border border-border bg-gradient-to-b from-surface-2/60 to-transparent">
                <div className="flex items-center justify-between border-b border-border/70 px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <GoogleAdsLogo className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold text-ink">{j.code}</span>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                    j.connected ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500")}>
                    <span className={cn("h-1 w-1 rounded-full", j.connected ? "bg-green-500" : "bg-red-400")} />
                    {j.connected ? "Live" : (j.error ? "Error" : "—")}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-lg font-bold text-ink">{j.connected ? inr(j.totalSpend) : "—"}</p>
                  {j.connected && j.budget && (
                    <div className={cn(
                      "mt-2 rounded-md px-2 py-1.5",
                      j.budget.pctRemaining < 5 ? "bg-red-50" : j.budget.pctRemaining < 15 ? "bg-amber-50" : "bg-green-50"
                    )}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted">
                          {j.budget.pctRemaining < 15 ? (
                            <AlertTriangle className={cn("h-3 w-3 shrink-0", j.budget.pctRemaining < 5 ? "text-red-500" : "text-amber-500")} />
                          ) : (
                            <Wallet className="h-3 w-3 shrink-0 text-green-600" />
                          )}
                          Balance
                        </span>
                        {j.budget.pctRemaining < 15 && (
                          <span className={cn("text-[8px] font-bold uppercase tracking-wide", j.budget.pctRemaining < 5 ? "text-red-600" : "text-amber-600")}>
                            {j.budget.pctRemaining < 5 ? "Critical" : "Low"}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "mt-0.5 text-sm font-bold",
                        j.budget.pctRemaining < 5 ? "text-red-600" : j.budget.pctRemaining < 15 ? "text-amber-600" : "text-green-700"
                      )}>
                        {inr(j.budget.remaining)}
                      </p>
                      <p className="text-[9px] text-faint">{j.budget.pctRemaining}% of {inr(j.budget.approvedLimit + j.budget.adjustments, { compact: true })} approved</p>
                    </div>
                  )}
                  {j.connected && (
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      <div className="rounded-md bg-surface-2/70 p-1 text-center">
                        <Eye className="mx-auto h-3 w-3 text-blue-500" />
                        <p className="mt-0.5 text-[11px] font-semibold text-ink">{j.impressions.toLocaleString("en-IN")}</p>
                        <p className="text-[9px] text-faint">Impr.</p>
                      </div>
                      <div className="rounded-md bg-surface-2/70 p-1 text-center">
                        <MousePointerClick className="mx-auto h-3 w-3 text-amber-500" />
                        <p className="mt-0.5 text-[11px] font-semibold text-ink">{j.clicks.toLocaleString("en-IN")}</p>
                        <p className="text-[9px] text-faint">Clicks</p>
                      </div>
                      <div className="rounded-md bg-surface-2/70 p-1 text-center">
                        <Target className="mx-auto h-3 w-3 text-green-500" />
                        <p className="mt-0.5 text-[11px] font-semibold text-ink">{j.conversions.toLocaleString("en-IN")}</p>
                        <p className="text-[9px] text-faint">Conv.</p>
                      </div>
                    </div>
                  )}
                  {j.connected && j.campaigns.length > 0 && (
                    <div className="mt-2 space-y-0.5 border-t border-border pt-1.5">
                      {j.campaigns.slice(0, 2).map((c) => (
                        <div key={c.name} className="flex items-center justify-between text-[10px]">
                          <span className="truncate text-faint">{c.name}</span>
                          <span className="text-muted">{inr(c.cost)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!j.connected && j.error && <p className="mt-1 truncate text-[10px] text-faint" title={j.error}>{j.error}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Journal performance table + revenue */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Journal Performance Overview" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-faint">
                  <th className="pb-2.5">Journal</th>
                  <th className="pb-2.5 text-right">Manuscripts</th>
                  <th className="pb-2.5 text-right">Published</th>
                  <th className="pb-2.5 text-right">Acceptance</th>
                  <th className="pb-2.5 text-right">Impact</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                  <th className="pb-2.5 text-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.journalPerformance.map((j) => (
                  <tr key={j.code} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: j.color }} />
                        <div>
                          <p className="font-semibold" style={{ color: j.color }}>{j.code}</p>
                          <p className="max-w-[200px] truncate text-xs text-faint">{j.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-ink">{j.manuscripts}</td>
                    <td className="py-3 text-right text-ink">{j.published}</td>
                    <td className="py-3 text-right text-muted">{j.acceptance}%</td>
                    <td className="py-3 text-right font-medium text-ink">{j.impact.toFixed(3)}</td>
                    <td className="py-3 text-right font-medium text-ink">{inr(j.revenue)}</td>
                    <td className="py-3 text-right"><Delta v={j.growth} /></td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-semibold">
                  <td className="py-3 text-ink">Total / Average</td>
                  <td className="py-3 text-right text-ink">{totalJournalManuscripts.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right text-ink">{totalJournalPublished.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right text-muted">{avgAcceptance.toFixed(1)}%</td>
                  <td className="py-3 text-right text-ink">{avgImpact.toFixed(3)}</td>
                  <td className="py-3 text-right text-ink">{inr(totalJournalRevenue)}</td>
                  <td className="py-3 text-right"><Delta v={avgGrowth} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Revenue Overview">
          <RevenueOverview />
        </Panel>
      </div>

      {/* Top Performing Journals + Article Status gauge + Top Countries */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Top Performing Journals" action={period}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-faint">
                  <th className="pb-2">Journal</th>
                  <th className="pb-2 text-right">Submissions</th>
                  <th className="pb-2 text-right">Published</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...data.journalPerformance].sort((a, b) => b.revenue - a.revenue).map((j) => (
                  <tr key={j.code} className="border-b border-border last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: j.color }}>{j.code[0]}</span>
                        <span className="font-medium text-ink">{j.code}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-ink">{j.manuscripts.toLocaleString("en-IN")}</td>
                    <td className="py-2 text-right text-ink">{j.published.toLocaleString("en-IN")}</td>
                    <td className="py-2 text-right font-medium text-ink">{inr(j.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Article Status Overview" action={period}>
          <SegmentedGauge data={data.articleStatus} center={totalArticleStatus.toLocaleString("en-IN")} sub="Total Articles" />
          <Legend items={data.articleStatus} />
        </Panel>

        <Panel title="Top Countries (Submissions)" action={<button onClick={() => setShowAllCountries(true)} className="text-xs font-medium text-indigo-600 hover:underline">View All</button>}>
          {topCountries.length === 0 ? (
            <p className="py-6 text-center text-sm text-faint">Country data isn't available yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topCountries.slice(0, 8).map((c) => (
                <div key={c.name} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-ink">{c.name}</span>
                  <span className="font-medium text-ink">{c.count.toLocaleString("en-IN")}</span>
                  <span className="w-12 text-right text-xs text-faint">({c.pct}%)</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* EMPLOYEE PRODUCTIVITY */}
      <EmployeeProductivityPanel />

      {/* All Countries modal */}
      {showAllCountries && (
        <Modal open={showAllCountries} onClose={() => setShowAllCountries(false)} title="Top Countries (Submissions)" size="sm">
          <div className="space-y-2.5">
            {topCountries.map((c) => (
              <div key={c.name} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{c.flag}</span>
                <span className="flex-1 text-ink">{c.name}</span>
                <span className="font-medium text-ink">{c.count.toLocaleString("en-IN")}</span>
                <span className="w-12 text-right text-xs text-faint">({c.pct}%)</span>
              </div>
            ))}
            {topCountries.length === 0 && <p className="py-4 text-center text-sm text-faint">Country data isn't available yet.</p>}
          </div>
        </Modal>
      )}

      {/* Expense Journal drill-down modal — editable */}
      {detailCell && (
        <Modal open={!!detailCell} onClose={() => setDetailCell(null)} title={detailCell.label} subtitle={matrixMonthLabel} size="md">
          <div className="space-y-2">
            {cellEntries(detailCell.journal, detailCell.category).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{e.paymentTo || "—"}</p>
                  <p className="truncate text-xs text-muted">{e.description || "No description"}</p>
                  <p className="text-[11px] text-faint">{new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · {e.mode}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-ink">{inr(e.amount)}</span>
                  <button onClick={() => setEditingExpense(e)} className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removeExpense(e.id)} className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {cellEntries(detailCell.journal, detailCell.category).length === 0 && (
              <p className="py-4 text-center text-sm text-faint">No entries for this cell.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Add Expense modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Business Expense" subtitle="Attribute to one journal or mark as a combined/shared cost" size="md">
        {addExpenseForm}
      </Modal>

      {/* Edit Expense modal */}
      {editingExpense && (
        <Modal open={!!editingExpense} onClose={() => setEditingExpense(null)} title="Edit Expense" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Journal</label>
                <select
                  value={editingExpense.journalCode}
                  onChange={(e) => setEditingExpense({ ...editingExpense, journalCode: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                >
                  {JOURNAL_OPTIONS.map((j) => <option key={j.code} value={j.code}>{j.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Category</label>
                <select
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                >
                  {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Amount (₹)</label>
                <input
                  type="number" min={0} step="0.01" value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Date</label>
                <input
                  type="date" value={editingExpense.date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Payment Mode</label>
                <select
                  value={editingExpense.mode}
                  onChange={(e) => setEditingExpense({ ...editingExpense, mode: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                >
                  <option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Cash</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Paid To</label>
                <input
                  type="text" value={editingExpense.paymentTo}
                  onChange={(e) => setEditingExpense({ ...editingExpense, paymentTo: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Description</label>
              <textarea
                rows={2} value={editingExpense.description}
                onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand resize-none transition-colors"
              />
            </div>
            <button
              onClick={saveEditedExpense} disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
