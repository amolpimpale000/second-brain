"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FolderOpen, LayoutGrid, HardDrive, Plus, FileText, Award, GraduationCap,
  CreditCard, BadgeCheck, Image as ImageIcon, ShieldCheck, User, Upload, FolderPlus, ScanLine,
  Share2, MoreVertical, Download, Trash2, List, RotateCcw, Check, Folder, Users,
  ImagePlus, FileUp, Replace, Clock, X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { DocItem, DocCategory } from "@/lib/data";
import { docCategories as defaultCategories, docFolders } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Modal, Field, inputCls, Dropdown } from "@/components/vault-ui";

/* helpers -------------------------------------------------------------------*/
const catIconMap: Record<string, React.ElementType> = {
  folder: FolderOpen, user: User, award: Award, cap: GraduationCap, id: CreditCard,
  users: Users, badge: BadgeCheck, image: ImageIcon, shield: ShieldCheck,
};
const toneBg: Record<string, string> = {
  violet: "bg-violet-100 text-violet-600", amber: "bg-amber-100 text-amber-500",
  green: "bg-green-100 text-green-600", blue: "bg-blue-100 text-blue-600",
  red: "bg-red-100 text-red-500",
};
const extBadge: Record<string, string> = {
  PDF: "bg-red-50 text-red-600", JPG: "bg-blue-50 text-blue-600", JPEG: "bg-blue-50 text-blue-600",
  PNG: "bg-blue-50 text-blue-600", WEBP: "bg-blue-50 text-blue-600", DOCX: "bg-indigo-50 text-indigo-600",
  DOC: "bg-indigo-50 text-indigo-600", XLSX: "bg-green-50 text-green-600", XLS: "bg-green-50 text-green-600",
  TXT: "bg-slate-100 text-slate-600",
};
const badgeCls = (ext: string) => extBadge[ext] ?? "bg-slate-100 text-slate-600";
const uid = () => Math.random().toString(36).slice(2, 9);
const PHOTO_CATEGORY = "Images / Photos";
const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
const DOC_ACCEPT = "*/*";

