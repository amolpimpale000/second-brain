import Link from "next/link";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoveRight,
} from "lucide-react";
import { Card, CardHeader, Delta, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { CashflowChart, DonutChart, Gauge } from "@/components/charts";
import {
  cashflow,
  goals,
  netWorth,
  quickStats,
  transactions,
  businesses,
} from "@/lib/data";
import { inr } from "@/lib/utils";

const iconFor = {
  income: <Wallet className="h-5 w-5" />,
  expense: <TrendingDown className="h-5 w-5" />,
  saving: <PiggyBank className="h-5 w-5" />,
  invest: <TrendingUp className="h-5 w-5" />,
};

export default function Dashboard() {
  const totalRevenue = businesses.reduce((s, b) => s + b.revenue, 0);
  const totalProfit = businesses.reduce((s, b) => s + (b.revenue - b.expenses), 0);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Good evening, Amol 👋"
        subtitle="Here's the complete picture across your money, journals, and goals."
        action={
          <div className="flex items-center gap-2">
            <button className="btn-soft">This month</button>
            <button className="btn-brand">
              Add transaction <MoveRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={inr(s.value, { compact: true })}
            delta={s.change}
            icon={iconFor[s.kind]}
            accent="var(--brand-soft)"
          />
        ))}
      </div>

      {/* Hero row */}
      <div className="grid gap-5 xl:grid-cols-3">
        {/* Net worth */}
        <Card className="card-pad xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Total Net Worth</p>
              <div className="mt-1 flex items-end gap-3">
                <p className="text-4xl font-semibold tracking-tight text-ink">
                  {inr(netWorth.total)}
                </p>
                <Delta value={netWorth.change} className="mb-1.5" />
              </div>
              <div className="mt-3 flex gap-5 text-sm">
                <span className="text-muted">
                  Assets <b className="text-ink">{inr(netWorth.assets, { compact: true })}</b>
                </span>
                <span className="text-muted">
                  Liabilities{" "}
                  <b className="text-ink">{inr(netWorth.liabilities, { compact: true })}</b>
                </span>
              </div>
            </div>
            <Link href="/finances" className="btn-soft">
              Details
            </Link>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-[200px_1fr] sm:items-center">
            <DonutChart data={netWorth.breakdown} height={190} />
            <div className="space-y-3">
              {netWorth.breakdown.map((b) => (
                <div key={b.name} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                  <span className="text-sm text-muted">{b.name}</span>
                  <span className="ml-auto text-sm font-medium text-ink">
                    {inr(b.value, { compact: true })}
                  </span>
                  <span className="w-12 text-right text-xs text-faint">
                    {((b.value / netWorth.assets) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Financial health */}
        <Card className="card-pad">
          <CardHeader title="Financial Health" desc="Aggregated across all accounts" />
          <Gauge value={78} label="Excellent" />
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="text-xs text-muted">Savings rate</p>
              <p className="mt-1 text-lg font-semibold text-ink">40.3%</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="text-xs text-muted">Debt ratio</p>
              <p className="mt-1 text-lg font-semibold text-ink">24.8%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cashflow + Businesses */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="card-pad xl:col-span-2">
          <CardHeader
            title="Cash Flow"
            desc="Income vs expenses over the last 7 months"
            right={
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-[var(--c-green)]" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full bg-[var(--c-amber)]" /> Expenses
                </span>
              </div>
            }
          />
          <div className="mt-4">
            <CashflowChart data={cashflow} />
          </div>
        </Card>

        {/* Business snapshot */}
        <Card className="card-pad">
          <CardHeader title="Business Snapshot" desc="5 journals combined" right={
            <Link href="/analytics" className="text-xs font-medium text-brand-ink hover:underline">View all</Link>
          } />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs text-muted">Revenue</p>
              <p className="mt-1 text-xl font-semibold text-ink">{inr(totalRevenue, { compact: true })}</p>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs text-muted">Net Profit</p>
              <p className="mt-1 text-xl font-semibold text-brand-ink">{inr(totalProfit, { compact: true })}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {businesses.map((b) => {
              const profit = b.revenue - b.expenses;
              const margin = (profit / b.revenue) * 100;
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{b.code}</span>
                    <span className="text-muted">{inr(b.revenue, { compact: true })}</span>
                  </div>
                  <ProgressBar value={margin} color={b.color} className="mt-1.5" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Transactions + Goals */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="card-pad xl:col-span-2">
          <CardHeader
            title="Recent Transactions"
            right={<Link href="/finances" className="text-xs font-medium text-brand-ink hover:underline">See all</Link>}
          />
          <div className="mt-3 divide-y divide-border">
            {transactions.slice(0, 6).map((t) => {
              const income = t.amount > 0;
              return (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      income ? "bg-brand-soft text-brand-ink" : "bg-surface-2 text-muted"
                    }`}
                  >
                    {income ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-faint">
                      {t.category} · {t.account}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className={`text-sm font-semibold ${income ? "text-brand-ink" : "text-ink"}`}>
                      {income ? "+" : "−"}
                      {inr(Math.abs(t.amount))}
                    </p>
                    <p className="text-xs text-faint">{t.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Goals */}
        <Card className="card-pad">
          <CardHeader
            title="Savings Goals"
            right={<Link href="/goals" className="text-xs font-medium text-brand-ink hover:underline">Manage</Link>}
          />
          <div className="mt-4 space-y-4">
            {goals.slice(0, 4).map((g) => {
              const p = (g.saved / g.target) * 100;
              return (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{g.name}</span>
                    <span className="text-xs text-faint">{p.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={p} color={g.color} className="mt-1.5" />
                  <div className="mt-1 flex justify-between text-xs text-muted">
                    <span>{inr(g.saved, { compact: true })}</span>
                    <span>{inr(g.target, { compact: true })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
