import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { updateDeliveryStatus } from "@/lib/journal-whatsapp-store";

export const dynamic = "force-dynamic";

// POST /api/journals/whatsapp-alerts/webhook
// Called by Interakt (not by us) whenever a sent template message's status
// changes — Sent / Delivered / Read / Failed. This is how we find out
// whether an alert actually reached WhatsApp, since the send API only
// confirms Interakt *queued* it. Configure this URL + a shared secret in
// Interakt's Developer Settings > Webhooks (API-sent messages).
function isValidSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const secret = process.env.INTERAKT_WEBHOOK_SECRET;

  if (secret) {
    const signature = request.headers.get("interakt-signature");
    if (!isValidSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("INTERAKT_WEBHOOK_SECRET not set — accepting webhook without signature verification.");
  }

  try {
    const payload = JSON.parse(rawBody);
    const messageId: string | undefined = payload?.data?.message?.id;
    const status: string | undefined = payload?.data?.message?.message_status;
    if (messageId && status) {
      await updateDeliveryStatus(messageId, status).catch((e) => {
        console.error("Failed to record WhatsApp delivery status:", e instanceof Error ? e.message : e);
      });
    }
  } catch (err) {
    console.error("WhatsApp webhook payload parse failed:", err);
  }

  return NextResponse.json({ ok: true });
}
