import { TrendingUp } from "lucide-react";
import { Card, CardHeader, Delta, PageHeader, StatCard } from "@/components/ui";
import { DonutChart, GrowthLine } from "@/components/charts";
import { portfolio, portfolioAllocation, portfolioGrowth } from "@/lib/data";
import { getHoldings } from "@/lib/queries";
import { inr } from "@/lib/utils";

export default async function InvestmentsPage() {
  const holdings = await getHoldings();
  const gain = portfolio.current - portfolio.invested;

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Investments"
        subtitle="Portfolio performance across equity, debt, gold, and crypto."
        action={<button className="btn-brand"><TrendingUp className="h-4 w-4" /> Add holding</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Current Value" value={inr(portfolio.current, { compact: true })} delta={portfolio.dayChange} />
        <StatCard label="Total Invested" value={inr(portfolio.invested, { compact: true })} />
        <StatCard label="Total Returns" value={inr(gain, { compact: true })} delta={portfolio.totalReturn} />
        <StatCard label="Today's Change" value={inr(gain * 0.018, { compact: true })} delta={portfolio.dayChange} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="card-pad xl:col-span-2">
          <CardHeader title="Portfolio Growth" desc="Total value over time" right={<Delta value={portfolio.totalReturn} />} />
          <div className="mt-4">
            <GrowthLine data={portfolioGrowth} />
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader title="Asset Allocation" />
          <div className="mt-4">
            <DonutChart data={portfolioAllocation} />
          </div>
          <div className="mt-4 space-y-2.5">
            {portfolioAllocation.map((a) => (
              <div key={a.name} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                <span className="text-muted">{a.name}</span>
                <span className="ml-auto font-medium text-ink">{inr(a.value, { compact: true })}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="card-pad">
        <CardHeader title="Holdings" desc={`${holdings.length} instruments`} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-faint">
                <th className="pb-3 font-medium">Instrument</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 text-right font-medium">Invested</th>
                <th className="pb-3 text-right font-medium">Current</th>
                <th className="pb-3 text-right font-medium">Returns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {holdings.map((h) => {
                const ret = ((h.current - h.invested) / h.invested) * 100;
                return (
                  <tr key={h.name}>
                    <td className="py-3.5 font-medium text-ink">{h.name}</td>
                    <td className="py-3.5">
                      <span className="chip bg-surface-2 text-muted">{h.type}</span>
                    </td>
                    <td className="py-3.5 text-right text-muted">{inr(h.invested, { compact: true })}</td>
                    <td className="py-3.5 text-right font-medium text-ink">{inr(h.current, { compact: true })}</td>
                    <td className="py-3.5 text-right">
                      <Delta value={ret} />
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
