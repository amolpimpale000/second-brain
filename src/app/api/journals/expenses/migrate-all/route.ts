import { NextResponse } from "next/server";
import { readAllExpenses, addExpense, deleteExpense } from "@/lib/journal-expenses-store";
import { GOOGLE_ADS_JOURNAL_CODES } from "@/lib/google-ads";

export const dynamic = "force-dynamic";

// One-time migration: the "ALL" (Shared/Combined) journalCode sentinel is being
// retired now that shared costs are split into 5 real per-journal entries at
// creation time. This backfills any existing "ALL" entries the same way, so
// no previously-entered expense silently disappears from the expense journal.
export async function POST() {
  const all = await readAllExpenses();
  const toMigrate = all.filter((e) => e.journalCode === "ALL");
  const migrated = [];

  for (const e of toMigrate) {
    const perJournalAmount = Math.round((e.amount / GOOGLE_ADS_JOURNAL_CODES.length) * 100) / 100;
    const created = await Promise.all(
      GOOGLE_ADS_JOURNAL_CODES.map((journalCode) =>
        addExpense({
          journalCode,
          category: e.category,
          amount: perJournalAmount,
          date: e.date,
          mode: e.mode,
          description: e.description,
          paymentTo: e.paymentTo,
          billUrl: e.billUrl,
          billName: e.billName,
        })
      )
    );
    await deleteExpense(e.id);
    migrated.push({ original: e, createdCount: created.length, perJournalAmount });
  }

  return NextResponse.json({ migratedCount: toMigrate.length, migrated });
}
