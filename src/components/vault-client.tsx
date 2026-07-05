"use client";

import { useMemo, useState } from "react";
import {
  Lock, Folder, ShieldCheck, CheckCircle2, AlertCircle,
  Search, ChevronDown, List, LayoutGrid,
  Landmark, Mail, Share2, ShoppingBag, Briefcase, Clapperboard, GraduationCap, Wallet, Circle,
  Star, MoreVertical, Wand2, Plus, DownloadCloud, UploadCloud, Trash2, RefreshCw, Clock, Eye, EyeOff,
} from "lucide-react";
import type { VaultAccount } from "@/lib/data";
import { vaultCategories, vaultCards, vaultStats, vaultSecurity } from "@/lib/data";
import { cn } from "@/lib/utils";

const tone: Record<string, { bg: string; fg: string }> = {
  green: { bg: "bg-green-50", fg: "text-green-600" },
  purple: { bg: "bg-purple-50", fg: "text-purple-600" },
  amber: { bg: "bg-amber-50", fg: "text-amber-500" },
  red: { bg: "bg-red-50", fg: "text-red-500" },
};

const statIcon: Record<string, React.ElementType> = {
  lock: Lock, folder: Folder, shield: ShieldCheck, check: CheckCircle2, alert: AlertCircle,
};
const catIcon: Record<string, React.ElementType> = {
  lock: Lock, landmark: Landmark, mail: Mail, share: Share2, bag: ShoppingBag,
  briefcase: Briefcase, play: Clapperboard, cap: GraduationCap, wallet: Wallet, circle: Circle,
};
const dashIcon: Record<string, React.ElementType> = {
  shield: ShieldCheck, lock: Lock, refresh: RefreshCw, clock: Clock,
};

const catPill: Record<VaultAccount["category"], string> = {
  Banking: "bg-blue-50 text-blue-600",
  Email: "bg-red-50 text-red-500",
  "Social Media": "bg-indigo-50 text-indigo-600",
  Shopping: "bg-amber-50 text-amber-600",
  Business: "bg-purple-50 text-purple-600",
  Entertainment: "bg-pink-50 text-pink-600",
};

const cardTheme: Record<string, string> = {
  blue: "from-blue-600 to-blue-500",
  orange: "from-orange-500 to-amber-600",
  dark: "from-slate-800 to-slate-950",
};

function ScoreRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-[168px] w-[168px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="#22c55e" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-ink">{value}%</span>
        <span className="text-xs font-medium text-green-600">Excellent</span>
      </div>
    </div>
  );
}

