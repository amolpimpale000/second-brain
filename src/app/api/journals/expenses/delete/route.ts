import { NextRequest, NextResponse } from "next/server";
import { deleteExpense } from "@/lib/journal-expenses-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const ok = await deleteExpense(id);
    if (!ok) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete expense error:", err);
    const msg = err instanceof Error ? err.message : "Failed to delete expense";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
