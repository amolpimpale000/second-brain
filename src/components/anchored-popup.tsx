"use client";

// Anchored popup rendered into document.body via React portal, so it always
// escapes clipping from any ancestor that sets `overflow: hidden` (cards,
// panels, sticky headers, etc). It sits next to a trigger element and
// re-positions itself on scroll/resize.
//
// Replace anywhere a manual `absolute z-50 ...`-style popup was used inside a
// `.relative` parent — that pattern gets visibly cropped when an ancestor
// card rounds its corners with `overflow-hidden`.

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Anchor = "left" | "right";

export function AnchoredPopup({
  open,
  anchorEl,
  onClose,
  children,
  align = "left",
  side = "bottom",
  offsetY = 4,
  zIndex = "z-50",
  className,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
  align?: Anchor;
  side?: "top" | "bottom";
  offsetY?: number;
  zIndex?: string;
  className?: string;
}) {
  const popRef = React.useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  const place = React.useCallback(() => {
    if (!open || !anchorEl) return;
    const r = anchorEl.getBoundingClientRect();
    const pop = popRef.current;
    const popW = pop?.offsetWidth ?? 160;
    const popH = pop?.offsetHeight ?? 0;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    let left: number;
    if (align === "right") left = r.right - popW;
    else left = r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));
    let top: number;
    if (side === "top") top = r.top + scrollY - popH - offsetY;
    else top = r.bottom + scrollY + offsetY;
    setCoords({ top, left });
  }, [open, anchorEl, align, side, offsetY]);

  React.useLayoutEffect(() => {
    place();
  }, [place]);

  React.useEffect(() => {
    if (!open) return;
    const onScroll = () => place();
    const onResize = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={popRef}
        style={coords ? { position: "absolute", top: coords.top, left: coords.left } : { position: "absolute", top: -9999, left: -9999 }}
        className={cn(zIndex, "rounded-xl border border-border bg-card p-1 shadow-card-lg", className)}
        role="menu"
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
