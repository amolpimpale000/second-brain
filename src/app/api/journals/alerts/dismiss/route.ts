import { NextRequest, NextResponse } from "next/server";
import { dismissAlert, undismissAlert, clearDismissals } from "@/lib/journal-alerts-store";

export const dynamic = "force-dynamic";

// POST /api/journals/alerts/dismiss
//   { alertKey, rule, journalCode }        -> dismiss one
//   { alertKey, undo: true }               -> restore one
//   { clearAll: true }                     -> restore every dismissed alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.clearAll) {
      await clearDismissals();
      return NextResponse.json({ ok: true });
    }

    const { alertKey, rule, journalCode, undo } = body;
    if (!alertKey || typeof alertKey !== "string") {
      return NextResponse.json({ error: "Missing alertKey" }, { status: 400 });
    }

    if (undo) {
      await undismissAlert(alertKey);
    } else {
      await dismissAlert(alertKey, rule || "", journalCode || "");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dismiss alert error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update dismissal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
