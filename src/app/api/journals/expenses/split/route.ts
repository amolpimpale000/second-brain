import { NextRequest, NextResponse } from "next/server";
import { addExpense } from "@/lib/journal-expenses-store";
import { GOOGLE_ADS_JOURNAL_CODES } from "@/lib/google-ads";

export const dynamic = "force-dynamic";

const PERIOD_MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 };

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

    const expenses = await Promise.all(
      GOOGLE_ADS_JOURNAL_CODES.map((journalCode) =>
        addExpense({
          journalCode,
          category,
          amount: perJournalAmount,
          date,
          mode: mode || "UPI",
          description: description || "",
          paymentTo: paymentTo || "",
        })
      )
    );

    return NextResponse.json({ expenses, perJournalAmount });
  } catch (err) {
    console.error("Split expense error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create split expense";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
