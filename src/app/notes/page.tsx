import { Pin, Plus, StickyNote } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import type { Note } from "@/lib/data";
import { getNotes } from "@/lib/queries";

export default async function NotesPage() {
  const notes = await getNotes();
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Notes"
        subtitle="Ideas, strategy, and everything worth remembering."
        action={<button className="btn-brand"><Plus className="h-4 w-4" /> New note</button>}
      />

      {pinned.length > 0 && (
        <div>
          <p className="label mb-3 flex items-center gap-1.5"><Pin className="h-3.5 w-3.5" /> Pinned</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pinned.map((n) => <NoteCard key={n.id} n={n} />)}
          </div>
        </div>
      )}

      <div>
        <p className="label mb-3 flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" /> All notes</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((n) => <NoteCard key={n.id} n={n} />)}
        </div>
      </div>
    </div>
  );
}

function NoteCard({ n }: { n: Note }) {
  return (
    <Card className="group card-pad cursor-pointer transition-shadow hover:shadow-card-lg">
      <div className="flex items-start justify-between gap-2">
        <span
          className="chip"
          style={{ background: "var(--surface-2)", color: n.color }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: n.color }} />
          {n.tag}
        </span>
        {n.pinned && <Pin className="h-4 w-4 text-faint" />}
      </div>
      <h3 className="mt-3 font-semibold text-ink">{n.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-muted">{n.preview}</p>
      <p className="mt-4 text-xs text-faint">Updated {n.updated}</p>
    </Card>
  );
}
