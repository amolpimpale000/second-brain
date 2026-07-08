import { NextRequest, NextResponse } from "next/server";
import { addExpenses } from "@/lib/journal-expenses-store";
import { GOOGLE_ADS_JOURNAL_CODES } from "@/lib/google-ads";

export const dynamic = "force-dynamic";

const PERIOD_MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** "2026-07-08" + 2 -> "2026-09-08" (clamped to the target month's last day). */
function shiftMonth(dateStr: string, monthOffset: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const targetYear = y + Math.floor((m - 1 + monthOffset) / 12);
  const targetMonth = ((m - 1 + monthOffset) % 12 + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return new Date(Date.UTC(targetYear, targetMonth, day)).toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, totalAmount, period, date, mode, description, paymentTo } = body;

    if (!category || !totalAmount || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const numTotal = Number(totalAmount);
    if (!Number.isFinite(numTotal) || numTotal <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }
    const periodMonths = PERIOD_MONTHS[period] ?? 1;
    const journalCount = GOOGLE_ADS_JOURNAL_CODES.length;
    const perJournalAmount = Math.round((numTotal / periodMonths / journalCount) * 100) / 100;
    if (perJournalAmount <= 0) {
      return NextResponse.json({ error: "Split amount rounds to zero — increase the total" }, { status: 400 });
    }

    // A quarterly/yearly shared cost is amortized across every month it
    // covers, not just the month it was entered in — so it shows up in the
    // expense journal for each of those months, for every journal.
    const monthDates = Array.from({ length: periodMonths }, (_, i) => shiftMonth(date, i));
    const inputs = GOOGLE_ADS_JOURNAL_CODES.flatMap((journalCode) =>
      monthDates.map((monthDate) => ({
        journalCode,
        category,
        amount: perJournalAmount,
        date: monthDate,
        mode: mode || "UPI",
        description: description || "",
        paymentTo: paymentTo || "",
      }))
    );

    const expenses = await addExpenses(inputs);

    return NextResponse.json({ expenses, perJournalAmount, monthsCovered: periodMonths });
  } catch (err) {
    console.error("Split expense error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create split expense";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
