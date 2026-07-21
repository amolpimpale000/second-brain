import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Hit directly by Hostinger cron jobs (their own ?secret= query param) or by
// Interakt's webhook caller — neither can complete a browser-based access
// check, so these stay outside the site-wide gate below (they're still
// protected, just by a different mechanism suited to machine callers).
const CRON_PATHS = [
  "/api/investments/sync-prices",
  "/api/journals/whatsapp-alerts/check",
  "/api/journals/whatsapp-alerts/trial",
  "/api/journals/whatsapp-alerts/webhook",
  "/api/journals/revenue-sync",
];

// The unlock link itself must stay reachable without the cookie it grants —
// it's what sets that cookie in the first place. See /api/auth/unlock.
const PUBLIC_PATHS = ["/api/auth/unlock"];

const ACCESS_COOKIE = "sb_trusted";

function denied() {
  return new NextResponse("This device isn't authorized to view this site.", { status: 403 });
}

// Whole-site access gate: silent — no visible login prompt. A device is
// trusted once it's visited the private unlock link (/api/auth/unlock),
// which sets a long-lived cookie; every other device gets a plain "not
// authorized" response. Off (site stays open) until SITE_ACCESS_TOKEN is
// set as an env var — see Settings page for the reminder.
function isAuthorized(request: NextRequest): boolean {
  const token = process.env.SITE_ACCESS_TOKEN;
  if (!token) return true;
  return request.cookies.get(ACCESS_COOKIE)?.value === token;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const bypassed =
    CRON_PATHS.some((p) => pathname.startsWith(p)) || PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!bypassed && !isAuthorized(request)) {
    return denied();
  }

  const response = await updateSession(request);
  // Keep HTML pages fresh so Hostinger's CDN doesn't serve stale builds after deploy.
  // Static assets under /_next/ keep their immutable long cache from Next.js.
  if (
    !request.nextUrl.pathname.startsWith("/_next/") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    // no-store / no-cache makes CDNs and browsers revalidate every request,
    // preventing stale HTML that references deleted chunk files after a deploy.
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0"
    );
  }
  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static assets & images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
