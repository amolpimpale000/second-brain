import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Persistence for the Journal Alerts panel. The alerts themselves are computed
// live from the read-only journal databases (see journal-alerts.ts); this
// store only holds the two pieces of app-owned state that must survive across
// requests, in this app's own Supabase Postgres (never the journal DBs):
//
//   journal_alert_dismissals  — alerts the user has acknowledged/dismissed so
//                               they stop reappearing (keyed by a stable
//                               alert id).
//   journal_alert_settings    — which employees are "tracked" per journal for
//                               the "employee published nothing in 24h" rule.
//                               No row for a journal  = default (track all
//                               active staff). A row with an empty array
//                               = explicitly track nobody.
// ---------------------------------------------------------------------------

const DISMISSALS = "journal_alert_dismissals";
const SETTINGS = "journal_alert_settings";

let _client: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Alert storage is not configured (url:${!!url} key:${!!key}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

// ------------------------------------------------------------------ dismissals

/** Set of currently-dismissed alert keys. */
export async function getDismissedKeys(): Promise<Set<string>> {
  const sb = admin();
  const { data, error } = await sb.from(DISMISSALS).select("alert_key");
  if (error) throw error;
  return new Set((data ?? []).map((r: { alert_key: string }) => r.alert_key));
}

export async function dismissAlert(alertKey: string, rule: string, journalCode: string): Promise<void> {
  const sb = admin();
  const { error } = await sb
    .from(DISMISSALS)
    .upsert({ alert_key: alertKey, rule, journal_code: journalCode }, { onConflict: "alert_key" });
  if (error) throw error;
}

export async function undismissAlert(alertKey: string): Promise<void> {
  const sb = admin();
  const { error } = await sb.from(DISMISSALS).delete().eq("alert_key", alertKey);
  if (error) throw error;
}

/** Clear every dismissal (used by the "restore dismissed" action). */
export async function clearDismissals(): Promise<void> {
  const sb = admin();
  const { error } = await sb.from(DISMISSALS).delete().neq("alert_key", "");
  if (error) throw error;
}

// -------------------------------------------------------------------- settings

export type TrackedConfig = Record<string, number[] | undefined>;

/** Map journalCode -> explicit tracked employee ids. Absent journal = default all. */
export async function getTrackedConfig(): Promise<TrackedConfig> {
  const sb = admin();
  const { data, error } = await sb.from(SETTINGS).select("journal_code, tracked_employee_ids");
  if (error) throw error;
  const out: TrackedConfig = {};
  for (const row of (data ?? []) as { journal_code: string; tracked_employee_ids: number[] | null }[]) {
    out[row.journal_code] = (row.tracked_employee_ids ?? []).map(Number);
  }
  return out;
}

export async function setTrackedEmployees(journalCode: string, employeeIds: number[]): Promise<void> {
  const sb = admin();
  const { error } = await sb
    .from(SETTINGS)
    .upsert(
      { journal_code: journalCode, tracked_employee_ids: employeeIds, updated_at: new Date().toISOString() },
      { onConflict: "journal_code" }
    );
  if (error) throw error;
}
