import { createJournalConnection } from "./journal-db";
import { getGoogleAdsSpend } from "./google-ads";
import { sendWhatsAppTemplate } from "./interakt";
import { shouldSendWhatsApp, recordWhatsAppSent } from "./journal-whatsapp-store";

// ---------------------------------------------------------------------------
// WhatsApp alert triggers — READ-ONLY against the journal databases. Checked
// on an hourly cron (see /api/journals/whatsapp-alerts/check). All sends go
// through IJPS Journal's Interakt account to the owner's number, regardless
// of which journal the alert concerns.
//
// Triggers:
//   1. google_ads_balance_alert — a journal's Google Ads account budget has
//      less than ₹1000 remaining. Persistent condition, so this reminds at
//      most once every 24h while it stays under the threshold (not once per
//      hourly check).
//   2. plagiarism_checking_alert — a new plagiarism-check submission arrived
//      for a journal. One-shot per submission; scoped to a recent window so
//      activating this feature doesn't backfill-notify years of history.
//   3. ai_voice_calling_agent_alert — the AI calling agent's last 3+ calls in
//      a row returned HTTP 500 (IJPS only). One-shot per failing streak
//      (keyed by the latest failing call's row id, so a new failure after
//      recovery creates a fresh, distinct alert).
// ---------------------------------------------------------------------------

const OWNER_PHONE = "9172532920";
const OWNER_COUNTRY_CODE = "+91";
const GOOGLE_ADS_BALANCE_THRESHOLD = 1000;
const GOOGLE_ADS_REMINDER_COOLDOWN_HOURS = 24;
const RECENT_SUBMISSION_WINDOW_HOURS = 2; // > the hourly cron cadence, as a buffer against a missed run

const MYSQL_JOURNALS: { code: string; prefix: string }[] = [
  { code: "IJPS", prefix: "ijps" },
  { code: "IJSRT", prefix: "ijsrt" },
  { code: "IJMPS", prefix: "ijmps" },
  { code: "IJES", prefix: "ijes" },
];

function journalName(code: string): string {
  return `${code} Journal`;
}

export type WhatsAppSendLog = {
  alertKey: string;
  template: string;
  journal: string;
  ok: boolean;
  httpStatus: number;
  detail: string;
};

async function fireTemplate(
  alertKey: string,
  template: string,
  journalCode: string,
  bodyValues: string[],
  cooldownHours: number | null
): Promise<WhatsAppSendLog | null> {
  const due = await shouldSendWhatsApp(alertKey, cooldownHours).catch((e) => {
    throw new Error(`dedup check failed for ${alertKey}: ${e instanceof Error ? e.message : e}`);
  });
  if (!due) return null;

  const result = await sendWhatsAppTemplate(OWNER_PHONE, OWNER_COUNTRY_CODE, template, bodyValues);
  if (result.ok) {
    await recordWhatsAppSent(alertKey, template, journalCode, OWNER_PHONE, result.messageId);
  }
  return { alertKey, template, journal: journalCode, ok: result.ok, httpStatus: result.httpStatus, detail: result.body };
}

// --------------------------------------------------------- 1. Google Ads balance

async function checkGoogleAdsBalance(): Promise<WhatsAppSendLog[]> {
  const sent: WhatsAppSendLog[] = [];
  const spend = await getGoogleAdsSpend();
  for (const j of spend.byJournal) {
    if (!j.connected || !j.budget) continue;
    if (j.budget.remaining >= GOOGLE_ADS_BALANCE_THRESHOLD) continue;
    const log = await fireTemplate(
      `${j.code}:google_ads_low`,
      "google_ads_balance_alert",
      j.code,
      [journalName(j.code)],
      GOOGLE_ADS_REMINDER_COOLDOWN_HOURS
    );
    if (log) sent.push(log);
  }
  return sent;
}

// ----------------------------------------------------- 2. Plagiarism submissions

async function checkPlagiarismSubmissions(): Promise<WhatsAppSendLog[]> {
  const sent: WhatsAppSendLog[] = [];
  for (const { code } of MYSQL_JOURNALS) {
    let conn;
    try {
      conn = await createJournalConnection(code);
    } catch {
      continue;
    }
    try {
      const [rows] = await conn.execute<any>(
        `SELECT id, name, created_date
         FROM tbl_check_plagarism
         WHERE is_deleted = 0 AND created_date >= DATE_SUB(NOW(), INTERVAL ${RECENT_SUBMISSION_WINDOW_HOURS} HOUR)
         ORDER BY created_date ASC
         LIMIT 20`
      );
      for (const r of rows) {
        const log = await fireTemplate(
          `${code}:plagiarism_submission:${r.id}`,
          "plagiarism_checking_alert",
          code,
          [journalName(code)],
          null
        );
        if (log) sent.push(log);
      }
    } catch {
      // table missing or query failed for this journal — skip silently, same
      // tolerance pattern as the in-app alerts computation.
    } finally {
      await conn.end().catch(() => {});
    }
  }
  return sent;
}

// ------------------------------------------------------- 3. AI calling failures

async function checkAiCallingFailures(): Promise<WhatsAppSendLog[]> {
  const sent: WhatsAppSendLog[] = [];
  let conn;
  try {
    conn = await createJournalConnection("IJPS");
  } catch {
    return sent;
  }
  try {
    const [rows] = await conn.execute<any>(
      `SELECT id, http_status FROM tbl_ai_call_log ORDER BY created_at DESC LIMIT 10`
    );
    let streak = 0;
    for (const r of rows) {
      if (Number(r.http_status) === 500) streak++;
      else break;
    }
    if (streak >= 3) {
      const latest = rows[0];
      const log = await fireTemplate(
        `IJPS:ai_calling_failed_wa:${latest.id}`,
        "ai_voice_calling_agent_alert",
        "IJPS",
        [journalName("IJPS")],
        null
      );
      if (log) sent.push(log);
    }
  } catch {
    // table doesn't exist / query failed — skip silently
  } finally {
    await conn.end().catch(() => {});
  }
  return sent;
}

export async function runWhatsAppAlertChecks(): Promise<WhatsAppSendLog[]> {
  const [a, b, c] = await Promise.all([
    checkGoogleAdsBalance().catch((e) => {
      console.error("WhatsApp check (google ads) failed:", e instanceof Error ? e.message : e);
      return [];
    }),
    checkPlagiarismSubmissions().catch((e) => {
      console.error("WhatsApp check (plagiarism) failed:", e instanceof Error ? e.message : e);
      return [];
    }),
    checkAiCallingFailures().catch((e) => {
      console.error("WhatsApp check (ai calling) failed:", e instanceof Error ? e.message : e);
      return [];
    }),
  ]);
  return [...a, ...b, ...c];
}
