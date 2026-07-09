// Generic loading skeleton shown instantly by Next.js while a route's async
// server component fetches data. Layout (sidebar/topbar) stays mounted —
// only this content area appears, so navigation feels immediate.
export function PageSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[20px] border border-border bg-card p-4">
            <div className="h-3 w-1/2 rounded bg-surface-2" />
            <div className="mt-4 h-5 w-2/3 rounded bg-surface-2" />
            <div className="mt-3 h-3 w-1/3 rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="h-64 rounded-[20px] border border-border bg-card p-5 xl:col-span-1">
            <div className="h-4 w-1/3 rounded bg-surface-2" />
            <div className="mt-5 h-40 rounded-xl bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
