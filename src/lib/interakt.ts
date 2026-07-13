// ---------------------------------------------------------------------------
// WhatsApp template sends via Interakt, using IJPS Journal's Interakt
// account for every alert regardless of which journal it's about (per
// instruction — one shared WhatsApp sender for all cross-journal alerts).
// Read the journal's own PHP backoffice already sends via Interakt
// (tbl_interakt_log confirms this), so this mirrors that same API.
// ---------------------------------------------------------------------------

const INTERAKT_API_URL = "https://api.interakt.ai/v1/public/message/";

export type InteraktSendResult = {
  ok: boolean;
  httpStatus: number;
  body: string;
  messageId?: string;
};

/** Sends a pre-approved WhatsApp template message via Interakt's public API. */
export async function sendWhatsAppTemplate(
  phone: string,
  countryCode: string,
  templateName: string,
  bodyValues: string[],
  languageCode = "en"
): Promise<InteraktSendResult> {
  const apiKey = process.env.INTERAKT_API_KEY;
  if (!apiKey) {
    return { ok: false, httpStatus: 0, body: "INTERAKT_API_KEY is not configured." };
  }

  try {
    const res = await fetch(INTERAKT_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode,
        phoneNumber: phone,
        type: "Template",
        template: {
          name: templateName,
          languageCode,
          bodyValues,
        },
      }),
    });
    const text = await res.text();
    let messageId: string | undefined;
    try {
      messageId = JSON.parse(text)?.id;
    } catch {
      // non-JSON response — leave messageId undefined
    }
    return { ok: res.ok, httpStatus: res.status, body: text.slice(0, 1000), messageId };
  } catch (err) {
    return { ok: false, httpStatus: 0, body: err instanceof Error ? err.message : "Request failed" };
  }
}