function catColor(name: string, cats: DocCategory[] = defaultCategories) {
  return cats.find((c) => c.name === name)?.color ?? "#8b5cf6";
}
function catIconFor(name: string, cats: DocCategory[] = defaultCategories) {
  const icon = cats.find((c) => c.name === name)?.icon ?? "folder";
  return catIconMap[icon] ?? FileText;
}
function fmtSize(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`;
  return `${bytes} B`;
}
/** Parse a size string like "1.2 MB" back into bytes. */
function parseSize(s: string) {
  const m = s?.match(/([\d.]+)\s*(GB|MB|KB|B)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  return n * (u === "GB" ? 1e9 : u === "MB" ? 1e6 : u === "KB" ? 1e3 : 1);
}
/** Documents get an id like `${Date.now()}-xxxx`; use it for ordering + relative time. */
function docTime(id: string) {
  const n = Number(String(id).split("-")[0]);
  return Number.isFinite(n) && n > 1e12 ? n : 0;
}
function relTime(ms: number) {
  if (!ms) return "";
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function usePersist<T>(key: string, seed: T, validate?: (v: unknown) => v is T) {
  const [val, setVal] = useState<T>(seed);
  const ready = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!validate || validate(parsed)) setVal(parsed);
      }
    } catch {}
    ready.current = true;
  }, [key, validate]);
  useEffect(() => { if (ready.current) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} } }, [key, val]);
  return [val, setVal] as const;
}

function isDocCategoryArray(v: unknown): v is DocCategory[] {
  return Array.isArray(v) && v.every((c) => c && typeof c === "object" && typeof c.name === "string" && typeof c.icon === "string" && typeof c.color === "string");
}

function isDocFolderArray(v: unknown): v is typeof docFolders {
  return Array.isArray(v) && v.every((f) => f && typeof f === "object" && typeof f.id === "string" && typeof f.name === "string");
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
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-xl border border-border bg-card p-1 shadow-card-lg">
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
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [folders, setFolders] = usePersist("sb.docs.folders", docFolders, isDocFolderArray);
  const [categories, setCategories] = usePersist<DocCategory[]>("sb.docs.categories", defaultCategories, isDocCategoryArray);
  const [tab, setTab] = useState<"all" | "photos" | "folders" | "trash">("all");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [sort, setSort] = useState("Recently Added");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "category" | "folder" | "rename" | "upload-category" | "change-category">(null);
  const [renamingDoc, setRenamingDoc] = useState<DocItem | null>(null);
  const [categoryDoc, setCategoryDoc] = useState<DocItem | null>(null);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replacingId = useRef<string | null>(null);
  const directUploadCat = useRef<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const reload = () => {
    setLoading(true);
    fetch("/api/documents")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load documents"))))
      .then((data) => { if (Array.isArray(data.docs)) setDocs(data.docs); })
      .catch((err) => { console.error(err); flash("Could not load documents"); })
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const live = useMemo(() => docs.filter((d) => !d.trashed), [docs]);
  const trashed = useMemo(() => docs.filter((d) => d.trashed), [docs]);
  const photos = useMemo(() => live.filter((d) => d.kind === "image"), [live]);

  /* accurate, computed data --------------------------------------------------*/
  const safeCategories = Array.isArray(categories) ? categories : defaultCategories;
  const categoryCount = (name: string) => live.filter((d) => d.category === name).length;
  const usedBytes = live.reduce((s, d) => s + parseSize(d.size), 0);
  const imageBytes = photos.reduce((s, d) => s + parseSize(d.size), 0);
  const docBytes = usedBytes - imageBytes;
  const categoryList = safeCategories.map((c) => ({ ...c, count: categoryCount(c.name) }));
  const nonEmptyCats = categoryList.filter((c) => c.count > 0).length;

  const stats = [
    { label: "Total Documents", value: String(live.length), sub: `${photos.length} photos`, tone: "violet", Icon: FolderOpen },
    { label: "Photos", value: String(photos.length), sub: "Images only", tone: "blue", Icon: ImageIcon },
    { label: "Total Size", value: fmtSize(usedBytes), sub: "Across all files", tone: "green", Icon: HardDrive },
    { label: "Categories", value: String(nonEmptyCats), sub: `${categories.length} available`, tone: "amber", Icon: LayoutGrid },
    { label: "In Trash", value: String(trashed.length), sub: "Recoverable", tone: "red", Icon: Trash2 },
  ];

  const storageBreakdown = [
    { name: "Documents", value: Math.max(docBytes, 0), color: "#8b5cf6" },
    { name: "Images", value: imageBytes, color: "#3b82f6" },
  ];

  const recentActivity = useMemo(
    () => [...live].sort((a, b) => docTime(b.id) - docTime(a.id)).slice(0, 5),
    [live]
  );

  /* current-tab list + pagination -------------------------------------------*/
  const filtered = useMemo(() => {
    const source = tab === "photos" ? photos : live;
    let list = source.filter(
      (d) => (tab === "photos" || !activeCat || d.category === activeCat) &&
             (typeFilter === "All Types" || d.ext === typeFilter)
    );
    if (sort === "Name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "Size") list = [...list].sort((a, b) => parseSize(b.size) - parseSize(a.size));
    else list = [...list].sort((a, b) => docTime(b.id) - docTime(a.id));
    return list;
  }, [tab, live, photos, activeCat, typeFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [activeCat, typeFilter, sort, tab]);

  /* mutations ----------------------------------------------------------------*/
  const removeDoc = async (id: string) => {
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, trashed: true } : d)));
    try {
      const res = await fetch("/api/documents/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error("Delete failed");
      flash("Moved to Trash");
    } catch (err) { console.error(err); flash("Delete failed"); setDocs((p) => p.map((d) => (d.id === id ? { ...d, trashed: false } : d))); }
  };
  const restoreDoc = async (id: string) => {
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, trashed: false } : d)));
    try {
      const res = await fetch("/api/documents/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error("Restore failed");
      flash("Document restored");
    } catch (err) { console.error(err); flash("Restore failed"); setDocs((p) => p.map((d) => (d.id === id ? { ...d, trashed: true } : d))); }
  };
  const purgeDoc = async (id: string) => {
    const prev = docs.find((d) => d.id === id);
    setDocs((p) => p.filter((d) => d.id !== id));
    try {
      const res = await fetch("/api/documents/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, mode: "hard" }) });
      if (!res.ok) throw new Error("Purge failed");
      flash("Deleted permanently");
    } catch (err) { console.error(err); flash("Delete failed"); if (prev) setDocs((p) => [...p, prev]); }
  };

  const renameDoc = async (id: string, newName: string) => {
    const prev = docs.find((d) => d.id === id);
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, name: newName.trim() } : d)));
    try {
      const res = await fetch("/api/documents/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: newName }) });
      if (!res.ok) throw new Error("Rename failed");
      const data = await res.json();
      if (data.doc) setDocs((p) => p.map((d) => (d.id === id ? data.doc : d)));
      flash("Renamed successfully");
    } catch (err) { console.error(err); flash("Rename failed"); if (prev) setDocs((p) => p.map((d) => (d.id === id ? prev : d))); }
  };

  const onUpload = async (files: FileList | null, asPhoto: boolean, chosenCategory?: string) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      formData.append("category", asPhoto ? PHOTO_CATEGORY : (chosenCategory || activeCat || "Important Docs"));
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const uploaded: DocItem[] = data.docs.map((d: DocItem) => ({ ...d, thumb: d.kind === "image" ? d.url : undefined }));
      setDocs((p) => [...uploaded, ...p]);
      flash(`${uploaded.length} ${asPhoto ? "photo" : "document"}${uploaded.length > 1 ? "s" : ""} uploaded`);
    } catch (err) { console.error(err); flash(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDocFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const direct = directUploadCat.current;
    directUploadCat.current = null;
    if (direct) {
      onUpload(files, false, direct);
    } else {
      setPendingFiles(files);
      setPendingPhoto(false);
      setModal("upload-category");
    }
  };

  const handlePhotoFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onUpload(files, true);
  };

  const changeCategory = async (id: string, newCategory: string) => {
    const prev = docs.find((d) => d.id === id);
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, category: newCategory } : d)));
    try {
      const res = await fetch("/api/documents/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, category: newCategory }),
      });
      if (!res.ok) throw new Error("Change category failed");
      flash("Category updated");
    } catch (err) {
      console.error(err);
      flash("Category update failed");
      if (prev) setDocs((p) => p.map((d) => (d.id === id ? prev : d)));
    }
  };

  const startReplace = (id: string) => { replacingId.current = id; replaceInputRef.current?.click(); };
  const onReplace = async (files: FileList | null) => {
    const id = replacingId.current;
    if (!id || !files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("files", files[0]);
      const res = await fetch("/api/documents/update", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      const updated: DocItem = { ...data.doc, thumb: data.doc.kind === "image" ? data.doc.url : undefined };
      setDocs((p) => p.map((d) => (d.id === id ? updated : d)));
      flash("File updated");
    } catch (err) { console.error(err); flash(err instanceof Error ? err.message : "Update failed"); }
    finally { setUploading(false); replacingId.current = null; }
  };

  const download = (d: DocItem) => {
    if (!d.url) return;
    const a = document.createElement("a");
    a.href = `${d.url}?dl=1`;
    a.download = d.name;
    a.click();
  };
  const share = async (d: DocItem) => {
    try { await navigator.clipboard.writeText(location.origin + (d.url ?? "")); flash("Link copied"); }
    catch { flash("Could not copy link"); }
  };

  const quickActions = [
    { label: "Upload Document", icon: FileUp, onClick: () => docInputRef.current?.click() },
    { label: "Upload Photo", icon: ImagePlus, onClick: () => photoInputRef.current?.click() },
    { label: "Create New Folder", icon: FolderPlus, onClick: () => setModal("folder") },
    { label: "Scan Document", icon: ScanLine, onClick: () => docInputRef.current?.click() },
    { label: "Share with Family", icon: Share2, onClick: () => flash("Sharing link copied") },
  ];

  const docCategoriesForUpload = categoryList.filter((c) => c.name !== PHOTO_CATEGORY);

  return (
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Documents</h1>
          <p className="mt-1 text-sm text-muted">Store, organize and manage all your important documents in one secure place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => docInputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60">
            <FileUp className="h-4 w-4" /> Upload Documents
          </button>
          <button onClick={() => photoInputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60">
            <ImagePlus className="h-4 w-4" /> Upload Photos
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {/* LEFT / MAIN */}
        <div className="min-w-0 space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-2">
                  <div className={cn("grid h-8 w-8 place-items-center rounded-lg", toneBg[s.tone])}><s.Icon className="h-4 w-4" /></div>
                  <p className="text-xs font-medium text-muted">{s.label}</p>
                </div>
                <p className="mt-3 text-2xl font-bold text-ink">{s.value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-faint">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Browse by Category */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Browse by Category</h2>
              <button onClick={() => setActiveCat(null)} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-100">View All</button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categoryList.map((c) => {
                const Icon = catIconMap[c.icon] ?? FileText;
                const active = activeCat === c.name;
                return (
                  <button key={c.name} onClick={() => { if (c.name === PHOTO_CATEGORY) { setTab("photos"); setActiveCat(null); } else { setTab("all"); setActiveCat(active ? null : c.name); } }}
                    className={cn("flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-card transition-colors hover:border-violet-200", active ? "border-violet-300 ring-1 ring-violet-200" : "border-border")}>
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${c.color}1a`, color: c.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                      <p className="text-xs text-muted">{categoryCount(c.name)} files</p>
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
                {([["all", "All Documents"], ["photos", "Photos"], ["folders", "Folders"], ["trash", "Trash"]] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setTab(k)}
                    className={cn("relative pb-3 text-sm font-medium transition-colors", tab === k ? "text-violet-600" : "text-muted hover:text-ink")}>
                    {label}
                    {k === "photos" && photos.length > 0 ? ` (${photos.length})` : ""}
                    {k === "trash" && trashed.length > 0 ? ` (${trashed.length})` : ""}
                    {tab === k && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-violet-600" />}
                  </button>
                ))}
              </div>
              {(tab === "all" || tab === "photos") && (
                <div className="flex items-center gap-2 pb-2">
                  <Dropdown label={`Sort by: ${sort}`} options={["Recently Added", "Name", "Size"]} onSelect={setSort} />
                  {tab === "all" && <Dropdown label={typeFilter === "All Types" ? "Filter" : typeFilter} options={["All Types", "PDF", "JPG", "PNG", "DOCX"]} onSelect={setTypeFilter} />}
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
                {loading ? "Loading…" : (
                  <>
                    {tab === "photos" ? "No photos yet. " : "No documents here. "}
                    <button onClick={() => (tab === "photos" ? photoInputRef : docInputRef).current?.click()} className="font-medium text-violet-600 hover:underline">
                      Upload {tab === "photos" ? "a photo" : "one"}
                    </button>
                  </>
                )}
              </div>
            ) : view === "grid" ? (
              <div className={cn("mt-4 grid gap-4", tab === "photos" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
                {shown.map((d) =>
                  tab === "photos" ? (
                    <PhotoCard
                      key={d.id}
                      doc={d}
                      onPreview={() => setPreviewUrl(d.url ?? null)}
                      onDelete={() => removeDoc(d.id)}
                      onRename={() => { setRenamingDoc(d); setModal("rename"); }}
                      onDownload={() => download(d)}
                      onShare={() => share(d)}
                    />
                  ) : (
                    <DocCard
                      key={d.id}
                      doc={d}
                      onDelete={() => removeDoc(d.id)}
                      onDownload={() => download(d)}
                      onShare={() => share(d)}
                      onReplace={() => startReplace(d.id)}
                      onRename={() => { setRenamingDoc(d); setModal("rename"); }}
                      onChangeCategory={() => { setCategoryDoc(d); setModal("change-category"); }}
                    />
                  )
                )}
                {tab === "all" && activeCat && shown.length > 0 && (
                  <button
                    onClick={() => { directUploadCat.current = activeCat; docInputRef.current?.click(); }}
                    className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-4 text-sm font-medium text-violet-600 shadow-card transition-colors hover:bg-violet-50"
                  >
                    <Plus className="h-6 w-6" />
                    Upload to {activeCat}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-border bg-card shadow-card">
                {shown.map((d) => {
                  const Icon = catIconFor(d.category);
                  return (
                    <div key={d.id} className="flex items-center gap-3 border-b border-border p-3 last:border-0 hover:bg-surface-2/50">
                      <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `${catColor(d.category)}1a`, color: catColor(d.category) }}><Icon className="h-5 w-5" /></div>
                      <button onClick={() => d.url && window.open(d.url, "_blank")} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium text-ink hover:text-violet-600">{d.name}</p><p className="text-xs text-faint">{d.category}</p></button>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", badgeCls(d.ext))}>{d.ext}</span>
                      <span className="hidden text-xs text-muted sm:block">{d.size}</span>
                      <span className="hidden text-xs text-faint md:block">{d.date}</span>
                      <Menu items={[
                        { label: "Open", icon: FileText, onClick: () => d.url && window.open(d.url, "_blank") },
                        { label: "Download", icon: Download, onClick: () => download(d) },
                        { label: "Rename", icon: FileText, onClick: () => { setRenamingDoc(d); setModal("rename"); } },
                        { label: "Change category", icon: FolderOpen, onClick: () => { setCategoryDoc(d); setModal("change-category"); } },
                        { label: "Replace file", icon: Replace, onClick: () => startReplace(d.id) },
                        { label: "Share", icon: Share2, onClick: () => share(d) },
                        { label: "Delete", icon: Trash2, danger: true, onClick: () => removeDoc(d.id) },
                      ]} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {(tab === "all" || tab === "photos") && shown.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} {tab === "photos" ? "photos" : "documents"}</p>
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
                    <Pie data={usedBytes > 0 ? storageBreakdown : [{ name: "Empty", value: 1, color: "#e5e7eb" }]} dataKey="value" innerRadius="72%" outerRadius="100%" paddingAngle={3} stroke="none" startAngle={90} endAngle={-270}>
                      {(usedBytes > 0 ? storageBreakdown : [{ name: "Empty", value: 1, color: "#e5e7eb" }]).map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-ink">{fmtSize(usedBytes)}</span>
                  <span className="text-[10px] text-faint">Used</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {storageBreakdown.map((b) => (
                  <div key={b.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} />
                    <span className="text-muted">{b.name}</span>
                    <span className="ml-auto font-medium text-ink">{fmtSize(b.value)}</span>
                  </div>
                ))}
              </div>
            </div>
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

          {/* Recent Activity */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 font-semibold text-ink">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-xs text-faint">No activity yet. Upload a document to get started.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${catColor(a.category)}1a`, color: catColor(a.category) }}>
                      {a.kind === "image" ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{a.name}</p><p className="truncate text-xs text-faint">Uploaded · {a.category}</p></div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-faint"><Clock className="h-3 w-3" />{relTime(docTime(a.id))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* hidden inputs: separate document + photo + replace pickers */}
      <input ref={docInputRef} type="file" multiple accept={DOC_ACCEPT} className="hidden" onChange={(e) => { handleDocFiles(e.target.files); e.target.value = ""; }} />
      <input ref={photoInputRef} type="file" multiple accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => { handlePhotoFiles(e.target.files); e.target.value = ""; }} />
      <input ref={replaceInputRef} type="file" className="hidden" onChange={(e) => { onReplace(e.target.files); e.target.value = ""; }} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card-lg">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400" /> {toast}</span>
        </div>
      )}

      {modal === "category" && (
        <AddCategoryModal
          onClose={() => setModal(null)}
          onDone={(name, icon, color) => {
            setCategories((p) => [...p, { name, count: 0, icon, color }]);
            setModal(null);
            flash("Category added");
          }}
        />
      )}
      {modal === "folder" && (
        <AddFolderModal onClose={() => setModal(null)} onCreate={(name) => { setFolders((p) => [...p, { id: uid(), name, count: 0, color: "#8b5cf6" }]); setModal(null); setTab("folders"); flash("Folder created"); }} />
      )}
      {modal === "rename" && renamingDoc && (
        <RenameModal
          initial={renamingDoc.name}
          onClose={() => { setModal(null); setRenamingDoc(null); }}
          onDone={(name) => { renameDoc(renamingDoc.id, name); setModal(null); setRenamingDoc(null); }}
        />
      )}
      {modal === "upload-category" && pendingFiles && (
        <CategoryPickerModal
          title="Choose category"
          categories={docCategoriesForUpload}
          onClose={() => { setModal(null); setPendingFiles(null); }}
          onSelect={(category) => {
            onUpload(pendingFiles, pendingPhoto, category);
            setModal(null);
            setPendingFiles(null);
          }}
        />
      )}
      {modal === "change-category" && categoryDoc && (
        <CategoryPickerModal
          title="Change category"
          categories={categoryList.filter((c) => c.name !== PHOTO_CATEGORY)}
          selected={categoryDoc.category}
          onClose={() => { setModal(null); setCategoryDoc(null); }}
          onSelect={(category) => {
            changeCategory(categoryDoc.id, category);
            setModal(null);
            setCategoryDoc(null);
          }}
        />
      )}
      {previewUrl && (
        <ImagePreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ doc card */
function DocCard({ doc, onDelete, onDownload, onShare, onReplace, onRename, onChangeCategory }: {
  doc: DocItem; onDelete: () => void; onDownload: () => void; onShare: () => void; onReplace: () => void; onRename: () => void; onChangeCategory: () => void;
}) {
  const Icon = catIconFor(doc.category);
  const open = () => doc.url && window.open(doc.url, "_blank");
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-lg">
      {/* preview */}
      <button onClick={open} className="relative block h-36 w-full overflow-hidden rounded-t-2xl">
        {doc.kind === "image" ? (
          doc.thumb || doc.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.thumb || doc.url} alt={doc.name} className="h-full w-full object-cover" />
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br", doc.gradient ?? "from-violet-300 to-sky-200")} />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: `${catColor(doc.category)}12` }}>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-sm" style={{ color: catColor(doc.category) }}><Icon className="h-6 w-6" /></div>
            <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-muted">{doc.ext} Document</span>
          </div>
        )}
        <span className={cn("absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold", badgeCls(doc.ext))}>{doc.ext}</span>
      </button>
      {/* meta */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
            <span className="mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${catColor(doc.category)}1a`, color: catColor(doc.category) }}>{doc.category}</span>
          </div>
          <Menu items={[
            { label: "Open", icon: FileText, onClick: open },
            { label: "Download", icon: Download, onClick: onDownload },
            { label: "Rename", icon: FileText, onClick: onRename },
            { label: "Change category", icon: FolderOpen, onClick: onChangeCategory },
            { label: "Replace file", icon: Replace, onClick: onReplace },
            { label: "Share", icon: Share2, onClick: onShare },
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

/* ------------------------------------------------------------- photo card */
function PhotoCard({ doc, onPreview, onDelete, onRename, onDownload, onShare }: {
  doc: DocItem;
  onPreview: () => void;
  onDelete: () => void;
  onRename: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-lg">
      <button onClick={onPreview} className="relative block aspect-square w-full overflow-hidden bg-surface-2">
        {doc.thumb || doc.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.thumb || doc.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br", doc.gradient ?? "from-violet-300 to-sky-200")} />
        )}
      </button>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Menu items={[
          { label: "Preview", icon: ImageIcon, onClick: onPreview },
          { label: "Download", icon: Download, onClick: onDownload },
          { label: "Rename", icon: FileText, onClick: onRename },
          { label: "Share", icon: Share2, onClick: onShare },
          { label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
        ]} />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- image preview */
function ImagePreview({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    document.documentElement.classList.add("overflow-hidden");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.documentElement.classList.remove("overflow-hidden"); document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
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

function AddCategoryModal({ onClose, onDone }: { onClose: () => void; onDone: (name: string, icon: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const [color, setColor] = useState("#8b5cf6");
  const iconOptions = [
    { key: "folder", Icon: FolderOpen },
    { key: "user", Icon: User },
    { key: "award", Icon: Award },
    { key: "cap", Icon: GraduationCap },
    { key: "id", Icon: CreditCard },
    { key: "users", Icon: Users },
    { key: "badge", Icon: BadgeCheck },
    { key: "shield", Icon: ShieldCheck },
  ];
  const colorOptions = ["#8b5cf6", "#22c55e", "#f59e0b", "#3b82f6", "#f43f5e", "#06b6d4", "#ef4444", "#eab308"];
  return (
    <Modal open title="Add Category" onClose={onClose} size="sm">
      <Field label="Category name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vehicle Docs" autoFocus />
      </Field>
      <div className="mt-3 space-y-2">
        <label className="text-xs font-medium text-muted">Icon</label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map(({ key, Icon }) => (
            <button key={key} onClick={() => setIcon(key)} className={cn("grid h-9 w-9 place-items-center rounded-lg border", icon === key ? "border-violet-500 bg-violet-50 text-violet-600" : "border-border bg-surface text-muted hover:bg-surface-2")}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <label className="text-xs font-medium text-muted">Color</label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={cn("h-7 w-7 rounded-full border-2", color === c ? "border-ink" : "border-transparent")} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
        <button onClick={() => name.trim() && onDone(name.trim(), icon, color)} disabled={!name.trim()} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60">Add Category</button>
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

function RenameModal({ initial, onClose, onDone }: { initial: string; onClose: () => void; onDone: (name: string) => void }) {
  const [name, setName] = useState(initial);
  return (
    <Modal open title="Rename Document" onClose={onClose} size="sm">
      <Field label="Name">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Document name"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onDone(name.trim()); }}
        />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
        <button onClick={() => name.trim() && onDone(name.trim())} disabled={!name.trim()} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60">Rename</button>
      </div>
    </Modal>
  );
}

function CategoryPickerModal({ title, categories, selected, onClose, onSelect }: {
  title: string;
  categories: DocCategory[];
  selected?: string;
  onClose: () => void;
  onSelect: (category: string) => void;
}) {
  return (
    <Modal open title={title} onClose={onClose} size="sm">
      <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
        {categories.map((c) => {
          const Icon = catIconMap[c.icon] ?? FileText;
          const isSelected = selected === c.name;
          return (
            <button
              key={c.name}
              onClick={() => onSelect(c.name)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                isSelected ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200" : "text-ink hover:bg-surface-2"
              )}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${c.color}1a`, color: c.color }}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1">{c.name}</span>
              {isSelected && <Check className="h-4 w-4 text-violet-600" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
      </div>
    </Modal>
  );
}
