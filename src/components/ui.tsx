import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "chip",
        up ? "bg-brand-soft text-brand-ink" : "bg-rose-50 text-rose-600",
        className
      )}
    >
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export function ProgressBar({
  value,
  color = "var(--brand)",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: number;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card className="card-pad">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        {icon && (
          <div
            className="grid h-9 w-9 place-items-center rounded-xl"
            style={{ background: accent ?? "var(--surface-2)", color: "var(--brand-ink)" }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="stat-num mt-3">{value}</p>
      {delta !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <Delta value={delta} />
          <span className="text-xs text-faint">vs last month</span>
        </div>
      )}
    </Card>
  );
}
