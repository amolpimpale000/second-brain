"use client";

import { useState } from "react";
import {
  BookOpen, FileText, CheckCircle2, Clock, Users, IndianRupee, ArrowUpRight, ArrowDownRight,
  Plus, FileStack, BarChart3, UserCog, Megaphone, Building2, CreditCard, Bell, TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MultiLineChart, StackedBars, Sparkline } from "@/components/charts";
import { Dropdown } from "@/components/vault-ui";
import { cn, inr } from "@/lib/utils";
import {
  jmStats, submissionsTrend, submissionsByJournal, jmActivities, journalPerformance,
  revenueBreakdown, articleStatus, submissionSource, financialSummary, keyMetrics,
  subjectAreas, subscription, publicationTrend, jmAlerts, quickActionsJM, employees,
} from "@/lib/data";

const statTone: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600", blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600", amber: "bg-amber-100 text-amber-500",
  pink: "bg-pink-100 text-pink-600", emerald: "bg-emerald-100 text-emerald-600",
};
const statIcon: Record<string, React.ElementType> = {
  book: BookOpen, file: FileText, check: CheckCircle2, review: Clock, users: Users, rupee: IndianRupee,
};
const actIcon: Record<string, React.ElementType> = {
  file: FileText, check: CheckCircle2, rupee: IndianRupee, user: Users, book: BookOpen,
};
const qaIcon: Record<string, React.ElementType> = {
  add: Plus, file: FileStack, report: BarChart3, users: UserCog, megaphone: Megaphone,
};
const subIcon: Record<string, React.ElementType> = { users: Users, building: Building2, card: CreditCard };
const alertTone: Record<string, string> = { red: "bg-red-50 text-red-600 border-red-100", amber: "bg-amber-50 text-amber-600 border-amber-100" };

function Delta({ v, className }: { v: number; className?: string }) {
  const up = v >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-green-600" : "text-red-500", className)}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(v)}%
    </span>
  );
}

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const period = <Dropdown label="This Month" options={["This Month", "Last Month", "This Quarter", "This Year"]} onSelect={() => {}} align="right" />;
const viewAll = <button className="text-xs font-medium text-indigo-600 hover:underline">View all</button>;

function Donut({ data, center, sub }: { data: { name: string; value: number; color: string }[]; center: string; sub: string }) {
  return (
    <div className="relative h-44 w-44 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="70%" outerRadius="100%" paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink">{center}</span>
        <span className="text-xs text-faint">{sub}</span>
      </div>
    </div>
  );
}

function Legend({ items }: { items: { name: string; value: number; pct?: number; color: string }[] }) {
  return (
    <div className="flex-1 space-y-2.5">
      {items.map((d) => (
        <div key={d.name} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
          <span className="truncate text-muted">{d.name}</span>
          <span className="ml-auto font-medium text-ink">{d.pct != null ? `${d.pct}%` : ""}</span>
          <span className="w-12 text-right text-xs text-faint">({d.value})</span>
        </div>
      ))}
    </div>
  );
}

