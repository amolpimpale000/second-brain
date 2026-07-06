"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  TrendingUp,
  BarChart3,
  Users,
  Home,
  CalendarDays,
  CheckSquare,
  Car,
  Plane,
  Shield,
  ShoppingBag,
  UtensilsCrossed,
  Lightbulb,
  LayoutGrid,
  Zap,
  Play,
  CreditCard,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Plus,
  Landmark,
  Package,
  Music,
  Smartphone,
  Wifi,
  Receipt,
  User,
  Check,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { cn, inr } from "@/lib/utils";
import {
  kpis,
  cashFlowWeekly,
  expenseBreakdown,
  savingsGoals,
  recentTxns,
  budgetVsActual,
  topSpending,
  accounts,
  upcomingBills,
  loans,
  iOwe,
  healthScore,
} from "@/lib/finance-data";

/* ═══════════════════════════════════════════════════════════════════════════
   Shared primitives
   ═══════════════════════════════════════════════════════════════════════════ */
const axis = { tick: { fill: "#9ca3af", fontSize: 11 }, axisLine: false, tickLine: false } as const;

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[20px] border border-border bg-card p-5 shadow-card", className)}>{children}</div>;
}

function Head({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {right}
    </div>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs font-medium text-muted hover:text-ink transition-colors">
      View All
    </Link>
  );
}

function MonthDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors"
      >
        This Month <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-xl border border-border bg-card p-1 shadow-card-lg">
          {["This Month", "Last Month", "Last 3 Months", "This Year"].map((m) => (
            <button
              key={m}
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-muted hover:bg-surface-2 hover:text-ink"
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={d} margin={{ top: 6, bottom: 4, left: 2, right: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function yFmt(v: number) {
  if (v === 0) return "₹ 0";
  if (v < 100000) return `₹ ${v / 1000}K`;
  const l = v / 100000;
  return `₹ ${Number.isInteger(l) ? l : l.toFixed(1)}L`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Icon maps
   ═══════════════════════════════════════════════════════════════════════════ */
const kpiIcon: Record<string, React.ElementType> = {
  "Total Income": CheckSquare,
  "Total Expenses": CalendarDays,
  "Net Savings": PiggyBank,
  "Total Investments": BarChart3,
  "Total Loans": Users,
  "Net Worth": Home,
};

const goalIcon: Record<string, React.ElementType> = { plane: Plane, bike: Car, shield: Shield };

const txnIcon: Record<string, { icon: React.ElementType; bg: string; fg: string }> = {
  salary: { icon: Wallet, bg: "bg-emerald-50", fg: "text-emerald-600" },
  grocery: { icon: ShoppingBag, bg: "bg-red-50", fg: "text-red-500" },
  transport: { icon: Car, bg: "bg-slate-100", fg: "text-slate-600" },
  bill: { icon: Zap, bg: "bg-amber-50", fg: "text-amber-500" },
  entertainment: { icon: Play, bg: "bg-red-50", fg: "text-red-500" },
};

const spendIcon: Record<string, { icon: React.ElementType; bg: string; fg: string }> = {
  Housing: { icon: Home, bg: "bg-emerald-50", fg: "text-emerald-500" },
  "Food & Dining": { icon: UtensilsCrossed, bg: "bg-amber-50", fg: "text-amber-500" },
  Transport: { icon: Car, bg: "bg-blue-50", fg: "text-blue-500" },
  Shopping: { icon: ShoppingBag, bg: "bg-pink-50", fg: "text-pink-500" },
  Utilities: { icon: Lightbulb, bg: "bg-purple-50", fg: "text-purple-500" },
  Others: { icon: LayoutGrid, bg: "bg-slate-100", fg: "text-slate-500" },
};

const billIcon: Record<string, React.ElementType> = {
  netflix: Play,
  amazon: Package,
  spotify: Music,
  mobile: Smartphone,
  internet: Wifi,
};


/* ═══════════════════════════════════════════════════════════════════════════
   Health gauge (semicircle speedometer)
   ═══════════════════════════════════════════════════════════════════════════ */
function HealthGauge({ score, max = 100 }: { score: number; max?: number }) {
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
          <CheckCircle2 className="h-3.5 w-3.5" /> {healthScore.label}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section components
   ═══════════════════════════════════════════════════════════════════════════ */

function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((k) => {
        const Icon = kpiIcon[k.label] ?? Wallet;
        const up = k.delta >= 0;
        return (
          <Card key={k.label} className="!p-4">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: `${k.color}18` }}>
                <Icon className="h-[18px] w-[18px]" style={{ color: k.color }} />
              </div>
              <p className="text-[11px] font-medium text-muted leading-tight">{k.label}</p>
            </div>
            <p className="mt-2.5 text-[17px] font-bold leading-none text-ink">₹ {k.value.toLocaleString("en-IN")}</p>
            <div className="mt-2 flex items-center gap-1">
              {up ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
              <span className={cn("text-[10px] font-semibold", up ? "text-green-500" : "text-red-500")}>{Math.abs(k.delta)}%</span>
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
}

function CashFlow() {
  return (
    <Card>
      <Head title="Cash Flow Overview" right={<MonthDropdown />} />
      <div className="mb-2 flex gap-4 text-[11px]">
        {[{ n: "Income", c: "#22c55e" }, { n: "Expenses", c: "#ef4444" }, { n: "Savings", c: "#3b82f6" }].map((s) => (
          <span key={s.n} className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.c }} />{s.n}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={cashFlowWeekly} margin={{ left: -6, right: 4, top: 5 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="week" {...axis} interval={0} />
          <YAxis {...axis} width={48} domain={[0, 150000]} ticks={[0, 50000, 100000, 150000]} tickFormatter={yFmt} />
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
}

function ExpenseBreakdown() {
  const totalExp = expenseBreakdown.reduce((s, c) => s + c.value, 0);
  return (
    <Card>
      <Head title="Expense Breakdown" right={<MonthDropdown />} />
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="92%" paddingAngle={2} stroke="none">
                {expenseBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) =>
                active && payload?.length ? (
                  <Tip><p className="font-medium text-ink">{String(payload[0].name)}</p><p className="text-muted">{inr(Number(payload[0].value))}</p></Tip>
                ) : null
              } />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-ink">₹ {totalExp.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-faint">Total</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {expenseBreakdown.map((c) => (
            <div key={c.name} className="flex items-center gap-2 text-[12px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
              <span className="flex-1 truncate text-muted">{c.name}</span>
              <span className="w-[36px] text-right text-faint">{c.pct}%</span>
              <span className="w-[62px] text-right font-medium text-ink">₹ {c.value.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SavingsGoals() {
  return (
    <Card>
      <Head title="Savings Goals" right={<ViewAll href="/goals" />} />
      <div className="space-y-4">
        {savingsGoals.map((g) => {
          const GI = goalIcon[g.icon] ?? PiggyBank;
          return (
            <div key={g.id} className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${g.color}18` }}>
                <GI className="h-4 w-4" style={{ color: g.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-ink">{g.name}</p>
                  <span className="text-[11px] font-bold text-ink">{g.pct}%</span>
                </div>
                <p className="mt-0.5 text-[10px] text-faint">₹ {g.saved.toLocaleString("en-IN")} of ₹ {g.target.toLocaleString("en-IN")}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: g.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <AddButton label="Add New Goal" />
    </Card>
  );
}

function AddButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border py-2 text-[11px] font-medium text-brand hover:bg-surface-2 transition-colors"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}


function RecentTransactions() {
  return (
    <Card>
      <Head title="Recent Transactions" right={<ViewAll href="/finances" />} />
      <div className="space-y-0.5">
        {recentTxns.map((t) => {
          const s = txnIcon[t.icon] ?? { icon: CreditCard, bg: "bg-slate-100", fg: "text-slate-500" };
          const Icon = s.icon;
          const credit = t.type === "credit";
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-surface-2/50 transition-colors">
              <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", s.bg)}>
                <Icon className={cn("h-4 w-4", s.fg)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink">{t.name}</p>
                <p className="text-[10px] text-faint">{t.category}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-[12px] font-bold", credit ? "text-green-600" : "text-red-500")}>
                  {credit ? "+ " : "- "}₹ {t.amount.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-faint">{t.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BudgetVsActual() {
  return (
    <Card>
      <Head title="Budget vs Actual" right={<MonthDropdown />} />
      <div className="mb-2 grid grid-cols-[1fr_58px_58px_54px] gap-1 text-[10px] font-medium text-faint">
        <span>Category</span><span className="text-right">Budget</span><span className="text-right">Actual</span><span className="text-right">Status</span>
      </div>
      <div className="space-y-3">
        {budgetVsActual.map((b) => (
          <div key={b.category} className="grid grid-cols-[1fr_58px_58px_54px] items-center gap-1">
            <span className="truncate text-[11px] font-medium text-ink">{b.category}</span>
            <span className="text-right text-[11px] text-muted">₹ {b.budget.toLocaleString("en-IN")}</span>
            <span className="text-right text-[11px] font-medium text-ink">₹ {b.actual.toLocaleString("en-IN")}</span>
            <div className="flex items-center justify-end gap-1">
              <div className="h-1.5 w-7 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${b.pct}%` }} />
              </div>
              <span className="w-[26px] text-right text-[10px] font-semibold text-muted">{b.pct}%</span>
            </div>
          </div>
        ))}
      </div>
      <Link href="/finances" className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View Full Budget Report <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

function TopSpending() {
  return (
    <Card>
      <Head title="Top Spending Categories" right={<MonthDropdown />} />
      <div className="space-y-2.5">
        {topSpending.map((c) => {
          const s = spendIcon[c.name] ?? { icon: LayoutGrid, bg: "bg-slate-100", fg: "text-slate-500" };
          const Icon = s.icon;
          return (
            <div key={c.name} className="flex items-center gap-2.5">
              <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", s.bg)}>
                <Icon className={cn("h-4 w-4", s.fg)} />
              </div>
              <span className="flex-1 truncate text-[12px] text-ink">{c.name}</span>
              <span className="text-[12px] font-semibold text-ink">₹ {c.value.toLocaleString("en-IN")}</span>
              <span className="w-[36px] text-right text-[11px] text-faint">{c.pct}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AccountsOverview() {
  return (
    <Card>
      <Head title="Accounts Overview" right={<ViewAll href="/finances" />} />
      <div className="space-y-3">
        {accounts.map((a) => {
          const Icon = a.icon === "cash" ? Wallet : Landmark;
          return (
            <div key={a.id} className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: `${a.color}18` }}>
                <Icon className="h-4 w-4" style={{ color: a.color }} />
              </div>
              <p className="flex-1 truncate text-[12px] font-medium text-ink">{a.name}{a.type ? ` - ${a.type}` : ""}</p>
              <p className="shrink-0 text-[12px] font-bold text-ink">₹ {a.balance.toLocaleString("en-IN")}</p>
            </div>
          );
        })}
      </div>
      <AddButton label="Add Account" />
    </Card>
  );
}

function UpcomingBills() {
  return (
    <Card>
      <Head title="Upcoming Bills & Subscriptions" right={<ViewAll href="/finances" />} />
      <div className="space-y-3">
        {upcomingBills.map((b) => {
          const Icon = billIcon[b.icon] ?? Receipt;
          return (
            <div key={b.id} className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${b.color}18` }}>
                <Icon className="h-4 w-4" style={{ color: b.color }} />
              </div>
              <p className="flex-1 truncate text-[12px] font-medium text-ink">{b.name}</p>
              <div className="shrink-0 text-right">
                <p className="text-[12px] font-bold text-ink">₹ {b.amount.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-faint">{b.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LoansOverview() {
  return (
    <Card>
      <Head title="Loans Overview" right={<ViewAll href="/loans" />} />
      <div className="space-y-4">
        {loans.map((l) => {
          const Icon = l.icon === "home" ? Home : User;
          const paidPct = Math.round(((l.principal - l.remaining) / l.principal) * 100);
          return (
            <div key={l.id}>
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${l.color}18` }}>
                  <Icon className="h-4 w-4" style={{ color: l.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-ink">{l.name}</p>
                  <p className="text-[14px] font-bold text-ink">₹ {l.principal.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-faint">Interest Rate {l.rate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-faint">Remaining</p>
                  <p className="text-[12px] font-bold text-ink">₹ {l.remaining.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/loans" className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View All Loans <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

function IOwe() {
  return (
    <Card>
      <Head title="I Owe (to others)" right={<ViewAll href="/finances" />} />
      <div className="space-y-3.5">
        {iOwe.map((o) => (
          <div key={o.id} className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-ink">{o.name}</p>
              <p className="text-[10px] text-faint">Due on {o.due}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[12px] font-bold text-ink">₹ {o.amount.toLocaleString("en-IN")}</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">{o.status}</span>
            </div>
          </div>
        ))}
      </div>
      <AddButton label="Add New" />
    </Card>
  );
}

function FinancialHealth() {
  return (
    <Card>
      <Head title="Financial Health Score" />
      <div className="flex items-center gap-3">
        <HealthGauge score={healthScore.score} max={healthScore.max} />
        <div className="flex-1 space-y-2">
          {healthScore.metrics.map((m) => (
            <div key={m.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> {m.name}
              </span>
              <span className={cn("text-[11px] font-semibold", m.status === "Excellent" ? "text-green-600" : "text-amber-500")}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>
      <Link href="/analytics" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View Full Report <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════════════════════ */
export function FinancesClient() {
  return (
    <div className="animate-fade-up space-y-4">
      <KpiCards />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_300px]">
        <CashFlow />
        <ExpenseBreakdown />
        <SavingsGoals />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_300px]">
        <RecentTransactions />
        <BudgetVsActual />
        <TopSpending />
        <div className="space-y-4">
          <AccountsOverview />
          <UpcomingBills />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <LoansOverview />
        <IOwe />
        <FinancialHealth />
      </div>
    </div>
  );
}
