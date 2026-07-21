import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { RAZORPAY_JOURNAL_CODES, getCreds, fetchAllPayments, type RazorpayPayment } from "./razorpay";

// ---------------------------------------------------------------------------
// Daily-cached Razorpay captured-income snapshots. A cron route
// (/api/journals/revenue-sync) refreshes these once/day; the dashboard and
// consolidated P&L read from this table instead of hitting Razorpay or the
// unreliable MySQL payment tables on every page load.
// ---------------------------------------------------------------------------

const TABLE = "razorpay_revenue_snapshots";

let _client: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Revenue snapshots store not configured (url:${!!url} key:${!!key}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

export type RevenueSnapshotRow = {
  journal_code: string;
  month_key: string;
  amount: number;
  payment_count: number;
};

export type MonthlyRevenuePoint = {
  month: string;
  amount: number;
};

// Minimum month_key to include (e.g. "2025-08" for a 12-month window).
function monthCutoff(months: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Read cached snapshots, grouped by journal_code → MonthlyRevenuePoint[]. */
export async function getRevenueSnapshots(months: number): Promise<Map<string, MonthlyRevenuePoint[]>> {
  const sb = admin();
  const cutoff = monthCutoff(months);
  const { data, error } = await sb
    .from(TABLE)
    .select("journal_code, month_key, amount")
    .gte("month_key", cutoff)
    .order("month_key", { ascending: true });
  if (error) throw error;

  const map = new Map<string, MonthlyRevenuePoint[]>();
  for (const row of (data ?? []) as { journal_code: string; month_key: string; amount: number }[]) {
    let arr = map.get(row.journal_code);
    if (!arr) { arr = []; map.set(row.journal_code, arr); }
    arr.push({ month: row.month_key, amount: row.amount });
  }
  return map;
}

/**
 * Read cached snapshots, self-healing on first run. If the table has no data
 * for the current month (e.g. the daily cron hasn't run yet, or this is the
 * very first deploy), fetch from Razorpay inline and upsert before returning.
 * Subsequent reads hit the cache only.
 */
export async function getRevenueSnapshotsWithFallback(months: number): Promise<Map<string, MonthlyRevenuePoint[]>> {
  try {
    const hasData = await hasCurrentMonthData();
    if (!hasData) {
      console.log("[revenue-snapshots] no current-month data; fetching from Razorpay inline (self-heal)");
      await syncRevenueSnapshots(months).catch((err) => console.error("[revenue-snapshots] self-heal failed:", err));
    }
    return await getRevenueSnapshots(months);
  } catch (err) {
    console.error("[revenue-snapshots] read failed, returning empty map:", err);
    return new Map();
  }
}

/** Check whether the table has any data for the current month. */
export async function hasCurrentMonthData(): Promise<boolean> {
  const sb = admin();
  const now = new Date();
  const key = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const { count, error } = await sb
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("month_key", key);
  if (error) return false;
  return (count ?? 0) > 0;
}

/** Bulk upsert rows. Replaces existing rows on (journal_code, month_key) conflict. */
export async function upsertSnapshots(rows: RevenueSnapshotRow[]): Promise<void> {
  if (rows.length === 0) return;
  const sb = admin();
  const { error } = await sb.from(TABLE).upsert(rows, { onConflict: "journal_code,month_key" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Sync: pull captured payments from every journal's Razorpay account over the
// last `months` months, bucket by UTC month, and upsert into the snapshot
// table. Used by the daily cron route AND as a self-healing fallback the first
// time the dashboard reads data before the cron has ever run.
//
// Returns a per-journal status so callers (the cron route) can report which
// journals succeeded.
// ---------------------------------------------------------------------------

export type RevenueSyncStatus = { code: string; ok: boolean; error?: string; rows: number };

// Bucket captured payments by UTC month. Returns Map<"YYYY-MM", { amount, count }>.
function bucketByMonth(payments: RazorpayPayment[]): Map<string, { amount: number; count: number }> {
  const out = new Map<string, { amount: number; count: number }>();
  for (const p of payments) {
    if (p.status !== "captured") continue;
    const d = new Date(p.created_at * 1000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const cur = out.get(key) ?? { amount: 0, count: 0 };
    cur.amount += p.amount / 100; // paise → rupees
    cur.count += 1;
    out.set(key, cur);
  }
  for (const v of out.values()) v.amount = Math.round(v.amount);
  return out;
}

export async function syncRevenueSnapshots(months = 12): Promise<{ rowsWritten: number; journals: RevenueSyncStatus[] }> {
  const now = new Date();
  const from = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1) / 1000);
  const to = Math.floor(now.getTime() / 1000);
  const maxPages = Math.min(400, months * 20);

  const rows: RevenueSnapshotRow[] = [];
  const journals: RevenueSyncStatus[] = [];

  await Promise.all(
    RAZORPAY_JOURNAL_CODES.map(async (code) => {
      const creds = getCreds(code);
      if (!creds) {
        journals.push({ code, ok: false, error: "no credentials", rows: 0 });
        return;
      }
      try {
        const payments = await fetchAllPayments(creds.keyId, creds.keySecret, from, to, maxPages);
        const bucketed = bucketByMonth(payments);
        for (const [monthKey, { amount, count }] of bucketed) {
          rows.push({ journal_code: code, month_key: monthKey, amount, payment_count: count });
        }
        journals.push({ code, ok: true, rows: bucketed.size });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Razorpay revenue sync failed for ${code}:`, msg);
        journals.push({ code, ok: false, error: msg, rows: 0 });
      }
    })
  );

  await upsertSnapshots(rows);
  return { rowsWritten: rows.length, journals };
}
