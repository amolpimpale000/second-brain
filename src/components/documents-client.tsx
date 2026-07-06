"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FolderOpen, LayoutGrid, HardDrive, Users, Clock, Plus, FileText, Award, GraduationCap,
  CreditCard, BadgeCheck, Image as ImageIcon, ShieldCheck, User, Upload, FolderPlus, ScanLine,
  Send, Share2, MoreVertical, Download, Trash2, Filter, List, ChevronDown, RotateCcw, Check, Folder,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { DocItem } from "@/lib/data";
import { docStats, docCategories, storageOverview, sampleDocs, expiringDocs, docActivity, docFolders } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Modal, Field, inputCls, Dropdown } from "@/components/vault-ui";

/* helpers -------------------------------------------------------------------*/
const catIconMap: Record<string, React.ElementType> = {
  folder: FolderOpen, user: User, award: Award, cap: GraduationCap, id: CreditCard,
  users: Users, badge: BadgeCheck, image: ImageIcon, shield: ShieldCheck,
};
const statIconMap: Record<string, React.ElementType> = {
  folder: FolderOpen, grid: LayoutGrid, drive: HardDrive, users: Users, clock: Clock,
};
const toneBg: Record<string, string> = {
  violet: "bg-violet-100 text-violet-600", amber: "bg-amber-100 text-amber-500",
  green: "bg-green-100 text-green-600", blue: "bg-blue-100 text-blue-600",
  red: "bg-red-100 text-red-500",
};
const subToneText: Record<string, string> = {
  green: "text-green-600", muted: "text-faint", violet: "text-violet-600",
};
const extBadge: Record<string, string> = {
  PDF: "bg-red-50 text-red-600", JPG: "bg-blue-50 text-blue-600",
  PNG: "bg-blue-50 text-blue-600", DOCX: "bg-indigo-50 text-indigo-600",
};
const uid = () => Math.random().toString(36).slice(2, 9);

