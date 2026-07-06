"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  FolderOpen,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { href: string; label: string }[];
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const nav: NavSection[] = [
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
    { href: "/journal-management", label: "Journal Management", icon: BookOpen,
      children: [
        { href: "/journals/ijps", label: "IJPS" },
        { href: "/journals/ijsrt", label: "IJSRT" },
        { href: "/journals/ijmps", label: "IJMPS" },
        { href: "/journals/ijes", label: "IJES" },
        { href: "/journals/jps", label: "JPS" },
      ],
    },
  ]},
  { section: "Life", items: [
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/documents", label: "Documents", icon: FolderOpen },
    { href: "/vault", label: "Password Vault", icon: KeyRound },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    if (pathname.startsWith("/journals") || pathname === "/journal-management") {
      setExpanded((prev) =>
        prev.includes("/journal-management") ? prev : [...prev, "/journal-management"]
      );
    }
  }, [pathname]);

  const toggle = (href: string) =>
    setExpanded((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );

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
                const isParentActive = pathname === item.href;
                const isChildActive = item.children?.some((c) => pathname === c.href) ?? false;
                const active = isParentActive || isChildActive;
                const isExpanded = expanded.includes(item.href);
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.href}>
                    {/* Parent item: icon + label is a link, chevron toggles children */}
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className={cn(
                          "nav-item flex-1",
                          active && "nav-item-active",
                          collapsed && "justify-center"
                        )}
                        title={item.label}
                      >
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand-ink")} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && !hasChildren && active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                        )}
                      </Link>
                      {/* Separate chevron toggle for expanding children */}
                      {hasChildren && !collapsed && (
                        <button
                          onClick={() => toggle(item.href)}
                          className="mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-muted transition-colors"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {/* Sub-items */}
                    {hasChildren && !collapsed && isExpanded && (
                      <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-border pl-3">
                        {item.children!.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink",
                                childActive && "bg-surface-2 text-ink font-semibold"
                              )}
                            >
                              <span className="truncate">{child.label}</span>
                              {childActive && (
                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
