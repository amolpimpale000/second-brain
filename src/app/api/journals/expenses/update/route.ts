import { NextRequest, NextResponse } from "next/server";
import { updateExpense } from "@/lib/journal-expenses-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...patch } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (patch.amount != null) {
      const numAmount = Number(patch.amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      patch.amount = numAmount;
    }

    const expense = await updateExpense(id, patch);
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ expense });
  } catch (err) {
    console.error("Update expense error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update expense";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
