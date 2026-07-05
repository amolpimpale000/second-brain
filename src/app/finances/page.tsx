import { ArrowDownRight, ArrowUpRight, Filter, Download } from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { CashflowChart, DonutChart } from "@/components/charts";
import { cashflow, spendingByCategory } from "@/lib/data";
import { getTransactions } from "@/lib/queries";
import { inr } from "@/lib/utils";

export default async function FinancesPage() {
  const transactions = await getTransactions();
  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalSpend = spendingByCategory.reduce((s, c) => s + c.value, 0);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Finances"
        subtitle="Every rupee in and out — income, expenses, and cash flow."
        action={
          <div className="flex gap-2">
            <button className="btn-soft"><Filter className="h-4 w-4" /> Filter</button>
            <button className="btn-soft"><Download className="h-4 w-4" /> Export</button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income (period)" value={inr(income, { compact: true })} delta={8.2} />
        <StatCard label="Expenses (period)" value={inr(expense, { compact: true })} delta={-4.1} />
        <StatCard label="Net Cash Flow" value={inr(income - expense, { compact: true })} delta={15.6} />
        <StatCard label="Avg Monthly Burn" value={inr(457000, { compact: true })} delta={-2.3} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="card-pad xl:col-span-2">
          <CardHeader title="Income vs Expenses" desc="Monthly trend" />
          <div className="mt-4">
            <CashflowChart data={cashflow} />
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader title="Spending Breakdown" desc="By category" />
          <div className="mt-4">
            <DonutChart data={spendingByCategory} />
          </div>
          <div className="mt-4 space-y-2.5">
            {spendingByCategory.map((c) => (
              <div key={c.name} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-muted">{c.name}</span>
                <span className="ml-auto font-medium text-ink">{inr(c.value, { compact: true })}</span>
                <span className="w-10 text-right text-xs text-faint">
                  {((c.value / totalSpend) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transaction ledger */}
      <Card className="card-pad">
        <CardHeader title="Transaction Ledger" desc={`${transactions.length} transactions`} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-faint">
                <th className="pb-3 font-medium">Transaction</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Account</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 text-right font-medium">Amount</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => {
                const income = t.amount > 0;
                return (
                  <tr key={t.id} className="group">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`grid h-8 w-8 place-items-center rounded-lg ${income ? "bg-brand-soft text-brand-ink" : "bg-surface-2 text-muted"}`}>
                          {income ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <span className="font-medium text-ink">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-muted">{t.category}</td>
                    <td className="py-3.5 text-muted">{t.account}</td>
                    <td className="py-3.5 text-muted">{t.date}</td>
                    <td className={`py-3.5 text-right font-semibold ${income ? "text-brand-ink" : "text-ink"}`}>
                      {income ? "+" : "−"}{inr(Math.abs(t.amount))}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`chip ${t.status === "completed" ? "bg-brand-soft text-brand-ink" : "bg-amber-50 text-amber-600"}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
