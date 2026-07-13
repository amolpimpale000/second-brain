import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Dedup store for WhatsApp alerts sent via Interakt (journal-whatsapp.ts).
// Two send patterns share one table:
//
//   - One-shot events (new plagiarism submission, an AI-calling failure
//     streak) — send once per stable alert_key, never again.
//   - Persistent-condition reminders (Google Ads balance still under the
//     threshold) — resend at most once per `cooldownHours`, keyed by a
//     condition key that doesn't change while the condition persists.
//
// Supabase Postgres, this app's own table — never the journal DBs.
// ---------------------------------------------------------------------------

const TABLE = "journal_whatsapp_sent";

let _client: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`WhatsApp send store is not configured (url:${!!url} key:${!!key}).`);
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

/**
 * Returns true if this alert_key should be sent now: either it has never
 * been sent, or (when cooldownHours is given) it was last sent more than
 * cooldownHours ago. Pass cooldownHours = null for strictly one-shot alerts.
 */
export async function shouldSendWhatsApp(alertKey: string, cooldownHours: number | null): Promise<boolean> {
  const sb = admin();
  const { data, error } = await sb.from(TABLE).select("last_sent_at").eq("alert_key", alertKey).maybeSingle();
  if (error) throw error;
  if (!data) return true;
  if (cooldownHours == null) return false; // one-shot, already sent
  const last = new Date(data.last_sent_at).getTime();
  return Date.now() - last > cooldownHours * 60 * 60 * 1000;
}

export async function recordWhatsAppSent(
  alertKey: string,
  template: string,
  journalCode: string,
  phone: string,
  messageId?: string
): Promise<void> {
  const sb = admin();
  const { error } = await sb
    .from(TABLE)
    .upsert(
      {
        alert_key: alertKey,
        template,
        journal_code: journalCode,
        phone,
        last_sent_at: new Date().toISOString(),
        message_id: messageId ?? null,
        delivery_status: null,
        delivery_updated_at: null,
      },
      { onConflict: "alert_key" }
    );
  if (error) throw error;
}

/** Called by the Interakt webhook when a message's delivery status changes. */
export async function updateDeliveryStatus(messageId: string, status: string): Promise<boolean> {
  const sb = admin();
  const { data, error } = await sb
    .from(TABLE)
    .update({ delivery_status: status, delivery_updated_at: new Date().toISOString() })
    .eq("message_id", messageId)
    .select();
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
