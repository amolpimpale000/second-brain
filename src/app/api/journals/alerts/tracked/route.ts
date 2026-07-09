import { NextRequest, NextResponse } from "next/server";
import { setTrackedEmployees } from "@/lib/journal-alerts-store";

export const dynamic = "force-dynamic";

// POST /api/journals/alerts/tracked
//   { journalCode, employeeIds: number[] }
// Sets which employees are tracked for the "no paper in 24h" rule on a journal.
// An empty array means "track nobody"; deleting the row (default) tracks all.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journalCode, employeeIds } = body;
    if (!journalCode || typeof journalCode !== "string") {
      return NextResponse.json({ error: "Missing journalCode" }, { status: 400 });
    }
    if (!Array.isArray(employeeIds)) {
      return NextResponse.json({ error: "employeeIds must be an array" }, { status: 400 });
    }
    const ids = employeeIds.map(Number).filter((n) => Number.isFinite(n));
    await setTrackedEmployees(journalCode, ids);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Set tracked employees error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update tracked employees";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
