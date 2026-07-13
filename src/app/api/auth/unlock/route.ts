import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/auth/unlock?token=... — visit once per device (PC, phone, ...) to
// grant silent, passwordless access. Sets a long-lived cookie that
// middleware.ts checks; once set, no login prompt ever appears on that
// device again. Any device without the cookie gets a plain "not authorized"
// response instead — see middleware.ts.
export async function GET(request: NextRequest) {
  const expected = process.env.SITE_ACCESS_TOKEN;
  const provided = request.nextUrl.searchParams.get("token");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("sb_trusted", expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    path: "/",
  });
  return response;
}
