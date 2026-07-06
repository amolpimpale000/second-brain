"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  CreditCard,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Plus,
  Landmark,
  Smartphone,
  Wifi,
  Receipt,
  User,
  Check,
  CheckCircle2,
} from "lucide-react";
import { FaAmazon, FaSpotify, FaGoogle, FaInstagram } from "react-icons/fa";

/* Custom brand icons not in react-icons */
function NetflixIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z" />
    </svg>
  );
}

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

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs font-medium text-muted hover:text-ink transition-colors">
      View All
    </Link>
  );
}

function MonthDropdown() {
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
  netflix: { icon: NetflixIcon, bg: "bg-red-50", fg: "text-red-600" },
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
  netflix: NetflixIcon,
  amazon: FaAmazon,
  spotify: FaSpotify,
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
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                style={{ background: `linear-gradient(135deg, ${k.color}20, ${k.color}08)` }}
              >
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

function SavingsGoals({ setModal }: { setModal: () => void }) {
  return (
    <Card>
      <Head title="Savings Goals" right={<ViewAll href="/goals" />} />
      <div className="space-y-3">
        {savingsGoals.map((g) => {
          const GI = goalIcon[g.icon] ?? PiggyBank;
          return (
            <div key={g.id} className="flex items-start gap-3">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]"
                style={{ background: `linear-gradient(135deg, ${g.color}20, ${g.color}08)` }}
              >
                <GI className="h-3.5 w-3.5" style={{ color: g.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-ink">{g.name}</p>
                  <span className="text-[11px] font-semibold text-ink">{g.pct}%</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted">₹ {g.saved.toLocaleString("en-IN")} of ₹ {g.target.toLocaleString("en-IN")}</p>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: `linear-gradient(90deg, ${g.color}, ${g.color}cc)` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <AddButton label="Add New Goal" onClick={setModal} />
    </Card>
  );
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
            <div key={t.id} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 hover:bg-surface-2/50 transition-colors -mx-1.5">
              <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[10px]", s.bg)}>
                <Icon className={cn("h-4 w-4", s.fg)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-ink">{t.name}</p>
                <p className="text-[10px] text-muted">{t.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-[12px] font-semibold", credit ? "text-green-600" : "text-red-500")}>
                  {credit ? "+" : "-"} ₹ {t.amount.toLocaleString("en-IN")}
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
      <div className="mb-2 grid grid-cols-[1fr_52px_52px_48px] gap-1 text-[10px] font-medium uppercase tracking-wide text-faint">
        <span>Category</span><span className="text-right">Budget</span><span className="text-right">Actual</span><span className="text-right">Status</span>
      </div>
      <div className="space-y-2">
        {budgetVsActual.map((b) => (
          <div key={b.category} className="grid grid-cols-[1fr_52px_52px_48px] items-center gap-1">
            <span className="truncate text-[11px] font-medium text-ink">{b.category}</span>
            <span className="text-right text-[10px] text-muted">₹ {b.budget.toLocaleString("en-IN")}</span>
            <span className="text-right text-[10px] font-semibold text-ink">₹ {b.actual.toLocaleString("en-IN")}</span>
            <div className="flex items-center justify-end gap-1">
              <div className="h-1.5 w-6 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${b.pct}%` }} />
              </div>
              <span className="w-[22px] text-right text-[10px] font-medium text-muted">{b.pct}%</span>
            </div>
          </div>
        ))}
      </div>
      <Link href="/finances" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View Full Budget Report <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

function TopSpending() {
  return (
    <Card>
      <Head title="Top Spending Categories" right={<MonthDropdown />} />
      <div className="space-y-2">
        {topSpending.map((c) => {
          const s = spendIcon[c.name] ?? { icon: LayoutGrid, bg: "bg-slate-100", fg: "text-slate-500" };
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
    </Card>
  );
}

function AccountsOverview({ setModal }: { setModal: () => void }) {
  return (
    <Card>
      <Head title="Accounts Overview" right={<ViewAll href="/finances" />} />
      <div className="space-y-2">
        {accounts.map((a) => {
          const Icon = a.icon === "cash" ? Wallet : Landmark;
          return (
            <div key={a.id} className="flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                style={{ background: `linear-gradient(135deg, ${a.color}18, ${a.color}06)` }}
              >
                <Icon className="h-4 w-4" style={{ color: a.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-ink">{a.name}</p>
                {a.type && <p className="text-[10px] text-muted">{a.type}</p>}
              </div>
              <p className="shrink-0 text-[12px] font-semibold text-ink">₹ {a.balance.toLocaleString("en-IN")}</p>
            </div>
          );
        })}
      </div>
      <AddButton label="Add Account" onClick={setModal} />
    </Card>
  );
}

function UpcomingBills() {
  return (
    <Card>
      <Head title="Upcoming Bills & Subscriptions" right={<ViewAll href="/finances" />} />
      <div className="space-y-2">
        {upcomingBills.map((b) => {
          const Icon = billIcon[b.icon] ?? Receipt;
          return (
            <div key={b.id} className="flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]"
                style={{ background: `linear-gradient(135deg, ${b.color}16, ${b.color}05)` }}
              >
                <Icon className="h-4 w-4" style={{ color: b.color }} />
              </div>
              <p className="flex-1 truncate text-[12px] font-medium text-ink">{b.name}</p>
              <div className="shrink-0 text-right">
                <p className="text-[12px] font-semibold text-ink">₹ {b.amount.toLocaleString("en-IN")}</p>
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
      <div className="space-y-3">
        {loans.map((l) => {
          const Icon = l.icon === "home" ? Home : User;
          const paidPct = Math.round(((l.principal - l.remaining) / l.principal) * 100);
          return (
            <div key={l.id}>
              <div className="flex items-start gap-2.5">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                  style={{ background: `linear-gradient(135deg, ${l.color}16, ${l.color}05)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: l.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-ink">{l.name}</p>
                  <p className="text-[14px] font-semibold text-ink">₹ {l.principal.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-muted">Interest Rate {l.rate}%</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted">Remaining</p>
                  <p className="text-[12px] font-semibold text-ink">₹ {l.remaining.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/loans" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
        View All Loans <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

function MoneyDueToOthers({ setModal }: { setModal: () => void }) {
  return (
    <Card>
      <Head title="Money due to others" right={<ViewAll href="/finances" />} />
      <div className="space-y-1">
        {iOwe.map((o) => (
          <div key={o.id} className="flex items-center gap-2.5 rounded-lg p-1.5 -mx-1.5 hover:bg-surface-2/50 transition-colors">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/50">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-ink">{o.name}</p>
              <p className="text-[10px] text-muted">Due on {o.due}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-[12px] font-semibold text-ink">₹ {o.amount.toLocaleString("en-IN")}</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">{o.status}</span>
            </div>
          </div>
        ))}
      </div>
      <AddButton label="Add New" onClick={setModal} />
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
   Modal for add buttons
   ═══════════════════════════════════════════════════════════════════════════ */
type ModalType = "goal" | "account" | "debt" | null;

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.documentElement.classList.add("overflow-hidden");
    }
    return () => {
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [open]);

  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-card-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink">
            <Plus className="h-5 w-5 rotate-45" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function AddForm({
  fields,
  submitLabel,
  onSubmit,
  onClose,
}: {
  fields: { name: string; label: string; type?: string; placeholder?: string }[];
  submitLabel: string;
  onSubmit: (data: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50">
          <Check className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="font-medium text-ink">Saved successfully!</p>
        <button onClick={onClose} className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
        setSubmitted(true);
      }}
      className="space-y-3"
    >
      {fields.map((f) => (
        <div key={f.name}>
          <label className="mb-1 block text-xs font-medium text-muted">{f.label}</label>
          <input
            type={f.type || "text"}
            placeholder={f.placeholder}
            required
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            onChange={(e) => setData((prev) => ({ ...prev, [f.name]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted hover:bg-surface-2">
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-xl bg-ink py-2 text-sm font-medium text-white hover:opacity-90">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Total Net Worth premium card
   ═══════════════════════════════════════════════════════════════════════════ */
function TotalNetWorth() {
  const netWorth = kpis.find((k) => k.label === "Net Worth")!;
  const assets = 2202950;
  const liabilities = 327000;
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 bg-gradient-to-br from-brand-soft/80 via-white to-brand-soft/40 p-6">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm">
              <Home className="h-5 w-5 text-brand-ink" />
            </div>
            <span className="text-sm font-medium text-muted">Total Net Worth</span>
          </div>
          <p className="mt-3 text-[32px] font-semibold tracking-tight text-ink">₹ {netWorth.value.toLocaleString("en-IN")}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-green-600">
              <ArrowUpRight className="h-3 w-3" /> {netWorth.delta}%
            </span>
            <span className="text-muted">{netWorth.vs}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/70 p-3 shadow-sm border border-border/50">
              <p className="text-xs text-muted">Total Assets</p>
              <p className="mt-1 text-base font-semibold text-ink">₹ {assets.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 shadow-sm border border-border/50">
              <p className="text-xs text-muted">Total Liabilities</p>
              <p className="mt-1 text-base font-semibold text-ink">₹ {liabilities.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <p className="text-sm font-semibold text-ink">Net Worth Trend</p>
          <div className="mt-2 h-[120px]">
            <Spark data={netWorth.spark} color="#22c55e" />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-2/60 p-3">
            <div>
              <p className="text-xs text-muted">Monthly Growth</p>
              <p className="text-sm font-semibold text-green-600">+₹ 42,500</p>
            </div>
            <Link href="/analytics" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main page
   ═══════════════════════════════════════════════════════════════════════════ */
export function FinancesClient() {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <div className="animate-fade-up space-y-4">
      <KpiCards />
      <TotalNetWorth />

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_1fr_300px]">
        <CashFlow />
        <ExpenseBreakdown />
        <SavingsGoals setModal={() => setModal("goal")} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_1fr_1fr_300px]">
        <RecentTransactions />
        <BudgetVsActual />
        <TopSpending />
        <div className="space-y-4">
          <AccountsOverview setModal={() => setModal("account")} />
          <UpcomingBills />
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <LoansOverview />
        <MoneyDueToOthers setModal={() => setModal("debt")} />
        <FinancialHealth />
      </div>

      <Modal open={modal === "goal"} onClose={() => setModal(null)} title="Add New Goal">
        <AddForm
          fields={[
            { name: "name", label: "Goal Name", placeholder: "e.g. New Car" },
            { name: "target", label: "Target Amount", type: "number", placeholder: "₹" },
            { name: "saved", label: "Saved So Far", type: "number", placeholder: "₹" },
          ]}
          submitLabel="Save Goal"
          onSubmit={(data) => console.log("New goal:", data)}
          onClose={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal === "account"} onClose={() => setModal(null)} title="Add Account">
        <AddForm
          fields={[
            { name: "bank", label: "Bank / Institution", placeholder: "e.g. HDFC Bank" },
            { name: "type", label: "Account Type", placeholder: "e.g. Savings" },
            { name: "balance", label: "Current Balance", type: "number", placeholder: "₹" },
          ]}
          submitLabel="Save Account"
          onSubmit={(data) => console.log("New account:", data)}
          onClose={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal === "debt"} onClose={() => setModal(null)} title="Add Money Due">
        <AddForm
          fields={[
            { name: "name", label: "Person Name", placeholder: "e.g. Rohan Sharma" },
            { name: "amount", label: "Amount", type: "number", placeholder: "₹" },
            { name: "due", label: "Due Date", type: "date" },
          ]}
          submitLabel="Save"
          onSubmit={(data) => console.log("New debt:", data)}
          onClose={() => setModal(null)}
        />
      </Modal>
    </div>
  );
}
