"use client";

import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  ChevronDown,
  CheckCircle2,
  Circle,
  Car,
  Gift,
  Plane,
  Shield,
  Home,
  User,
  BarChart3,
  MoreHorizontal,
  Briefcase,
  ShoppingBag,
  Zap,
  Lock,
  Mail,
  Instagram,
  CalendarPlus,
  PlusCircle,
  ArrowRightLeft,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
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
  kpiCards,
  accountsOverview,
  cashFlowMonthly,
  expenseCategories,
  upcomingTasks,
  savingsGoals,
  investmentsPortfolio,
  loansOverview,
  quickNotes,
  businessOverview,
  recentTransactions,
  passwordsManager,
  quickActions,
} from "@/lib/dashboard-data";

/* ═══════════════════════════════════════════════════════════════════════════
   Shared primitives
   ═══════════════════════════════════════════════════════════════════════════ */
const axis = { tick: { fill: "#9ca3af", fontSize: 11 }, axisLine: false, tickLine: false } as const;

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>{children}</div>;
}

function Head({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {right}
    </div>
  );
}

function ViewAll({ href }: { href: string }) {
  return <Link href={href} className="text-xs font-medium text-muted hover:text-ink transition-colors">View All</Link>;
}

function MonthBtn() {
  return (
    <button className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
      This Month <ChevronDown className="h-3 w-3" />
    </button>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <LineChart data={d} margin={{ top: 6, bottom: 4, left: 2, right: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatDelta(n: number) {
  const up = n >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", up ? "text-green-500" : "text-red-500")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(n)}%
    </span>
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
  wallet: Wallet,
  income: TrendingUp,
  expense: TrendingDown,
  investment: BarChart3,
};

const goalIcon: Record<string, React.ElementType> = {
  car: Car,
  gift: Gift,
  plane: Plane,
  shield: Shield,
};

const investIcon: Record<string, React.ElementType> = {
  barChart: BarChart3,
  trendingUp: TrendingUp,
  circle: Circle,
  moreHorizontal: MoreHorizontal,
};

const txnIcon: Record<string, React.ElementType> = {
  wallet: Wallet,
  shoppingBag: ShoppingBag,
  zap: Zap,
  briefcase: Briefcase,
};

const pwdIcon: Record<string, React.ElementType> = {
  lock: Lock,
  mail: Mail,
  instagram: Instagram,
};

const actionIcon: Record<string, React.ElementType> = {
  calendarPlus: CalendarPlus,
  plusCircle: PlusCircle,
  arrowRightLeft: ArrowRightLeft,
  target: Target,
};


/* ═══════════════════════════════════════════════════════════════════════════
   Section components
   ═══════════════════════════════════════════════════════════════════════════ */

function KpiCards() {
  return (
    <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((k) => {
        const Icon = kpiIcon[k.icon] ?? Wallet;
        return (
          <Card key={k.label} className="!p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: k.bg }}>
                <Icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
              <p className="text-xs font-medium text-muted">{k.label}</p>
            </div>
            <p className="mt-3 text-xl font-bold text-ink">₹ {k.value.toLocaleString("en-IN")}</p>
            <div className="mt-1 flex items-center gap-2">
              {formatDelta(k.delta)}
              <span className="text-[11px] text-faint">{k.deltaLabel}</span>
            </div>
            <div className="mt-2 -mx-1">
              <SparkLine data={k.spark} color={k.color} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AccountsOverviewCard() {
  return (
    <Card>
      <Head title="Accounts Overview" right={<ViewAll href="/finances" />} />
      <div className="space-y-3">
        {accountsOverview.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-2/50 transition-colors">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: a.bg }}>
              <Landmark className="h-5 w-5" style={{ color: a.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{a.bank}</p>
              <p className="text-xs text-muted">{a.type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-ink">₹ {a.balance.toLocaleString("en-IN")}</p>
              <p className="text-[10px] text-faint">**** {a.accountNumber}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border py-2.5 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
        <Plus className="h-3.5 w-3.5" /> Add New Account
      </button>
    </Card>
  );
}

function CashFlowOverview() {
  return (
    <Card className="xl:col-span-2">
      <Head title="Cash Flow Overview" right={<MonthBtn />} />
      <div className="mb-3 flex gap-5 text-xs">
        {[{ n: "Income", c: "#22c55e" }, { n: "Expenses", c: "#ef4444" }, { n: "Savings", c: "#3b82f6" }].map((s) => (
          <span key={s.n} className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.c }} />{s.n}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={cashFlowMonthly} margin={{ left: -6, right: 4, top: 5 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" {...axis} interval={0} />
          <YAxis {...axis} width={50} tickFormatter={yFmt} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload, label }) =>
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
            }
          />
          <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={14} />
          <Bar dataKey="savings" name="Savings" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function ExpenseCategoriesCard() {
  const total = expenseCategories.reduce((s, c) => s + c.value, 0);
  return (
    <Card>
      <Head title="Expense Categories" right={<MonthBtn />} />
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <ResponsiveContainer width={170} height={170}>
            <PieChart>
              <Pie
                data={expenseCategories}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={1}
                stroke="none"
              >
                {expenseCategories.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <Tip>
                      <p className="font-medium text-ink">{String(payload[0].name)}</p>
                      <p className="text-muted">{inr(Number(payload[0].value))}</p>
                    </Tip>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-muted">Total</p>
            <p className="text-base font-bold text-ink">₹ {total.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {expenseCategories.map((c) => (
            <div key={c.name} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <span className="flex-1 truncate text-muted">{c.name}</span>
              <span className="w-8 text-right font-medium text-ink">{c.pct}%</span>
              <span className="w-14 text-right font-semibold text-ink">₹ {c.value.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function UpcomingTasksCard() {
  return (
    <Card>
      <Head title="Upcoming Tasks" right={<ViewAll href="/tasks" />} />
      <div className="space-y-3">
        {upcomingTasks.map((t) => (
          <div key={t.id} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {t.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-faint" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium leading-tight", t.completed ? "text-muted line-through" : "text-ink")}>
                {t.title}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: t.categoryBg, color: t.categoryColor }}
                >
                  {t.category}
                </span>
                <span className="text-[10px] text-faint">{t.due}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


function SavingsGoalsCard() {
  return (
    <Card>
      <Head title="Savings Goals" right={<ViewAll href="/goals" />} />
      <div className="space-y-4">
        {savingsGoals.map((g) => {
          const GI = goalIcon[g.icon] ?? Wallet;
          return (
            <div key={g.id} className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: g.bg }}>
                <GI className="h-5 w-5" style={{ color: g.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{g.name}</p>
                  <span className="text-xs font-bold text-ink">{g.pct}%</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">
                  ₹ {g.current.toLocaleString("en-IN")} / ₹ {g.target.toLocaleString("en-IN")}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
                  <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: g.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function InvestmentsPortfolioCard() {
  return (
    <Card>
      <Head title="Investments Portfolio" right={<ViewAll href="/investments" />} />
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-ink">₹ {investmentsPortfolio.totalValue.toLocaleString("en-IN")}</p>
          <div className="mt-1 flex items-center gap-1">
            {formatDelta(investmentsPortfolio.delta)}
            <span className="text-[11px] text-faint">from last month</span>
          </div>
        </div>
        <div className="h-10 w-24">
          <SparkLine data={investmentsPortfolio.spark} color="#22c55e" />
        </div>
      </div>
      <div className="space-y-3">
        {investmentsPortfolio.items.map((item) => {
          const Icon = investIcon[item.icon] ?? BarChart3;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: item.bg }}>
                <Icon className="h-4 w-4" style={{ color: item.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <span className="text-sm font-semibold text-ink">₹ {item.value.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                  <span className="text-[11px] font-medium text-muted w-7 text-right">{item.pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LoansOverviewCard() {
  return (
    <Card>
      <Head title="Loans Overview" right={<ViewAll href="/loans" />} />
      <div className="space-y-4">
        {loansOverview.map((l) => {
          const Icon = l.icon === "home" ? Home : l.icon === "car" ? Car : User;
          return (
            <div key={l.id}>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: l.bg }}>
                  <Icon className="h-5 w-5" style={{ color: l.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{l.name}</p>
                  <p className="text-[11px] text-muted">Balance</p>
                  <p className="text-sm font-bold text-ink">₹ {l.balance.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted">Interest Rate</p>
                  <p className="text-sm font-bold text-ink">{l.rate}%</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
                <div className="h-full rounded-full" style={{ width: `${l.progress}%`, background: l.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function QuickNotesCard() {
  return (
    <Card>
      <Head
        title="Quick Notes"
        right={
          <button className="text-xs font-medium text-muted hover:text-ink transition-colors flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add Note
          </button>
        }
      />
      <div className="space-y-2">
        {quickNotes.map((n) => (
          <div key={n.id} className="rounded-xl border border-border bg-surface-2/50 p-3 hover:bg-surface-2 transition-colors">
            <p className="text-sm font-medium text-ink">{n.text}</p>
            <p className="mt-1 text-[10px] text-faint">{n.time}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}


function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={34}>
      <LineChart data={d} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BusinessOverviewCard() {
  return (
    <Card>
      <Head title="Business Overview" right={<MonthBtn />} />
      <div className="grid grid-cols-2 gap-3">
        {businessOverview.metrics.map((m, idx) => (
          <div key={m.label} className="rounded-xl border border-border p-3 hover:bg-surface-2/50 transition-colors">
            <p className="text-[11px] font-medium text-muted">{m.label}</p>
            <p className="mt-1 text-base font-bold text-ink">
              {m.label === "Clients" ? m.value.toLocaleString("en-IN") : `₹ ${m.value.toLocaleString("en-IN")}`}
            </p>
            <div className="mt-1">{formatDelta(m.delta)}</div>
            <div className="mt-2">
              <MiniSpark data={businessOverview.sparklines[idx]} color={m.color} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentTransactionsCard() {
  return (
    <Card>
      <Head title="Recent Transactions" right={<ViewAll href="/finances" />} />
      <div className="space-y-1">
        {recentTransactions.map((t) => {
          const Icon = txnIcon[t.icon] ?? Wallet;
          const credit = t.type === "credit";
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-1 py-2 hover:bg-surface-2/50 transition-colors">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: t.bg }}>
                <Icon className="h-4 w-4" style={{ color: t.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.name}</p>
                <p className="text-[11px] text-muted">{t.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-sm font-bold", credit ? "text-green-600" : "text-red-500")}>
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

function PasswordsManagerCard() {
  return (
    <Card>
      <Head title="Passwords Manager" right={<ViewAll href="/vault" />} />
      <div className="space-y-1">
        {passwordsManager.map((p) => {
          const Icon = pwdIcon[p.icon] ?? Lock;
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-xl px-1 py-2 hover:bg-surface-2/50 transition-colors">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: p.bg }}>
                <Icon className="h-4 w-4" style={{ color: p.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <p className="text-[11px] text-muted truncate">{p.username}</p>
              </div>
              <button className="text-faint hover:text-ink transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function QuickActionsCard() {
  return (
    <Card>
      <Head title="Quick Actions" />
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((a) => {
          const Icon = actionIcon[a.icon] ?? PlusCircle;
          return (
            <button
              key={a.id}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:bg-surface-2 transition-colors"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: a.bg }}>
                <Icon className="h-5 w-5" style={{ color: a.color }} />
              </div>
              <span className="text-xs font-medium text-ink">{a.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main dashboard
   ═══════════════════════════════════════════════════════════════════════════ */
export function DashboardClient() {
  return (
    <div className="animate-fade-up grid grid-cols-1 gap-4 xl:grid-cols-4">
      {/* Row 1 */}
      <KpiCards />
      <AccountsOverviewCard />

      {/* Row 2 */}
      <CashFlowOverview />
      <ExpenseCategoriesCard />
      <UpcomingTasksCard />

      {/* Row 3 */}
      <SavingsGoalsCard />
      <InvestmentsPortfolioCard />
      <LoansOverviewCard />
      <QuickNotesCard />

      {/* Row 4 */}
      <BusinessOverviewCard />
      <RecentTransactionsCard />
      <PasswordsManagerCard />
      <QuickActionsCard />
    </div>
  );
}
