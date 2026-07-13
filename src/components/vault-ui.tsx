"use client";

import { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { cn } from "@/lib/utils";

/* Real brand logo via favicon service, with colored-initial fallback. */
export function BrandLogo({
  domain,
  initial,
  color,
  size = 36,
  rounded = "rounded-lg",
}: {
  domain?: string;
  initial: string;
  color: string;
  size?: number;
  rounded?: string;
}) {
  const [err, setErr] = useState(false);
  if (!domain || err) {
    return (
      <div
        className={cn("grid shrink-0 place-items-center text-xs font-bold text-white", rounded)}
        style={{ width: size, height: size, background: color }}
      >
        {initial}
      </div>
    );
  }
  return (
    <div
      className={cn("grid shrink-0 place-items-center overflow-hidden border border-border bg-white", rounded)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
        onError={() => setErr(true)}
        alt=""
        width={size - 12}
        height={size - 12}
        className="object-contain"
      />
    </div>
  );
}

export function NetworkMark({ network, className }: { network: string; className?: string }) {
  if (network === "VISA") return <SiVisa className={className} />;
  if (network === "Mastercard") return <SiMastercard className={className} />;
  if (network === "Amex") return <SiAmericanexpress className={className} />;
  return <span className="text-[10px] font-extrabold italic tracking-tight">RuPay</span>;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative my-auto max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border bg-card shadow-card-lg animate-fade-up", width)}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Dropdown({
  label,
  options,
  onSelect,
  align = "left",
}: {
  label: string;
  options: string[];
  onSelect: (value: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2"
      >
        {label} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={cn("absolute z-20 mt-1 min-w-[160px] rounded-xl border border-border bg-card p-1 shadow-card-lg", align === "right" ? "right-0" : "left-0")}>
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onSelect(o); setOpen(false); }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-ink"
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/15";
