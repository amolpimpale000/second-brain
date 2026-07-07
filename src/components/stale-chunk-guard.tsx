"use client";

import { useEffect } from "react";

const RELOAD_KEY = "_sb_stale_chunk_reload";

export function StaleChunkGuard() {
  useEffect(() => {
    // Only react to resource-loading errors (capture phase so we see script/link failures).
    const handleError = (event: ErrorEvent | Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isScript = target.tagName === "SCRIPT";
      const isLink = target.tagName === "LINK";
      if (!isScript && !isLink) return;

      const src =
        (target as HTMLScriptElement).src ||
        (target as HTMLLinkElement).href ||
        "";

      // A 404 on a Next.js static chunk almost always means the CDN served
      // stale HTML pointing at a chunk from a previous build.
      if (!src.includes("/_next/static/")) return;

      // Prevent an infinite reload loop.
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, "1");

      // Hard navigation with a cache-busting param forces the CDN/browser to
      // fetch fresh HTML for the current route.
      const url = new URL(window.location.href);
      url.searchParams.set("_cb", Date.now().toString());
      window.location.replace(url.toString());
    };

    window.addEventListener("error", handleError, true);
    return () => window.removeEventListener("error", handleError, true);
  }, []);

  return null;
}
