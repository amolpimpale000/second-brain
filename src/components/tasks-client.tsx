"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Circle, CheckCircle2, Flag, Trash2, X } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/ui";
import type { Task } from "@/lib/data";
import { cn } from "@/lib/utils";

const priorityStyle: Record<Task["priority"], string> = {
  high: "bg-rose-50 text-rose-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-surface-2 text-muted",
};

const inputCls = "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function NewTaskForm({ busy, onSubmit }: { busy: boolean; onSubmit: (d: { title: string; project: string; due: string; priority: string }) => void }) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({ title: title.trim(), project: project.trim(), due: due.trim(), priority });
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Title</label>
        <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Review Q3 submissions" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Project</label>
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. IJPS" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Due</label>
          <input value={due} onChange={(e) => setDue(e.target.value)} placeholder="e.g. 15 Jul" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])} className={inputCls}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
        {busy ? "Adding…" : "Add Task"}
      </button>
    </form>
  );
}

export function TasksClient({ initial }: { initial: Task[] }) {
  const [items, setItems] = useState<Task[]>(initial);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function apiMutate(action: "create" | "update" | "delete", payload: { id?: string; data?: Record<string, unknown> }) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Save failed");
    return json;
  }

  async function toggle(id: string) {
    const t = items.find((x) => x.id === id);
    if (!t) return;
    const nextDone = !t.done;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, done: nextDone } : x)));
    try {
      await apiMutate("update", { id, data: { done: nextDone } });
    } catch (err) {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, done: !nextDone } : x)));
      flash(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  async function remove(id: string) {
    const t = items.find((x) => x.id === id);
    if (!t || !window.confirm(`Delete "${t.title}"?`)) return;
    const prevItems = items;
    setItems((p) => p.filter((x) => x.id !== id));
    try {
      await apiMutate("delete", { id });
      flash("Task deleted");
    } catch (err) {
      setItems(prevItems);
      flash(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  async function addTask(data: { title: string; project: string; due: string; priority: string }) {
    setBusy(true);
    try {
      const { row } = await apiMutate("create", { data });
      setItems((p) => [...p, row]);
      setModalOpen(false);
      flash("Task added");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setBusy(false);
    }
  }

  const shown = items.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );
  const done = items.filter((t) => t.done).length;
  const high = items.filter((t) => t.priority === "high" && !t.done).length;

  return (
    <div className="animate-fade-up space-y-5">
      {toast && (
        <div className="fixed right-6 top-6 z-[110] rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-card-lg animate-fade-up">
          {toast}
        </div>
      )}

      <PageHeader
        title="Tasks"
        subtitle="Everything on your plate across journals, finance, and life."
        action={<button onClick={() => setModalOpen(true)} className="btn-brand"><Plus className="h-4 w-4" /> New task</button>}
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
            <div key={t.id} className="group flex items-center gap-3 py-3.5">
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
              <button
                onClick={() => remove(t.id)}
                title="Delete task"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-faint opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {shown.length === 0 && (
            <p className="py-10 text-center text-sm text-faint">Nothing here. You're all caught up ✨</p>
          )}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <NewTaskForm busy={busy} onSubmit={addTask} />
      </Modal>
    </div>
  );
}
