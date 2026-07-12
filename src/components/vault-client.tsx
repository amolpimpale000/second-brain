"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock, Folder, ShieldCheck, CheckCircle2, AlertCircle,
  Search, List, LayoutGrid, ChevronDown,
  Landmark, Mail, Share2, ShoppingBag, Briefcase, Clapperboard, GraduationCap, Wallet, Circle,
  Star, MoreVertical, Wand2, Plus, DownloadCloud, UploadCloud, Trash2, RefreshCw, Clock,
  Eye, EyeOff, Copy, Pencil, CreditCard, RotateCcw, KeyRound, Check,
} from "lucide-react";
import type { VaultAccount, VaultCard, CardNetwork, CardTheme } from "@/lib/data";
import { vaultCategories, vaultCards as seedCards } from "@/lib/data";
import { cn } from "@/lib/utils";
import { BrandLogo, NetworkMark, Modal, Dropdown, Field, inputCls } from "@/components/vault-ui";

/* ------------------------------------------------------------------ helpers */
const tone: Record<string, { bg: string; fg: string }> = {
  green: { bg: "bg-green-50", fg: "text-green-600" },
  purple: { bg: "bg-purple-50", fg: "text-purple-600" },
  amber: { bg: "bg-amber-50", fg: "text-amber-500" },
  red: { bg: "bg-red-50", fg: "text-red-500" },
};
const catIcon: Record<string, React.ElementType> = {
  lock: Lock, landmark: Landmark, mail: Mail, share: Share2, bag: ShoppingBag,
  briefcase: Briefcase, play: Clapperboard, cap: GraduationCap, wallet: Wallet, circle: Circle,
};
const catPill: Record<string, string> = {
  Banking: "bg-blue-50 text-blue-600",
  Email: "bg-red-50 text-red-500",
  "Social Media": "bg-indigo-50 text-indigo-600",
  Shopping: "bg-amber-50 text-amber-600",
  Business: "bg-purple-50 text-purple-600",
  Entertainment: "bg-pink-50 text-pink-600",
};
const CATEGORIES = ["Banking", "Email", "Social Media", "Shopping", "Business", "Entertainment"] as const;
const cardGrad: Record<CardTheme, string> = {
  blue: "from-blue-600 to-blue-500",
  orange: "from-orange-500 to-amber-600",
  dark: "from-slate-800 to-slate-950",
  purple: "from-purple-600 to-fuchsia-600",
  green: "from-emerald-600 to-green-500",
  rose: "from-rose-600 to-pink-500",
};
const CARD_THEMES: CardTheme[] = ["blue", "orange", "dark", "purple", "green", "rose"];
const NETWORKS: CardNetwork[] = ["VISA", "Mastercard", "RuPay", "Amex"];

function strengthOf(pw: string): VaultAccount["strength"] {
  let s = 0;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s >= 4 ? "strong" : s >= 2 ? "medium" : "weak";
}
function genPassword(len = 16, opts = { upper: true, numbers: true, symbols: true }) {
  let chars = "abcdefghijkmnopqrstuvwxyz";
  if (opts.upper) chars += "ABCDEFGHJKLMNPQRSTUVWXYZ";
  if (opts.numbers) chars += "23456789";
  if (opts.symbols) chars += "!@#$%^&*()-_=+";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function maskCard(n: string) {
  const digits = n.replace(/\s/g, "");
  return "•••• •••• •••• " + digits.slice(-4);
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}


/* --------------------------------------------------------------- score ring */
function ScoreRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-[168px] w-[168px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#22c55e" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-ink">{value}%</span>
        <span className="text-xs font-medium text-green-600">{value >= 80 ? "Excellent" : value >= 60 ? "Good" : "Improve"}</span>
      </div>
    </div>
  );
}