function catColor(name: string) {
  return docCategories.find((c) => c.name === name)?.color ?? "#8b5cf6";
}
function catIconFor(name: string) {
  const icon = docCategories.find((c) => c.name === name)?.icon ?? "folder";
  return catIconMap[icon] ?? FileText;
}
function fmtSize(bytes: number) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`;
  return `${bytes} B`;
}

function usePersist<T>(key: string, seed: T) {
  const [val, setVal] = useState<T>(seed);
  const ready = useRef(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setVal(JSON.parse(raw)); } catch {}
    ready.current = true;
  }, [key]);
  useEffect(() => { if (ready.current) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} } }, [key, val]);
  return [val, setVal] as const;
}

function Menu({ items }: { items: { label: string; icon: React.ElementType; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-surface-2 hover:text-ink">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 min-w-[150px] rounded-xl border border-border bg-card p-1 shadow-card-lg">
            {items.map((it) => (
              <button key={it.label} onClick={() => { it.onClick(); setOpen(false); }}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2", it.danger ? "text-red-500" : "text-muted hover:text-ink")}>
                <it.icon className="h-4 w-4" /> {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const PAGE_SIZE = 12;

/* =========================================================================== */
export function DocumentsClient() {
  const [docs, setDocs] = usePersist<DocItem[]>("sb.docs", sampleDocs);
  const [folders, setFolders] = usePersist("sb.docs.folders", docFolders);
  const [tab, setTab] = useState<"all" | "folders" | "trash">("all");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [sort, setSort] = useState("Recently Added");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "category" | "folder">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1600); };

  const live = docs.filter((d) => !d.trashed);
  const trashed = docs.filter((d) => d.trashed);

  const filtered = useMemo(() => {
    let list = live.filter((d) => (!activeCat || d.category === activeCat) && (typeFilter === "All Types" || d.ext === typeFilter));
    if (sort === "Name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "Size") list = [...list].sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
    return list;
  }, [live, activeCat, typeFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [activeCat, typeFilter, sort, tab]);

  /* mutations */
  const removeDoc = (id: string) => { setDocs((p) => p.map((d) => (d.id === id ? { ...d, trashed: true } : d))); flash("Moved to Trash"); };
  const restoreDoc = (id: string) => setDocs((p) => p.map((d) => (d.id === id ? { ...d, trashed: false } : d)));
  const purgeDoc = (id: string) => setDocs((p) => p.filter((d) => d.id !== id));

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const added: DocItem[] = Array.from(files).map((f) => {
      const ext = (f.name.split(".").pop() || "").toUpperCase();
      const isImg = f.type.startsWith("image/");
      return {
        id: uid(),
        name: f.name.replace(/\.[^.]+$/, ""),
        category: isImg ? "Images / Photos" : "Important Docs",
        ext: (["PDF", "JPG", "PNG", "DOCX"].includes(ext) ? ext : "PDF") as DocItem["ext"],
        size: fmtSize(f.size),
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        kind: isImg ? "image" : "doc",
        thumb: isImg ? URL.createObjectURL(f) : undefined,
        gradient: isImg ? "from-violet-300 via-fuchsia-200 to-sky-200" : undefined,
      };
    });
    setDocs((p) => [...added, ...p]);
    flash(`${added.length} document${added.length > 1 ? "s" : ""} uploaded`);
  };

  const quickActions = [
    { label: "Upload Document", icon: Upload, onClick: () => fileRef.current?.click() },
    { label: "Create New Folder", icon: FolderPlus, onClick: () => setModal("folder") },
    { label: "Scan Document", icon: ScanLine, onClick: () => fileRef.current?.click() },
    { label: "Request Document", icon: Send, onClick: () => flash("Request sent to family") },
    { label: "Share with Family", icon: Share2, onClick: () => flash("Sharing link copied") },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Documents</h1>
        <p className="mt-1 text-sm text-muted">Store, organize and manage all your important documents in one secure place.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {/* LEFT / MAIN */}
        <div className="min-w-0 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {docStats.map((s) => {
              const Icon = statIconMap[s.icon];
              return (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-8 w-8 place-items-center rounded-lg", toneBg[s.tone])}><Icon className="h-4 w-4" /></div>
                    <p className="text-xs font-medium text-muted">{s.label}</p>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-ink">{s.value}</p>
                  <p className={cn("mt-0.5 text-[11px] font-medium", subToneText[s.subTone])}>{s.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Browse by Category */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Browse by Category</h2>
              <div className="flex items-center gap-2">
                <Dropdown label="All Family Members" options={["All Family Members", "Amol", "Family"]} onSelect={() => {}} />
                <button onClick={() => setActiveCat(null)} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-100">View All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {docCategories.map((c) => {
                const Icon = catIconMap[c.icon] ?? FileText;
                const active = activeCat === c.name;
                return (
                  <button key={c.name} onClick={() => setActiveCat(active ? null : c.name)}
                    className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-card transition-colors hover:border-violet-200", active ? "border-violet-300 ring-1 ring-violet-200" : "border-border")}>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${c.color}1a`, color: c.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                      <p className="text-xs text-muted">{c.count}</p>
                    </div>
                  </button>
                );
              })}
              <button onClick={() => setModal("category")} className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-3 text-sm font-medium text-violet-600 hover:bg-violet-50">
                <Plus className="h-4 w-4" /> Add Category
              </button>
            </div>
          </div>

          {/* Tabs + toolbar */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
              <div className="flex gap-5">
                {([["all", "All Documents"], ["folders", "Folders"], ["trash", "Trash"]] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setTab(k)}
                    className={cn("relative pb-3 text-sm font-medium transition-colors", tab === k ? "text-violet-600" : "text-muted hover:text-ink")}>
                    {label}{k === "trash" && trashed.length > 0 ? ` (${trashed.length})` : ""}
                    {tab === k && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-violet-600" />}
                  </button>
                ))}
              </div>
              {tab === "all" && (
                <div className="flex items-center gap-2 pb-2">
                  <Dropdown label={`Sort by: ${sort}`} options={["Recently Added", "Name", "Size"]} onSelect={setSort} />
                  <Dropdown label={typeFilter === "All Types" ? "Filter" : typeFilter} options={["All Types", "PDF", "JPG", "PNG", "DOCX"]} onSelect={setTypeFilter} />
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-0.5">
                    <button onClick={() => setView("list")} className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "list" ? "bg-violet-50 text-violet-600" : "text-faint")}><List className="h-4 w-4" /></button>
                    <button onClick={() => setView("grid")} className={cn("grid h-8 w-8 place-items-center rounded-lg", view === "grid" ? "bg-violet-50 text-violet-600" : "text-faint")}><LayoutGrid className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {tab === "folders" ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {folders.map((f) => (
                  <div key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                    <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${f.color}1a`, color: f.color }}><Folder className="h-5 w-5" /></div>
                    <p className="mt-3 font-medium text-ink">{f.name}</p>
                    <p className="text-xs text-muted">{f.count} files</p>
                  </div>
                ))}
                <button onClick={() => setModal("folder")} className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-medium text-violet-600 hover:bg-violet-50">
                  <FolderPlus className="h-6 w-6" /> New Folder
                </button>
              </div>
            ) : tab === "trash" ? (
              trashed.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-border bg-card p-14 text-center text-sm text-muted shadow-card">Trash is empty.</div>
              ) : (
                <div className="mt-4 space-y-2">
                  {trashed.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${catColor(d.category)}1a`, color: catColor(d.category) }}><FileText className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{d.name}</p><p className="text-xs text-faint">{d.category} · {d.size}</p></div>
                      <button onClick={() => restoreDoc(d.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                      <button onClick={() => purgeDoc(d.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )
            ) : shown.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-border bg-card p-14 text-center text-sm text-muted shadow-card">
                No documents here. <button onClick={() => fileRef.current?.click()} className="font-medium text-violet-600 hover:underline">Upload one</button>
              </div>
            ) : view === "grid" ? (
              <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {shown.map((d) => <DocCard key={d.id} doc={d} onDelete={() => removeDoc(d.id)} onCopy={() => flash("Link copied")} />)}
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                {shown.map((d) => {
                  const Icon = catIconFor(d.category);
                  return (
                    <div key={d.id} className="flex items-center gap-3 border-b border-border p-3 last:border-0 hover:bg-surface-2/50">
                      <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `${catColor(d.category)}1a`, color: catColor(d.category) }}><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{d.name}</p><p className="text-xs text-faint">{d.category}</p></div>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", extBadge[d.ext])}>{d.ext}</span>
                      <span className="hidden text-xs text-muted sm:block">{d.size}</span>
                      <span className="hidden text-xs text-faint md:block">{d.date}</span>
                      <Menu items={[{ label: "Download", icon: Download, onClick: () => flash("Downloading…") }, { label: "Share", icon: Share2, onClick: () => flash("Link copied") }, { label: "Delete", icon: Trash2, danger: true, onClick: () => removeDoc(d.id) }]} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {tab === "all" && shown.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} documents</p>
                <div className="flex items-center gap-1">
                  <PageBtn disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>‹</PageBtn>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <PageBtn key={p} active={p === safePage} onClick={() => setPage(p)}>{p}</PageBtn>
                  ))}
                  <PageBtn disabled={safePage === pages} onClick={() => setPage(safePage + 1)}>›</PageBtn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT RAIL */}
        <aside className="space-y-4">
          {/* Storage */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-semibold text-ink">Storage Overview</h3>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={storageOverview.breakdown} dataKey="value" innerRadius="72%" outerRadius="100%" paddingAngle={3} stroke="none" startAngle={90} endAngle={-270}>
                      {storageOverview.breakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-ink">{storageOverview.usedLabel}</span>
                  <span className="text-[10px] text-faint">of {storageOverview.totalLabel} Used</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {storageOverview.breakdown.map((b) => (
                  <div key={b.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
                    <span className="text-muted">{b.name}</span>
                    <span className="ml-auto font-medium text-ink">{b.value} GB</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-violet-50 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-100">Manage Storage</button>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-ink">Quick Actions</h3>
            <div className="space-y-1">
              {quickActions.map((a) => (
                <button key={a.label} onClick={a.onClick} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink">
                  <a.icon className="h-4 w-4 text-violet-500" /> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Expiring Soon</h3>
              <button className="text-xs font-medium text-violet-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {expiringDocs.map((e) => (
                <div key={e.id} className="flex items-center gap-2.5">
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", toneBg[e.tone])}><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{e.name}</p><p className="truncate text-xs text-faint">{e.date}</p></div>
                  <span className={cn("shrink-0 text-xs font-semibold", subToneText[e.tone] ?? "text-muted")}>{e.days}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Recent Activity</h3>
              <button className="text-xs font-medium text-violet-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {docActivity.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${a.color}1a`, color: a.color }}><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{a.name}</p><p className="truncate text-xs text-faint">{a.action}</p></div>
                  <span className="shrink-0 text-xs text-faint">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card-lg">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400" /> {toast}</span>
        </div>
      )}

      {modal === "category" && <AddCategoryModal onClose={() => setModal(null)} onDone={() => { setModal(null); flash("Category added"); }} />}
      {modal === "folder" && (
        <AddFolderModal onClose={() => setModal(null)} onCreate={(name) => { setFolders((p) => [...p, { id: uid(), name, count: 0, color: "#8b5cf6" }]); setModal(null); setTab("folders"); flash("Folder created"); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ doc card */
function DocCard({ doc, onDelete, onCopy }: { doc: DocItem; onDelete: () => void; onCopy: () => void }) {
  const Icon = catIconFor(doc.category);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-lg">
      {/* preview */}
      <div className="relative h-36 overflow-hidden">
        {doc.kind === "image" ? (
          doc.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.thumb} alt={doc.name} className="h-full w-full object-cover" />
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br", doc.gradient ?? "from-violet-300 to-sky-200")} />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: `${catColor(doc.category)}12` }}>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm" style={{ color: catColor(doc.category) }}><Icon className="h-6 w-6" /></div>
            <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-muted">{doc.ext} Document</span>
          </div>
        )}
        <span className={cn("absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold", extBadge[doc.ext])}>{doc.ext}</span>
      </div>
      {/* meta */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
            <span className="mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${catColor(doc.category)}1a`, color: catColor(doc.category) }}>{doc.category}</span>
          </div>
          <Menu items={[
            { label: "Download", icon: Download, onClick: () => {} },
            { label: "Share", icon: Share2, onClick: onCopy },
            { label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
          ]} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-faint">
          <FileText className="h-3 w-3" /> {doc.ext} · {doc.size}
          <span className="ml-auto">{doc.date}</span>
        </div>
      </div>
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm transition-colors", active ? "bg-violet-600 font-semibold text-white" : "text-muted hover:bg-surface-2", disabled && "opacity-40")}>
      {children}
    </button>
  );
}

function AddCategoryModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  return (
    <Modal open title="Add Category" onClose={onClose} size="sm">
      <Field label="Category name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vehicle Docs" autoFocus /></Field>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
        <button onClick={() => name.trim() && onDone()} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600">Add Category</button>
      </div>
    </Modal>
  );
}

function AddFolderModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Modal open title="Create New Folder" onClose={onClose} size="sm">
      <Field label="Folder name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bank Documents" autoFocus /></Field>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
        <button onClick={() => name.trim() && onCreate(name.trim())} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600">Create Folder</button>
      </div>
    </Modal>
  );
}
