import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let queryMs = -1;
  let queryError: string | null = null;
  try {
    const { createServerClient } = await import("@supabase/ssr");
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "placeholder-anon-key",
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const t0 = Date.now();
    const { error } = await client.from("tasks").select("*").order("position");
    queryMs = Date.now() - t0;
    if (error) queryError = error.message;
  } catch (err) {
    queryError = err instanceof Error ? err.message : String(err);
    queryMs = Date.now() - started;
  }

  return NextResponse.json({
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    hasSupabaseUrlFallback: Boolean(process.env.SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    urlPrefix: (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").slice(0, 20),
    queryMs,
    queryError,
    totalMs: Date.now() - started,
  });
}
