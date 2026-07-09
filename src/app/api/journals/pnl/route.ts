import { NextRequest, NextResponse } from "next/server";
import { getConsolidatedPnL } from "@/lib/consolidated-pnl";

export const dynamic = "force-dynamic";

// GET /api/journals/pnl?months=12
// Consolidated month-by-month P&L across all journals (income = Razorpay,
// expenses = tracked + Google Ads). Loaded client-side so the pages that host
// it stay fast; the underlying computation is cached 30 min.
export async function GET(request: NextRequest) {
  try {
    const monthsParam = Number(request.nextUrl.searchParams.get("months") || "12");
    const months = Number.isFinite(monthsParam) ? Math.min(24, Math.max(1, monthsParam)) : 12;
    const pnl = await getConsolidatedPnL(months);
    return NextResponse.json({ pnl });
  } catch (err) {
    console.error("Consolidated P&L error:", err);
    const msg = err instanceof Error ? err.message : "Failed to compute consolidated P&L";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
