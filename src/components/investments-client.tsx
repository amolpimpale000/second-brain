"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Pencil, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, X, Wallet,
  LineChart as LineChartIcon, IndianRupee, Landmark, Globe2, Coins, Banknote, Bitcoin, LayoutGrid,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { cn, inr } from "@/lib/utils";
import { INVESTMENT_TYPES } from "@/lib/investment-types";
import type { FinInvestment } from "@/lib/finance-store";

/* ── shared primitives (visually matched to /finances) ───────────────────── */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04),0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)] hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  Stocks: LineChartIcon, "US Stocks": Globe2, "Mutual Funds": Landmark, PPF: Banknote,
  Gold: Coins, FD: Wallet, Crypto: Bitcoin, Other: LayoutGrid,
};

const inputCls = "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (open) document.documentElement.classList.add("overflow-hidden");
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, [open]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-card-lg animate-fade-up">
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

function InvestmentForm({
  initial, submitLabel, onSubmit, busy,
}: {
  initial?: Partial<FinInvestment>;
  submitLabel: string;
  onSubmit: (data: { name: string; type: string; invested: number; currentValue: number }) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "Stocks");
  const [invested, setInvested] = useState(initial?.invested != null ? String(initial.invested) : "");
  const [currentValue, setCurrentValue] = useState(initial?.currentValue != null ? String(initial.currentValue) : "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, type, invested: Number(invested) || 0, currentValue: Number(currentValue) || 0 });
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IRFC · 548 qty" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
          {INVESTMENT_TYPES.map((t) => <option key={t.value}>{t.value}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Invested (₹)</label>
          <input required type="number" step="0.01" value={invested} onChange={(e) => setInvested(e.target.value)} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Current Value (₹)</label>
          <input required type="number" step="0.01" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="0" className={inputCls} />
        </div>
      </div>
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

/* ── main page ────────────────────────────────────────────────────────────── */
type ModalState =
  | { kind: "add" }
  | { kind: "edit"; investment: FinInvestment }
  | { kind: "value"; investment: FinInvestment }
  | null;

export function InvestmentsClient({ initial }: { initial: FinInvestment[] }) {
  const [items, setItems] = useState<FinInvestment[]>(initial);
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function apiMutate(action: "create" | "update" | "delete", payload: { id?: string; data?: Record<string, unknown> }) {
    const res = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "investments", action, ...payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Save failed");
    return json;
  }

  async function save(action: "create" | "update", data: Record<string, unknown>, id?: string, msg = "Saved") {
    setBusy(true);
    try {
      const { row } = await apiMutate(action, action === "create" ? { data } : { id, data });
      setItems((p) => (action === "create" ? [...p, row] : p.map((r) => (r.id === id ? row : r))));
      setModal(null);
      flash(msg);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(i: FinInvestment) {
    if (!window.confirm(`Delete "${i.name}"?`)) return;
    try {
      await apiMutate("delete", { id: i.id });
      setItems((p) => p.filter((r) => r.id !== i.id));
      flash("Deleted");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const M = useMemo(() => {
    const invested = items.reduce((s, i) => s + i.invested, 0);
    const current = items.reduce((s, i) => s + i.currentValue, 0);
    const gain = current - invested;
    const gainPct = invested > 0 ? Math.round((gain / invested) * 1000) / 10 : 0;

    const byType = INVESTMENT_TYPES.map((t) => {
      const list = items.filter((i) => i.type === t.value);
      const inv = list.reduce((s, i) => s + i.invested, 0);
      const cur = list.reduce((s, i) => s + i.currentValue, 0);
      return { type: t.value, color: t.color, list, invested: inv, current: cur, gain: cur - inv, gainPct: inv > 0 ? Math.round(((cur - inv) / inv) * 1000) / 10 : 0 };
    }).filter((t) => t.list.length > 0);

    const donut = byType.map((t) => ({ name: t.type, value: Math.round(t.current), color: t.color }));
    return { invested, current, gain, gainPct, byType, donut };
  }, [items]);

  return (
    <div className="animate-fade-up space-y-4">
      {toast && (
        <div className="fixed right-6 top-6 z-[110] rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-card-lg animate-fade-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Investments</h1>
          <p className="mt-1 text-sm text-muted">Your full portfolio — Indian stocks, US stocks, mutual funds and more.</p>
        </div>
        <button
          onClick={() => setModal({ kind: "add" })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Investment
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Invested", value: inr(Math.round(M.invested)), color: "#6366f1", icon: IndianRupee },
          { label: "Current Value", value: inr(Math.round(M.current)), color: "#22c55e", icon: Wallet },
          { label: "Total Gain / Loss", value: `${M.gain >= 0 ? "+" : "−"}${inr(Math.abs(Math.round(M.gain)))}`, color: M.gain >= 0 ? "#22c55e" : "#ef4444", icon: M.gain >= 0 ? TrendingUp : TrendingDown },
          { label: "Overall Return", value: `${M.gainPct >= 0 ? "+" : ""}${M.gainPct}%`, color: M.gainPct >= 0 ? "#22c55e" : "#ef4444", icon: M.gainPct >= 0 ? ArrowUpRight : ArrowDownRight },
        ].map((k) => (
          <Card key={k.label} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted">{k.label}</p>
                <p className="mt-1 text-[20px] font-semibold" style={{ color: k.color }}>{k.value}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${k.color}14` }}>
                <k.icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[320px_1fr]">
        {/* Allocation */}
        <Card>
          <h3 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">Allocation</h3>
          {M.donut.length === 0 ? (
            <p className="py-8 text-center text-sm text-faint">No investments yet — add your first one.</p>
          ) : (
            <>
              <div className="relative mx-auto w-fit">
                <ResponsiveContainer width={190} height={190} debounce={200}>
                  <PieChart>
                    <Pie data={M.donut} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
                      {M.donut.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) =>
                      active && payload?.length ? (
                        <Tip><p className="font-medium text-ink">{String(payload[0].name)}</p><p className="text-muted">{inr(Number(payload[0].value))}</p></Tip>
                      ) : null
                    } />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-sm font-bold text-ink">{inr(Math.round(M.current), { compact: true })}</p>
                  <p className="text-[10px] text-faint">Current</p>
                </div>
              </div>
              <div className="mt-2 space-y-1.5">
                {M.byType.map((t) => {
                  const pctOf = M.current > 0 ? Math.round((t.current / M.current) * 100) : 0;
                  return (
                    <div key={t.type} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: t.color }} />
                      <span className="flex-1 text-muted">{t.type}</span>
                      <span className="text-faint">{pctOf}%</span>
                      <span className="w-[72px] text-right font-medium text-ink">₹ {Math.round(t.current).toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Holdings grouped by type */}
        <div className="space-y-4">
          {M.byType.length === 0 && (
            <Card>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-faint">Track your Indian stocks, US stocks, mutual funds, PPF, gold and more.</p>
                <button onClick={() => setModal({ kind: "add" })} className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
                  <Plus className="h-4 w-4" /> Add Investment
                </button>
              </div>
            </Card>
          )}
          {M.byType.map((group) => {
            const GIcon = TYPE_ICON[group.type] ?? LayoutGrid;
            return (
              <Card key={group.type}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${group.color}16` }}>
                      <GIcon style={{ color: group.color, height: 18, width: 18 }} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold tracking-tight text-ink">{group.type}</h3>
                      <p className="text-[11px] text-muted">{group.list.length} holding{group.list.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] text-muted">Invested</p>
                      <p className="text-[13px] font-semibold text-ink">₹ {Math.round(group.invested).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">Current</p>
                      <p className="text-[13px] font-semibold text-ink">₹ {Math.round(group.current).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted">P&L</p>
                      <p className={cn("text-[13px] font-semibold", group.gain >= 0 ? "text-green-600" : "text-red-500")}>
                        {group.gain >= 0 ? "+" : "−"}₹ {Math.abs(Math.round(group.gain)).toLocaleString("en-IN")} ({group.gainPct >= 0 ? "+" : ""}{group.gainPct}%)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-faint">
                        <th className="pb-2">Name</th>
                        <th className="pb-2 text-right">Invested</th>
                        <th className="pb-2 text-right">Current</th>
                        <th className="pb-2 text-right">P&L</th>
                        <th className="pb-2 text-right">Return</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.list.map((i) => {
                        const gain = i.currentValue - i.invested;
                        const gainPct = i.invested > 0 ? Math.round((gain / i.invested) * 1000) / 10 : 0;
                        return (
                          <tr key={i.id} className="group border-b border-border last:border-0 hover:bg-surface-2/40">
                            <td className="py-2.5 text-[13px] font-medium text-ink">{i.name}</td>
                            <td className="py-2.5 text-right text-[12px] text-muted whitespace-nowrap">₹ {Math.round(i.invested).toLocaleString("en-IN")}</td>
                            <td className="py-2.5 text-right text-[13px] font-semibold text-ink whitespace-nowrap">₹ {Math.round(i.currentValue).toLocaleString("en-IN")}</td>
                            <td className={cn("py-2.5 text-right text-[12px] font-semibold whitespace-nowrap", gain >= 0 ? "text-green-600" : "text-red-500")}>
                              {gain >= 0 ? "+" : "−"}₹ {Math.abs(Math.round(gain)).toLocaleString("en-IN")}
                            </td>
                            <td className={cn("py-2.5 text-right text-[12px] font-semibold", gainPct >= 0 ? "text-green-600" : "text-red-500")}>
                              {gainPct >= 0 ? "+" : ""}{gainPct}%
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setModal({ kind: "value", investment: i })} title="Update current value" className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-ink"><TrendingUp className="h-3 w-3" /></button>
                                <button onClick={() => setModal({ kind: "edit", investment: i })} title="Edit" className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-ink"><Pencil className="h-3 w-3" /></button>
                                <button onClick={() => remove(i)} title="Delete" className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <Modal open={modal?.kind === "add"} onClose={() => setModal(null)} title="Add Investment">
        <InvestmentForm
          submitLabel="Add Investment"
          busy={busy}
          onSubmit={(d) => save("create", d, undefined, "Investment added")}
        />
      </Modal>

      {modal?.kind === "edit" && (
        <Modal open onClose={() => setModal(null)} title="Edit Investment">
          <InvestmentForm
            initial={modal.investment}
            submitLabel="Save Changes"
            busy={busy}
            onSubmit={(d) => save("update", d, modal.investment.id, "Investment updated")}
          />
        </Modal>
      )}

      {modal?.kind === "value" && (
        <Modal open onClose={() => setModal(null)} title={`Update Value — ${modal.investment.name}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = Number((e.currentTarget.elements.namedItem("cv") as HTMLInputElement).value) || 0;
              save("update", { currentValue: v }, modal.investment.id, "Value updated");
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Current Value (₹)</label>
              <input name="cv" required type="number" step="0.01" defaultValue={modal.investment.currentValue} className={inputCls} />
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
              {busy ? "Saving…" : "Update Value"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
