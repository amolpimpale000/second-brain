import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Hit directly by Hostinger cron jobs with their own ?secret= query param —
// a cron job can't complete an HTTP Basic Auth challenge, so these stay
// outside the site-wide gate below (they're still protected, just by a
// different mechanism suited to machine callers).
const CRON_PATHS = [
  "/api/investments/sync-prices",
  "/api/journals/whatsapp-alerts/check",
  "/api/journals/whatsapp-alerts/trial",
];

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Second Brain"' },
  });
}

// Whole-site login gate. Off (site stays open) until AUTH_USERNAME/
// AUTH_PASSWORD are set as env vars — see Settings page for the reminder.
function isAuthorized(request: NextRequest): boolean {
  const user = process.env.AUTH_USERNAME;
  const pass = process.env.AUTH_PASSWORD;
  if (!user || !pass) return true;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  const decoded = atob(header.slice(6));
  const sep = decoded.indexOf(":");
  if (sep === -1) return false;
  return decoded.slice(0, sep) === user && decoded.slice(sep + 1) === pass;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!CRON_PATHS.some((p) => pathname.startsWith(p)) && !isAuthorized(request)) {
    return unauthorized();
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
