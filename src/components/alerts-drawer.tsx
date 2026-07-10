"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell, X, Clock, FileWarning, UserX, RefreshCw, ShieldAlert, MailWarning,
  Check, RotateCcw, Settings2, ChevronDown, Loader2, Gift, PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertRule, AlertSeverity } from "@/lib/journal-alerts";

type Alert = {
  id: string;
  rule: AlertRule;
  severity: AlertSeverity;
  journal: string;
  title: string;
  detail: string;
  manuscriptId?: string;
  employee?: string;
  ageDays?: number;
  when?: string;
};
type EmployeeLite = { id: number; name: string };
type AlertsResponse = {
  alerts: Alert[];
  roster: Record<string, EmployeeLite[]>;
  tracked: Record<string, number[]>;
  dismissedCount: number;
  generatedAt: string;
  errors: string[];
};

const JOURNALS = ["IJPS", "IJSRT", "IJMPS", "IJES", "JPS"] as const;

const RULE_META: Record<AlertRule, { label: string; icon: React.ElementType }> = {
  manuscript_stale: { label: "Awaiting acceptance", icon: FileWarning },
  employee_idle: { label: "Employee inactive", icon: UserX },
  revision_overdue: { label: "Corrections overdue", icon: RefreshCw },
  plagiarism_pending: { label: "Plagiarism pending", icon: ShieldAlert },
  contact_unresolved: { label: "Contact query", icon: MailWarning },
  referral_pending: { label: "Referral pending", icon: Gift },
  ai_calling_failed: { label: "AI calling failing", icon: PhoneOff },
};

const SEV_STYLE: Record<AlertSeverity, { dot: string; chip: string }> = {
  high: { dot: "bg-red-500", chip: "bg-red-50 text-red-600 border-red-100" },
  medium: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-600 border-amber-100" },
  low: { dot: "bg-slate-400", chip: "bg-slate-50 text-slate-500 border-slate-200" },
};

const JOURNAL_COLOR: Record<string, string> = {
  IJPS: "#6366f1", IJSRT: "#0ea5e9", IJMPS: "#14b8a6", IJES: "#f59e0b", JPS: "#ec4899",
};

