"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Percent, Coins, IndianRupee,
  ArrowUpRight, ArrowDownRight, ChevronDown, Download, MoreVertical, Plus,
  ArrowRight, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { cn, inr } from "@/lib/utils";
import { BrandLogo } from "@/components/vault-ui";
import {
  invKpis, portfolioPerformance, assetAllocation, portfolioTotal, watchlist,
  invHoldings, invPerformance, sipSummary, invTabs, type InvTab, type Holding,
} from "@/lib/investments-data";

/* ── shared primitives ────────────────────────────────────────────────────── */
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04),0_1px_2px_rgba(16,24,40,0.04)]", className)}>
      {children}
    </div>
  );
}
function Head({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
      {right}
    </div>
  );
}
function ViewAll({ href, label = "View all" }: { href: string; label?: string }) {
  return <Link href={href} className="text-xs font-medium text-brand hover:underline">{label}</Link>;
}
function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}
function MiniDropdown({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2">
      {label} <ChevronDown className="h-3 w-3" />
    </button>
  );
}
function Spark({ data, color }: { data: number[]; color: string }) {
  const d = data.map((v, i) => ({ i, v }));
  const id = `sp-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={d} margin={{ top: 6, bottom: 2, left: 2, right: 2 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
const kpiIconMap: Record<string, React.ElementType> = {
  value: TrendingUp, gains: PiggyBank, xirr: Percent, invested: Wallet, available: Coins,
};
const typeBadge: Record<string, string> = {
  "Mutual Fund": "bg-emerald-50 text-emerald-600",
  Stock: "bg-blue-50 text-blue-600",
  Gold: "bg-amber-50 text-amber-600",
  Bond: "bg-purple-50 text-purple-600",
  ETF: "bg-cyan-50 text-cyan-600",
};
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const yFmtL = (v: number) => `₹${(v / 100000).toFixed(0)}L`;

/* ═══════════════════════════════════════════════════════════════════ MAIN ══ */
export function InvestmentsClient() {
  const [tab, setTab] = useState<InvTab>("Overview");
  const [range, setRange] = useState("1M");

  return (
    <div className="animate-fade-up space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Investments</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2">
            May 01 – May 31, 2025 <ChevronDown className="h-4 w-4" />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted hover:bg-surface-2">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 overflow-x-auto border-b border-border">
        {invTabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("relative whitespace-nowrap pb-3 text-sm font-medium transition-colors", tab === t ? "text-green-600" : "text-muted hover:text-ink")}>
            {t}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-green-500" />}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {invKpis.map((k) => {
          const Icon = kpiIconMap[k.icon] ?? Wallet;
          const up = (k.delta ?? 0) >= 0;
          return (
            <Card key={k.label} className="!p-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                  style={{ background: `linear-gradient(135deg, ${k.color}22, ${k.color}0a)` }}>
                  <Icon className="h-[18px] w-[18px]" style={{ color: k.color }} />
                </div>
                <p className="text-[11px] font-medium leading-tight text-muted">{k.label}</p>
              </div>
              <p className="mt-2.5 text-[19px] font-semibold leading-none text-ink">
                {k.isPct ? `${k.value.toFixed(2)}%` : `₹${k.value.toLocaleString("en-IN")}`}
              </p>
              {k.delta != null ? (
                <div className="mt-2 flex items-center gap-1">
                  {up ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                  <span className={cn("text-[10px] font-semibold", up ? "text-green-500" : "text-red-500")}>{Math.abs(k.delta)}%</span>
                  <span className="text-[10px] text-faint">{k.vs}</span>
                </div>
              ) : (
                <div className="mt-2 h-3" />
              )}
              {k.spark ? (
                <div className="-mx-1.5 mt-1.5"><Spark data={k.spark} color={k.color} /></div>
              ) : (
                <div className="mt-1.5 h-[44px]" />
              )}
            </Card>
          );
        })}
      </div>

      {tab === "Overview" ? (
        <>
          {/* Row 2 */}
          <div className="grid items-start gap-4 xl:grid-cols-[1.5fr_1.1fr_1fr]">
            <PortfolioPerformance range={range} setRange={setRange} />
            <AssetAllocation />
            <Watchlist />
          </div>
          {/* Row 3 */}
          <div className="grid items-start gap-4 xl:grid-cols-[1.5fr_1.1fr_1fr]">
            <HoldingsCard holdings={invHoldings} />
            <InvestmentPerformance />
            <div className="space-y-4">
              <SipSummary />
              <PromoCard />
            </div>
          </div>
        </>
      ) : (
        <TabView tab={tab} />
      )}
    </div>
  );
}

/* ── Portfolio performance ────────────────────────────────────────────────── */
function PortfolioPerformance({ range, setRange }: { range: string; setRange: (r: string) => void }) {
  const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y", "All"];
  return (
    <Card>
      <Head title="Portfolio Performance" right={<MiniDropdown label="This Month" />} />
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={portfolioPerformance} margin={{ left: -4, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="d" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} interval={2} />
          <YAxis domain={[600000, 1400000]} ticks={[600000, 800000, 1000000, 1200000, 1400000]}
            tickFormatter={yFmtL} tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Tip>
                <p className="font-medium text-ink">{label}, 2025</p>
                <p className="mt-0.5 font-semibold text-green-600">{inr(Number(payload[0].value))}</p>
              </Tip>
            ) : null
          } />
          <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2.5} fill="url(#perfGrad)"
            dot={false} activeDot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-3 flex justify-center gap-1 rounded-xl bg-surface-2 p-1">
        {ranges.map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={cn("rounded-lg px-3 py-1 text-xs font-medium transition-colors", range === r ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}>
            {r}
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ── Asset allocation ─────────────────────────────────────────────────────── */
function AssetAllocation() {
  return (
    <Card>
      <Head title="Asset Allocation" />
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <ResponsiveContainer width={168} height={168}>
            <PieChart>
              <Pie data={assetAllocation} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="98%" paddingAngle={2} stroke="none">
                {assetAllocation.map((a, i) => <Cell key={i} fill={a.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) =>
                active && payload?.length ? (
                  <Tip><p className="font-medium text-ink">{String(payload[0].name)}</p><p className="text-muted">{inr(Number(payload[0].value))}</p></Tip>
                ) : null
              } />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-[15px] font-bold text-ink">{inr(portfolioTotal)}</p>
            <p className="text-[10px] text-faint">Total Value</p>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {assetAllocation.map((a) => (
            <div key={a.name} className="flex items-center gap-2 text-[12px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: a.color }} />
              <span className="flex-1 truncate text-ink">{a.name}</span>
              <div className="text-right">
                <p className="font-semibold text-ink">{a.pct.toFixed(1)}%</p>
                <p className="text-[10px] text-faint">{inr(a.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Link href="#" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
        View full allocation <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

/* ── Watchlist ────────────────────────────────────────────────────────────── */
function Watchlist() {
  return (
    <Card>
      <Head title="Investment Watchlist" right={<ViewAll href="#" />} />
      <div className="space-y-1">
        {watchlist.map((w) => {
          const up = w.delta >= 0;
          return (
            <div key={w.name} className="flex items-center gap-3 rounded-lg py-2">
              <BrandLogo domain={w.domain} initial={initials(w.name)} color={w.color} size={34} rounded="rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-ink">{w.name}</p>
                <p className="text-[10px] text-faint">{w.sub}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-semibold text-ink">₹{w.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                <p className={cn("flex items-center justify-end gap-0.5 text-[10px] font-medium", up ? "text-green-600" : "text-red-500")}>
                  {up ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}{Math.abs(w.delta)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Holdings table ───────────────────────────────────────────────────────── */
function HoldingsCard({ holdings, title = "Your Holdings" }: { holdings: Holding[]; title?: string }) {
  return (
    <Card>
      <Head title={title} right={<ViewAll href="#" label="View All Holdings" />} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-faint">
              <th className="pb-2 font-semibold">Asset</th>
              <th className="pb-2 font-semibold">Type</th>
              <th className="pb-2 text-right font-semibold">Invested</th>
              <th className="pb-2 text-right font-semibold">Current Value</th>
              <th className="pb-2 text-right font-semibold">Gain/Loss</th>
              <th className="pb-2 text-right font-semibold">Gain %</th>
              <th className="pb-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {holdings.map((h) => {
              const gain = h.current - h.invested;
              const pct = (gain / h.invested) * 100;
              const up = gain >= 0;
              return (
                <tr key={h.name} className="hover:bg-surface-2/40">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <BrandLogo domain={h.domain} initial={initials(h.name)} color={h.color} size={30} rounded="rounded-lg" />
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-ink">{h.name}</p>
                        <p className="text-[10px] text-faint">{h.sub}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3"><span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", typeBadge[h.type])}>{h.type}</span></td>
                  <td className="py-3 text-right text-[12px] text-muted">{inr(h.invested)}</td>
                  <td className="py-3 text-right text-[12px] font-semibold text-ink">{inr(h.current)}</td>
                  <td className={cn("py-3 text-right text-[12px] font-semibold", up ? "text-green-600" : "text-red-500")}>{up ? "" : "-"}{inr(Math.abs(gain))}</td>
                  <td className="py-3 text-right">
                    <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold", up ? "text-green-600" : "text-red-500")}>
                      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(pct).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="grid h-7 w-7 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink"><MoreVertical className="h-4 w-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Link href="#" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
        View all holdings <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

/* ── Investment performance ───────────────────────────────────────────────── */
function InvestmentPerformance() {
  const p = invPerformance;
  const Row = ({ label, sub, right }: { label: string; sub: string; right: React.ReactNode }) => (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="text-[11px] text-faint">{label}</p>
        <p className="text-[13px] font-semibold text-ink">{sub}</p>
      </div>
      {right}
    </div>
  );
  return (
    <Card>
      <Head title="Investment Performance" right={<ViewAll href="#" label="View Report" />} />
      <Row label="Best Performing Asset" sub={p.best.name}
        right={<span className="flex items-center gap-0.5 text-[13px] font-semibold text-green-600"><ArrowUpRight className="h-3.5 w-3.5" />{p.best.delta}%</span>} />
      <Row label="Worst Performing Asset" sub={p.worst.name}
        right={<span className="flex items-center gap-0.5 text-[13px] font-semibold text-red-500"><ArrowDownRight className="h-3.5 w-3.5" />{p.worst.delta}%</span>} />
      <Row label="Highest Investment" sub={p.highest.name}
        right={<span className="text-[13px] font-semibold text-ink">{inr(p.highest.value)}</span>} />
      <Row label="Lowest Investment" sub={p.lowest.name}
        right={<span className="text-[13px] font-semibold text-ink">{inr(p.lowest.value)}</span>} />
      <Row label="Average Return (All Assets)" sub=""
        right={<span className="text-[13px] font-semibold text-green-600">{p.avgReturn}%</span>} />
      <Link href="#" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
        Detailed Performance Report <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

/* ── SIP summary ──────────────────────────────────────────────────────────── */
function SipSummary() {
  const s = sipSummary;
  const Row = ({ label, value, green }: { label: string; value: string; green?: boolean }) => (
    <div className="flex items-center justify-between py-2 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={cn("font-semibold", green ? "text-green-600" : "text-ink")}>{value}</span>
    </div>
  );
  return (
    <Card>
      <Head title="SIP Summary" right={<ViewAll href="#" />} />
      <Row label="Total SIPs" value={String(s.total)} />
      <Row label="Monthly SIP Amount" value={inr(s.monthly)} />
      <Row label="Invested Amount" value={inr(s.invested)} />
      <Row label="Total Gains" value={inr(s.gains)} green />
      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600">
        <Plus className="h-4 w-4" /> New SIP
      </button>
    </Card>
  );
}

function PromoCard() {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/40">
      <div className="max-w-[70%]">
        <div className="mb-1 inline-grid h-8 w-8 place-items-center rounded-lg bg-white/70 text-green-600 shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-[15px] font-bold leading-snug text-ink">Stay diversified,<br />stay ahead!</p>
        <p className="mt-1 text-[11px] text-muted">Review your portfolio health</p>
        <button className="mt-3 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-surface-2">
          Analyze Now
        </button>
      </div>
      <TrendingUp className="pointer-events-none absolute -bottom-2 -right-2 h-24 w-24 text-green-500/15" />
    </Card>
  );
}

/* ── Non-overview tabs (filtered holdings / empty states) ─────────────────── */
function TabView({ tab }: { tab: InvTab }) {
  const typeMap: Partial<Record<InvTab, Holding["type"]>> = {
    "Mutual Funds": "Mutual Fund", Stocks: "Stock", Gold: "Gold", Bonds: "Bond", ETFs: "ETF",
  };
  if (tab === "Holdings") return <HoldingsCard holdings={invHoldings} title="All Holdings" />;
  if (tab === "SIPs")
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:max-w-2xl">
        <SipSummary />
        <PromoCard />
      </div>
    );
  const type = typeMap[tab];
  const filtered = type ? invHoldings.filter((h) => h.type === type) : [];
  if (filtered.length > 0) return <HoldingsCard holdings={filtered} title={`${tab} Holdings`} />;
  return (
    <Card className="grid place-items-center py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-faint"><IndianRupee className="h-6 w-6" /></div>
      <p className="text-sm font-medium text-ink">No {tab} holdings yet</p>
      <p className="mt-1 max-w-xs text-xs text-muted">Once you connect your accounts or add {tab.toLowerCase()}, they’ll show up here.</p>
    </Card>
  );
}
