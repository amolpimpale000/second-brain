import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  // Keep HTML pages fresh so Hostinger's CDN doesn't serve stale builds after deploy.
  // Static assets under /_next/ keep their immutable long cache from Next.js.
  if (!request.nextUrl.pathname.startsWith("/_next/") && !request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate, s-maxage=60");
  }
  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static assets & images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
