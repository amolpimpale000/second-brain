"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  StickyNote,
  CheckSquare,
  KeyRound,
  Settings,
  ChevronsLeft,
  FolderOpen,
  BookOpen,
  ChevronDown,
  X,
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
  ]},
  { section: "Money", items: [
    { href: "/finances", label: "Personal Finances", icon: Wallet },
    { href: "/investments", label: "Investments", icon: TrendingUp },
  ]},
  { section: "Business", items: [
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

function NavList({
  collapsed,
  expanded,
  toggle,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  expanded: string[];
  toggle: (href: string) => void;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
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
                      onClick={onNavigate}
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
                            onClick={onNavigate}
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
  );
}

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
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

  // Mobile drawer closes on route change.
  useEffect(() => {
    onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggle = (href: string) =>
    setExpanded((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface px-3 py-5 transition-all lg:flex",
          collapsed ? "w-[76px]" : "w-[248px]"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="Second Brain" className="h-9 w-9 shrink-0 rounded-xl" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">Second Brain</p>
              <p className="truncate text-xs text-faint">Command Center</p>
            </div>
          )}
        </div>

        <NavList collapsed={collapsed} expanded={expanded} toggle={toggle} pathname={pathname} />

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

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto border-r border-border bg-surface px-3 py-5 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 px-2 pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.png" alt="Second Brain" className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">Second Brain</p>
            <p className="truncate text-xs text-faint">Command Center</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <NavList collapsed={false} expanded={expanded} toggle={toggle} pathname={pathname} onNavigate={onCloseMobile} />

        <div className="mt-4 space-y-1 border-t border-border pt-3">
          <Link href="/settings" className="nav-item" onClick={onCloseMobile} title="Settings">
            <Settings className="h-[18px] w-[18px] shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
