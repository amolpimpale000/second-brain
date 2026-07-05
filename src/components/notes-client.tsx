"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText, Pin, LayoutGrid, Bell, Trash2, Plus, Search, Maximize2,
  Lock, Wallet, Briefcase, Lightbulb, Heart, Plane, Folder, GraduationCap, Circle, Layers,
  MoreHorizontal, Pencil, Star, Check, CheckCircle2, RotateCcw, X,
} from "lucide-react";
import type { RichNote, ChecklistItem, Reminder } from "@/lib/data";
import { sampleNotes, sampleReminders, sampleNoteTrash, noteCategories, noteTags } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Modal, Field, inputCls, Dropdown } from "@/components/vault-ui";

/* helpers -------------------------------------------------------------------*/
const catIconMap: Record<string, React.ElementType> = {
  layers: Layers, lock: Lock, wallet: Wallet, briefcase: Briefcase, bulb: Lightbulb,
  heart: Heart, plane: Plane, folder: Folder, cap: GraduationCap, circle: Circle,
};
const noteBg: Record<RichNote["color"], string> = {
  yellow: "bg-[#fdf7db] border-[#f2e9b8]",
  green: "bg-[#e9f9ef] border-[#c9edd6]",
  pink: "bg-[#fdecef] border-[#f6d6dd]",
  white: "bg-card border-border",
};
const catPill: Record<string, string> = {
  Business: "bg-violet-100 text-violet-700",
  Finance: "bg-green-100 text-green-700",
  Travel: "bg-blue-100 text-blue-700",
  Personal: "bg-purple-100 text-purple-700",
  Work: "bg-rose-100 text-rose-700",
  Health: "bg-teal-100 text-teal-700",
  Education: "bg-sky-100 text-sky-700",
  Ideas: "bg-amber-100 text-amber-700",
  Others: "bg-slate-100 text-slate-600",
};
const COLORS: RichNote["color"][] = ["yellow", "green", "pink", "white"];
const colorSwatch: Record<RichNote["color"], string> = {
  yellow: "bg-[#fbe98a]", green: "bg-[#a7e8bf]", pink: "bg-[#f6b8c4]", white: "bg-white border border-border",
};
const uid = () => Math.random().toString(36).slice(2, 9);
const ci = (text: string, done = false): ChecklistItem => ({ id: uid(), text, done });

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
      <button onClick={() => setOpen((o) => !o)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-black/5 hover:text-ink">
        <MoreHorizontal className="h-4 w-4" />
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

/* =========================================================================== */
export function NotesClient() {
  const [notes, setNotes] = usePersist<RichNote[]>("sb.notes", sampleNotes);
  const [reminders, setReminders] = usePersist<Reminder[]>("sb.notes.reminders", sampleReminders);
  const [trash, setTrash] = usePersist<RichNote[]>("sb.notes.trash", sampleNoteTrash);

  const [activeCat, setActiveCat] = useState("All Notes");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Recently Updated");
  const [quick, setQuick] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: "note"; editing?: RichNote } | { type: "trash" } | { type: "reminders" } | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1500); };

  /* derived */
  const catCount = useMemo(() => {
    const m: Record<string, number> = {};
    notes.forEach((n) => { m[n.category] = (m[n.category] || 0) + 1; });
    return m;
  }, [notes]);
  const tagCount = useMemo(() => {
    const m: Record<string, number> = {};
    notes.forEach((n) => n.tags.forEach((t) => { m[t] = (m[t] || 0) + 1; }));
    return m;
  }, [notes]);

  const stats = [
    { label: "Total Notes", value: notes.length, sub: "all saved notes", icon: FileText, tone: "violet" },
    { label: "Pinned Notes", value: notes.filter((n) => n.pinned).length, sub: "kept on top", icon: Pin, tone: "green" },
    { label: "Categories", value: new Set(notes.map((n) => n.category)).size, sub: "in use", icon: LayoutGrid, tone: "amber" },
    { label: "Reminders", value: reminders.filter((r) => !r.done).length, sub: "upcoming reminders", icon: Bell, tone: "blue" },
    { label: "Trash", value: trash.length, sub: "recently deleted", icon: Trash2, tone: "indigo" },
  ];
  const statTone: Record<string, string> = {
    violet: "bg-violet-100 text-violet-600", green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-500", blue: "bg-blue-100 text-blue-600", indigo: "bg-indigo-100 text-indigo-600",
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = notes.filter((n) => {
      const catOk = activeCat === "All Notes" || n.category === activeCat;
      const tagOk = !activeTag || n.tags.includes(activeTag);
      const text = (n.title + " " + (n.body || "") + " " + (n.items?.map((i) => i.text).join(" ") || "")).toLowerCase();
      return catOk && tagOk && (!q || text.includes(q));
    });
    if (sort === "Title (A-Z)") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "Pinned First") list = [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return list;
  }, [notes, activeCat, activeTag, query, sort]);

  /* mutations */
  const saveNote = (n: RichNote) => setNotes((prev) => prev.some((x) => x.id === n.id) ? prev.map((x) => (x.id === n.id ? n : x)) : [n, ...prev]);
  const removeNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) setTrash((t) => [note, ...t]);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    flash("Moved to Trash");
  };
  const restoreNote = (id: string) => {
    const note = trash.find((n) => n.id === id);
    if (note) setNotes((p) => [note, ...p]);
    setTrash((t) => t.filter((n) => n.id !== id));
  };
  const purgeNote = (id: string) => setTrash((t) => t.filter((n) => n.id !== id));
  const togglePin = (id: string) => setNotes((p) => p.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  const toggleStar = (id: string) => setNotes((p) => p.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n)));
  const toggleItem = (noteId: string, itemId: string) =>
    setNotes((p) => p.map((n) => n.id === noteId ? { ...n, items: n.items?.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) } : n));

  const addQuick = () => {
    if (!quick.trim()) return;
    const first = quick.trim().split("\n")[0].slice(0, 40);
    saveNote({ id: uid(), title: first || "Quick note", body: quick.trim(), category: "Others", tags: [], color: "yellow", time: "Just now", pinned: false, starred: false });
    setQuick("");
    flash("Note added");
  };
  const toggleReminder = (id: string) => setReminders((p) => p.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
  const addReminder = (title: string, time: string) => setReminders((p) => [{ id: uid(), title, time: time || "No date", color: "#8b5cf6", done: false }, ...p]);
  const deleteReminder = (id: string) => setReminders((p) => p.filter((r) => r.id !== id));

  const recent = notes.slice(0, 5);

  return (
    <div className="animate-fade-up">
      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        {/* Stats span first two cols */}
        <div className="xl:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className={cn("grid h-9 w-9 place-items-center rounded-xl", statTone[s.tone])}><s.icon className="h-[18px] w-[18px]" /></div>
                </div>
                <p className="mt-3 text-2xl font-bold text-ink">{s.value}</p>
                <p className="mt-0.5 text-xs font-medium text-muted">{s.label}</p>
                <p className="mt-0.5 text-[11px] text-faint">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Notes (right col, row 1) */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><FileText className="h-4 w-4 text-violet-500" /> Quick Notes</h3>
            <button onClick={() => setModal({ type: "note" })} className="text-slate-400 hover:text-ink"><Maximize2 className="h-4 w-4" /></button>
          </div>
          <textarea value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Write a quick note..."
            className="h-20 w-full resize-none rounded-xl border border-border bg-surface-2 p-3 text-sm text-ink placeholder:text-faint focus:border-violet-400 focus:outline-none" />
          <button onClick={addQuick} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-500 py-2.5 text-sm font-semibold text-white hover:bg-violet-600">
            <Plus className="h-4 w-4" /> Add Note
          </button>
        </div>

        {/* LEFT sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="mb-1.5 flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-ink">Categories</p>
              <button onClick={() => setModal({ type: "note" })} className="grid h-6 w-6 place-items-center rounded-lg text-violet-500 hover:bg-violet-50"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="space-y-0.5">
              <CatRow icon={Layers} color="#8b5cf6" name="All Notes" count={notes.length} active={activeCat === "All Notes"} onClick={() => setActiveCat("All Notes")} />
              {noteCategories.map((c) => (
                <CatRow key={c.name} icon={catIconMap[c.icon]} color={c.color} name={c.name} count={catCount[c.name] || 0} active={activeCat === c.name} onClick={() => setActiveCat(c.name)} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="mb-1.5 flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-ink">Tags</p>
              <button className="grid h-6 w-6 place-items-center rounded-lg text-violet-500 hover:bg-violet-50"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="space-y-0.5">
              {noteTags.map((t) => {
                const active = activeTag === t.name;
                return (
                  <button key={t.name} onClick={() => setActiveTag(active ? null : t.name)}
                    className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors", active ? "bg-violet-50 font-medium text-violet-700" : "text-muted hover:bg-surface-2")}>
                    <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                    <span>{t.name}</span>
                    <span className="ml-auto text-[11px] text-faint">{tagCount[t.name] || 0}</span>
                  </button>
                );
              })}
              <button className="mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-violet-500 hover:bg-violet-50"><Plus className="h-3.5 w-3.5" /> Add Tag</button>
            </div>
          </div>
        </aside>

        {/* MIDDLE */}
        <div className="min-w-0 space-y-4">
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes..."
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-faint shadow-card focus:border-violet-400 focus:outline-none" />
            </div>
            <Dropdown label={activeCat} options={["All Notes", ...noteCategories.map((c) => c.name)]} onSelect={setActiveCat} />
            <Dropdown label={`Sort: ${sort}`} options={["Recently Updated", "Title (A-Z)", "Pinned First"]} onSelect={setSort} />
            <button onClick={() => setModal({ type: "note" })} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-600">
              <Plus className="h-4 w-4" /> New Note
            </button>
          </div>

          {/* notes masonry */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-16 text-center shadow-card">
              <p className="text-sm text-muted">No notes here. <button onClick={() => setModal({ type: "note" })} className="font-medium text-violet-600 hover:underline">Create one</button></p>
            </div>
          ) : (
            <div className="gap-4 [column-gap:1rem] sm:columns-2 xl:columns-3">
              {filtered.map((n) => (
                <NoteCard key={n.id} note={n} onToggleItem={toggleItem} onStar={() => toggleStar(n.id)} onPin={() => togglePin(n.id)}
                  onEdit={() => setModal({ type: "note", editing: n })} onDelete={() => removeNote(n.id)} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT sidebar */}
        <aside className="space-y-4">
          {/* Reminders */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Bell className="h-4 w-4 text-violet-500" /> Reminders</h3>
              <button onClick={() => setModal({ type: "reminders" })} className="text-xs font-medium text-violet-600 hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {reminders.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium leading-tight", r.done ? "text-faint line-through" : "text-ink")}>{r.title}</p>
                    <p className="text-xs text-faint">{r.time}</p>
                  </div>
                  <button onClick={() => toggleReminder(r.id)} className="mt-0.5 shrink-0">
                    {r.done ? <CheckCircle2 className="h-4 w-4 text-violet-500" /> : <Circle className="h-4 w-4 text-slate-300 hover:text-violet-500" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notes */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Recent Notes</h3>
              <span className="text-xs font-medium text-violet-600">Latest</span>
            </div>
            <div className="space-y-3">
              {recent.map((n) => (
                <button key={n.id} onClick={() => setModal({ type: "note", editing: n })} className="flex w-full items-center gap-2.5 text-left">
                  <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", noteBg[n.color])}><FileText className="h-3.5 w-3.5 text-muted" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                    <p className="text-xs text-faint">{n.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trash */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-ink"><Trash2 className="h-4 w-4 text-violet-500" /> Trash</h3>
              <button onClick={() => setModal({ type: "trash" })} className="text-xs font-medium text-violet-600 hover:underline">View All</button>
            </div>
            <button onClick={() => setModal({ type: "trash" })} className="flex items-center gap-2 py-1 text-sm text-muted hover:text-ink">
              <Trash2 className="h-4 w-4 text-faint" /> {trash.length} note{trash.length !== 1 ? "s" : ""}
            </button>
          </div>
        </aside>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-card-lg">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400" /> {toast}</span>
        </div>
      )}

      {/* modals */}
      {modal?.type === "note" && (
        <NoteModal editing={modal.editing} onClose={() => setModal(null)} onSave={(n) => { saveNote(n); setModal(null); flash(modal.editing ? "Note updated" : "Note created"); }} />
      )}
      {modal?.type === "trash" && (
        <Modal open title="Trash" subtitle={`${trash.length} deleted note(s)`} onClose={() => setModal(null)}>
          {trash.length === 0 ? <p className="py-8 text-center text-sm text-faint">Trash is empty.</p> : (
            <div className="space-y-2">
              {trash.map((n) => (
                <div key={n.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-lg", noteBg[n.color])}><FileText className="h-4 w-4 text-muted" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{n.title}</p><p className="text-xs text-faint">{n.category} · {n.time}</p></div>
                  <button onClick={() => restoreNote(n.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"><RotateCcw className="h-3.5 w-3.5" /> Restore</button>
                  <button onClick={() => purgeNote(n.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => { setTrash([]); flash("Trash emptied"); }} className="mt-2 w-full rounded-xl border border-border py-2 text-sm font-medium text-red-500 hover:bg-red-50">Empty Trash</button>
            </div>
          )}
        </Modal>
      )}
      {modal?.type === "reminders" && (
        <RemindersModal reminders={reminders} onClose={() => setModal(null)} onToggle={toggleReminder} onAdd={addReminder} onDelete={deleteReminder} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ note card */
function NoteCard({ note, onToggleItem, onStar, onPin, onEdit, onDelete }: {
  note: RichNote; onToggleItem: (n: string, i: string) => void; onStar: () => void; onPin: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const done = note.items?.filter((i) => i.done).length ?? 0;
  const total = note.items?.length ?? 0;
  return (
    <div className={cn("mb-4 break-inside-avoid rounded-2xl border p-4 shadow-card", noteBg[note.color])}>
      <div className="mb-1.5 flex items-start justify-between">
        {note.pinned ? <Pin className="h-4 w-4 rotate-45 fill-amber-400 text-amber-400" /> : <span />}
        <Menu items={[
          { label: "Edit", icon: Pencil, onClick: onEdit },
          { label: note.pinned ? "Unpin" : "Pin", icon: Pin, onClick: onPin },
          { label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
        ]} />
      </div>

      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-ink">{note.title}</h4>
        {note.listStyle === "check" && total > 0 && (
          <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-medium text-muted">{done}/{total}</span>
        )}
      </div>

      {note.body && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">{note.body}</p>}
      {note.itemsLabel && <p className="mt-2 text-sm font-semibold text-ink">{note.itemsLabel}</p>}

      {note.items && note.listStyle === "check" && (
        <div className="mt-2 space-y-1.5">
          {note.items.map((i) => (
            <button key={i.id} onClick={() => onToggleItem(note.id, i.id)} className="flex w-full items-center gap-2 text-left text-sm">
              <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded border", i.done ? "border-green-500 bg-green-500 text-white" : "border-slate-300 bg-white")}>
                {i.done && <Check className="h-3 w-3" />}
              </span>
              <span className={cn(i.done ? "text-faint line-through" : "text-muted")}>{i.text}</span>
            </button>
          ))}
        </div>
      )}
      {note.items && note.listStyle === "bullet" && (
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {note.items.map((i) => (
            <li key={i.id} className="flex items-start gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{i.text}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-end justify-between">
        <div>
          <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium", catPill[note.category] || catPill.Others)}>{note.category}</span>
          <p className="mt-1.5 text-xs text-faint">{note.time}</p>
        </div>
        <button onClick={onStar}><Star className={cn("h-4 w-4", note.starred ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-400")} /></button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ note modal */
function NoteModal({ editing, onClose, onSave }: { editing?: RichNote; onClose: () => void; onSave: (n: RichNote) => void }) {
  const isCheck = editing?.listStyle === "check";
  const [kind, setKind] = useState<"text" | "checklist">(isCheck ? "checklist" : "text");
  const [f, setF] = useState<RichNote>(
    editing ?? { id: uid(), title: "", body: "", category: "Personal", tags: [], color: "yellow", time: "Just now", pinned: false, starred: false }
  );
  const [items, setItems] = useState<ChecklistItem[]>(editing?.items ?? [ci("")]);
  const [tagText, setTagText] = useState((editing?.tags ?? []).join(", "));
  const set = (p: Partial<RichNote>) => setF((s) => ({ ...s, ...p }));

  const submit = () => {
    if (!f.title.trim()) return;
    const tags = tagText.split(",").map((t) => t.trim()).filter(Boolean);
    if (kind === "checklist") {
      const clean = items.filter((i) => i.text.trim());
      onSave({ ...f, tags, listStyle: "check", items: clean.length ? clean : [ci("New item")], body: undefined });
    } else {
      onSave({ ...f, tags, listStyle: undefined, items: undefined });
    }
  };

  return (
    <Modal open title={editing ? "Edit Note" : "New Note"} onClose={onClose} size="md">
      <div className="space-y-3">
        <Field label="Title"><input className={inputCls} value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Note title" /></Field>

        <div className="flex gap-1.5 rounded-xl bg-surface-2 p-1">
          {(["text", "checklist"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={cn("flex-1 rounded-lg py-1.5 text-sm font-medium capitalize", kind === k ? "bg-card text-ink shadow-sm" : "text-muted")}>
              {k === "checklist" ? "Checklist / Tasks" : "Text"}
            </button>
          ))}
        </div>

        {kind === "text" ? (
          <Field label="Content"><textarea className={cn(inputCls, "h-28 resize-none")} value={f.body ?? ""} onChange={(e) => set({ body: e.target.value })} placeholder="Write your note..." /></Field>
        ) : (
          <div>
            <span className="mb-1 block text-xs font-medium text-muted">Tasks</span>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={it.id} className="flex items-center gap-2">
                  <button onClick={() => setItems((p) => p.map((x) => (x.id === it.id ? { ...x, done: !x.done } : x)))} className={cn("grid h-5 w-5 shrink-0 place-items-center rounded border", it.done ? "border-green-500 bg-green-500 text-white" : "border-slate-300")}>{it.done && <Check className="h-3 w-3" />}</button>
                  <input className={inputCls} value={it.text} onChange={(e) => setItems((p) => p.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))} placeholder={`Task ${idx + 1}`} />
                  <button onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-faint hover:text-red-500"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button onClick={() => setItems((p) => [...p, ci("")])} className="mt-2 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline"><Plus className="h-4 w-4" /> Add task</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className={inputCls} value={f.category} onChange={(e) => set({ category: e.target.value })}>
              {noteCategories.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Tags (comma separated)"><input className={inputCls} value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Important, Ideas" /></Field>
        </div>

        <Field label="Colour">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => set({ color: c })} className={cn("h-8 w-8 rounded-lg", colorSwatch[c], f.color === c ? "ring-2 ring-violet-500 ring-offset-2" : "")} />
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">Cancel</button>
        <button onClick={submit} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600">{editing ? "Save changes" : "Create note"}</button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------- reminders modal */
function RemindersModal({ reminders, onClose, onToggle, onAdd, onDelete }: {
  reminders: Reminder[]; onClose: () => void; onToggle: (id: string) => void; onAdd: (t: string, time: string) => void; onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  return (
    <Modal open title="Reminders & Tasks" subtitle={`${reminders.filter((r) => !r.done).length} pending`} onClose={onClose}>
      <div className="mb-4 flex gap-2">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New reminder…" />
        <input className={cn(inputCls, "max-w-[140px]")} value={time} onChange={(e) => setTime(e.target.value)} placeholder="When" />
        <button onClick={() => { if (title.trim()) { onAdd(title.trim(), time.trim()); setTitle(""); setTime(""); } }} className="shrink-0 rounded-xl bg-violet-500 px-3 text-sm font-semibold text-white hover:bg-violet-600">Add</button>
      </div>
      <div className="space-y-2">
        {reminders.map((r) => (
          <div key={r.id} className="flex items-center gap-2.5 rounded-xl border border-border p-3">
            <button onClick={() => onToggle(r.id)}>{r.done ? <CheckCircle2 className="h-5 w-5 text-violet-500" /> : <Circle className="h-5 w-5 text-slate-300 hover:text-violet-500" />}</button>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", r.done ? "text-faint line-through" : "text-ink")}>{r.title}</p>
              <p className="text-xs text-faint">{r.time}</p>
            </div>
            <button onClick={() => onDelete(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* helper row */
function CatRow({ icon: Icon, color, name, count, active, onClick }: { icon: React.ElementType; color: string; name: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors", active ? "bg-violet-50 font-medium text-violet-700" : "text-muted hover:bg-surface-2")}>
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <span className="truncate">{name}</span>
      <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-medium", active ? "bg-violet-100 text-violet-700" : "bg-surface-2 text-faint")}>{count}</span>
    </button>
  );
}
