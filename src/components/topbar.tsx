"use client";

import { Search, Bell, Plus, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { owner } from "@/lib/data";

export function Topbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Search */}
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          placeholder="Search anything — transactions, notes, journals…"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="btn-brand hidden sm:inline-flex">
          <Plus className="h-4 w-4" /> Quick add
        </button>
        <button
          onClick={() => setDark((d) => !d)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-ink"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-ink">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
        </button>
        <div className="ml-1 flex items-center gap-2.5 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-sm font-semibold text-brand-ink">
            AP
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-ink">{owner.name}</p>
            <p className="text-xs text-faint">{owner.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