/* small action menu (kebab / add-new) */
function Menu({ trigger, items, align = "right" }: {
  trigger: React.ReactNode;
  items: { label: string; icon: React.ElementType; onClick: () => void; danger?: boolean }[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}>{trigger}</button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={cn("absolute z-20 mt-1 min-w-[168px] rounded-xl border border-border bg-card p-1 shadow-card-lg", align === "right" ? "right-0" : "left-0")}>
            {items.map((it) => (
              <button key={it.label} onClick={() => { it.onClick(); setOpen(false); }}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2",
                  it.danger ? "text-red-500 hover:text-red-600" : "text-muted hover:text-ink")}>
                <it.icon className="h-4 w-4" /> {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* full card visual (manager) */
function FullCard({ card, onEdit, onDelete }: { card: VaultCard; onEdit: () => void; onDelete: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn("relative flex h-56 flex-col justify-between rounded-2xl bg-gradient-to-br p-5 text-white shadow-card-lg", cardGrad[card.theme])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{card.label}</p>
          <p className="text-[11px] text-white/70">{card.type} · {card.bank}</p>
        </div>
        <div className="text-xl"><NetworkMark network={card.network} className="h-7 w-10" /></div>
      </div>
      <div className="h-8 w-11 rounded-md bg-white/20" />
      <div>
        <p className="font-mono text-lg tracking-widest">{show ? card.number : maskCard(card.number)}</p>
        <div className="mt-2 flex items-end justify-between text-[11px]">
          <div>
            <p className="text-white/60">Holder</p>
            <p className="font-medium">{card.holder}</p>
          </div>
          <div>
            <p className="text-white/60">Expiry</p>
            <p className="font-medium">{card.expiry}</p>
          </div>
          <div>
            <p className="text-white/60">CVV</p>
            <p className="font-mono font-medium">{show ? card.cvv : "•••"}</p>
          </div>
          <div>
            <p className="text-white/60">PIN</p>
            <p className="font-mono font-medium">{show ? card.pin : "••••"}</p>
          </div>
        </div>
      </div>
      <div className="absolute right-3 top-3 flex gap-1">
        <button onClick={() => setShow((s) => !s)} className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 hover:bg-white/25">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button onClick={onEdit} className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 hover:bg-white/25"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 hover:bg-white/25"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 6;

/* =========================================================================== */
export function VaultClient({ accounts: initialAccounts, cards: initialCards }: { accounts: VaultAccount[]; cards: VaultCard[] }) {
  const [accounts, setAccounts] = useState<VaultAccount[]>(initialAccounts.filter((a) => !a.trashed));
  const [trash, setTrash] = useState<VaultAccount[]>(initialAccounts.filter((a) => a.trashed));
  const [cards, setCards] = useState<VaultCard[]>(initialCards);
  const [busy, setBusy] = useState(false);

  const [activeCat, setActiveCat] = useState("All Passwords");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [strengthFilter, setStrengthFilter] = useState("All Types");
  const [sort, setSort] = useState("Recent");
  const [page, setPage] = useState(1);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // modal: null | account | card | cards | gen | trash | security
  const [modal, setModal] = useState<
    | { type: "account"; editing?: VaultAccount }
    | { type: "card"; editing?: VaultCard }
    | { type: "cards" }
    | { type: "gen" }
    | { type: "trash" }
    | { type: "security" }
    | null
  >(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1600); };
  const copy = (text: string, what = "Copied") => { navigator.clipboard?.writeText(text); flash(what); };
  const reveal = (id: string) => setRevealed((r) => ({ ...r, [id]: !r[id] }));

  /* derived metrics */
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    accounts.forEach((a) => { m[a.category] = (m[a.category] || 0) + 1; });
    return m;
  }, [accounts]);

  const strong = accounts.filter((a) => a.strength === "strong").length;
  const weak = accounts.filter((a) => a.strength === "weak").length;
  const twoFA = accounts.filter((a) => a.twoFactor).length;
  const n = accounts.length || 1;
  const base = accounts.reduce((s, a) => s + (a.strength === "strong" ? 1 : a.strength === "medium" ? 0.65 : 0.3), 0) / n;
  const score = Math.round((base * 0.7 + (twoFA / n) * 0.3) * 100);
  const reused = accounts.length - new Set(accounts.map((a) => a.secret)).size;

  const stats = [
    { label: "Total Passwords", value: `${accounts.length}`, sub: "All accounts", icon: Lock, tone: "green" },
    { label: "Categories", value: `${Object.keys(catCounts).length}`, sub: "Active groups", icon: Folder, tone: "purple" },
    { label: "Security Score", value: `${score}%`, sub: score >= 80 ? "Strong" : "Improve", icon: ShieldCheck, tone: "green" },
    { label: "Compromised", value: "0", sub: "Accounts at risk", icon: CheckCircle2, tone: "amber" },
    { label: "Weak Passwords", value: `${weak}`, sub: "Update recommended", icon: AlertCircle, tone: "red" },
  ];

  const breakdown = [
    { label: "Strong Passwords", value: strong },
    { label: "Two-Factor Enabled", value: twoFA },
    { label: "No Compromised", value: 0 },
    { label: "Regularly Updated", value: accounts.length - weak },
  ];
  const dashboard = [
    { label: "Password Health", value: `${score}%`, note: score >= 80 ? "Strong" : "Improve", icon: ShieldCheck, tone: score >= 80 ? "green" : "amber" },
    { label: "Two-Factor Auth", value: `${Math.round((twoFA / n) * 100)}%`, note: "Enabled", icon: Lock, tone: "green" },
    { label: "Reused Passwords", value: `${reused}`, note: "Accounts", icon: RefreshCw, tone: reused ? "amber" : "green" },
    { label: "Weak Passwords", value: `${weak}`, note: "Need Update", icon: Clock, tone: weak ? "red" : "green" },
  ];

  /* filter + sort + paginate */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = accounts.filter((a) => {
      const catOk = activeCat === "All Passwords" || a.category === activeCat;
      const qOk = !q || a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q);
      const sOk = strengthFilter === "All Types" || a.strength === strengthFilter.toLowerCase();
      return catOk && qOk && sOk;
    });
    if (sort === "Name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "Category") list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    return list;
  }, [accounts, activeCat, query, strengthFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [activeCat, query, strengthFilter, sort]);

  /* ── persistence ──────────────────────────────────────────────────────── */
  async function apiMutate(entity: "account" | "card", action: "create" | "update" | "delete", payload: { id?: string; data?: Record<string, unknown> }) {
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, action, ...payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Save failed");
    return json;
  }

  function accountToData(a: VaultAccount) {
    return { name: a.name, username: a.username, category: a.category, domain: a.domain, secret: a.secret, strength: a.strength, color: a.color, initial: a.initial, favorite: a.favorite, twoFactor: a.twoFactor };
  }

  /* mutations */
  async function saveAccount(a: VaultAccount, isNew: boolean) {
    setBusy(true);
    try {
      if (isNew) {
        const { row } = await apiMutate("account", "create", { data: accountToData(a) });
        setAccounts((prev) => [row, ...prev]);
        flash("Account added");
      } else {
        const { row } = await apiMutate("account", "update", { id: a.id, data: accountToData(a) });
        setAccounts((prev) => prev.map((x) => (x.id === a.id ? row : x)));
        flash("Account updated");
      }
      setModal(null);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setBusy(false);
    }
  }
  async function deleteAccount(id: string) {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setTrash((t) => [{ ...acc, trashed: true }, ...t]);
    flash("Moved to Trash");
    try {
      await apiMutate("account", "update", { id, data: { trashed: true } });
    } catch (err) {
      setAccounts((prev) => [acc, ...prev]);
      setTrash((t) => t.filter((a) => a.id !== id));
      flash(err instanceof Error ? err.message : "Failed to delete account");
    }
  }
  async function restore(id: string) {
    const acc = trash.find((a) => a.id === id);
    if (!acc) return;
    setTrash((t) => t.filter((a) => a.id !== id));
    setAccounts((p) => [{ ...acc, trashed: false }, ...p]);
    try {
      await apiMutate("account", "update", { id, data: { trashed: false } });
    } catch (err) {
      setAccounts((p) => p.filter((a) => a.id !== id));
      setTrash((t) => [acc, ...t]);
      flash(err instanceof Error ? err.message : "Failed to restore account");
    }
  }
  async function purge(id: string) {
    const prevTrash = trash;
    setTrash((t) => t.filter((a) => a.id !== id));
    try {
      await apiMutate("account", "delete", { id });
    } catch (err) {
      setTrash(prevTrash);
      flash(err instanceof Error ? err.message : "Failed to delete account");
    }
  }
  async function emptyTrash() {
    const prevTrash = trash;
    setTrash([]);
    try {
      await Promise.all(prevTrash.map((a) => apiMutate("account", "delete", { id: a.id })));
      flash("Trash emptied");
    } catch (err) {
      setTrash(prevTrash);
      flash(err instanceof Error ? err.message : "Failed to empty trash");
    }
  }
  async function toggleFav(id: string) {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    const nextFav = !acc.favorite;
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, favorite: nextFav } : a)));
    try {
      await apiMutate("account", "update", { id, data: { favorite: nextFav } });
    } catch {
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, favorite: !nextFav } : a)));
    }
  }

  async function saveCard(c: VaultCard, isNew: boolean) {
    setBusy(true);
    try {
      const data = { bank: c.bank, label: c.label, type: c.type, network: c.network, number: c.number, holder: c.holder, expiry: c.expiry, cvv: c.cvv, pin: c.pin, theme: c.theme };
      if (isNew) {
        const { row } = await apiMutate("card", "create", { data });
        setCards((prev) => [...prev, row]);
      } else {
        const { row } = await apiMutate("card", "update", { id: c.id, data });
        setCards((prev) => prev.map((x) => (x.id === c.id ? row : x)));
      }
      flash("Card saved");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to save card");
    } finally {
      setBusy(false);
    }
  }
  async function deleteCard(id: string) {
    const prevCards = cards;
    setCards((prev) => prev.filter((c) => c.id !== id));
    try {
      await apiMutate("card", "delete", { id });
      flash("Card deleted");
    } catch (err) {
      setCards(prevCards);
      flash(err instanceof Error ? err.message : "Failed to delete card");
    }
  }

  const exportVault = () => {
    const blob = new Blob([JSON.stringify({ accounts, cards }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "second-brain-vault.json"; a.click();
    URL.revokeObjectURL(url);
    flash("Vault exported");
  };
  const importVault = async (file: File) => {
    const text = await file.text();
    let data: { accounts?: VaultAccount[]; cards?: VaultCard[] };
    try {
      data = JSON.parse(text);
    } catch {
      flash("Invalid file");
      return;
    }
    setBusy(true);
    try {
      if (Array.isArray(data.accounts)) {
        for (const a of data.accounts) {
          const { row } = await apiMutate("account", "create", { data: accountToData(a) });
          setAccounts((prev) => [row, ...prev]);
        }
      }
      if (Array.isArray(data.cards)) {
        for (const c of data.cards) {
          const { row } = await apiMutate("card", "create", { data: { bank: c.bank, label: c.label, type: c.type, network: c.network, number: c.number, holder: c.holder, expiry: c.expiry, cvv: c.cvv, pin: c.pin, theme: c.theme } });
          setCards((prev) => [...prev, row]);
        }
      }
      flash("Vault imported");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Passwords</h1>
          <p className="mt-1 text-sm text-muted">Manage and secure all your accounts in one place</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setModal({ type: "gen" })} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2">
            <Wand2 className="h-4 w-4 text-muted" /> Password Generator
          </button>
          <Menu
            trigger={
              <span className="inline-flex items-center gap-2 rounded-xl bg-green-500 py-2.5 pl-4 pr-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-600">
                <Plus className="h-4 w-4" /> Add New
                <span className="ml-1 border-l border-white/30 pl-2"><ChevronDown className="h-4 w-4" /></span>
              </span>
            }
            items={[
              { label: "New Login", icon: KeyRound, onClick: () => setModal({ type: "account" }) },
              { label: "New Card", icon: CreditCard, onClick: () => setModal({ type: "card" }) },
            ]}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => {
          const t = tone[s.tone];
          const subColor = s.label === "Security Score" ? "text-green-600" : s.label === "Weak Passwords" ? "text-red-500" : "text-faint";
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-muted">{s.label}</p>
                <div className={cn("grid h-8 w-8 place-items-center rounded-full", t.bg)}>
                  <s.icon className={cn("h-4 w-4", t.fg)} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-ink">{s.value}</p>
              <p className={cn("mt-0.5 text-xs font-medium", subColor)}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_336px]">
        {/* LEFT */}
        <div className="min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-border bg-card p-2.5 shadow-card">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search accounts..."
                className="w-full rounded-xl border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-green-400 focus:outline-none" />
            </div>
            <Dropdown label={activeCat === "All Passwords" ? "All Categories" : activeCat} options={["All Passwords", ...CATEGORIES]} onSelect={setActiveCat} />
            <Dropdown label={strengthFilter} options={["All Types", "Strong", "Medium", "Weak"]} onSelect={setStrengthFilter} />
            <Dropdown label={`Sort: ${sort}`} options={["Recent", "Name", "Category"]} onSelect={setSort} />
            <div className="ml-auto flex items-center gap-1 rounded-xl border border-border bg-surface p-0.5">
              <button onClick={() => setView("list")} className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "list" ? "bg-blue-50 text-blue-600" : "text-faint")}><List className="h-4 w-4" /></button>
              <button onClick={() => setView("grid")} className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "grid" ? "bg-blue-50 text-blue-600" : "text-faint")}><LayoutGrid className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
            {/* Categories */}
            <div className="h-max rounded-2xl border border-border bg-card p-3 shadow-card">
              <p className="px-2 pb-2 text-sm font-semibold text-ink">Categories</p>
              <div className="space-y-0.5">
                {vaultCategories.map((c) => {
                  const Icon = catIcon[c.icon];
                  const active = c.name === activeCat;
                  const count = c.name === "All Passwords" ? accounts.length : catCounts[c.name] ?? 0;
                  return (
                    <button key={c.name} onClick={() => setActiveCat(c.name)}
                      className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors", active ? "bg-green-50 font-medium text-green-700" : "text-muted hover:bg-surface-2")}>
                      <Icon className="h-4 w-4 shrink-0" style={{ color: c.color }} />
                      <span className="truncate">{c.name}</span>
                      <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-medium", active ? "bg-green-100 text-green-700" : "bg-surface-2 text-faint")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accounts — list or grid */}
            <div className="min-w-0">
              {shown.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                  <p className="text-sm text-muted">No accounts match. <button onClick={() => setModal({ type: "account" })} className="font-medium text-blue-600 hover:underline">Add one</button></p>
                </div>
              ) : view === "list" ? (
                <div className="rounded-2xl border border-border bg-card shadow-card">
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
                        {shown.map((a) => (
                          <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <BrandLogo domain={a.domain} initial={a.initial} color={a.color} size={36} />
                                <span className="font-medium text-ink">{a.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted">{a.username}</td>
                            <td className="px-4 py-3"><span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", catPill[a.category])}>{a.category}</span></td>
                            <td className="px-4 py-3 text-muted">{a.lastUsed}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => toggleFav(a.id)} aria-label="Favorite">
                                <Star className={cn("h-4 w-4", a.favorite ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-400")} />
                              </button>
                            </td>
                            <td className="px-2 py-3">
                              <Menu
                                trigger={<span className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink"><MoreVertical className="h-4 w-4" /></span>}
                                items={[
                                  { label: "Edit", icon: Pencil, onClick: () => setModal({ type: "account", editing: a }) },
                                  { label: "Copy password", icon: Copy, onClick: () => copy(a.secret, "Password copied") },
                                  { label: "Copy username", icon: Copy, onClick: () => copy(a.username, "Username copied") },
                                  { label: "Delete", icon: Trash2, danger: true, onClick: () => deleteAccount(a.id) },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={safePage} pages={pages} total={filtered.length} onPage={setPage} />
                </div>
              ) : (
                <div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shown.map((a) => (
                      <div key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <BrandLogo domain={a.domain} initial={a.initial} color={a.color} size={40} />
                            <div>
                              <p className="font-medium text-ink">{a.name}</p>
                              <p className="text-xs text-muted">{a.username}</p>
                            </div>
                          </div>
                          <button onClick={() => toggleFav(a.id)}><Star className={cn("h-4 w-4", a.favorite ? "fill-amber-400 text-amber-400" : "text-slate-300")} /></button>
                        </div>
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2">
                          <span className="flex-1 truncate font-mono text-sm text-ink">{revealed[a.id] ? a.secret : "•".repeat(10)}</span>
                          <button onClick={() => reveal(a.id)} className="text-muted hover:text-ink">{revealed[a.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                          <button onClick={() => copy(a.secret, "Password copied")} className="text-muted hover:text-ink"><Copy className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", catPill[a.category])}>{a.category}</span>
                          <div className="flex gap-1">
                            <button onClick={() => setModal({ type: "account", editing: a })} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => deleteAccount(a.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border border-border bg-card shadow-card">
                    <Pagination page={safePage} pages={pages} total={filtered.length} onPage={setPage} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Dashboard */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="mb-4 text-sm font-semibold text-ink">Security Dashboard</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {dashboard.map((d) => {
                const t = tone[d.tone];
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", t.bg)}><d.icon className={cn("h-5 w-5", t.fg)} /></div>
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
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Security Score</h3>
              <button onClick={() => setModal({ type: "security" })} className="text-xs font-medium text-blue-600 hover:underline">View Details</button>
            </div>
            <div className="my-4"><ScoreRing value={score} /></div>
            <div className="space-y-3">
              {breakdown.map((b) => (
                <div key={b.label} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted">{b.label}</span>
                  <span className="ml-auto font-semibold text-ink">{b.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-ink">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Add Password", icon: Plus, onClick: () => setModal({ type: "account" }) },
                { label: "Password Generator", icon: Wand2, onClick: () => setModal({ type: "gen" }) },
                { label: "Import Passwords", icon: DownloadCloud, onClick: () => fileRef.current?.click() },
                { label: "Export Vault", icon: UploadCloud, onClick: exportVault },
                { label: "Security Check", icon: ShieldCheck, onClick: () => setModal({ type: "security" }) },
                { label: "Trash", icon: Trash2, onClick: () => setModal({ type: "trash" }) },
              ].map((a) => (
                <button key={a.label} onClick={a.onClick} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left text-xs font-medium text-ink transition-colors hover:bg-surface-2">
                  <a.icon className="h-4 w-4 shrink-0 text-muted" /> <span className="truncate">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink">ATM &amp; Card Pins <span className="text-xs font-normal text-faint">({cards.length})</span></h3>
              <button onClick={() => setModal({ type: "cards" })} className="text-xs font-medium text-blue-600 hover:underline">Manage all</button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {cards.slice(0, 3).map((c) => (
                <button key={c.id} onClick={() => setModal({ type: "cards" })} className={cn("flex flex-col justify-between rounded-xl bg-gradient-to-br p-2.5 text-left text-white", cardGrad[c.theme])}>
                  <div className="flex items-start justify-between">
                    <span className="h-4 w-6 rounded-sm bg-white/25" />
                    <span className="text-[8px] font-bold"><NetworkMark network={c.network} className="h-3 w-5" /></span>
                  </div>
                  <p className="mt-2 text-[10px] font-medium leading-tight">{c.label}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-widest">•••• {c.number.replace(/\s/g, "").slice(-4)}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setModal({ type: "card" })} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink">
              <Plus className="h-3.5 w-3.5" /> Add card
            </button>
          </div>
        </aside>
      </div>

      {/* hidden import input */}
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importVault(e.target.files[0])} />

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card-lg">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-green-400" /> {toast}</span>
        </div>
      )}

      {/* MODALS */}
      {modal?.type === "account" && (
        <AccountModal editing={modal.editing} busy={busy} onClose={() => setModal(null)} onSave={(a) => saveAccount(a, !modal.editing)} onGenerate={() => genPassword()} />
      )}
      {modal?.type === "card" && (
        <CardModal editing={undefined} busy={busy} onClose={() => setModal(null)} onSave={(c) => saveCard(c, true).then(() => setModal(null))} />
      )}
      {modal?.type === "cards" && (
        <CardsManagerModal cards={cards} busy={busy} onClose={() => setModal(null)} onSave={saveCard} onDelete={deleteCard} />
      )}
      {modal?.type === "gen" && <GeneratorModal onClose={() => setModal(null)} onCopy={(pw) => copy(pw, "Password copied")} />}
      {modal?.type === "trash" && (
        <Modal open title="Trash" subtitle={`${trash.length} deleted item(s)`} size="md" onClose={() => setModal(null)}>
          {trash.length === 0 ? (
            <p className="py-8 text-center text-sm text-faint">Trash is empty.</p>
          ) : (
            <div className="space-y-2">
              {trash.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <BrandLogo domain={a.domain} initial={a.initial} color={a.color} size={34} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{a.name}</p><p className="truncate text-xs text-muted">{a.username}</p></div>
                  <button onClick={() => restore(a.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                  <button onClick={() => purge(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={emptyTrash} className="mt-2 w-full rounded-xl border border-border py-2 text-sm font-medium text-red-500 hover:bg-red-50">Empty Trash</button>
            </div>
          )}
        </Modal>
      )}
      {modal?.type === "security" && (
        <Modal open title="Security Details" subtitle="Live analysis of your vault" size="md" onClose={() => setModal(null)}>
          <div className="mb-4"><ScoreRing value={score} /></div>
          <div className="space-y-2.5">
            {[
              { label: "Strong passwords", value: `${strong} of ${accounts.length}`, ok: true },
              { label: "Two-factor enabled", value: `${twoFA} of ${accounts.length}`, ok: twoFA > 0 },
              { label: "Weak passwords", value: `${weak}`, ok: weak === 0 },
              { label: "Reused passwords", value: `${reused}`, ok: reused === 0 },
              { label: "Saved cards", value: `${cards.length}`, ok: true },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm">
                {r.ok ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                <span className="text-muted">{r.label}</span>
                <span className="ml-auto font-semibold text-ink">{r.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- pagination */
function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  const out: (number | "…")[] = [];
  nums.forEach((p, i) => { if (i && p - (nums[i - 1] as number) > 1) out.push("…"); out.push(p); });
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
      <p className="text-xs text-muted">Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} accounts</p>
      <div className="flex items-center gap-1">
        <PageBtn disabled={page === 1} onClick={() => onPage(page - 1)}>‹</PageBtn>
        {out.map((p, i) => p === "…" ? <span key={`e${i}`} className="px-1 text-faint">…</span> : <PageBtn key={p} active={p === page} onClick={() => onPage(p as number)}>{p}</PageBtn>)}
        <PageBtn disabled={page === pages} onClick={() => onPage(page + 1)}>›</PageBtn>
      </div>
    </div>
  );
}
function PageBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm transition-colors",
        active ? "bg-green-500 font-semibold text-white" : "text-muted hover:bg-surface-2", disabled && "opacity-40")}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------- account modal */
function AccountModal({ editing, busy, onClose, onSave, onGenerate }: {
  editing?: VaultAccount; busy: boolean; onClose: () => void; onSave: (a: VaultAccount) => void; onGenerate: () => string;
}) {
  const [f, setF] = useState<VaultAccount>(
    editing ?? { id: uid(), name: "", username: "", category: "Banking", lastUsed: "Just now", favorite: false, color: "#334155", initial: "?", domain: "", secret: "", strength: "weak", twoFactor: false }
  );
  const [show, setShow] = useState(false);
  const set = (patch: Partial<VaultAccount>) => setF((p) => ({ ...p, ...patch }));
  const submit = () => {
    if (!f.name.trim()) return;
    onSave({ ...f, initial: (f.name[0] || "?").toUpperCase(), strength: strengthOf(f.secret) });
  };
  return (
    <Modal open title={editing ? "Edit Account" : "New Login"} onClose={onClose} size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Account name"><input className={inputCls} value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Netflix" /></Field>
          <Field label="Website (for logo)"><input className={inputCls} value={f.domain} onChange={(e) => set({ domain: e.target.value })} placeholder="netflix.com" /></Field>
        </div>
        <Field label="Username / Email"><input className={inputCls} value={f.username} onChange={(e) => set({ username: e.target.value })} placeholder="you@email.com" /></Field>
        <Field label="Password">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input className={inputCls} type={show ? "text" : "password"} value={f.secret} onChange={(e) => set({ secret: e.target.value })} placeholder="Password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
            <button type="button" onClick={() => { set({ secret: onGenerate() }); setShow(true); }} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-muted hover:bg-surface-2 hover:text-ink"><Wand2 className="h-4 w-4" /> Generate</button>
          </div>
          {f.secret && <p className="mt-1 text-xs text-muted">Strength: <span className={cn("font-medium", strengthOf(f.secret) === "strong" ? "text-green-600" : strengthOf(f.secret) === "medium" ? "text-amber-500" : "text-red-500")}>{strengthOf(f.secret)}</span></p>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className={inputCls} value={f.category} onChange={(e) => set({ category: e.target.value as VaultAccount["category"] })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Two-factor">
            <button type="button" onClick={() => set({ twoFactor: !f.twoFactor })} className={cn("flex h-[38px] w-full items-center justify-between rounded-xl border px-3 text-sm", f.twoFactor ? "border-green-300 bg-green-50 text-green-700" : "border-border bg-surface-2 text-muted")}>
              {f.twoFactor ? "Enabled" : "Disabled"}
              <span className={cn("relative h-5 w-9 rounded-full transition-colors", f.twoFactor ? "bg-green-500" : "bg-slate-300")}><span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", f.twoFactor ? "left-[18px]" : "left-0.5")} /></span>
            </button>
          </Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
        <button onClick={submit} disabled={busy} className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60">{busy ? "Saving…" : editing ? "Save changes" : "Add account"}</button>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- card modal */
function CardModal({ editing, busy, onClose, onSave }: { editing?: VaultCard; busy: boolean; onClose: () => void; onSave: (c: VaultCard) => void }) {
  const [f, setF] = useState<VaultCard>(
    editing ?? { id: uid(), bank: "", label: "", type: "Debit", network: "VISA", number: "", holder: "", expiry: "", cvv: "", pin: "", theme: "blue" }
  );
  const set = (patch: Partial<VaultCard>) => setF((p) => ({ ...p, ...patch }));
  return (
    <Modal open title={editing ? "Edit Card" : "New Card"} onClose={onClose} size="md">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Card label"><input className={inputCls} value={f.label} onChange={(e) => set({ label: e.target.value })} placeholder="HDFC Debit Card" /></Field>
          <Field label="Bank"><input className={inputCls} value={f.bank} onChange={(e) => set({ bank: e.target.value })} placeholder="HDFC Bank" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><select className={inputCls} value={f.type} onChange={(e) => set({ type: e.target.value as VaultCard["type"] })}><option>Debit</option><option>Credit</option></select></Field>
          <Field label="Network"><select className={inputCls} value={f.network} onChange={(e) => set({ network: e.target.value as CardNetwork })}>{NETWORKS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="Card number"><input className={inputCls} value={f.number} onChange={(e) => set({ number: e.target.value })} placeholder="1234 5678 9012 3456" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cardholder"><input className={inputCls} value={f.holder} onChange={(e) => set({ holder: e.target.value })} placeholder="Amit Sharma" /></Field>
          <Field label="Expiry (MM/YY)"><input className={inputCls} value={f.expiry} onChange={(e) => set({ expiry: e.target.value })} placeholder="08/27" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CVV"><input className={inputCls} value={f.cvv} onChange={(e) => set({ cvv: e.target.value })} placeholder="123" /></Field>
          <Field label="ATM PIN"><input className={inputCls} value={f.pin} onChange={(e) => set({ pin: e.target.value })} placeholder="••••" /></Field>
        </div>
        <Field label="Card colour">
          <div className="flex gap-2">
            {CARD_THEMES.map((t) => (
              <button key={t} type="button" onClick={() => set({ theme: t })} className={cn("h-8 w-8 rounded-lg bg-gradient-to-br ring-offset-2", cardGrad[t], f.theme === t ? "ring-2 ring-green-500" : "")} />
            ))}
          </div>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
        <button onClick={() => f.label.trim() && onSave(f)} disabled={busy} className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60">{busy ? "Saving…" : editing ? "Save changes" : "Add card"}</button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------- cards manager modal */
function CardsManagerModal({ cards, busy, onClose, onSave, onDelete }: {
  cards: VaultCard[]; busy: boolean; onClose: () => void; onSave: (c: VaultCard, isNew: boolean) => void; onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<VaultCard | "new" | null>(null);
  return (
    <>
      <Modal open title="Cards & ATM Pins" subtitle={`${cards.length} card(s) — click a card to reveal details`} size="xl" onClose={onClose}>
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <FullCard key={c.id} card={c} onEdit={() => setEditing(c)} onDelete={() => onDelete(c.id)} />
          ))}
          <button onClick={() => setEditing("new")} className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted hover:bg-surface-2 hover:text-ink">
            <Plus className="h-6 w-6" /> <span className="text-sm font-medium">Add card</span>
          </button>
        </div>
      </Modal>
      {editing && (
        <CardModal
          editing={editing === "new" ? undefined : editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={(c) => { onSave(c, editing === "new"); setEditing(null); }}
        />
      )}
    </>
  );
}

/* ----------------------------------------------------------- generator modal */
function GeneratorModal({ onClose, onCopy }: { onClose: () => void; onCopy: (pw: string) => void }) {
  const [len, setLen] = useState(16);
  const [upper, setUpper] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [pw, setPw] = useState(() => genPassword(16));
  const regen = () => setPw(genPassword(len, { upper, numbers, symbols }));
  useEffect(() => { setPw(genPassword(len, { upper, numbers, symbols })); }, [len, upper, numbers, symbols]);
  const st = strengthOf(pw);
  return (
    <Modal open title="Password Generator" subtitle="Create a strong, unique password" size="sm" onClose={onClose}>
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="break-all font-mono text-sm text-ink">{pw}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className={cn("text-xs font-medium", st === "strong" ? "text-green-600" : st === "medium" ? "text-amber-500" : "text-red-500")}>Strength: {st}</span>
          <div className="flex gap-1.5">
            <button onClick={regen} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:bg-surface hover:text-ink"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={() => onCopy(pw)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:bg-surface hover:text-ink"><Copy className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted"><span>Length</span><span className="font-medium text-ink">{len}</span></div>
          <input type="range" min={8} max={32} value={len} onChange={(e) => setLen(+e.target.value)} className="w-full accent-green-500" />
        </div>
        {[
          { label: "Uppercase (A-Z)", v: upper, set: setUpper },
          { label: "Numbers (0-9)", v: numbers, set: setNumbers },
          { label: "Symbols (!@#$)", v: symbols, set: setSymbols },
        ].map((o) => (
          <label key={o.label} className="flex items-center justify-between text-sm">
            <span className="text-muted">{o.label}</span>
            <button onClick={() => o.set(!o.v)} className={cn("relative h-5 w-9 rounded-full transition-colors", o.v ? "bg-green-500" : "bg-slate-300")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", o.v ? "left-[18px]" : "left-0.5")} />
            </button>
          </label>
        ))}
      </div>
      <button onClick={() => onCopy(pw)} className="mt-5 w-full rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600">Copy password</button>
    </Modal>
  );
}
