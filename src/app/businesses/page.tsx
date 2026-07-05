import Link from "next/link";
import { FileText, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, Delta, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { getBusinesses } from "@/lib/queries";
import { inr } from "@/lib/utils";

export default async function BusinessesPage() {
  const businesses = await getBusinesses();
  const revenue = businesses.reduce((s, b) => s + b.revenue, 0);
  const profit = businesses.reduce((s, b) => s + (b.revenue - b.expenses), 0);
  const submissions = businesses.reduce((s, b) => s + b.submissions, 0);
  const published = businesses.reduce((s, b) => s + b.published, 0);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Journals"
        subtitle="Your 5 publishing businesses — revenue, submissions & output."
        action={<Link href="/analytics" className="btn-brand">Full analytics <ArrowUpRight className="h-4 w-4" /></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Combined Revenue" value={inr(revenue, { compact: true })} delta={13.4} />
        <StatCard label="Net Profit" value={inr(profit, { compact: true })} delta={16.1} />
        <StatCard label="Total Submissions" value={submissions.toLocaleString("en-IN")} delta={9.8} />
        <StatCard label="Papers Published" value={published.toLocaleString("en-IN")} delta={11.2} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {businesses.map((b) => {
          const p = b.revenue - b.expenses;
          const margin = (p / b.revenue) * 100;
          const acceptRate = (b.published / b.submissions) * 100;
          return (
            <Card key={b.id} className="card-pad">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl text-base font-bold text-white"
                    style={{ background: b.color }}
                  >
                    {b.code.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{b.code}</h3>
                    <p className="max-w-[220px] text-xs text-muted">{b.name}</p>
                  </div>
                </div>
                <Delta value={b.growth} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-surface-2 p-3">
                  <p className="text-xs text-muted">Revenue</p>
                  <p className="mt-1 font-semibold text-ink">{inr(b.revenue, { compact: true })}</p>
                </div>
                <div className="rounded-2xl bg-surface-2 p-3">
                  <p className="text-xs text-muted">Profit</p>
                  <p className="mt-1 font-semibold text-brand-ink">{inr(p, { compact: true })}</p>
                </div>
                <div className="rounded-2xl bg-surface-2 p-3">
                  <p className="text-xs text-muted">Margin</p>
                  <p className="mt-1 font-semibold text-ink">{margin.toFixed(0)}%</p>
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted" />
                  <span className="text-muted">Submissions</span>
                  <span className="ml-auto font-medium text-ink">{b.submissions}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted" />
                  <span className="text-muted">Published · {acceptRate.toFixed(0)}% accept rate</span>
                  <span className="ml-auto font-medium text-ink">{b.published}</span>
                </div>
                <ProgressBar value={acceptRate} color={b.color} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
