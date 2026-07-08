"use client";

import { useMemo, useRef, useState } from "react";
import {
  FileText, BookOpen, CheckCircle2, DollarSign, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, Eye, Pencil, Trash2,
  Upload, Send, Receipt, FileBarChart, BarChart3, Download, Filter, X, Check,
  PlugZap,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Area, AreaChart,
} from "recharts";
import { type IjpsPageData } from "@/lib/ijps-dashboard";
import { cn } from "@/lib/utils";
import { Modal, Field, inputCls } from "@/components/vault-ui";

const axis = { tick: { fill: "var(--faint)", fontSize: 11 }, axisLine: false, tickLine: false } as const;

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-card-lg">{children}</div>;
}

function inrFmt(n: number) {
  return `₹ ${Math.round(n).toLocaleString("en-IN")}`;
}

type ExpenseRow = {
  id: string; date: string; category: string; description: string;
  amount: number; mode: string; paymentTo: string; bill: string; billUrl?: string;
};

// ---------- KPI icon resolver ----------
function KpiIcon({ type, className, color }: { type: string; className?: string; color?: string }) {
  const cls = cn("h-5 w-5", className);
  const style = color ? { color } : undefined;
  switch (type) {
    case "file": return <FileText className={cls} style={style} />;
    case "papers": return <BookOpen className={cls} style={style} />;
    case "check": return <CheckCircle2 className={cls} style={style} />;
    case "revenue": return <DollarSign className={cls} style={style} />;
    case "expense": return <TrendingDown className={cls} style={style} />;
    case "profit": return <TrendingUp className={cls} style={style} />;
    default: return <FileText className={cls} style={style} />;
  }
}

function QuickActionIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn("h-4 w-4", className);
  switch (type) {
    case "submit": return <Send className={cls} />;
    case "expense": return <Receipt className={cls} />;
    case "import": return <Upload className={cls} />;
    case "report": return <FileBarChart className={cls} />;
    case "ads": return <BarChart3 className={cls} />;
    case "download": return <Download className={cls} />;
    default: return <FileText className={cls} />;
  }
}

const JOURNAL_DOMAIN: Record<string, string> = {
  IJPS: "ijpsjournal.com",
  IJSRT: "ijsrtjournal.com",
  IJMPS: "ijmpsjournal.com",
  IJES: "ijesjournal.com",
};

// ---------- Delta chip ----------
function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-emerald-600" : "text-rose-500")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

// ---------- Month filter (real dropdown; filters client-side where the card has date-bearing data) ----------
const MONTH_OPTIONS = ["This Month", "Last 3 Months", "This Year", "All Time"] as const;
type MonthOption = (typeof MONTH_OPTIONS)[number];

