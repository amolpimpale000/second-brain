import { Car, Heart, Plane, Shield, Target, Plus } from "lucide-react";
import { Card, CardHeader, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { getGoals } from "@/lib/queries";
import { inr } from "@/lib/utils";

const icons: Record<string, React.ReactNode> = {
  car: <Car className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  plane: <Plane className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
};

export default async function GoalsPage() {
  const goals = await getGoals();
  const target = goals.reduce((s, g) => s + g.target, 0);
  const saved = goals.reduce((s, g) => s + g.saved, 0);
  const monthly = goals.reduce((s, g) => s + g.monthly, 0);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Savings Goals"
        subtitle="Car, wedding, travel and more — funding your future, tracked."
        action={<button className="btn-brand"><Plus className="h-4 w-4" /> New goal</button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Target" value={inr(target, { compact: true })} icon={<Target className="h-5 w-5" />} accent="var(--brand-soft)" />
        <StatCard label="Total Saved" value={inr(saved, { compact: true })} delta={14.8} />
        <StatCard label="Monthly Contribution" value={inr(monthly, { compact: true })} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {goals.map((g) => {
          const p = (g.saved / g.target) * 100;
          const remaining = g.target - g.saved;
          const done = p >= 100;
          return (
            <Card key={g.id} className="card-pad">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                    style={{ background: g.color }}
                  >
                    {icons[g.icon]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{g.name}</h3>
                    <p className="text-xs text-muted">Target · {g.deadline}</p>
                  </div>
                </div>
                {done ? (
                  <span className="chip bg-brand-soft text-brand-ink">Achieved 🎉</span>
                ) : (
                  <span className="chip bg-surface-2 text-muted">{p.toFixed(0)}%</span>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-semibold text-ink">{inr(g.saved)}</p>
                  <p className="text-sm text-muted">of {inr(g.target, { compact: true })}</p>
                </div>
                <ProgressBar value={p} color={g.color} className="mt-3 h-2.5" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                <div>
                  <p className="text-xs text-faint">{done ? "Surplus" : "Remaining"}</p>
                  <p className="font-medium text-ink">{inr(Math.abs(remaining), { compact: true })}</p>
                </div>
                <div>
                  <p className="text-xs text-faint">Monthly</p>
                  <p className="font-medium text-ink">{g.monthly ? inr(g.monthly, { compact: true }) : "—"}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
