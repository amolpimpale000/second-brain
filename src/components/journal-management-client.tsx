"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen, FileText, CheckCircle2, Clock, Users, IndianRupee, ArrowUpRight, ArrowDownRight,
  Plus, FileStack, BarChart3, UserCog, Megaphone, Building2, CreditCard, Bell, TrendingUp,
  Pencil, Trash2, Eye, ChevronLeft, ChevronRight, MousePointerClick, Target,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MultiLineChart, StackedBars, Sparkline } from "@/components/charts";
import { Dropdown, Modal } from "@/components/vault-ui";
import { GoogleAdsLogo } from "@/components/google-ads-logo";
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
const qaIcon: Record<string, React.ElementType> = {
  add: Plus, file: FileStack, report: BarChart3, users: UserCog, megaphone: Megaphone,
};
const subIcon: Record<string, React.ElementType> = { users: Users, building: Building2, card: CreditCard };
const alertTone: Record<string, string> = { red: "bg-red-50 text-red-600 border-red-100", amber: "bg-amber-50 text-amber-600 border-amber-100" };

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

function Delta({ v, className }: { v: number; className?: string }) {
  const up = v >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-green-600" : "text-red-500", className)}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(v)}%
    </span>
  );
}

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const period = <Dropdown label="This Month" options={["This Month", "Last Month", "This Quarter", "This Year"]} onSelect={() => {}} align="right" />;
const viewAll = <button className="text-xs font-medium text-indigo-600 hover:underline">View all</button>;

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
  const [sortKey, setSortKey] = useState<"score" | "handled" | "turnaround">("score");
  const [trendRangeLabel, setTrendRangeLabel] = useState<6 | 12>(12);
  const sortedEmployees = [...data.employees].sort((a, b) =>
    sortKey === "turnaround" ? a.turnaround - b.turnaround : b[sortKey] - a[sortKey]
  );
  const totalHandled = data.employees.reduce((s, e) => s + e.handled, 0);
  const totalCompleted = data.employees.reduce((s, e) => s + e.completed, 0);
  const avgTurn = (data.employees.reduce((s, e) => s + e.turnaround, 0) / data.employees.length).toFixed(1);
  const avgScore = Math.round(data.employees.reduce((s, e) => s + e.score, 0) / data.employees.length);

  // Aggregates computed from real + placeholder journal data.
  const totalJournalManuscripts = data.journalPerformance.reduce((s, j) => s + j.manuscripts, 0);
  const totalJournalPublished = data.journalPerformance.reduce((s, j) => s + j.published, 0);
  const avgAcceptance = data.journalPerformance.reduce((s, j) => s + j.acceptance, 0) / data.journalPerformance.length || 0;
  const avgImpact = data.journalPerformance.reduce((s, j) => s + j.impact, 0) / data.journalPerformance.length || 0;
  const totalJournalRevenue = data.journalPerformance.reduce((s, j) => s + j.revenue, 0);
  const avgGrowth = data.journalPerformance.reduce((s, j) => s + j.growth, 0) / data.journalPerformance.length || 0;
  const totalSubmissionsByJournal = data.submissionsByJournal.reduce((s, j) => s + j.value, 0);
  const totalArticleStatus = data.articleStatus.reduce((s, a) => s + a.value, 0);
  const totalSubmissionSource = data.submissionSource.reduce((s, a) => s + a.value, 0);

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
        <input type="checkbox" checked={expShared} onChange={(e) => setExpShared(e.target.checked)} className="h-4 w-4 rounded border-border accent-emerald-500" />
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
        className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
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
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> Quick Add Expense
        </button>
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
          <div className="flex items-center gap-4">
            <Donut data={data.submissionsByJournal} center={totalSubmissionsByJournal.toLocaleString("en-IN")} sub="Total" />
            <Legend items={data.submissionsByJournal} />
          </div>
        </Panel>

        <Panel title="Journal Snapshot">
          <div className="space-y-3">
            {data.journalPerformance.map((j) => (
              <div key={j.code} className="rounded-xl border border-border p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: j.color }} />
                    <span className="text-xs font-semibold text-ink">{j.code}</span>
                  </div>
                  <Delta v={j.growth} />
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div>
                    <p className="text-sm font-semibold text-ink">{j.manuscripts.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-faint">Manuscripts</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{j.acceptance}%</p>
                    <p className="text-[10px] text-faint">Acceptance</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{inr(j.revenue)}</p>
                    <p className="text-[10px] text-faint">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
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
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Expense
            </button>
          </div>
        }
      >
        <p className="mb-3 text-xs text-muted">Complete expense breakdown including Google Ads spend — click any amount to see the entries behind it.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-faint">
                <th className="pb-2.5 pr-3">Business</th>
                {EXPENSE_CATEGORIES.map((c) => <th key={c} className="pb-2.5 px-3 text-right">{c}</th>)}
                <th className="pb-2.5 px-3 text-right bg-indigo-50/60">Google Ads {matrixAdsLoading && "…"}</th>
                <th className="pb-2.5 pl-3 text-right bg-surface-2">Total Expense</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row.code} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                  <td className="py-2.5 pr-3">
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">{row.label}</span>
                  </td>
                  {EXPENSE_CATEGORIES.map((c) => {
                    const amt = cellAmount(row.code, c);
                    return (
                      <td key={c} className="py-2.5 px-3 text-right">
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
                  <td className="py-2.5 px-3 text-right bg-indigo-50/60">
                    {adsAmount(row.code) > 0 ? (
                      <span className="font-medium text-indigo-700">{inr(adsAmount(row.code))}</span>
                    ) : (
                      <span className="text-faint">₹0</span>
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-semibold text-ink bg-surface-2">{inr(rowTotal(row.code))}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-3 pr-3 text-indigo-600">Grand Total</td>
                {EXPENSE_CATEGORIES.map((c) => (
                  <td key={c} className="py-3 px-3 text-right text-ink">{inr(columnTotal(c))}</td>
                ))}
                <td className="py-3 px-3 text-right text-indigo-700 bg-indigo-50/60">{inr(adsColumnTotal)}</td>
                <td className="py-3 pl-3 text-right text-ink bg-surface-2">{inr(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
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

        <Panel title="Revenue Overview" action={period}>
          <p className="text-xs text-muted">Total Revenue</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-ink">{inr(totalJournalRevenue)}</p>
            <Delta v={data.financialSummary.find((f) => f.label === "Total Revenue")?.growth ?? 0} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Donut data={data.revenueBreakdown} center="" sub="" />
            <div className="flex-1 space-y-2.5">
              {data.revenueBreakdown.map((r) => (
                <div key={r.name} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                    <span className="truncate text-muted">{r.name}</span>
                    <span className="ml-auto text-xs font-medium text-faint">{r.pct}%</span>
                  </div>
                  <p className="pl-[18px] font-medium text-ink">{inr(r.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Article status + Financial + Quick actions */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Article Status Overview" action={period}>
          <div className="flex items-center gap-4">
            <Donut data={data.articleStatus} center={totalArticleStatus.toLocaleString("en-IN")} sub="Total" />
            <Legend items={data.articleStatus} />
          </div>
        </Panel>

        <Panel title="Financial Overview" action={period}>
          <div className="space-y-3">
            {data.financialSummary.map((f) => (
              <div key={f.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{f.label}</p>
                  <p className="text-lg font-bold text-ink">{f.value}</p>
                  <Delta v={f.growth} />
                </div>
                <div className="h-10 w-24 shrink-0"><Sparkline data={f.spark} color={f.color} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Quick Actions">
          <div className="space-y-1">
            {data.quickActionsJM.map((a) => {
              const Icon = qaIcon[a.icon];
              return (
                <button key={a.label} className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-2">
                  <Icon className="h-4 w-4 text-indigo-500" /> {a.label}
                  <ArrowUpRight className="ml-auto h-4 w-4 rotate-45 text-faint" />
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Key metrics + subjects + subscription */}
      <div className="grid gap-5 xl:grid-cols-4">
        <Panel title="Key Metrics Trend" action={period} className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            {data.keyMetrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted">{m.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-ink">{m.value}</p>
                  <Delta v={m.growth} />
                </div>
                <div className="mt-1 h-9"><Sparkline data={m.spark} color={m.color} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top Subject Areas" action={viewAll}>
          <div className="space-y-3">
            {data.subjectAreas.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-muted">{s.name}</span><span className="font-medium text-ink">{s.pct}%</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Subscription & Membership" action={viewAll}>
          <div className="space-y-3">
            {data.subscription.map((s) => {
              const Icon = subIcon[s.icon];
              return (
                <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="text-xs text-muted">{s.label}</p><p className="text-lg font-bold text-ink">{s.value}</p></div>
                  <Delta v={s.growth} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Source + Publication trend + Alerts */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Submission Source">
          <div className="flex items-center gap-4">
            <Donut data={data.submissionSource} center={totalSubmissionSource.toLocaleString("en-IN")} sub="Total" />
            <Legend items={data.submissionSource} />
          </div>
        </Panel>

        <Panel title="Publication Trend" action={period}>
          <div className="mb-2 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />Published</span>
            <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" />Accepted</span>
          </div>
          <StackedBars data={data.publicationTrend} series={[{ key: "accepted", color: "#3b82f6" }, { key: "published", color: "#22c55e" }]} />
        </Panel>

        <Panel title="Alerts & Notifications">
          <div className="space-y-2.5">
            {data.jmAlerts.map((a) => (
              <div key={a.id} className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-sm", alertTone[a.tone])}>
                <Bell className="h-4 w-4 shrink-0" />
                <span className="flex-1">{a.text}</span>
                <button className="shrink-0 text-xs font-semibold hover:underline">View Now</button>
              </div>
            ))}
            <button className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-2.5 text-sm font-medium text-muted hover:text-ink">View All Notifications</button>
          </div>
        </Panel>
      </div>

      {/* EMPLOYEE PRODUCTIVITY */}
      <Panel
        title="Employee Productivity"
        action={<Dropdown label={`Sort: ${sortKey === "score" ? "Score" : sortKey === "handled" ? "Manuscripts" : "Turnaround"}`}
          options={["Score", "Manuscripts", "Turnaround"]}
          onSelect={(v) => setSortKey(v === "Manuscripts" ? "handled" : v === "Turnaround" ? "turnaround" : "score")} align="right" />}
      >
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Active Staff", value: `${data.employees.length}`, icon: Users, tone: "bg-indigo-50 text-indigo-600" },
            { label: "Tasks Completed", value: `${totalCompleted}`, icon: CheckCircle2, tone: "bg-green-50 text-green-600" },
            { label: "Avg Turnaround", value: `${avgTurn} days`, icon: Clock, tone: "bg-amber-50 text-amber-500" },
            { label: "Avg Productivity", value: `${avgScore}%`, icon: TrendingUp, tone: "bg-emerald-50 text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", s.tone)}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-lg font-bold text-ink">{s.value}</p><p className="text-xs text-muted">{s.label}</p></div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-faint">
                <th className="pb-2.5">Employee</th>
                <th className="pb-2.5">Journal</th>
                <th className="pb-2.5 text-right">Handled</th>
                <th className="pb-2.5 text-right">Completed</th>
                <th className="pb-2.5 text-right">Pending</th>
                <th className="pb-2.5 text-right">Avg TAT</th>
                <th className="pb-2.5">Productivity</th>
                <th className="pb-2.5 text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: e.color }}>{e.initials}</div>
                      <div><p className="font-medium text-ink">{e.name}</p><p className="text-xs text-faint">{e.role}</p></div>
                    </div>
                  </td>
                  <td className="py-3"><span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">{e.journal}</span></td>
                  <td className="py-3 text-right text-ink">{e.handled}</td>
                  <td className="py-3 text-right text-green-600">{e.completed}</td>
                  <td className="py-3 text-right text-amber-500">{e.pending}</td>
                  <td className="py-3 text-right text-muted">{e.turnaround} d</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full" style={{ width: `${e.score}%`, background: e.score >= 90 ? "#22c55e" : e.score >= 80 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className="text-xs font-semibold text-ink">{e.score}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right"><Delta v={e.trend} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

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
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
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
