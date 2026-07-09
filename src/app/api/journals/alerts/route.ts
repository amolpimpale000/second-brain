import { NextResponse } from "next/server";
import { computeJournalAlerts } from "@/lib/journal-alerts";
import { getDismissedKeys } from "@/lib/journal-alerts-store";

export const dynamic = "force-dynamic";

// GET /api/journals/alerts
// Live-computes alerts across all journals, hides dismissed ones, and returns
// the employee roster + effective tracked config the panel needs.
export async function GET() {
  try {
    const [payload, dismissed] = await Promise.all([
      computeJournalAlerts(),
      getDismissedKeys().catch(() => new Set<string>()),
    ]);

    const visible = payload.alerts.filter((a) => !dismissed.has(a.id));

    return NextResponse.json({
      alerts: visible,
      roster: payload.roster,
      tracked: payload.tracked,
      dismissedCount: payload.alerts.length - visible.length,
      generatedAt: payload.generatedAt,
      errors: payload.errors,
    });
  } catch (err) {
    console.error("Compute alerts error:", err);
    const msg = err instanceof Error ? err.message : "Failed to compute alerts";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
