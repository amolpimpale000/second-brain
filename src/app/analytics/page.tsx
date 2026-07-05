import { Card, CardHeader, Delta, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { DonutChart, StackedBars } from "@/components/charts";
import { businessMonthly } from "@/lib/data";
import { getBusinesses } from "@/lib/queries";
import { inr } from "@/lib/utils";

export default async function AnalyticsPage() {
  const businesses = await getBusinesses();
  const revenue = businesses.reduce((s, b) => s + b.revenue, 0);
  const profit = businesses.reduce((s, b) => s + (b.revenue - b.expenses), 0);
  const revenueSplit = businesses.map((b) => ({ name: b.code, value: b.revenue, color: b.color }));
  const series = businesses.map((b) => ({ key: b.code, color: b.color }));

  const ranked = [...businesses].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Business Analytics"
        subtitle="Consolidated performance intelligence across all 5 journals."
        action={<button className="btn-soft">Last 6 months</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={inr(revenue, { compact: true })} delta={13.4} accent="var(--brand-soft)" />
        <StatCard label="Net Profit" value={inr(profit, { compact: true })} delta={16.1} />
        <StatCard label="Profit Margin" value={`${((profit / revenue) * 100).toFixed(1)}%`} delta={2.4} />
        <StatCard label="Avg Growth" value={`${(businesses.reduce((s, b) => s + b.growth, 0) / businesses.length).toFixed(1)}%`} delta={1.8} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="card-pad xl:col-span-2">
          <CardHeader
            title="Monthly Submissions by Journal"
            desc="Stacked volume across all titles (last 6 months)"
            right={
              <div className="flex flex-wrap gap-3 text-xs">
                {businesses.map((b) => (
                  <span key={b.code} className="flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: b.color }} /> {b.code}
                  </span>
                ))}
              </div>
            }
          />
          <div className="mt-4">
            <StackedBars data={businessMonthly} series={series} />
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader title="Revenue Share" desc="Contribution by journal" />
          <div className="mt-4">
            <DonutChart data={revenueSplit} />
          </div>
          <div className="mt-4 space-y-2.5">
            {revenueSplit.map((r) => (
              <div key={r.name} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                <span className="text-muted">{r.name}</span>
                <span className="ml-auto font-medium text-ink">{inr(r.value, { compact: true })}</span>
                <span className="w-10 text-right text-xs text-faint">{((r.value / revenue) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="card-pad">
        <CardHeader title="Journal Leaderboard" desc="Ranked by revenue & efficiency" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-faint">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Journal</th>
                <th className="pb-3 text-right font-medium">Revenue</th>
                <th className="pb-3 text-right font-medium">Profit</th>
                <th className="pb-3 text-right font-medium">Margin</th>
                <th className="pb-3 text-right font-medium">Growth</th>
                <th className="pb-3 font-medium pl-6">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranked.map((b, i) => {
                const p = b.revenue - b.expenses;
                const margin = (p / b.revenue) * 100;
                return (
                  <tr key={b.id}>
                    <td className="py-3.5 font-semibold text-faint">{i + 1}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                        <span className="font-medium text-ink">{b.code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-medium text-ink">{inr(b.revenue, { compact: true })}</td>
                    <td className="py-3.5 text-right text-brand-ink">{inr(p, { compact: true })}</td>
                    <td className="py-3.5 text-right text-muted">{margin.toFixed(0)}%</td>
                    <td className="py-3.5 text-right"><Delta value={b.growth} /></td>
                    <td className="py-3.5 pl-6">
                      <ProgressBar value={(b.revenue / revenue) * 100} color={b.color} className="w-32" />
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
