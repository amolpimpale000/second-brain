"use client";

import { useState } from "react";
import {
  FileText, BookOpen, CheckCircle2, DollarSign, TrendingDown, TrendingUp,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, Eye, Pencil, Trash2,
  Upload, Send, Receipt, FileBarChart, BarChart3, Download, Filter,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Area, AreaChart, Legend,
} from "recharts";
import { type IjpsPageData } from "@/lib/ijps-dashboard";
import { cn } from "@/lib/utils";

const axis = { tick: { fill: "var(--faint)", fontSize: 11 }, axisLine: false, tickLine: false } as const;

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-card-lg">{children}</div>;
}

function inrFmt(n: number) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}

// ---------- KPI icon resolver ----------
function KpiIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn("h-5 w-5", className);
  switch (type) {
    case "file": return <FileText className={cls} />;
    case "papers": return <BookOpen className={cls} />;
    case "check": return <CheckCircle2 className={cls} />;
    case "revenue": return <DollarSign className={cls} />;
    case "expense": return <TrendingDown className={cls} />;
    case "profit": return <TrendingUp className={cls} />;
    default: return <FileText className={cls} />;
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

// ---------- Month filter ----------
function MonthFilter() {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
      This Month <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

export function IjpsClient({ data }: { data: IjpsPageData }) {
  const [expCategory, setExpCategory] = useState("Google Ads");
  const [expAmount, setExpAmount] = useState("0.00");
  const [expDate, setExpDate] = useState("23 May 2025");
  const [expMode, setExpMode] = useState("UPI");
  const [expDesc, setExpDesc] = useState("");

  const totalExpenses = data.expensesTable.reduce((s, e) => s + e.amount, 0);
  const totalManuscripts = data.manuscriptsByStatus.reduce((s, m) => s + m.value, 0);
  const totalRevenue = data.revenueBreakdownIjps.reduce((s, r) => s + r.value, 0);

  return (
    <div className="animate-fade-up space-y-5">
      {/* Page Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-sm text-muted mb-1">
          <span>Journal Management</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink font-medium">IJPS</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          International Journal of Pharmaceutical Sciences
        </h1>
        <p className="mt-1 text-sm text-muted">Complete overview of manuscripts, revenue, expenses, and analytics for IJPS.</p>
      </div>

      {/* ========== KPI CARDS ========== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {data.ijpsKpis.map((kpi) => (
          <div key={kpi.label} className="card card-pad flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted leading-tight">{kpi.label}</p>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: `${kpi.color}15` }}>
                <KpiIcon type={kpi.icon} className="h-4 w-4" style-color={kpi.color} />
              </div>
            </div>
            <p className="text-xl font-semibold tracking-tight text-ink">{kpi.value}</p>
            <div className="flex items-center gap-1.5">
              <Delta value={kpi.delta} />
              <span className="text-[11px] text-faint">vs Apr 2025</span>
            </div>
          </div>
        ))}
      </div>

      {/* ========== ROW 2: Manuscript Overview + Status + Quick Actions ========== */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Manuscript Overview */}
        <div className="card card-pad xl:col-span-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-ink">Manuscript Overview</h3>
            </div>
            <MonthFilter />
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
            <LineChart data={data.manuscriptOverview} margin={{ left: 0, right: 6, top: 5 }}>
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
              <button key={a.label} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink hover:bg-surface-2 transition-colors group">
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
            <MonthFilter />
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted">Total Revenue</p>
            <p className="text-2xl font-semibold text-ink mt-0.5">{`₹ ${totalRevenue.toLocaleString("en-IN")}`}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Delta value={28.6} />
              <span className="text-[11px] text-faint">vs Apr 2025</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.revenueData} margin={{ left: 0, right: 0, top: 5 }}>
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
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Income (Razorpay)</h3>
            <MonthFilter />
          </div>
          <div className="mb-6">
            <p className="text-xs text-muted">Total Collected</p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-2xl font-semibold text-ink">{`₹ ${data.razorpayIncome.total.toLocaleString("en-IN")}`}</p>
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

          <div className="mb-6">
            <p className="text-sm font-medium text-ink mb-3">Top Payment Sources</p>
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
          </div>
        </div>

        {/* Google Ads Overview */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Google Ads Overview</h3>
            <MonthFilter />
          </div>
          <div className="mb-5">
            <p className="text-xs text-muted">Total Spend</p>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-2xl font-semibold text-ink">₹ 52,430</p>
              <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 mr-1" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Delta value={14.7} />
              <span className="text-[11px] text-faint">vs Apr 2025</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {data.googleAds.metrics.map((m) => (
              <div key={m.label} className="rounded-xl bg-surface-2 p-3 text-center">
                <p className="text-[11px] text-muted mb-1">{m.label}</p>
                <p className="text-sm font-semibold text-ink">{m.value}</p>
                <Delta value={m.delta} />
              </div>
            ))}
          </div>

          <button className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View Full Google Ads Report <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ========== ROW 4: Expenses + Expense Trend + Profitability ========== */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Expenses Overview */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Expenses Overview</h3>
            <MonthFilter />
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted">Total Expenses</p>
            <p className="text-2xl font-semibold text-ink mt-0.5">₹ 1,82,340</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Delta value={15.3} />
              <span className="text-[11px] text-faint">vs Apr 2025</span>
            </div>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.expensesBreakdownIjps} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="95%" paddingAngle={2} stroke="none">
                  {data.expensesBreakdownIjps.map((d, i) => <Cell key={i} fill={d.color} />)}
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
            {data.expensesBreakdownIjps.map((e) => (
              <div key={e.name} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                <span className="text-muted flex-1 truncate">{e.name}</span>
                <span className="font-medium text-ink">{inrFmt(e.value)}</span>
                <span className="text-xs text-faint w-12 text-right">({e.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Trend */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-ink">Expense Trend</h3>
            <MonthFilter />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.expenseTrend} margin={{ left: 0, right: 6, top: 5 }}>
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
        </div>

        {/* Profitability Overview */}
        <div className="card card-pad">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-ink">Profitability Overview</h3>
            <MonthFilter />
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted">Net Profit</p>
            <p className="text-2xl font-semibold text-ink mt-0.5">₹ 4,43,110</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Delta value={33.7} />
              <span className="text-[11px] text-faint">vs Apr 2025</span>
            </div>
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
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.profitabilityData} margin={{ left: 0, right: 0, top: 5 }}>
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
        </div>
      </div>

      {/* ========== ROW 5: Add Expense + Recent Transactions ========== */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Add Expense */}
        <div className="card card-pad">
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
                  type="text"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand transition-colors"
                  />
                </div>
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
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-2 p-4 text-center">
                <div>
                  <Upload className="h-5 w-5 text-faint mx-auto mb-1" />
                  <p className="text-xs text-muted"><span className="font-medium text-ink">Choose file</span> or drag & drop</p>
                  <p className="text-[11px] text-faint mt-0.5">PDF, JPG, PNG (Max. 5MB)</p>
                </div>
              </div>
            </div>
            <button className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
              Add Expense
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
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
                {data.recentTransactions.map((t) => {
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
                        <div className="inline-flex items-center gap-1.5">
                          <button className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                          <button className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                          <button className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View All Transactions <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ========== ROW 6: Expenses Breakdown Table ========== */}
      <div className="card card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-ink">Expenses Breakdown</h3>
            <MonthFilter />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-medium text-white hover:bg-rose-600 transition-colors">
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
              {data.expensesTable.map((e) => (
                <tr key={e.id} className="group hover:bg-surface-2 transition-colors">
                  <td className="py-3 text-muted whitespace-nowrap">{e.date}</td>
                  <td className="py-3 text-muted">{e.category}</td>
                  <td className="py-3 text-ink">{e.description}</td>
                  <td className="py-3 text-right font-semibold text-ink">{e.amount.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-muted">{e.mode}</td>
                  <td className="py-3 text-muted">{e.paymentTo}</td>
                  <td className="py-3">
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">{e.bill}</span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                      <button className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="py-3 font-semibold text-ink" colSpan={3}>Total</td>
                <td className="py-3 text-right font-bold text-ink">{inrFmt(totalExpenses)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
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
    </div>
  );
}
