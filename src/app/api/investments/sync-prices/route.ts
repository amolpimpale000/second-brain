import { NextRequest, NextResponse } from "next/server";
import { runInvestmentPriceSync } from "@/lib/investment-sync";

export const dynamic = "force-dynamic";

// GET /api/investments/sync-prices?secret=...
// Meant to be hit by a Hostinger cron job. Protected by a shared secret since
// it writes to finance_investments (refreshed current_value, and SIP-driven
// quantity/invested increases).
export async function GET(request: NextRequest) {
  const expected = process.env.INVESTMENT_SYNC_CRON_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const log = await runInvestmentPriceSync();
    return NextResponse.json({ ok: true, count: log.length, log });
  } catch (err) {
    console.error("Investment price sync failed:", err);
    const msg = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
