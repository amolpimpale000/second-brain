"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Circle,
  Car,
  Gift,
  Plane,
  Shield,
  Home,
  User,
  MoreHorizontal,
  Briefcase,
  ShoppingBag,
  Zap,
  CalendarPlus,
  PlusCircle,
  ArrowRightLeft,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
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
  AreaChart,
  Area,
} from "recharts";
import { cn, inr } from "@/lib/utils";
import { INVESTMENT_TYPES } from "@/lib/investment-types";
import type { DashboardData } from "@/lib/dashboard-queries";
import type { StoredDoc } from "@/lib/documents-store";
import { ConsolidatedPnL } from "@/components/consolidated-pnl";
import { BrandLogo } from "@/components/vault-ui";

/* ═══════════════════════════════════════════════════════════════════════════
   Shared primitives
   ═══════════════════════════════════════════════════════════════════════════ */
const axis = { tick: { fill: "#9ca3af", fontSize: 11 }, axisLine: false, tickLine: false } as const;

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[20px] border border-border bg-card p-5 shadow-card", className)}>
      {children}
    </div>
  );
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

function MonthBtn() {
  return (
    <button className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
      This Month <ChevronDown className="h-3 w-3" />
    </button>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}

function yFmt(v: number) {
  if (v === 0) return "₹ 0";
  if (v < 100000) return `₹ ${v / 1000}K`;
  const l = v / 100000;
  return `₹ ${Number.isInteger(l) ? l : l.toFixed(1)}L`;
}

function SparkLine({ data, color, fill }: { data: number[]; color: string; fill?: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={44} debounce={200}>
      <AreaChart data={d} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={fill ?? `url(#grad-${color.replace("#", "")})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={34} debounce={200}>
      <LineChart data={d} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold", up ? "text-green-500" : "text-red-500")}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function EmptyState({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <p className="text-xs text-faint">{text}</p>
      <button onClick={onClick} className="text-xs font-medium text-brand hover:underline">{cta}</button>
    </div>
  );
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
  home: Home,
  piggy: Wallet,
  bike: Car,
};

const investIcon: Record<string, React.ElementType> = {
  barChart: BarChart3,
  trendingUp: TrendingUp,
  circle: Circle,
  moreHorizontal: MoreHorizontal,
};
const INVEST_ICON_KEYS = ["barChart", "trendingUp", "circle", "moreHorizontal"] as const;

const txnIcon: Record<string, React.ElementType> = {
  wallet: Wallet,
  shoppingBag: ShoppingBag,
  zap: Zap,
  briefcase: Briefcase,
};

const actionIcon: Record<string, React.ElementType> = {
  calendarPlus: CalendarPlus,
  plusCircle: PlusCircle,
  arrowRightLeft: ArrowRightLeft,
  target: Target,
};

/* ── Presentation palettes (derived data → color, not fabricated values) ──── */
const CAT_COLOR: Record<string, string> = {
  Housing: "#22c55e", "Food & Dining": "#f59e0b", Transport: "#3b82f6", Shopping: "#ec4899",
  Utilities: "#8b5cf6", Entertainment: "#ef4444", Health: "#14b8a6", Education: "#6366f1",
  "Loan EMI": "#f97316", Others: "#94a3b8", Salary: "#22c55e", Business: "#3b82f6",
  Freelance: "#8b5cf6", Interest: "#14b8a6", Refund: "#f59e0b", "Other Income": "#94a3b8",
};

const LOAN_META: Record<string, { icon: string; color: string; bg: string }> = {
  home: { icon: "home", color: "#8b5cf6", bg: "#ede9fe" },
  personal: { icon: "user", color: "#ef4444", bg: "#fee2e2" },
  vehicle: { icon: "car", color: "#f59e0b", bg: "#fef3c7" },
  education: { icon: "user", color: "#14b8a6", bg: "#ccfbf1" },
};

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  high: { color: "#ef4444", bg: "#fee2e2" },
  medium: { color: "#f59e0b", bg: "#fef3c7" },
  low: { color: "#3b82f6", bg: "#dbeafe" },
};

// Real logo domain guessing for vault entries — same auto-detect-then-let-
// the-user-override pattern used for bank accounts and bills in /finances.
const VAULT_DOMAIN_HINTS: { pattern: RegExp; domain: string }[] = [
  { pattern: /hdfc/i, domain: "hdfcbank.com" },
  { pattern: /\bsbi\b|state bank/i, domain: "sbi.co.in" },
  { pattern: /icici/i, domain: "icicibank.com" },
  { pattern: /kotak/i, domain: "kotak.com" },
  { pattern: /axis/i, domain: "axisbank.com" },
  { pattern: /gmail|google/i, domain: "google.com" },
  { pattern: /instagram/i, domain: "instagram.com" },
  { pattern: /facebook/i, domain: "facebook.com" },
  { pattern: /twitter|\bx\.com\b/i, domain: "x.com" },
  { pattern: /linkedin/i, domain: "linkedin.com" },
  { pattern: /netflix/i, domain: "netflix.com" },
  { pattern: /amazon/i, domain: "amazon.in" },
  { pattern: /apple|icloud/i, domain: "apple.com" },
  { pattern: /microsoft|outlook/i, domain: "microsoft.com" },
  { pattern: /paypal/i, domain: "paypal.com" },
  { pattern: /github/i, domain: "github.com" },
  { pattern: /dropbox/i, domain: "dropbox.com" },
  { pattern: /crossref/i, domain: "crossref.org" },
  { pattern: /ijsrt/i, domain: "ijsrtjournal.com" },
  { pattern: /ijps\b/i, domain: "ijpsjournal.com" },
  { pattern: /ijes\b/i, domain: "ijesjournal.com" },
];
function guessVaultDomain(name: string): string | undefined {
  return VAULT_DOMAIN_HINTS.find((h) => h.pattern.test(name))?.domain;
}

function txnIconKeyFor(category: string): string {
  const c = category.toLowerCase();
  if (["salary", "business", "freelance", "interest", "refund", "other income"].includes(c)) return "wallet";
  if (c.includes("shop")) return "shoppingBag";
  if (c.includes("util") || c.includes("electric")) return "zap";
  return "briefcase";
}

function fmtTxnDate(iso: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === today) return "Today";
  if (iso === yest) return "Yesterday";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/* ═══════════════════════════════════════════════════════════════════════════
   KPI Cards
   ═══════════════════════════════════════════════════════════════════════════ */
type KpiCard = { label: string; value: number; delta: number; deltaLabel: string; color: string; bg: string; icon: string; spark: number[] };

function KpiCards({ cards }: { cards: KpiCard[] }) {
  return (
    <div className="xl:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((k) => {
        const Icon = kpiIcon[k.icon] ?? Wallet;
        return (
          <Card key={k.label} className="!p-4 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: k.bg }}>
                <Icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
              <p className="text-xs font-medium text-muted">{k.label}</p>
            </div>
            <p className="mt-3 text-[22px] font-bold text-ink">₹ {Math.round(k.value).toLocaleString("en-IN")}</p>
            <div className="mt-1 flex items-center gap-2">
              <Delta value={k.delta} />
              <span className="text-[11px] text-faint">{k.deltaLabel}</span>
            </div>
            <div className="mt-auto pt-3 -mx-1">
              <SparkLine data={k.spark} color={k.color} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Documents Preview
   ═══════════════════════════════════════════════════════════════════════════ */
function DocumentsPreviewCard({ documents, onAdd }: { documents: StoredDoc[]; onAdd: () => void }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Documents" right={<ViewAll href="/documents" />} />
      {documents.length === 0 ? (
        <EmptyState text="No documents uploaded yet." cta="Upload a document" onClick={onAdd} />
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {documents.map((d) => (
            <button
              key={d.id}
              onClick={() => window.open(d.url, "_blank")}
              title={d.name}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-2/40 hover:border-brand/40 transition-colors"
            >
              {d.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.url} alt={d.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1">
                  <FileText className="h-4 w-4 text-muted" />
                  <span className="truncate px-0.5 text-[8px] font-semibold text-faint">{d.ext}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      <button onClick={onAdd} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border py-2.5 text-xs font-medium text-muted hover:bg-surface-2 transition-colors">
        <Plus className="h-3.5 w-3.5" /> Upload Document
      </button>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cash Flow Overview
   ═══════════════════════════════════════════════════════════════════════════ */
type CashFlowPoint = { month: string; income: number; expenses: number; savings: number };

function CashFlowOverview({ data }: { data: CashFlowPoint[] }) {
  return (
    <Card className="xl:col-span-2">
      <Head title="Cash Flow Overview" right={<MonthBtn />} />
      <div className="mb-3 flex gap-5 text-xs">
        {[{ n: "Income", c: "#22c55e" }, { n: "Expenses", c: "#ef4444" }, { n: "Savings", c: "#3b82f6" }].map((s) => (
          <span key={s.n} className="flex items-center gap-1.5 text-muted">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.c }} />
            {s.n}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={240} debounce={200}>
        <BarChart data={data} margin={{ left: -6, right: 4, top: 5 }} barCategoryGap="22%">
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

/* ═══════════════════════════════════════════════════════════════════════════
   Expense Categories
   ═══════════════════════════════════════════════════════════════════════════ */
type ExpenseCat = { name: string; value: number; pct: number; color: string };

function ExpenseCategoriesCard({ categories }: { categories: ExpenseCat[] }) {
  const total = categories.reduce((s, c) => s + c.value, 0);
  return (
    <Card className="xl:col-span-1">
      <Head title="Expense Categories" right={<MonthBtn />} />
      {categories.length === 0 ? (
        <p className="py-10 text-center text-xs text-faint">No expenses recorded this month.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ResponsiveContainer width={170} height={170} debounce={200}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={1}
                  stroke="none"
                >
                  {categories.map((d, i) => <Cell key={i} fill={d.color} />)}
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
            {categories.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 truncate text-muted">{c.name}</span>
                <span className="w-7 text-right font-medium text-ink">{c.pct}%</span>
                <span className="w-14 text-right font-semibold text-ink">₹ {c.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Upcoming Tasks
   ═══════════════════════════════════════════════════════════════════════════ */
type TaskVM = { id: string; title: string; category: string; completed: boolean; due: string; categoryColor: string; categoryBg: string };

function UpcomingTasksCard({ tasks, available, onToggle }: { tasks: TaskVM[]; available: boolean; onToggle: (id: string) => void }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Upcoming Tasks" right={<ViewAll href="/tasks" />} />
      {!available ? (
        <EmptyState text="No tasks yet." cta="Add a task" onClick={() => { window.location.href = "/tasks"; }} />
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-3">
              <button onClick={() => onToggle(t.id)} className="mt-0.5 shrink-0">
                {t.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-faint hover:text-brand-ink" />
                )}
              </button>
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
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Savings Goals
   ═══════════════════════════════════════════════════════════════════════════ */
type GoalVM = { id: string; name: string; current: number; target: number; pct: number; color: string; bg: string; icon: string };

function SavingsGoalsCard({ goals, onAdd }: { goals: GoalVM[]; onAdd: () => void }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Savings Goals" right={<ViewAll href="/finances?tab=Savings Goals" />} />
      {goals.length === 0 ? (
        <EmptyState text="No savings goals yet." cta="Add a goal" onClick={onAdd} />
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
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
                    ₹ {Math.round(g.current).toLocaleString("en-IN")} / ₹ {Math.round(g.target).toLocaleString("en-IN")}
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: g.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Investments Portfolio
   ═══════════════════════════════════════════════════════════════════════════ */
type InvestItemVM = { name: string; value: number; pct: number; color: string; bg: string; icon: string };
type InvestPortfolioVM = { totalValue: number; delta: number; spark: number[]; items: InvestItemVM[] };

function InvestmentsPortfolioCard({ portfolio }: { portfolio: InvestPortfolioVM }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Investments Portfolio" right={<ViewAll href="/investments" />} />
      {portfolio.items.length === 0 ? (
        <EmptyState text="No investments tracked yet." cta="Add an investment" onClick={() => { window.location.href = "/investments"; }} />
      ) : (
        <>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xl font-bold text-ink">₹ {Math.round(portfolio.totalValue).toLocaleString("en-IN")}</p>
              <div className="mt-1 flex items-center gap-1">
                <Delta value={portfolio.delta} />
                <span className="text-[11px] text-faint">overall return</span>
              </div>
            </div>
            <div className="h-10 w-24">
              <SparkLine data={portfolio.spark} color="#22c55e" />
            </div>
          </div>
          <div className="space-y-3">
            {portfolio.items.map((item) => {
              const Icon = investIcon[item.icon] ?? BarChart3;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: item.bg }}>
                    <Icon className="h-4 w-4" style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{item.name}</p>
                      <span className="text-xs font-medium text-muted">{item.pct}%</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-surface-2">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                      <span className="w-16 text-right text-xs font-semibold text-ink">₹ {Math.round(item.value).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Loans Overview
   ═══════════════════════════════════════════════════════════════════════════ */
type LoanVM = { id: string; name: string; balance: number; rate: number; color: string; bg: string; icon: string; progress: number };

function LoansOverviewCard({ loans, onAdd }: { loans: LoanVM[]; onAdd: () => void }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Loans Overview" right={<ViewAll href="/finances?tab=Loans" />} />
      {loans.length === 0 ? (
        <EmptyState text="No loans tracked." cta="Add a loan" onClick={onAdd} />
      ) : (
        <div className="space-y-4">
          {loans.map((l) => {
            const Icon = l.icon === "home" ? Home : l.icon === "car" ? Car : User;
            return (
              <div key={l.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: l.bg }}>
                      <Icon className="h-5 w-5" style={{ color: l.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{l.name}</p>
                      <p className="text-[11px] text-muted">Balance</p>
                      <p className="text-sm font-bold text-ink">₹ {Math.round(l.balance).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
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
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Quick Notes
   ═══════════════════════════════════════════════════════════════════════════ */
type NoteVM = { id: string; text: string; time: string };

function QuickNotesCard({ notes, available, onAdd }: { notes: NoteVM[]; available: boolean; onAdd: () => void }) {
  const router = useRouter();
  return (
    <Card className="xl:col-span-1">
      <Head
        title="Quick Notes"
        right={
          <button onClick={onAdd} className="text-xs font-medium text-muted hover:text-ink transition-colors flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add Note
          </button>
        }
      />
      {!available ? (
        <EmptyState text="No notes yet." cta="Add a note" onClick={onAdd} />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => router.push("/notes")}
              className="block w-full rounded-xl border border-border bg-surface-2/40 p-3 text-left hover:border-brand/40 transition-colors"
            >
              <p className="text-sm font-medium text-ink">{n.text}</p>
              <p className="mt-1 text-[10px] text-faint">{n.time}</p>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Business Overview
   ═══════════════════════════════════════════════════════════════════════════ */
type BizMetric = { label: string; value: number; delta: number; color: string; bg: string };

function BusinessOverviewCard({ metrics, sparklines }: { metrics: BizMetric[] | null; sparklines: number[][] }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Business Overview" right={<MonthBtn />} />
      {!metrics ? (
        <p className="py-8 text-center text-xs text-faint">Journal business data is temporarily unavailable.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, idx) => (
            <div key={m.label} className="rounded-xl border border-border bg-surface-2/40 p-3">
              <p className="text-[11px] font-medium text-muted">{m.label}</p>
              <p className="mt-1 text-base font-bold text-ink">
                {m.label === "Clients" ? m.value.toLocaleString("en-IN") : `₹ ${Math.round(m.value).toLocaleString("en-IN")}`}
              </p>
              <div className="mt-1">
                <Delta value={m.delta} />
              </div>
              <div className="mt-2">
                <MiniSpark data={sparklines[idx] ?? [0, 0]} color={m.color} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Recent Transactions
   ═══════════════════════════════════════════════════════════════════════════ */
type TxnVM = { id: string; name: string; category: string; amount: number; type: "credit" | "debit"; date: string; color: string; bg: string; icon: string };

function RecentTransactionsCard({ transactions, onAdd }: { transactions: TxnVM[]; onAdd: () => void }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Recent Transactions" right={<ViewAll href="/finances" />} />
      {transactions.length === 0 ? (
        <EmptyState text="No transactions recorded yet." cta="Add a transaction" onClick={onAdd} />
      ) : (
        <div className="space-y-1">
          {transactions.map((t) => {
            const Icon = txnIcon[t.icon] ?? Wallet;
            const credit = t.type === "credit";
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: t.bg }}>
                  <Icon className="h-4 w-4" style={{ color: t.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-[11px] text-muted">{t.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-sm font-bold", credit ? "text-green-600" : "text-red-500")}>
                    {credit ? "+" : "-"} ₹ {Math.round(t.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-faint">{t.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Passwords Manager
   ═══════════════════════════════════════════════════════════════════════════ */
type VaultVM = { id: string; name: string; username: string; color: string; domain?: string };

function PasswordsManagerCard({ accounts, available }: { accounts: VaultVM[]; available: boolean }) {
  const router = useRouter();
  return (
    <Card className="xl:col-span-1">
      <Head title="Passwords Manager" right={<ViewAll href="/vault" />} />
      {!available ? (
        <EmptyState text="No saved passwords yet." cta="Add one in the Vault" onClick={() => router.push("/vault")} />
      ) : (
        <div className="space-y-1">
          {accounts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
              <BrandLogo domain={p.domain} initial={(p.name.trim()[0] || "?").toUpperCase()} color={p.color} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <p className="text-[11px] text-muted truncate">{p.username}</p>
              </div>
              <button onClick={() => router.push("/vault")} className="text-faint hover:text-ink transition-colors shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Quick Actions
   ═══════════════════════════════════════════════════════════════════════════ */
type ActionVM = { id: string; label: string; color: string; bg: string; icon: string; onClick: () => void };

function QuickActionsCard({ actions }: { actions: ActionVM[] }) {
  return (
    <Card className="xl:col-span-1">
      <Head title="Quick Actions" />
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = actionIcon[a.icon] ?? PlusCircle;
          return (
            <button
              key={a.id}
              onClick={a.onClick}
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
   Main dashboard — computes real view-models from live data, same layout
   ═══════════════════════════════════════════════════════════════════════════ */
export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { finance, notes, vault, documents, business } = data;
  const [tasks, setTasks] = useState(data.tasks);

  async function toggleTask(id: string) {
    if (!tasks) return;
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const nextDone = !t.done;
    setTasks((prev) => prev && prev.map((x) => (x.id === id ? { ...x, done: nextDone } : x)));
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, data: { done: nextDone } }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setTasks((prev) => prev && prev.map((x) => (x.id === id ? { ...x, done: !nextDone } : x)));
    }
  }

  const vm = useMemo(() => {
    const now = new Date();
    const thisKey = now.toISOString().slice(0, 7);

    // rolling last-12-months window (real transactions, real dates)
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
      return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-US", { month: "short" }) };
    });
    const cashFlowMonthly: CashFlowPoint[] = months.map(({ key, label }) => {
      const txns = finance.transactions.filter((t) => t.date.slice(0, 7) === key);
      const income = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expenses = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return { month: label, income, expenses, savings: Math.max(0, income - expenses) };
    });
    const lastKey = months[10].key;

    const txnsThisMonth = finance.transactions.filter((t) => t.date.slice(0, 7) === thisKey);
    const incomeThis = txnsThisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const incomeLast = finance.transactions.filter((t) => t.type === "income" && t.date.slice(0, 7) === lastKey).reduce((s, t) => s + t.amount, 0);
    const expenseThis = txnsThisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const expenseLast = finance.transactions.filter((t) => t.type === "expense" && t.date.slice(0, 7) === lastKey).reduce((s, t) => s + t.amount, 0);
    const incomeDelta = incomeLast > 0 ? round1(((incomeThis - incomeLast) / incomeLast) * 100) : 0;
    const expenseDelta = expenseLast > 0 ? round1(((expenseThis - expenseLast) / expenseLast) * 100) : 0;

    const totalBalance = finance.accounts.reduce((s, a) => s + a.balance, 0);
    const netThisMonth = incomeThis - expenseThis;
    const priorBalance = totalBalance - netThisMonth;
    const balanceDelta = priorBalance > 0 ? round1((netThisMonth / priorBalance) * 100) : 0;

    const totalInvested = finance.investments.reduce((s, i) => s + i.invested, 0);
    const totalCurrent = finance.investments.reduce((s, i) => s + i.currentValue, 0);
    const investDelta = totalInvested > 0 ? round1(((totalCurrent - totalInvested) / totalInvested) * 100) : 0;

    const balanceSpark = (() => {
      const netByMonth = cashFlowMonthly.map((m) => m.income - m.expenses);
      let running = totalBalance - netByMonth.reduce((s, n) => s + n, 0);
      return netByMonth.map((n) => { running += n; return running; });
    })();
    const investSpark = [...finance.investments].sort((a, b) => a.currentValue - b.currentValue)
      .reduce<number[]>((acc, i) => [...acc, (acc[acc.length - 1] ?? 0) + i.currentValue], []);

    const kpiCards: KpiCard[] = [
      { label: "Total Balance", value: totalBalance, delta: balanceDelta, deltaLabel: "net this month", color: "#8b5cf6", bg: "#ede9fe", icon: "wallet", spark: balanceSpark.length ? balanceSpark : [0, 0] },
      { label: "Monthly Income", value: incomeThis, delta: incomeDelta, deltaLabel: incomeLast > 0 ? "from last month" : "no data last month", color: "#22c55e", bg: "#dcfce7", icon: "income", spark: cashFlowMonthly.map((m) => m.income) },
      { label: "Monthly Expenses", value: expenseThis, delta: expenseDelta, deltaLabel: expenseLast > 0 ? "from last month" : "no data last month", color: "#f59e0b", bg: "#fef3c7", icon: "expense", spark: cashFlowMonthly.map((m) => m.expenses) },
      { label: "Total Investments", value: totalCurrent, delta: investDelta, deltaLabel: "overall return", color: "#3b82f6", bg: "#dbeafe", icon: "investment", spark: investSpark.length ? investSpark : [0, 0] },
    ];

    const catMap = new Map<string, number>();
    for (const t of txnsThisMonth.filter((t) => t.type === "expense")) catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount);
    const totalCat = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
    const expenseCategories: ExpenseCat[] = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: totalCat ? Math.round((value / totalCat) * 100) : 0, color: CAT_COLOR[name] ?? "#94a3b8" }));

    const upcomingTasks: TaskVM[] = (tasks ?? []).slice(0, 4).map((t) => {
      const meta = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
      return { id: t.id, title: t.title, category: t.project, completed: t.done, due: t.due, categoryColor: meta.color, categoryBg: meta.bg };
    });

    const savingsGoals: GoalVM[] = finance.goals.map((g) => ({
      id: g.id, name: g.name, current: g.saved, target: g.target,
      pct: g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0,
      color: g.color, bg: `${g.color}20`, icon: g.icon,
    }));

    const byType = INVESTMENT_TYPES
      .map((t, idx) => {
        const list = finance.investments.filter((i) => i.type === t.value);
        const value = list.reduce((s, i) => s + i.currentValue, 0);
        return { name: t.value, value, pct: totalCurrent ? Math.round((value / totalCurrent) * 100) : 0, color: t.color, bg: `${t.color}20`, icon: INVEST_ICON_KEYS[idx % 4] };
      })
      .filter((t) => t.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
    const investmentsPortfolio: InvestPortfolioVM = { totalValue: totalCurrent, delta: investDelta, spark: investSpark.length ? investSpark : [0, 0], items: byType };

    const loansOverview: LoanVM[] = finance.loans.map((l) => {
      const meta = LOAN_META[l.kind] ?? LOAN_META.personal;
      return { id: l.id, name: l.name, balance: l.outstanding, rate: l.rate, color: meta.color, bg: meta.bg, icon: meta.icon, progress: l.principal > 0 ? Math.round(((l.principal - l.outstanding) / l.principal) * 100) : 0 };
    });

    const quickNotes: NoteVM[] = (notes ?? []).map((n) => ({ id: n.id, text: n.title, time: n.time }));

    const businessMetrics: BizMetric[] | null = business ? [
      { label: "Revenue", value: business.revenue, delta: business.revenueDelta, color: "#8b5cf6", bg: "#ede9fe" },
      { label: "Expenses", value: business.expenses, delta: business.expensesDelta, color: "#ef4444", bg: "#fee2e2" },
      { label: "Profit", value: business.profit, delta: business.profitDelta, color: "#22c55e", bg: "#dcfce7" },
      { label: "Clients", value: business.clients, delta: 0, color: "#3b82f6", bg: "#dbeafe" },
    ] : null;
    const businessSparklines = business ? [business.revenueSpark, business.expenseSpark, business.profitSpark, business.clientsSpark] : [];

    const recentTransactions: TxnVM[] = [...finance.transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((t) => ({
        id: t.id, name: t.description || t.category, category: t.category, amount: t.amount,
        type: t.type === "income" ? "credit" : "debit", date: fmtTxnDate(t.date),
        color: CAT_COLOR[t.category] ?? "#94a3b8", bg: `${CAT_COLOR[t.category] ?? "#94a3b8"}20`, icon: txnIconKeyFor(t.category),
      }));

    const passwordsManager: VaultVM[] = (vault ?? []).slice(0, 4).map((v) => ({
      id: v.id, name: v.name, username: v.username, color: v.color, domain: v.domain || guessVaultDomain(v.name),
    }));

    const quickActions: ActionVM[] = [
      { id: "qa1", label: "Add Expense", color: "#8b5cf6", bg: "#ede9fe", icon: "calendarPlus", onClick: () => router.push("/finances?quickAdd=txn") },
      { id: "qa2", label: "Add Income", color: "#22c55e", bg: "#dcfce7", icon: "plusCircle", onClick: () => router.push("/finances?quickAdd=txn") },
      { id: "qa3", label: "Transfer Money", color: "#f59e0b", bg: "#fef3c7", icon: "arrowRightLeft", onClick: () => router.push("/finances") },
      { id: "qa4", label: "Add Goal", color: "#3b82f6", bg: "#dbeafe", icon: "target", onClick: () => router.push("/finances?quickAdd=goal") },
    ];

    return {
      kpiCards, cashFlowMonthly, expenseCategories, upcomingTasks, savingsGoals,
      investmentsPortfolio, loansOverview, quickNotes, businessMetrics, businessSparklines, recentTransactions,
      passwordsManager, quickActions,
    };
  }, [finance, tasks, notes, vault, business, router]);

  return (
    <div className="animate-fade-up grid grid-cols-1 gap-4 xl:grid-cols-4">
      {/* Row 1 */}
      <KpiCards cards={vm.kpiCards} />
      <DocumentsPreviewCard documents={documents} onAdd={() => router.push("/documents")} />

      {/* Consolidated journal P&L — full width, with month toggle */}
      <ConsolidatedPnL className="xl:col-span-4" />

      {/* Row 2 */}
      <CashFlowOverview data={vm.cashFlowMonthly} />
      <ExpenseCategoriesCard categories={vm.expenseCategories} />
      <UpcomingTasksCard tasks={vm.upcomingTasks} available={tasks !== null} onToggle={toggleTask} />

      {/* Row 3 */}
      <SavingsGoalsCard goals={vm.savingsGoals} onAdd={() => router.push("/finances?quickAdd=goal")} />
      <InvestmentsPortfolioCard portfolio={vm.investmentsPortfolio} />
      <LoansOverviewCard loans={vm.loansOverview} onAdd={() => router.push("/finances?quickAdd=loan")} />
      <QuickNotesCard notes={vm.quickNotes} available={notes !== null} onAdd={() => router.push("/notes")} />

      {/* Row 4 */}
      <BusinessOverviewCard metrics={vm.businessMetrics} sparklines={vm.businessSparklines} />
      <RecentTransactionsCard transactions={vm.recentTransactions} onAdd={() => router.push("/finances?quickAdd=txn")} />
      <PasswordsManagerCard accounts={vm.passwordsManager} available={vault !== null} />
      <QuickActionsCard actions={vm.quickActions} />
    </div>
  );
}
