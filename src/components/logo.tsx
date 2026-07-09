"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   Logo component — three usage modes (mutually exclusive, priority order):

   1. src prop  → direct path to a local image (e.g. /journal-logos/ijps.png).
                  Never fails; no fallback needed.
   2. domain prop → fetches from Clearbit → Google favicon → monogram fallback.
                  Used for stock/investment holdings where domains vary.
   3. Neither    → monogram fallback (same as domain failure).

   Shared by Investments, Journal Management, and any future pages.
   ═══════════════════════════════════════════════════════════════════════════ */

const MONO = ["#6366f1", "#22c55e", "#0ea5e9", "#f59e0b", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6"];
export function monoColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return MONO[h % MONO.length];
}

export function Logo({ src, domain, label, size = 36, rounded = "rounded-xl" }: {
  src?: string; domain?: string; label: string; size?: number; rounded?: string;
}) {
  const letter = (label.trim()[0] || "?").toUpperCase();

  // Mode 1: explicit local src — render immediately, no state needed
  if (src) {
    return (
      <div className={cn("grid shrink-0 place-items-center overflow-hidden border border-border/60 bg-white", rounded)} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} width={size} height={size} className="h-full w-full object-contain p-0.5" referrerPolicy="no-referrer" />
      </div>
    );
  }

  // Mode 2: domain-based (Clearbit → Google favicon → monogram fallback)
  const [stage, setStage] = useState(0);
  useEffect(() => setStage(0), [domain]);
  if (!domain || stage >= 2) {
    return (
      <div className={cn("grid shrink-0 place-items-center font-bold text-white", rounded)} style={{ width: size, height: size, background: monoColor(label), fontSize: size * 0.42 }}>
        {letter}
      </div>
    );
  }
  const imgSrc = stage === 0 ? `https://logo.clearbit.com/${domain}` : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden border border-border/60 bg-white", rounded)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt={label} width={size} height={size} className="h-full w-full object-contain p-0.5" onError={() => setStage((s) => s + 1)} referrerPolicy="no-referrer" />
    </div>
  );
}