function MonthFilter({ value, onChange }: { value: MonthOption; onChange: (v: MonthOption) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 transition-colors"
      >
        {value} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 min-w-[150px] rounded-xl border border-border bg-card p-1 shadow-card-lg">
            {MONTH_OPTIONS.map((o) => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={cn("block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-surface-2", o === value ? "font-semibold text-ink" : "text-muted")}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Filters {label|month, ...} series by a MonthFilter selection, using the last item as "now". */
function filterByMonth<T extends { label?: string; month?: string }>(series: T[], sel: MonthOption): T[] {
  if (!series.length) return series;
  const key = (t: T) => (t.label ?? t.month ?? "").slice(0, 7); // yyyy-mm
  const months = Array.from(new Set(series.map(key))).sort();
  const latest = months[months.length - 1];
  if (!latest) return series;
  if (sel === "This Month") return series.filter((t) => key(t) === latest);
  if (sel === "Last 3 Months") {
    const cutoff = months[Math.max(0, months.length - 3)];
    return series.filter((t) => key(t) >= cutoff);
  }
  if (sel === "This Year") {
    const year = latest.slice(0, 4);
    return series.filter((t) => key(t).startsWith(year));
  }
  return series; // All Time
}

type IjpsClientProps = {
  data: IjpsPageData;
  journalCode?: string;
  journalName?: string;
};

export function IjpsClient({
  data,
  journalCode = "IJPS",
  journalName = "International Journal of Pharmaceutical Sciences",
}: IjpsClientProps) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>(data.expensesTable);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAllTxns, setShowAllTxns] = useState(false);
  const [viewingTxn, setViewingTxn] = useState<IjpsPageData["recentTransactions"][number] | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<string>("All Categories");
  const [filterOpen, setFilterOpen] = useState(false);

  const [moManuscript, setMoManuscript] = useState<MonthOption>("All Time");
  const [moRevenue, setMoRevenue] = useState<MonthOption>("All Time");
  const [moExpenseTrend, setMoExpenseTrend] = useState<MonthOption>("All Time");
  const [moProfitability, setMoProfitability] = useState<MonthOption>("All Time");
  const [moExpBreakdown, setMoExpBreakdown] = useState<MonthOption>("All Time");

  // Add Expense form
  const [expCategory, setExpCategory] = useState("Salaries");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expMode, setExpMode] = useState("UPI");
  const [expDesc, setExpDesc] = useState("");
  const [expPaymentTo, setExpPaymentTo] = useState("");
  const [expBillFile, setExpBillFile] = useState<File | null>(null);
  const billInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  // --- live-recomputed totals (reflect expense CRUD immediately, no reload) ---
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalManuscripts = data.manuscriptsByStatus.reduce((s, m) => s + m.value, 0);
  const totalRevenue = data.revenueBreakdownIjps.reduce((s, r) => s + r.value, 0);
  const netProfit = totalRevenue - totalExpenses;

  const expenseCategories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category));
    return ["All Categories", ...Array.from(set).sort()];
  }, [expenses]);

  const filteredExpenses = useMemo(
    () => (expenseFilter === "All Categories" ? expenses : expenses.filter((e) => e.category === expenseFilter)),
    [expenses, expenseFilter]
  );

  const expensesBreakdownLive = useMemo(() => {
    const colors = ["#6366f1", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#94a3b8", "#14b8a6", "#ec4899"];
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], i) => ({
        name, value,
        pct: totalExpenses ? Math.round((value / totalExpenses) * 100) : 0,
        color: colors[i % colors.length],
      }));
  }, [expenses, totalExpenses]);

  const shownManuscriptOverview = filterByMonth(data.manuscriptOverview, moManuscript);
  const shownRevenueData = filterByMonth(data.revenueData, moRevenue);
  const shownExpenseTrend = filterByMonth(data.expenseTrend, moExpenseTrend);
  const shownProfitability = filterByMonth(data.profitabilityData, moProfitability);

  const journalDomain = JOURNAL_DOMAIN[journalCode];

  // -------------------------------------------------------------- expense API --------------------------------------------------------------
  async function uploadBill(file: File): Promise<{ url: string; name: string } | null> {
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("category", "Journal Expenses");
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      const doc = json.docs?.[0];
      return doc ? { url: doc.url, name: doc.name } : null;
    } catch (err) {
      console.error(err);
      flash("Bill upload failed, saving expense without it");
      return null;
    }
  }

  async function submitExpense() {
    const amountNum = Number(expAmount);
    if (!amountNum || amountNum <= 0) { flash("Enter a valid amount"); return; }
    if (!expDate) { flash("Enter a date"); return; }
    setSaving(true);
    try {
      let bill: { url: string; name: string } | null = null;
      if (expBillFile) bill = await uploadBill(expBillFile);

      const res = await fetch("/api/journals/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalCode, category: expCategory, amount: amountNum, date: expDate,
          mode: expMode, description: expDesc, paymentTo: expPaymentTo,
          billUrl: bill?.url, billName: bill?.name,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add expense");

      const e = json.expense;
      const row: ExpenseRow = {
        id: e.id,
        date: new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        category: e.category, description: e.description, amount: e.amount, mode: e.mode,
        paymentTo: e.paymentTo, bill: e.billName || (e.billUrl ? "Attachment" : "—"), billUrl: e.billUrl,
      };
      setExpenses((p) => [row, ...p]);
      setExpAmount(""); setExpDesc(""); setExpPaymentTo(""); setExpBillFile(null);
      if (billInputRef.current) billInputRef.current.value = "";
      flash("Expense added");
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
          id: editingExpense.id, category: editingExpense.category, amount: editingExpense.amount,
          description: editingExpense.description, paymentTo: editingExpense.paymentTo, mode: editingExpense.mode,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setExpenses((p) => p.map((e) => (e.id === editingExpense.id ? editingExpense : e)));
      setEditingExpense(null);
      flash("Expense updated");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeExpense(id: string) {
    if (!confirm("Delete this expense? This can't be undone.")) return;
    const prev = expenses;
    setExpenses((p) => p.filter((e) => e.id !== id));
    try {
      const res = await fetch("/api/journals/expenses/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      flash("Expense deleted");
    } catch (err) {
      setExpenses(prev);
      flash("Delete failed");
    }
  }

  // -------------------------------------------------------------- exports --------------------------------------------------------------
  function downloadCsv(filename: string, rows: (string | number)[][]) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function exportExpenses() {
    downloadCsv(`${journalCode.toLowerCase()}-expenses.csv`, [
      ["Date", "Category", "Description", "Amount", "Payment Mode", "Payment To", "Bill"],
      ...filteredExpenses.map((e) => [e.date, e.category, e.description, e.amount, e.mode, e.paymentTo, e.bill]),
    ]);
    flash(`Exported ${filteredExpenses.length} expenses`);
  }

  function downloadReport() {
    downloadCsv(`${journalCode.toLowerCase()}-financial-report.csv`, [
      ["Metric", "Value"],
      ...data.ijpsKpis.map((k) => [k.label, k.value]),
      [],
      ["Manuscript Status", "Count", "%"],
      ...data.manuscriptsByStatus.map((m) => [m.name, m.value, `${m.pct}%`]),
      [],
      ["Revenue Source", "Amount", "%"],
      ...data.revenueBreakdownIjps.map((r) => [r.name, r.value, `${r.pct}%`]),
      [],
      ["Expense Category", "Amount", "%"],
      ...expensesBreakdownLive.map((e) => [e.name, e.value, `${e.pct}%`]),
    ]);
    flash("Report downloaded");
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  function runQuickAction(icon: string) {
    switch (icon) {
      case "submit":
        if (journalDomain) window.open(`https://${journalDomain}`, "_blank", "noopener,noreferrer");
        else flash("No public site configured for this journal");
        return;
      case "expense":
        scrollTo("add-expense-card");
        return;
      case "import":
        scrollTo("razorpay-card");
        return;
      case "report":
        scrollTo("expenses-breakdown-card");
        return;
      case "ads":
        window.open("https://ads.google.com", "_blank", "noopener,noreferrer");
        return;
      case "download":
        downloadReport();
        return;
    }
  }

  const visibleTxns = showAllTxns ? data.recentTransactions : data.recentTransactions.slice(0, 8);

  return (
    <div className="animate-fade-up space-y-5">
      {/* Page Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-sm text-muted mb-1">
          <span>Journal Management</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink font-medium">{journalCode}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {journalName}
        </h1>
        <p className="mt-1 text-sm text-muted">Complete overview of manuscripts, revenue, expenses, and analytics for {journalCode}.</p>
      </div>

      {/* ========== KPI CARDS ========== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {data.ijpsKpis.map((kpi) => {
          const isExpense = kpi.label === "Total Expenses";
          const isProfit = kpi.label === "Net Profit / Loss";
          const value = isExpense ? inrFmt(totalExpenses) : isProfit ? inrFmt(netProfit) : kpi.value;
          return (
            <div key={kpi.label} className="card card-pad flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted leading-tight">{kpi.label}</p>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: `${kpi.color}15` }}>
                  <KpiIcon type={kpi.icon} className="h-4 w-4" color={kpi.color} />
                </div>
              </div>
              <p className="text-xl font-semibold tracking-tight text-ink">{value}</p>
              <div className="flex items-center gap-1.5">
                <Delta value={kpi.delta} />
                <span className="text-[11px] text-faint">vs Apr 2025</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========== ROW 2: Manuscript Overview + Status + Quick Actions ========== */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Manuscript Overview */}
        <div className="card card-pad xl:col-span-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink">Manuscript Overview</h3>
            </div>
            <MonthFilter value={moManuscript} onChange={setMoManuscript} />
          </div>
          <div className="flex flex-wrap gap-3 mb-3">
            {[
              { name: "Submitted", color: "#6366f1" },
              { name: "Under Review", color: "#22c55e" },
              { name: "Accepted", color: "#3b82f6" },
              { name: "Rejected", color: "#ef4444" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                {s.name}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={shownManuscriptOverview} margin={{ left: 0, right: 6, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} />
              <YAxis {...axis} width={36} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TipBox>
                      <p className="mb-1 font-medium text-ink">{label}</p>
                      {payload.map((p) => (
                        <p key={p.name} className="flex items-center gap-1.5 text-muted">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                          {p.name}: <span className="font-medium text-ink">{p.value}</span>
                        </p>
                      ))}
                    </TipBox>
                  ) : null
                }
              />
              <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="underReview" name="Under Review" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accepted" name="Accepted" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Manuscripts by Status */}
        <div className="card card-pad">
          <h3 className="font-semibold text-ink mb-4">Manuscripts by Status</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.manuscriptsByStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="95%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.manuscriptsByStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <TipBox>
                        <p className="font-medium text-ink">{payload[0].name}</p>
                        <p className="text-muted">{payload[0].value} ({data.manuscriptsByStatus.find(m => m.name === payload[0].name)?.pct}%)</p>
                      </TipBox>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-ink">{totalManuscripts.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted">Total</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {data.manuscriptsByStatus.map((s) => (
              <div key={s.name} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-muted flex-1">{s.name}</span>
                <span className="font-medium text-ink">{s.value}</span>
                <span className="text-xs text-faint w-12 text-right">({s.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card card-pad">
          <h3 className="font-semibold text-ink mb-4">Quick Actions</h3>
          <div className="space-y-1">
            {data.quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => runQuickAction(a.icon)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink hover:bg-surface-2 transition-colors group"
              >
                <QuickActionIcon type={a.icon} className="text-muted group-hover:text-ink" />
                <span className="flex-1 text-left">{a.label}</span>
                <ChevronRight className="h-4 w-4 text-faint group-hover:text-muted" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========== ROW 3: Revenue + Razorpay + Google Ads ========== */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Revenue Overview */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Revenue Overview</h3>
            <MonthFilter value={moRevenue} onChange={setMoRevenue} />
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted">Total Revenue</p>
            <p className="text-2xl font-semibold text-ink mt-0.5">{inrFmt(totalRevenue)}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Delta value={28.6} />
              <span className="text-[11px] text-faint">vs Apr 2025</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={shownRevenueData} margin={{ left: 0, right: 0, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} width={30} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <TipBox><p className="font-medium text-ink">{label}</p><p className="text-muted">{inrFmt(Number(payload[0].value))}</p></TipBox>
                  ) : null
                }
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {data.revenueBreakdownIjps.map((r) => (
              <div key={r.name} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                <span className="text-muted flex-1 truncate">{r.name}</span>
                <span className="font-medium text-ink">{inrFmt(r.value)}</span>
                <span className="text-xs text-faint w-12 text-right">({r.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Income (Razorpay) */}
        <div id="razorpay-card" className="card card-pad scroll-mt-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Income (Razorpay)</h3>
            <MonthFilter value={moRevenue} onChange={setMoRevenue} />
          </div>
          <div className="mb-6">
            <p className="text-xs text-muted">Total Collected</p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-2xl font-semibold text-ink">{inrFmt(data.razorpayIncome.total)}</p>
              <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1" fill="currentColor"><path d="M7.076 2h2.368l-1.6 4.667h2.789L6.5 14l1.263-5.333H5.394L7.076 2zm5.448 0h2.368l-1.6 4.667h2.789L11.948 14l1.263-5.333h-2.369L12.524 2z" /></svg>
                Razorpay
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Delta value={28.6} />
              <span className="text-[11px] text-faint">vs Apr 2025</span>
            </div>
          </div>

          <div className="mb-2">
            <p className="text-sm font-medium text-ink mb-3">Top Payment Sources</p>
            {data.razorpayIncome.sources.length === 0 ? (
              <p className="text-xs text-faint">No payment-method data available yet.</p>
            ) : (
              <div className="space-y-3">
                {data.razorpayIncome.sources.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted">{s.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-ink">{s.pct}%</span>
                        <span className="text-xs text-faint">{inrFmt(s.amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Google Ads Overview — live from the Google Ads API when this journal's account is configured */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Google Ads Overview</h3>
          </div>
          {data.googleAds.connected ? (
            <>
              <div className="mb-6">
                <p className="text-xs text-muted">Spend This Month</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-2xl font-semibold text-ink">{inrFmt(data.googleAds.totalSpend)}</p>
                  <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">Live</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Delta value={data.googleAds.delta} />
                  <span className="text-[11px] text-faint">vs last month</span>
                </div>
              </div>
              <div className="mb-2">
                <p className="text-sm font-medium text-ink mb-3">Top Campaigns</p>
                {data.googleAds.metrics.length === 0 ? (
                  <p className="text-xs text-faint">No campaign spend recorded this month.</p>
                ) : (
                  <div className="space-y-2.5">
                    {data.googleAds.metrics.map((m) => (
                      <div key={m.label} className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted">{m.label}</span>
                        <span className="shrink-0 text-xs font-medium text-ink">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-faint">
                <PlugZap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Google Ads isn't connected</p>
                <p className="mt-1 max-w-[220px] text-xs text-muted">
                  {data.googleAds.error || "Link a Google Ads account to see spend, clicks, and conversions here."}
                </p>
              </div>
              <button
                onClick={() => window.open("https://ads.google.com", "_blank", "noopener,noreferrer")}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
              >
                Open Google Ads <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========== ROW 4: Expenses + Expense Trend + Profitability ========== */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Expenses Overview */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Expenses Overview</h3>
            <MonthFilter value={moExpBreakdown} onChange={setMoExpBreakdown} />
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted">Total Expenses</p>
            <p className="text-2xl font-semibold text-ink mt-0.5">{inrFmt(totalExpenses)}</p>
            <p className="text-[11px] text-faint mt-1">{expenses.length} recorded expense{expenses.length === 1 ? "" : "s"}</p>
          </div>
          {expensesBreakdownLive.length === 0 ? (
            <div className="grid place-items-center py-10 text-center">
              <p className="text-sm text-muted">No expenses recorded yet</p>
              <button onClick={() => scrollTo("add-expense-card")} className="mt-2 text-xs font-medium text-brand hover:underline">Add your first expense</button>
            </div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={expensesBreakdownLive} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="95%" paddingAngle={2} stroke="none">
                      {expensesBreakdownLive.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <TipBox><p className="font-medium text-ink">{payload[0].name}</p><p className="text-muted">{inrFmt(Number(payload[0].value))}</p></TipBox>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {expensesBreakdownLive.map((e) => (
                  <div key={e.name} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-muted flex-1 truncate">{e.name}</span>
                    <span className="font-medium text-ink">{inrFmt(e.value)}</span>
                    <span className="text-xs text-faint w-12 text-right">({e.pct}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Expense Trend */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-ink">Expense Trend</h3>
            <MonthFilter value={moExpenseTrend} onChange={setMoExpenseTrend} />
          </div>
          {shownExpenseTrend.length === 0 ? (
            <div className="grid h-[260px] place-items-center text-sm text-muted">No expense history yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={shownExpenseTrend} margin={{ left: 0, right: 6, top: 5 }}>
                <defs>
                  <linearGradient id="gExpTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" {...axis} />
                <YAxis {...axis} width={36} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TipBox><p className="font-medium text-ink">{label}</p><p className="text-muted">{inrFmt(Number(payload[0].value))}</p></TipBox>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2.5} fill="url(#gExpTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profitability Overview */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Profitability Overview</h3>
            <MonthFilter value={moProfitability} onChange={setMoProfitability} />
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted">Net Profit</p>
            <p className="text-2xl font-semibold text-ink mt-0.5">{inrFmt(netProfit)}</p>
            <p className="text-[11px] text-faint mt-1">Revenue {inrFmt(totalRevenue)} − Expenses {inrFmt(totalExpenses)}</p>
          </div>
          <div className="flex flex-wrap gap-3 mb-3">
            {[
              { name: "Revenue", color: "#6366f1" },
              { name: "Expenses", color: "#ef4444" },
              { name: "Profit", color: "#22c55e" },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                {s.name}
              </div>
            ))}
          </div>
          {shownProfitability.length === 0 ? (
            <div className="grid h-[200px] place-items-center text-sm text-muted">No expense history yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={shownProfitability} margin={{ left: 0, right: 0, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" {...axis} />
                <YAxis {...axis} width={30} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <TipBox>
                        <p className="mb-1 font-medium text-ink">{label}</p>
                        {payload.map((p) => (
                          <p key={p.name} className="flex items-center gap-1.5 text-muted">
                            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                            {p.name}: <span className="font-medium text-ink">{inrFmt(Number(p.value))}</span>
                          </p>
                        ))}
                      </TipBox>
                    ) : null
                  }
                />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ========== ROW 5: Add Expense + Recent Transactions ========== */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Add Expense */}
        <div id="add-expense-card" className="card card-pad scroll-mt-4">
          <h3 className="font-semibold text-ink mb-4">Add Expense</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                >
                  <option>Google Ads</option>
                  <option>Salaries</option>
                  <option>Hosting &amp; Domain</option>
                  <option>Software &amp; Tools</option>
                  <option>Publication Charges</option>
                  <option>Other Expenses</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Payment Mode</label>
                <select
                  value={expMode}
                  onChange={(e) => setExpMode(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                >
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Card</option>
                  <option>Cash</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Paid To</label>
              <input
                type="text"
                value={expPaymentTo}
                onChange={(e) => setExpPaymentTo(e.target.value)}
                placeholder="e.g. Hostinger, Rahul Sharma..."
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Description</label>
              <textarea
                rows={2}
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Enter description.."
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand resize-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Attach Bill / Invoice (Optional)</label>
              <input
                ref={billInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setExpBillFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => billInputRef.current?.click()}
                className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-2 p-4 text-center hover:bg-surface-2/70 transition-colors"
              >
                <div>
                  <Upload className="h-5 w-5 text-faint mx-auto mb-1" />
                  {expBillFile ? (
                    <p className="text-xs font-medium text-ink truncate max-w-[220px]">{expBillFile.name}</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted"><span className="font-medium text-ink">Choose file</span> or drag & drop</p>
                      <p className="text-[11px] text-faint mt-0.5">PDF, JPG, PNG (Max. 5MB)</p>
                    </>
                  )}
                </div>
              </button>
            </div>
            <button
              onClick={submitExpense}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add Expense"}
            </button>
          </div>
        </div>

        {/* Recent Transactions (real Razorpay income — read-only) */}
        <div className="card card-pad xl:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-ink">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-faint border-b border-border">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 text-right font-medium">Amount (₹)</th>
                  <th className="pb-3 font-medium">Payment Mode</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleTxns.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-sm text-muted">No transactions found</td></tr>
                ) : visibleTxns.map((t) => {
                  const isExpense = t.type === "Expense";
                  return (
                    <tr key={t.id} className="group hover:bg-surface-2 transition-colors">
                      <td className="py-3 text-muted whitespace-nowrap">{t.date}</td>
                      <td className="py-3">
                        <span className={cn("chip", isExpense ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 text-muted">{t.category}</td>
                      <td className="py-3 text-ink">{t.description}</td>
                      <td className={cn("py-3 text-right font-semibold", isExpense ? "text-ink" : "text-emerald-600")}>
                        {isExpense ? "" : "+"}{t.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-muted">{t.mode}</td>
                      <td className="py-3 text-muted">{t.source || "—"}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setViewingTxn(t)}
                          title="View details"
                          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.recentTransactions.length > 8 && (
            <button
              onClick={() => setShowAllTxns((v) => !v)}
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showAllTxns ? "Show Fewer" : `View All Transactions (${data.recentTransactions.length})`} <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========== ROW 6: Expenses Breakdown Table ========== */}
      <div id="expenses-breakdown-card" className="card card-pad scroll-mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-ink">Expenses Breakdown</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted hover:bg-surface-2 transition-colors"
              >
                <Filter className="h-3.5 w-3.5" /> {expenseFilter === "All Categories" ? "Filter" : expenseFilter}
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 z-50 mt-1 min-w-[180px] max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-card-lg">
                    {expenseCategories.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setExpenseFilter(c); setFilterOpen(false); }}
                        className={cn("block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-surface-2", c === expenseFilter ? "font-semibold text-ink" : "text-muted")}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={exportExpenses}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-medium text-white hover:bg-rose-600 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-faint border-b border-border">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 text-right font-medium">Amount (₹)</th>
                <th className="pb-3 font-medium">Payment Mode</th>
                <th className="pb-3 font-medium">Payment To</th>
                <th className="pb-3 font-medium">Bill / Invoice</th>
                <th className="pb-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-muted">No expenses recorded yet — add one above.</td></tr>
              ) : filteredExpenses.map((e) => (
                <tr key={e.id} className="group hover:bg-surface-2 transition-colors">
                  <td className="py-3 text-muted whitespace-nowrap">{e.date}</td>
                  <td className="py-3 text-muted">{e.category}</td>
                  <td className="py-3 text-ink">{e.description || "—"}</td>
                  <td className="py-3 text-right font-semibold text-ink">{e.amount.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-muted">{e.mode}</td>
                  <td className="py-3 text-muted">{e.paymentTo || "—"}</td>
                  <td className="py-3">
                    {e.billUrl ? (
                      <a href={e.billUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{e.bill}</a>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => { setEditingExpense(e); }}
                        title="Edit"
                        className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeExpense(e.id)}
                        title="Delete"
                        className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="py-3 font-semibold text-ink" colSpan={3}>Total</td>
                  <td className="py-3 text-right font-bold text-ink">
                    {inrFmt(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2 text-xs text-faint">
        <p>&copy; 2025 Journal Hub. All rights reserved.</p>
        <div className="flex gap-4">
          <span className="hover:text-muted cursor-pointer">Privacy Policy</span>
          <span className="hover:text-muted cursor-pointer">Terms of Service</span>
        </div>
      </div>

      {/* ---------- Transaction detail modal ---------- */}
      {viewingTxn && (
        <Modal open title="Transaction Details" onClose={() => setViewingTxn(null)} size="sm">
          <div className="space-y-3 text-sm">
            <Row label="Date" value={viewingTxn.date} />
            <Row label="Type" value={viewingTxn.type} />
            <Row label="Category" value={viewingTxn.category} />
            <Row label="Description" value={viewingTxn.description} />
            <Row label="Amount" value={inrFmt(viewingTxn.amount)} />
            <Row label="Payment Mode" value={viewingTxn.mode} />
            <Row label="Source" value={viewingTxn.source || "—"} />
          </div>
          <p className="mt-4 text-[11px] text-faint">This is a real record from the journal's payment database — read-only.</p>
        </Modal>
      )}

      {/* ---------- Edit expense modal ---------- */}
      {editingExpense && (
        <Modal open title="Edit Expense" onClose={() => setEditingExpense(null)} size="sm">
          <div className="space-y-4">
            <Field label="Category">
              <select
                className={inputCls}
                value={editingExpense.category}
                onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
              >
                <option>Google Ads</option>
                <option>Salaries</option>
                <option>Hosting &amp; Domain</option>
                <option>Software &amp; Tools</option>
                <option>Publication Charges</option>
                <option>Other Expenses</option>
              </select>
            </Field>
            <Field label="Amount (₹)">
              <input
                ref={editInputRef}
                type="number"
                className={inputCls}
                value={editingExpense.amount}
                onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Paid To">
              <input
                className={inputCls}
                value={editingExpense.paymentTo}
                onChange={(e) => setEditingExpense({ ...editingExpense, paymentTo: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={2}
                className={cn(inputCls, "resize-none")}
                value={editingExpense.description}
                onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setEditingExpense(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
            <button onClick={saveEditedExpense} disabled={saving} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card-lg">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {toast}</span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink text-right">{value}</span>
    </div>
  );
}