export function JournalManagementClient() {
  const [sortKey, setSortKey] = useState<"score" | "handled" | "turnaround">("score");
  const sortedEmployees = [...employees].sort((a, b) =>
    sortKey === "turnaround" ? a.turnaround - b.turnaround : b[sortKey] - a[sortKey]
  );
  const totalHandled = employees.reduce((s, e) => s + e.handled, 0);
  const totalCompleted = employees.reduce((s, e) => s + e.completed, 0);
  const avgTurn = (employees.reduce((s, e) => s + e.turnaround, 0) / employees.length).toFixed(1);
  const avgScore = Math.round(employees.reduce((s, e) => s + e.score, 0) / employees.length);

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Journal Management</h1>
        <p className="mt-1 text-sm text-muted">Complete analytics and insights across all journals.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {jmStats.map((s) => {
          const Icon = statIcon[s.icon];
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2">
                <div className={cn("grid h-9 w-9 place-items-center rounded-xl", statTone[s.tone])}><Icon className="h-[18px] w-[18px]" /></div>
                <p className="text-xs font-medium text-muted">{s.label}</p>
              </div>
              <p className="mt-3 text-xl font-bold text-ink">{s.value}</p>
              <p className={cn("mt-0.5 flex items-center gap-1 text-[11px] font-medium",
                s.subTone === "green" ? "text-green-600" : s.subTone === "red" ? "text-red-500" : "text-faint")}>
                {s.subTone === "green" && <ArrowUpRight className="h-3 w-3" />}
                {s.subTone === "red" && <ArrowDownRight className="h-3 w-3" />}
                {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Overview + donut + activities */}
      <div className="grid gap-5 xl:grid-cols-4">
        <Panel title="Manuscripts Overview" action={period} className="xl:col-span-2">
          <div className="mb-2 flex flex-wrap gap-4 text-xs">
            {[["Total Submitted", "#6366f1"], ["Under Review", "#3b82f6"], ["Accepted", "#22c55e"], ["Rejected", "#ef4444"]].map(([n, c]) => (
              <span key={n} className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{n}</span>
            ))}
          </div>
          <MultiLineChart data={submissionsTrend} series={[
            { key: "total", name: "Total Submitted", color: "#6366f1" },
            { key: "review", name: "Under Review", color: "#3b82f6" },
            { key: "accepted", name: "Accepted", color: "#22c55e" },
            { key: "rejected", name: "Rejected", color: "#ef4444" },
          ]} />
        </Panel>

        <Panel title="Manuscripts by Journal">
          <div className="flex items-center gap-4">
            <Donut data={submissionsByJournal} center="1,248" sub="Total" />
            <Legend items={submissionsByJournal} />
          </div>
        </Panel>

        <Panel title="Recent Activities" action={viewAll}>
          <div className="space-y-3.5">
            {jmActivities.map((a) => {
              const Icon = actIcon[a.icon];
              return (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${a.color}1a`, color: a.color }}><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight text-ink">{a.text}</p>
                    <p className="truncate text-xs text-faint">{a.meta}</p>
                  </div>
                  <span className="shrink-0 text-xs text-faint">{a.time}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Journal performance table + revenue */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Journal Performance Overview" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-faint">
                  <th className="pb-2.5">Journal</th>
                  <th className="pb-2.5 text-right">Manuscripts</th>
                  <th className="pb-2.5 text-right">Published</th>
                  <th className="pb-2.5 text-right">Acceptance</th>
                  <th className="pb-2.5 text-right">Impact</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                  <th className="pb-2.5 text-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                {journalPerformance.map((j) => (
                  <tr key={j.code} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: j.color }} />
                        <div>
                          <p className="font-semibold" style={{ color: j.color }}>{j.code}</p>
                          <p className="max-w-[200px] truncate text-xs text-faint">{j.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right text-ink">{j.manuscripts}</td>
                    <td className="py-3 text-right text-ink">{j.published}</td>
                    <td className="py-3 text-right text-muted">{j.acceptance}%</td>
                    <td className="py-3 text-right font-medium text-ink">{j.impact.toFixed(3)}</td>
                    <td className="py-3 text-right font-medium text-ink">{inr(j.revenue)}</td>
                    <td className="py-3 text-right"><Delta v={j.growth} /></td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-semibold">
                  <td className="py-3 text-ink">Total / Average</td>
                  <td className="py-3 text-right text-ink">1,248</td>
                  <td className="py-3 text-right text-ink">842</td>
                  <td className="py-3 text-right text-muted">67.5%</td>
                  <td className="py-3 text-right text-ink">3.196</td>
                  <td className="py-3 text-right text-ink">{inr(1875450)}</td>
                  <td className="py-3 text-right"><Delta v={24.8} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Revenue Overview" action={period}>
          <p className="text-xs text-muted">Total Revenue</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-ink">{inr(1875450)}</p>
            <Delta v={24.8} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Donut data={revenueBreakdown} center="" sub="" />
            <div className="flex-1 space-y-2.5">
              {revenueBreakdown.map((r) => (
                <div key={r.name} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                    <span className="truncate text-muted">{r.name}</span>
                    <span className="ml-auto text-xs font-medium text-faint">{r.pct}%</span>
                  </div>
                  <p className="pl-[18px] font-medium text-ink">{inr(r.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Article status + Financial + Quick actions */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Article Status Overview" action={period}>
          <div className="flex items-center gap-4">
            <Donut data={articleStatus} center="1,248" sub="Total" />
            <Legend items={articleStatus} />
          </div>
        </Panel>

        <Panel title="Financial Overview" action={period}>
          <div className="space-y-3">
            {financialSummary.map((f) => (
              <div key={f.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{f.label}</p>
                  <p className="text-lg font-bold text-ink">{f.value}</p>
                  <Delta v={f.growth} />
                </div>
                <div className="h-10 w-24 shrink-0"><Sparkline data={f.spark} color={f.color} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Quick Actions">
          <div className="space-y-1">
            {quickActionsJM.map((a) => {
              const Icon = qaIcon[a.icon];
              return (
                <button key={a.label} className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-2">
                  <Icon className="h-4 w-4 text-indigo-500" /> {a.label}
                  <ArrowUpRight className="ml-auto h-4 w-4 rotate-45 text-faint" />
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Key metrics + subjects + subscription */}
      <div className="grid gap-5 xl:grid-cols-4">
        <Panel title="Key Metrics Trend" action={period} className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            {keyMetrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted">{m.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-ink">{m.value}</p>
                  <Delta v={m.growth} />
                </div>
                <div className="mt-1 h-9"><Sparkline data={m.spark} color={m.color} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top Subject Areas" action={viewAll}>
          <div className="space-y-3">
            {subjectAreas.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-muted">{s.name}</span><span className="font-medium text-ink">{s.pct}%</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Subscription & Membership" action={viewAll}>
          <div className="space-y-3">
            {subscription.map((s) => {
              const Icon = subIcon[s.icon];
              return (
                <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="text-xs text-muted">{s.label}</p><p className="text-lg font-bold text-ink">{s.value}</p></div>
                  <Delta v={s.growth} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Source + Publication trend + Alerts */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Submission Source">
          <div className="flex items-center gap-4">
            <Donut data={submissionSource} center="1,248" sub="Total" />
            <Legend items={submissionSource} />
          </div>
        </Panel>

        <Panel title="Publication Trend" action={period}>
          <div className="mb-2 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />Published</span>
            <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" />Accepted</span>
          </div>
          <StackedBars data={publicationTrend} series={[{ key: "accepted", color: "#3b82f6" }, { key: "published", color: "#22c55e" }]} />
        </Panel>

        <Panel title="Alerts & Notifications">
          <div className="space-y-2.5">
            {jmAlerts.map((a) => (
              <div key={a.id} className={cn("flex items-center gap-2.5 rounded-xl border p-3 text-sm", alertTone[a.tone])}>
                <Bell className="h-4 w-4 shrink-0" />
                <span className="flex-1">{a.text}</span>
                <button className="shrink-0 text-xs font-semibold hover:underline">View Now</button>
              </div>
            ))}
            <button className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-2.5 text-sm font-medium text-muted hover:text-ink">View All Notifications</button>
          </div>
        </Panel>
      </div>

      {/* EMPLOYEE PRODUCTIVITY */}
      <Panel
        title="Employee Productivity"
        action={<Dropdown label={`Sort: ${sortKey === "score" ? "Score" : sortKey === "handled" ? "Manuscripts" : "Turnaround"}`}
          options={["Score", "Manuscripts", "Turnaround"]}
          onSelect={(v) => setSortKey(v === "Manuscripts" ? "handled" : v === "Turnaround" ? "turnaround" : "score")} align="right" />}
      >
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Active Staff", value: `${employees.length}`, icon: Users, tone: "bg-indigo-50 text-indigo-600" },
            { label: "Tasks Completed", value: `${totalCompleted}`, icon: CheckCircle2, tone: "bg-green-50 text-green-600" },
            { label: "Avg Turnaround", value: `${avgTurn} days`, icon: Clock, tone: "bg-amber-50 text-amber-500" },
            { label: "Avg Productivity", value: `${avgScore}%`, icon: TrendingUp, tone: "bg-emerald-50 text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", s.tone)}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-lg font-bold text-ink">{s.value}</p><p className="text-xs text-muted">{s.label}</p></div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-faint">
                <th className="pb-2.5">Employee</th>
                <th className="pb-2.5">Journal</th>
                <th className="pb-2.5 text-right">Handled</th>
                <th className="pb-2.5 text-right">Completed</th>
                <th className="pb-2.5 text-right">Pending</th>
                <th className="pb-2.5 text-right">Avg TAT</th>
                <th className="pb-2.5">Productivity</th>
                <th className="pb-2.5 text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: e.color }}>{e.initials}</div>
                      <div><p className="font-medium text-ink">{e.name}</p><p className="text-xs text-faint">{e.role}</p></div>
                    </div>
                  </td>
                  <td className="py-3"><span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">{e.journal}</span></td>
                  <td className="py-3 text-right text-ink">{e.handled}</td>
                  <td className="py-3 text-right text-green-600">{e.completed}</td>
                  <td className="py-3 text-right text-amber-500">{e.pending}</td>
                  <td className="py-3 text-right text-muted">{e.turnaround} d</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full" style={{ width: `${e.score}%`, background: e.score >= 90 ? "#22c55e" : e.score >= 80 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className="text-xs font-semibold text-ink">{e.score}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right"><Delta v={e.trend} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