export function AlertsBell({ initialData }: { initialData?: AlertsResponse }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AlertsResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [ruleFilter, setRuleFilter] = useState<AlertRule | "all">("all");
  const [journalFilter, setJournalFilter] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  const fetchedOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/journals/alerts", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setData(json);
    } catch {
      /* keep whatever we had */
    } finally {
      setLoading(false);
    }
  }, []);

  // First load (bell badge) on mount, without blocking page render.
  useEffect(() => {
    if (!fetchedOnce.current) {
      fetchedOnce.current = true;
      load();
    }
  }, [load]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const alerts = data?.alerts ?? [];
  const count = alerts.length;

  const filtered = useMemo(() => {
    return alerts.filter(
      (a) => (ruleFilter === "all" || a.rule === ruleFilter) && (journalFilter === "all" || a.journal === journalFilter)
    );
  }, [alerts, ruleFilter, journalFilter]);

  const countsByRule = useMemo(() => {
    const m = new Map<AlertRule, number>();
    for (const a of alerts) m.set(a.rule, (m.get(a.rule) ?? 0) + 1);
    return m;
  }, [alerts]);

  const highCount = alerts.filter((a) => a.severity === "high").length;

  async function dismiss(a: Alert) {
    setBusyIds((s) => new Set(s).add(a.id));
    // optimistic removal
    setData((d) => (d ? { ...d, alerts: d.alerts.filter((x) => x.id !== a.id), dismissedCount: d.dismissedCount + 1 } : d));
    try {
      await fetch("/api/journals/alerts/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertKey: a.id, rule: a.rule, journalCode: a.journal }),
      });
    } catch {
      load(); // reconcile on failure
    } finally {
      setBusyIds((s) => { const n = new Set(s); n.delete(a.id); return n; });
    }
  }

  async function restoreDismissed() {
    await fetch("/api/journals/alerts/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearAll: true }),
    });
    load();
  }

  return (
    <>
      {/* Bell indicator */}
      <div className="relative inline-block">
        {count > 0 && (
          <>
            <span className={cn("pointer-events-none absolute inset-0 rounded-full animate-ping", highCount > 0 ? "bg-red-500" : "bg-amber-500", "opacity-60")} />
            <span className={cn("pointer-events-none absolute inset-0 rounded-full animate-ping [animation-delay:0.5s]", highCount > 0 ? "bg-red-500" : "bg-amber-500", "opacity-40")} />
          </>
        )}
        <button
          onClick={() => setOpen(true)}
          className="relative z-10 grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted shadow-card transition-colors hover:text-ink"
          title="Alerts & Notifications"
          aria-label="Open alerts"
        >
          <Bell className="h-[18px] w-[18px]" />
          {count > 0 && (
            <span
              className={cn(
                "absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[11px] font-bold text-white ring-2 ring-bg",
                highCount > 0 ? "bg-red-500" : "bg-amber-500"
              )}
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </div>

      {/* Overlay + Drawer */}
      <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={cn("absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
        />
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-bg shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-label="Alerts and notifications"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand-ink">
              <Bell className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-ink">Alerts &amp; Notifications</h2>
              <p className="text-xs text-faint">
                {loading ? "Refreshing…" : `${count} active${highCount ? ` · ${highCount} urgent` : ""} across all journals`}
              </p>
            </div>
            <button onClick={() => load()} className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink" title="Refresh">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-2 border-b border-border px-5 py-3">
            <div className="flex flex-wrap gap-1.5">
              <Chip active={journalFilter === "all"} onClick={() => setJournalFilter("all")}>All journals</Chip>
              {JOURNALS.map((j) => (
                <Chip key={j} active={journalFilter === j} onClick={() => setJournalFilter(j)} dot={JOURNAL_COLOR[j]}>
                  {j}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={ruleFilter === "all"} onClick={() => setRuleFilter("all")}>All ({count})</Chip>
              {(Object.keys(RULE_META) as AlertRule[]).map((r) => {
                const n = countsByRule.get(r) ?? 0;
                const Icon = RULE_META[r].icon;
                return (
                  <Chip key={r} active={ruleFilter === r} onClick={() => setRuleFilter(r)} disabled={n === 0}>
                    <Icon className="h-3 w-3" /> {RULE_META[r].label} {n > 0 && `(${n})`}
                  </Chip>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loading && alerts.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-faint">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading alerts…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                  <Check className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-ink">All clear</p>
                <p className="text-xs text-faint">No alerts match this filter.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((a) => {
                  const Icon = RULE_META[a.rule].icon;
                  const busy = busyIds.has(a.id);
                  return (
                    <li key={a.id} className={cn("group relative rounded-xl border border-border bg-card p-3 shadow-card transition-opacity", busy && "opacity-50")}>
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex flex-col items-center gap-1">
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", SEV_STYLE[a.severity].dot)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                              style={{ background: JOURNAL_COLOR[a.journal] ?? "#64748b" }}
                            >
                              {a.journal}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-faint">
                              <Icon className="h-3 w-3" /> {RULE_META[a.rule].label}
                            </span>
                            {a.ageDays != null && a.ageDays > 0 && (
                              <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] text-faint">
                                <Clock className="h-3 w-3" /> {a.ageDays}d
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-ink">{a.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted">{a.detail}</p>
                          {(a.manuscriptId || a.employee) && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {a.manuscriptId && (
                                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">ID {a.manuscriptId}</span>
                              )}
                              {a.employee && (
                                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">{a.employee}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => dismiss(a)}
                          disabled={busy}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-faint opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
                          title="Dismiss"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer: settings + restore dismissed */}
          <div className="border-t border-border">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="flex w-full items-center gap-2 px-5 py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
            >
              <Settings2 className="h-4 w-4" /> Tracked employees (Rule 2)
              <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", showSettings && "rotate-180")} />
            </button>
            {showSettings && data && (
              <TrackedSettings roster={data.roster} tracked={data.tracked} onSaved={load} />
            )}
            {data && data.dismissedCount > 0 && (
              <button
                onClick={restoreDismissed}
                className="flex w-full items-center justify-center gap-2 border-t border-border px-5 py-2.5 text-xs font-medium text-faint hover:bg-surface-2 hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restore {data.dismissedCount} dismissed
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function Chip({
  children, active, onClick, disabled, dot,
}: { children: React.ReactNode; active?: boolean; onClick?: () => void; disabled?: boolean; dot?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active ? "border-brand bg-brand-soft text-brand-ink" : "border-border bg-card text-muted hover:text-ink",
        disabled && "cursor-not-allowed opacity-40 hover:text-muted"
      )}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  );
}

function TrackedSettings({
  roster, tracked, onSaved,
}: { roster: Record<string, EmployeeLite[]>; tracked: Record<string, number[]>; onSaved: () => void }) {
  const [local, setLocal] = useState<Record<string, number[]>>(() => ({ ...tracked }));
  const [savingJournal, setSavingJournal] = useState<string | null>(null);

  const toggle = (journal: string, id: number) => {
    setLocal((prev) => {
      const cur = new Set(prev[journal] ?? []);
      if (cur.has(id)) cur.delete(id); else cur.add(id);
      return { ...prev, [journal]: Array.from(cur) };
    });
  };

  async function save(journal: string) {
    setSavingJournal(journal);
    try {
      await fetch("/api/journals/alerts/tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalCode: journal, employeeIds: local[journal] ?? [] }),
      });
      onSaved();
    } finally {
      setSavingJournal(null);
    }
  }

  const journalsWithStaff = JOURNALS.filter((j) => (roster[j]?.length ?? 0) > 0);

  return (
    <div className="max-h-64 space-y-3 overflow-y-auto bg-surface px-5 py-3">
      <p className="text-[11px] leading-relaxed text-faint">
        Untick an employee to stop alerting when they publish nothing in 24h. All active staff are tracked by default.
      </p>
      {journalsWithStaff.map((j) => (
        <div key={j} className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: JOURNAL_COLOR[j] }}>{j}</span>
            <button
              onClick={() => save(j)}
              disabled={savingJournal === j}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-brand px-2 py-0.5 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {savingJournal === j ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {roster[j].map((e) => {
              const on = (local[j] ?? tracked[j] ?? []).includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(j, e.id)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                    on ? "border-brand bg-brand-soft text-brand-ink" : "border-border bg-surface text-faint"
                  )}
                >
                  {e.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
