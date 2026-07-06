import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — reports env var PRESENCE only (never values/secrets).
export async function GET() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const names = Object.keys(process.env)
    .filter((n) => /SUPABASE|SERVICE_ROLE|NEXT_PUBLIC|DOCUMENT/i.test(n))
    .sort();
  return NextResponse.json({
    hasServiceKey: !!k,
    serviceKeyLength: k ? k.length : 0,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    matchingEnvVarNames: names,
  });
}
