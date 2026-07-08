import { NextRequest, NextResponse } from "next/server";
import { getGoogleAdsSpend } from "@/lib/google-ads";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const month = request.nextUrl.searchParams.get("month") || undefined;
    const spend = await getGoogleAdsSpend(month);
    return NextResponse.json(spend);
  } catch (err) {
    console.error("Google Ads spend lookup error:", err);
    const msg = err instanceof Error ? err.message : "Failed to fetch Google Ads spend";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
