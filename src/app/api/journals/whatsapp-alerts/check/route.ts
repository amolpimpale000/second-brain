import { NextRequest, NextResponse } from "next/server";
import { runWhatsAppAlertChecks } from "@/lib/journal-whatsapp";

export const dynamic = "force-dynamic";

// GET /api/journals/whatsapp-alerts/check?secret=...
// Hit by an hourly Hostinger cron job. Protected by a shared secret so this
// can't be triggered by anyone who finds the URL — it sends real WhatsApp
// messages and reads live journal databases.
export async function GET(request: NextRequest) {
  const expected = process.env.WHATSAPP_ALERTS_CRON_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await runWhatsAppAlertChecks();
    return NextResponse.json({ ok: true, sentCount: sent.length, sent });
  } catch (err) {
    console.error("WhatsApp alert check failed:", err);
    const msg = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
