"use client";

import { useState } from "react";
import { Plus, Circle, CheckCircle2, Flag } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { tasks as seed, type Task } from "@/lib/data";
import { cn } from "@/lib/utils";

const priorityStyle: Record<Task["priority"], string> = {
  high: "bg-rose-50 text-rose-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-surface-2 text-muted",
};

export default function TasksPage() {
  const [items, setItems] = useState<Task[]>(seed);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const toggle = (id: string) =>
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const shown = items.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );
  const done = items.filter((t) => t.done).length;
  const high = items.filter((t) => t.priority === "high" && !t.done).length;

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Tasks"
        subtitle="Everything on your plate across journals, finance, and life."
        action={<button className="btn-brand"><Plus className="h-4 w-4" /> New task</button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Tasks" value={`${items.length - done}`} />
        <StatCard label="High Priority" value={`${high}`} />
        <StatCard label="Completed" value={`${done} / ${items.length}`} />
      </div>

      <Card className="card-pad">
        <div className="mb-4 flex gap-1.5">
          {(["all", "active", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                filter === f ? "bg-ink text-white" : "text-muted hover:bg-surface-2"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {shown.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3.5">
              <button onClick={() => toggle(t.id)} className="shrink-0">
                {t.done ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-ink" />
                ) : (
                  <Circle className="h-5 w-5 text-faint hover:text-brand-ink" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", t.done ? "text-faint line-through" : "text-ink")}>
                  {t.title}
                </p>
                <p className="text-xs text-faint">{t.project}</p>
              </div>
              <span className={cn("chip", priorityStyle[t.priority])}>
                <Flag className="h-3 w-3" /> {t.priority}
              </span>
              <span className="w-20 text-right text-xs text-muted">{t.due}</span>
            </div>
          ))}
          {shown.length === 0 && (
            <p className="py-10 text-center text-sm text-faint">Nothing here. You're all caught up ✨</p>
          )}
        </div>
      </Card>
    </div>
  );
}
