"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Landmark,
  Target,
  Briefcase,
  StickyNote,
  CheckSquare,
  KeyRound,
  BarChart3,
  Settings,
  Sparkles,
  ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { section: "Overview", items: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analytics", label: "Business Analytics", icon: BarChart3 },
  ]},
  { section: "Money", items: [
    { href: "/finances", label: "Finances", icon: Wallet },
    { href: "/investments", label: "Investments", icon: TrendingUp },
    { href: "/loans", label: "Loans", icon: Landmark },
    { href: "/goals", label: "Savings Goals", icon: Target },
  ]},
  { section: "Business", items: [
    { href: "/businesses", label: "Journals", icon: Briefcase },
  ]},
  { section: "Life", items: [
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/vault", label: "Password Vault", icon: KeyRound },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface px-3 py-5 transition-all lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-brand">
          <Sparkles className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Second Brain</p>
            <p className="truncate text-xs text-faint">Command Center</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section}>
            {!collapsed && <p className="label mb-1.5 px-3">{group.section}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-item", active && "nav-item-active", collapsed && "justify-center")}
                    title={item.label}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand-ink")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-4 space-y-1 border-t border-border pt-3">
        <Link href="/settings" className={cn("nav-item", collapsed && "justify-center")} title="Settings">
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn("nav-item w-full", collapsed && "justify-center")}
        >
          <ChevronsLeft className={cn("h-[18px] w-[18px] shrink-0 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
