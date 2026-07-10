import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/interakt";

export const dynamic = "force-dynamic";

// POST /api/journals/whatsapp-alerts/trial
// Manual trial-send for verifying a template works, bypassing the dedup
// store entirely. Same shared-secret protection as the cron check route.
// Body: { secret, phone?, countryCode?, template, bodyValues, languageCode? }
export async function POST(request: NextRequest) {
  const expected = process.env.WHATSAPP_ALERTS_CRON_SECRET;
  const body = await request.json();
  if (!expected || body.secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone = "9172532920", countryCode = "+91", template, bodyValues = [], languageCode } = body;
  if (!template) {
    return NextResponse.json({ error: "Missing template" }, { status: 400 });
  }

  const result = await sendWhatsAppTemplate(phone, countryCode, template, bodyValues, languageCode || "en");
  return NextResponse.json(result);
}