export function VaultClient({ accounts }: { accounts: VaultAccount[] }) {
  const [activeCat, setActiveCat] = useState("All Passwords");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [favs, setFavs] = useState<Record<string, boolean>>(
    Object.fromEntries(accounts.map((a) => [a.id, a.favorite]))
  );
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const toggleFav = (id: string) => setFavs((f) => ({ ...f, [id]: !f[id] }));
  const toggleCard = (id: string) => setRevealed((r) => ({ ...r, [id]: !r[id] }));

  const rows = useMemo(
    () =>
      accounts.filter((a) => {
        const catOk = activeCat === "All Passwords" || a.category === activeCat;
        const q = query.trim().toLowerCase();
        const qOk = !q || a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q);
        return catOk && qOk;
      }),
    [accounts, activeCat, query]
  );

  return (
    <div className="animate-fade-up space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Passwords</h1>
          <p className="mt-1 text-sm text-muted">Manage and secure all your accounts in one place</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2">
            <Wand2 className="h-4 w-4 text-muted" /> Password Generator
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-green-500 py-2.5 pl-4 pr-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-600">
            <Plus className="h-4 w-4" /> Add New
            <span className="ml-1 border-l border-white/30 pl-2"><ChevronDown className="h-4 w-4" /></span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {vaultStats.map((s) => {
          const Icon = statIcon[s.icon];
          const t = tone[s.tone];
          const subColor =
            s.label === "Security Score" ? "text-green-600"
            : s.label === "Weak Passwords" ? "text-red-500"
            : "text-faint";
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-muted">{s.label}</p>
                <div className={cn("grid h-8 w-8 place-items-center rounded-full", t.bg)}>
                  <Icon className={cn("h-4 w-4", t.fg)} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-ink">{s.value}</p>
              <p className={cn("mt-0.5 text-xs font-medium", subColor)}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main + right rail */}
      <div className="grid gap-5 xl:grid-cols-[1fr_336px]">
        {/* LEFT */}
        <div className="min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-border bg-card p-2.5 shadow-card">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search accounts..."
                className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-green-400 focus:outline-none"
              />
            </div>
            {["All Categories", "All Types", "Sort: Recent"].map((f) => (
              <button key={f} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2">
                {f} <ChevronDown className="h-3.5 w-3.5" />
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 rounded-xl border border-border bg-surface p-0.5">
              <button onClick={() => setView("list")} className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "list" ? "bg-green-50 text-green-600" : "text-faint")}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setView("grid")} className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "grid" ? "bg-green-50 text-green-600" : "text-faint")}>
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Categories + table */}
          <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
            {/* Categories */}
            <div className="h-max rounded-2xl border border-border bg-card p-3 shadow-card">
              <p className="px-2 pb-2 text-sm font-semibold text-ink">Categories</p>
              <div className="space-y-0.5">
                {vaultCategories.map((c) => {
                  const Icon = catIcon[c.icon];
                  const active = c.name === activeCat;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setActiveCat(c.name)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                        active ? "bg-green-50 font-medium text-green-700" : "text-muted hover:bg-surface-2"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: c.color }} />
                      <span className="truncate">{c.name}</span>
                      <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-medium", active ? "bg-green-100 text-green-700" : "bg-surface-2 text-faint")}>
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accounts table */}
            <div className="min-w-0 rounded-2xl border border-border bg-card shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium text-faint">
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Username / Email</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Last Used</th>
                      <th className="px-4 py-3"></th>
                      <th className="px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: a.color }}>
                              {a.initial}
                            </div>
                            <span className="font-medium text-ink">{a.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{a.username}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", catPill[a.category])}>
                            {a.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">{a.lastUsed}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleFav(a.id)} aria-label="Favorite">
                            <Star className={cn("h-4 w-4", favs[a.id] ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-400")} />
                          </button>
                        </td>
                        <td className="px-2 py-3">
                          <button className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink" aria-label="More">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                <p className="text-xs text-muted">Showing 1 to {rows.length} of 128 accounts</p>
                <div className="flex items-center gap-1">
                  <PageBtn>‹</PageBtn>
                  <PageBtn active>1</PageBtn>
                  <PageBtn>2</PageBtn>
                  <PageBtn>3</PageBtn>
                  <PageBtn>4</PageBtn>
                  <span className="px-1 text-faint">…</span>
                  <PageBtn>13</PageBtn>
                  <PageBtn>›</PageBtn>
                </div>
              </div>
            </div>
          </div>

          {/* Security Dashboard */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="mb-4 text-sm font-semibold text-ink">Security Dashboard</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {vaultSecurity.dashboard.map((d) => {
                const Icon = dashIcon[d.icon];
                const t = tone[d.tone];
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", t.bg)}>
                      <Icon className={cn("h-5 w-5", t.fg)} />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-tight text-ink">{d.value}</p>
                      <p className="text-xs font-medium text-muted">{d.label}</p>
                      <p className={cn("text-[11px] font-medium", t.fg)}>{d.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT RAIL */}
        <aside className="space-y-4">
          {/* Security score */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Security Score</h3>
              <button className="text-xs font-medium text-green-600 hover:underline">View Details</button>
            </div>
            <div className="my-4">
              <ScoreRing value={vaultSecurity.score} />
            </div>
            <div className="space-y-3">
              {vaultSecurity.breakdown.map((b) => (
                <div key={b.label} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted">{b.label}</span>
                  <span className="ml-auto font-semibold text-ink">{b.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-ink">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Add Password", icon: Plus },
                { label: "Password Generator", icon: Wand2 },
                { label: "Import Passwords", icon: DownloadCloud },
                { label: "Export Vault", icon: UploadCloud },
                { label: "Security Check", icon: ShieldCheck },
                { label: "Trash", icon: Trash2 },
              ].map((a) => (
                <button key={a.label} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left text-xs font-medium text-ink transition-colors hover:bg-surface-2">
                  <a.icon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ATM & card pins */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink">ATM &amp; Card Pins</h3>
              <button className="text-xs font-medium text-green-600 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {vaultCards.map((c) => {
                const shown = revealed[c.id];
                return (
                  <div key={c.id} className={cn("flex flex-col justify-between rounded-xl bg-gradient-to-br p-2.5 text-white", cardTheme[c.theme])}>
                    <div className="flex items-start justify-between">
                      <span className="h-4 w-6 rounded-sm bg-white/25" />
                      <span className="text-[9px] font-bold tracking-wide">{c.network}</span>
                    </div>
                    <p className="mt-3 text-[10px] font-medium leading-tight">{c.bank}</p>
                    <div className="mt-2">
                      <p className="text-[9px] text-white/70">Pin</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs tracking-widest">
                          {shown ? c.pin : "•".repeat(c.pin.length)}
                        </span>
                        <button onClick={() => toggleCard(c.id)} aria-label="Reveal pin">
                          {shown ? <EyeOff className="h-3 w-3 text-white/80" /> : <Eye className="h-3 w-3 text-white/80" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={cn(
        "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm transition-colors",
        active ? "bg-green-500 font-semibold text-white" : "text-muted hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}
