import { Landmark, CalendarClock } from "lucide-react";
import { Card, CardHeader, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { loans } from "@/lib/data";
import { inr } from "@/lib/utils";

export default function LoansPage() {
  const outstanding = loans.reduce((s, l) => s + l.outstanding, 0);
  const monthlyEmi = loans.reduce((s, l) => s + l.emi, 0);
  const totalPrincipal = loans.reduce((s, l) => s + l.principal, 0);
  const paid = totalPrincipal - outstanding;

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Loans & Liabilities"
        subtitle="Track every EMI, outstanding balance, and payoff progress."
        action={<button className="btn-brand"><Landmark className="h-4 w-4" /> Add loan</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Outstanding" value={inr(outstanding, { compact: true })} />
        <StatCard label="Monthly EMI" value={inr(monthlyEmi, { compact: true })} />
        <StatCard label="Principal Paid" value={inr(paid, { compact: true })} delta={6.2} />
        <StatCard label="Active Loans" value={`${loans.length}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {loans.map((l) => {
          const progress = ((l.principal - l.outstanding) / l.principal) * 100;
          return (
            <Card key={l.id} className="card-pad">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ink">{l.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">{l.lender} · {l.rate}% p.a.</p>
                </div>
                <span className="chip bg-surface-2 text-muted">
                  <CalendarClock className="h-3.5 w-3.5" /> {l.nextDue}
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted">Outstanding</p>
                    <p className="text-2xl font-semibold text-ink">{inr(l.outstanding)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">EMI</p>
                    <p className="text-lg font-semibold text-ink">{inr(l.emi)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <span>{progress.toFixed(0)}% paid</span>
                    <span>{l.tenureLeft} months left</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-xs text-faint">Principal</p>
                  <p className="font-medium text-ink">{inr(l.principal, { compact: true })}</p>
                </div>
                <div>
                  <p className="text-xs text-faint">Interest rate</p>
                  <p className="font-medium text-ink">{l.rate}%</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
