import { NextRequest, NextResponse } from "next/server";
import { syncRevenueSnapshots } from "@/lib/revenue-snapshots-store";

export const dynamic = "force-dynamic";

// GET /api/journals/revenue-sync?secret=...
// Hit by a daily Hostinger cron job. Pulls captured payments from each
// journal's Razorpay account (12-month window), buckets them by month, and
// upserts into razorpay_revenue_snapshots. The dashboard and consolidated
// P&L then read from this cached table instead of hitting Razorpay on every
// page load — accurate revenue (from Razorpay, not the unreliable MySQL
// payment tables) with once-a-day refresh.
export async function GET(request: NextRequest) {
  const expected = process.env.REVENUE_SYNC_CRON_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rowsWritten, journals } = await syncRevenueSnapshots(12);
    return NextResponse.json({ ok: true, rowsWritten, journals });
  } catch (err) {
    console.error("Revenue sync failed:", err);
    const msg = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
