import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getRazorpayIncomeForJournalPeriod, RAZORPAY_JOURNAL_CODES, type RazorpayPeriod } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const VALID_PERIODS: RazorpayPeriod[] = ["this_month", "last_30_days", "this_year", "all_time"];

// Cache per (code, period) so switching back to a period — especially the
// expensive "all_time" — serves instantly instead of re-paging the Razorpay
// API every time. 5-minute freshness is plenty for a collected-income figure.
const cachedIncome = unstable_cache(
  (code: string, period: RazorpayPeriod) => getRazorpayIncomeForJournalPeriod(code, period),
  ["razorpay-income-period"],
  { revalidate: 900 }
);

// GET /api/journals/razorpay?code=IJPS&period=last_30_days
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")?.toUpperCase();
    const period = request.nextUrl.searchParams.get("period") as RazorpayPeriod | null;

    if (!code || !RAZORPAY_JOURNAL_CODES.includes(code)) {
      return NextResponse.json({ error: "Invalid or missing journal code" }, { status: 400 });
    }
    if (!period || !VALID_PERIODS.includes(period)) {
      return NextResponse.json({ error: "Invalid or missing period" }, { status: 400 });
    }

    const income = await cachedIncome(code, period);
    return NextResponse.json(income);
  } catch (err) {
    console.error("Razorpay income error:", err);
    const msg = err instanceof Error ? err.message : "Failed to fetch Razorpay income";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
