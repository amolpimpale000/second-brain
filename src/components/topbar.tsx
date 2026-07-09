"use client";

import { Search, Bell, Plus, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { owner } from "@/lib/data";
import { cn } from "@/lib/utils";

const quickLinks = [
  { label: "Transaction", href: "/finances" },
  { label: "Expense", href: "/journal-management?addExpense=1" },
  { label: "Note", href: "/notes" },
  { label: "Task", href: "/tasks" },
  { label: "Goal", href: "/finances?quickAdd=goal" },
];

export function Topbar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

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
        <div className="relative hidden sm:block" ref={ref}>
          <button onClick={() => setOpen(!open)} className="btn-brand inline-flex">
            <Plus className="h-4 w-4" /> Quick add <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-40 mt-2 w-40 rounded-xl border border-border bg-card p-1 shadow-card-lg">
              {quickLinks.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
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
