import { NextRequest, NextResponse } from "next/server";
import { listExpenses, addExpense } from "@/lib/journal-expenses-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Missing journal code" }, { status: 400 });
    const expenses = await listExpenses(code);
    return NextResponse.json({ expenses });
  } catch (err) {
    console.error("List expenses error:", err);
    const msg = err instanceof Error ? err.message : "Failed to list expenses";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journalCode, category, amount, date, mode, description, paymentTo, billUrl, billName } = body;

    if (!journalCode || !category || !amount || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const expense = await addExpense({
      journalCode,
      category,
      amount: numAmount,
      date,
      mode: mode || "UPI",
      description: description || "",
      paymentTo: paymentTo || "",
      billUrl,
      billName,
    });

    return NextResponse.json({ expense });
  } catch (err) {
    console.error("Add expense error:", err);
    const msg = err instanceof Error ? err.message : "Failed to add expense";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
