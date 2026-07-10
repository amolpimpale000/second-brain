import { createJournalConnection } from "./journal-db";
import { createJpsConnection } from "./jps-db";
import { getTrackedConfig, type TrackedConfig } from "./journal-alerts-store";

// ---------------------------------------------------------------------------
// Journal Alerts — READ-ONLY. Computes actionable alerts across every journal
// from five rules the owner defined. SELECT-only against the journal DBs; the
// only writes this feature ever does are dismissals/settings in Supabase
// (journal-alerts-store.ts), never the journal databases.
//
// Rules:
//   1. manuscript_stale    — received >3 days ago, still not accepted
//                            (scoped to the last 10 days so the panel stays
//                            actionable rather than surfacing an ancient
//                            backlog).
//   2. employee_idle       — a tracked employee published no paper in the
//                            last 24h. "Published a paper" = an article row
//                            whose createdByUserID is that employeeID (verified
//                            attribution) within 24h. Tracked set defaults to
//                            all active staff; overridable per journal.
//   3. revision_overdue    — sent for revision (statusID 6) but no update in
//                            >3 days.
//   4. plagiarism_pending  — a plagiarism-check row not marked completed.
//   5. contact_unresolved  — a Contact-Us query left Pending for >2 days.
//   6. referral_pending    — a referral request left unpaid/unreviewed.
//   7. ai_calling_failed   — the AI calling agent's last 3+ calls in a row
//                            returned HTTP 500 (IJPS only — the only journal
//                            with this feature). Observed failures are a
//                            systemic outage (e.g. the calling service's own
//                            balance running out), not a per-manuscript
//                            issue, so this fires once for the whole streak
//                            rather than once per failed call.
// ---------------------------------------------------------------------------

export type AlertRule =
  | "manuscript_stale"
  | "employee_idle"
  | "revision_overdue"
  | "plagiarism_pending"
  | "contact_unresolved"
  | "referral_pending"
  | "ai_calling_failed";

export type AlertSeverity = "high" | "medium" | "low";

export type JournalAlert = {
  id: string; // stable key used for dismissal
  rule: AlertRule;
  severity: AlertSeverity;
  journal: string; // journal code
  title: string;
  detail: string;
  manuscriptId?: string;
  employee?: string;
  ageDays?: number;
  when?: string; // ISO of the underlying event
};

export type EmployeeLite = { id: number; name: string };

export type AlertsPayload = {
  alerts: JournalAlert[];
  roster: Record<string, EmployeeLite[]>; // journalCode -> active employees (for the picker)
  tracked: Record<string, number[]>; // journalCode -> effective tracked employee ids
  generatedAt: string;
  errors: string[]; // per-journal failures (surfaced, not thrown)
};

const MYSQL_JOURNALS: { code: string; prefix: string }[] = [
  { code: "IJPS", prefix: "ijps" },
  { code: "IJSRT", prefix: "ijsrt" },
  { code: "IJMPS", prefix: "ijmps" },
  { code: "IJES", prefix: "ijes" },
];

// Status IDs are consistent across the four PHP-schema journals.
const REVISION_STATUS = 6;
const RECEIVED_STATUS = 1;

// Cap emitted alerts per rule/journal so a large backlog can't flood the panel.
const PER_RULE_CAP = 60;

function ageDaysFrom(d: Date | string): number {
  const t = new Date(d).getTime();
  if (isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// --------------------------------------------------------------------- MySQL

async function computeMysqlJournal(
  code: string,
  prefix: string,
  tracked: TrackedConfig
): Promise<{ alerts: JournalAlert[]; roster: EmployeeLite[]; effectiveTracked: number[]; errors: string[] }> {
  const alerts: JournalAlert[] = [];
  const errors: string[] = [];
  let roster: EmployeeLite[] = [];
  let effectiveTracked: number[] = [];

  let conn;
  try {
    conn = await createJournalConnection(code);
  } catch (e) {
    return { alerts, roster, effectiveTracked, errors: [`${code}: connect failed — ${(e as Error).message}`] };
  }

  try {
    // Roster of active employees (drives the picker + rule 2 defaults).
    try {
      const [emps] = await conn.execute<any>(
        `SELECT employeeID AS id, name FROM ${prefix}_tblemployee WHERE isActive = 1 ORDER BY name`
      );
      roster = emps.map((r: any) => ({ id: Number(r.id), name: r.name || `#${r.id}` }));
    } catch (e) {
      errors.push(`${code} roster: ${(e as Error).message}`);
    }
    const trackedSet = tracked[code];
    effectiveTracked = trackedSet ?? roster.map((e) => e.id); // default: all active staff

    // Rule 1 — received >3d ago, still not accepted, within a 10-day window.
    try {
      const [rows] = await conn.execute<any>(
        `SELECT m.uniqueCode, m.titleOfPaper, m.authorName, m.createdDate, e.name AS employeeName
         FROM ${prefix}_tblmanuscript m
         LEFT JOIN ${prefix}_tblemployee e ON e.employeeID = m.assignedEmployeeID
         WHERE m.isActive = 1 AND m.statusID = ?
           AND m.createdDate < DATE_SUB(NOW(), INTERVAL 3 DAY)
           AND m.createdDate >= DATE_SUB(NOW(), INTERVAL 10 DAY)
         ORDER BY m.createdDate ASC
         LIMIT ${PER_RULE_CAP}`,
        [RECEIVED_STATUS]
      );
      for (const r of rows) {
        const age = ageDaysFrom(r.createdDate);
        const mid = r.uniqueCode || "—";
        alerts.push({
          id: `${code}:manuscript_stale:${mid}`,
          rule: "manuscript_stale",
          severity: age >= 6 ? "high" : "medium",
          journal: code,
          title: `Manuscript ${mid} awaiting acceptance`,
          detail: `Received ${age}d ago, still not accepted — "${trim(r.titleOfPaper)}"${r.authorName ? ` by ${trim(r.authorName, 40)}` : ""}.`,
          manuscriptId: mid,
          employee: r.employeeName || undefined,
          ageDays: age,
          when: toIso(r.createdDate),
        });
      }
    } catch (e) {
      errors.push(`${code} rule1: ${(e as Error).message}`);
    }

    // Rule 2 — tracked employee published no paper in the last 24h.
    try {
      if (effectiveTracked.length > 0) {
        const [rows] = await conn.execute<any>(
          `SELECT e.employeeID AS id, e.name,
             (SELECT COUNT(*) FROM ${prefix}_tblarticle a
              WHERE a.isActive = 1 AND a.createdByUserID = e.employeeID
                AND a.createdDate >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS pub24
           FROM ${prefix}_tblemployee e
           WHERE e.isActive = 1 AND e.employeeID IN (${effectiveTracked.map(() => "?").join(",")})`,
          effectiveTracked
        );
        const day = todayKey();
        for (const r of rows) {
          if (Number(r.pub24) === 0) {
            alerts.push({
              // date in the key: dismissing hides today's, it re-checks tomorrow.
              id: `${code}:employee_idle:${r.id}:${day}`,
              rule: "employee_idle",
              severity: "medium",
              journal: code,
              title: `${r.name} — no paper published today`,
              detail: `${r.name} has not published any paper in the last 24 hours.`,
              employee: r.name,
              when: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      errors.push(`${code} rule2: ${(e as Error).message}`);
    }

    // Rule 3 — revision requested but no update in >3 days.
    try {
      const [rows] = await conn.execute<any>(
        `SELECT m.uniqueCode, m.titleOfPaper, m.updatedDate, e.name AS employeeName
         FROM ${prefix}_tblmanuscript m
         LEFT JOIN ${prefix}_tblemployee e ON e.employeeID = m.assignedEmployeeID
         WHERE m.isActive = 1 AND m.statusID = ?
           AND m.updatedDate < DATE_SUB(NOW(), INTERVAL 3 DAY)
         ORDER BY m.updatedDate ASC
         LIMIT ${PER_RULE_CAP}`,
        [REVISION_STATUS]
      );
      for (const r of rows) {
        const age = ageDaysFrom(r.updatedDate);
        const mid = r.uniqueCode || "—";
        alerts.push({
          id: `${code}:revision_overdue:${mid}`,
          rule: "revision_overdue",
          severity: "high",
          journal: code,
          title: `Corrections overdue on ${mid}`,
          detail: `Sent for revision ${age}d ago with no update${r.employeeName ? ` — handler ${r.employeeName}` : " — unassigned"}. "${trim(r.titleOfPaper)}".`,
          manuscriptId: mid,
          employee: r.employeeName || "Unassigned",
          ageDays: age,
          when: toIso(r.updatedDate),
        });
      }
    } catch (e) {
      errors.push(`${code} rule3: ${(e as Error).message}`);
    }

    // Rule 4 — plagiarism check pending (not marked completed 'Done').
    try {
      const [rows] = await conn.execute<any>(
        `SELECT id, name, email, created_date
         FROM tbl_check_plagarism
         WHERE is_deleted = 0
           AND (completed_status IS NULL OR completed_status <> 'Done')
         ORDER BY created_date DESC
         LIMIT ${PER_RULE_CAP}`
      );
      for (const r of rows) {
        const age = ageDaysFrom(r.created_date);
        alerts.push({
          id: `${code}:plagiarism_pending:${r.id}`,
          rule: "plagiarism_pending",
          severity: "medium",
          journal: code,
          title: `Plagiarism report pending`,
          detail: `Report for ${trim(r.name, 40) || "a submission"} pending${age ? ` (${age}d)` : ""}.`,
          ageDays: age,
          when: toIso(r.created_date),
        });
      }
    } catch (e) {
      errors.push(`${code} rule4: ${(e as Error).message}`);
    }

    // Rule 5 — Contact-Us query left Pending for >2 days.
    try {
      const [rows] = await conn.execute<any>(
        `SELECT contactFormDataID AS id, name, subject, createdDate
         FROM ${prefix}_tblcontactformdata
         WHERE isActive = 1 AND status = 'Pending'
           AND createdDate < DATE_SUB(NOW(), INTERVAL 2 DAY)
         ORDER BY createdDate ASC
         LIMIT ${PER_RULE_CAP}`
      );
      for (const r of rows) {
        const age = ageDaysFrom(r.createdDate);
        alerts.push({
          id: `${code}:contact_unresolved:${r.id}`,
          rule: "contact_unresolved",
          severity: age >= 5 ? "high" : "medium",
          journal: code,
          title: `Contact query unresolved (${age}d)`,
          detail: `"${trim(r.subject, 50) || "No subject"}" from ${trim(r.name, 40) || "visitor"} pending ${age} days.`,
          ageDays: age,
          when: toIso(r.createdDate),
        });
      }
    } catch (e) {
      errors.push(`${code} rule5: ${(e as Error).message}`);
    }

    // Rule 6 — referral request left pending (unreviewed/unpaid).
    try {
      const [rows] = await conn.execute<any>(
        `SELECT id, name, article_id, title_of_paper, created_date
         FROM referral_requests
         WHERE completed_status = 'pending'
         ORDER BY created_date ASC
         LIMIT ${PER_RULE_CAP}`
      );
      for (const r of rows) {
        const age = ageDaysFrom(r.created_date);
        alerts.push({
          id: `${code}:referral_pending:${r.id}`,
          rule: "referral_pending",
          severity: age >= 5 ? "high" : "medium",
          journal: code,
          title: `Referral request pending`,
          detail: `${trim(r.name, 40) || "Applicant"} — "${trim(r.title_of_paper, 50)}"${r.article_id ? ` (${r.article_id})` : ""}, pending ${age}d.`,
          manuscriptId: r.article_id || undefined,
          ageDays: age,
          when: toIso(r.created_date),
        });
      }
    } catch (e) {
      errors.push(`${code} rule6: ${(e as Error).message}`);
    }

    // Rule 7 — AI calling agent failing: last 3+ calls in a row returned
    // HTTP 500 (only IJPS has this table; other journals hit the catch below
    // and are silently skipped, same as any journal lacking a table a rule
    // depends on).
    try {
      const [rows] = await conn.execute<any>(
        `SELECT id, uniqueCode, authorName, http_status, response, created_at
         FROM tbl_ai_call_log
         ORDER BY created_at DESC
         LIMIT 10`
      );
      let streak = 0;
      for (const r of rows) {
        if (Number(r.http_status) === 500) streak++;
        else break;
      }
      if (streak >= 3) {
        const latest = rows[0];
        let reason = "Server error";
        try {
          const parsed = JSON.parse(latest.response || "{}");
          reason = parsed.error_description || parsed.error || reason;
        } catch {
          // response wasn't valid JSON — keep the generic reason
        }
        alerts.push({
          id: `${code}:ai_calling_failed:${latest.id}`,
          rule: "ai_calling_failed",
          severity: "high",
          journal: code,
          title: `AI Calling Agent failing — ${streak} calls in a row returned HTTP 500`,
          detail: `${reason} Last failed call: ${trim(latest.authorName, 40) || "unknown author"} (${latest.uniqueCode || "—"}).`,
          manuscriptId: latest.uniqueCode || undefined,
          when: toIso(latest.created_at),
        });
      }
    } catch (e) {
      errors.push(`${code} rule7: ${(e as Error).message}`);
    }
  } finally {
    await conn.end().catch(() => {});
  }

  return { alerts, roster, effectiveTracked, errors };
}

// ----------------------------------------------------------------------- JPS

async function computeJps(): Promise<{ alerts: JournalAlert[]; errors: string[] }> {
  const alerts: JournalAlert[] = [];
  const errors: string[] = [];
  let client;
  try {
    client = await createJpsConnection();
  } catch (e) {
    return { alerts, errors: [`JPS: connect failed — ${(e as Error).message}`] };
  }
  try {
    // Rule 1 — submitted >3d ago, not yet accepted, within 10 days.
    try {
      const res = await client.query(
        `SELECT manuscript_id, title, submission_date
         FROM manuscripts
         WHERE status = 'submitted'
           AND submission_date < now() - interval '3 days'
           AND submission_date >= now() - interval '10 days'
         ORDER BY submission_date ASC
         LIMIT ${PER_RULE_CAP}`
      );
      for (const r of res.rows) {
        const age = ageDaysFrom(r.submission_date);
        const mid = r.manuscript_id || "—";
        alerts.push({
          id: `JPS:manuscript_stale:${mid}`,
          rule: "manuscript_stale",
          severity: age >= 6 ? "high" : "medium",
          journal: "JPS",
          title: `Manuscript ${mid} awaiting acceptance`,
          detail: `Received ${age}d ago, still not accepted — "${trim(r.title)}".`,
          manuscriptId: mid,
          ageDays: age,
          when: toIso(r.submission_date),
        });
      }
    } catch (e) {
      errors.push(`JPS rule1: ${(e as Error).message}`);
    }

    // Rule 3 — revision_required with no update in >3 days.
    try {
      const res = await client.query(
        `SELECT manuscript_id, title, updated_at
         FROM manuscripts
         WHERE status = 'revision_required'
           AND updated_at < now() - interval '3 days'
         ORDER BY updated_at ASC
         LIMIT ${PER_RULE_CAP}`
      );
      for (const r of res.rows) {
        const age = ageDaysFrom(r.updated_at);
        const mid = r.manuscript_id || "—";
        alerts.push({
          id: `JPS:revision_overdue:${mid}`,
          rule: "revision_overdue",
          severity: "high",
          journal: "JPS",
          title: `Corrections overdue on ${mid}`,
          detail: `Sent for revision ${age}d ago with no update. "${trim(r.title)}".`,
          manuscriptId: mid,
          ageDays: age,
          when: toIso(r.updated_at),
        });
      }
    } catch (e) {
      errors.push(`JPS rule3: ${(e as Error).message}`);
    }
  } finally {
    await client.end().catch(() => {});
  }
  return { alerts, errors };
}

// -------------------------------------------------------------------- public

export async function computeJournalAlerts(): Promise<AlertsPayload> {
  const tracked = await getTrackedConfig().catch(() => ({} as TrackedConfig));

  const mysqlResults = await Promise.all(
    MYSQL_JOURNALS.map((j) => computeMysqlJournal(j.code, j.prefix, tracked))
  );
  const jpsResult = await computeJps().catch((e) => ({ alerts: [], errors: [`JPS: ${(e as Error).message}`] }));

  const alerts: JournalAlert[] = [];
  const roster: Record<string, EmployeeLite[]> = {};
  const trackedOut: Record<string, number[]> = {};
  const errors: string[] = [];

  MYSQL_JOURNALS.forEach((j, i) => {
    const r = mysqlResults[i];
    alerts.push(...r.alerts);
    roster[j.code] = r.roster;
    trackedOut[j.code] = r.effectiveTracked;
    errors.push(...r.errors);
  });
  alerts.push(...jpsResult.alerts);
  errors.push(...jpsResult.errors);

  // Sort: severity first, then most overdue.
  const sev: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => sev[a.severity] - sev[b.severity] || (b.ageDays ?? 0) - (a.ageDays ?? 0));

  return { alerts, roster, tracked: trackedOut, generatedAt: new Date().toISOString(), errors };
}

// ------------------------------------------------------------------- helpers

function trim(s: unknown, n = 60): string {
  const str = String(s ?? "").trim();
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function toIso(d: unknown): string | undefined {
  if (!d) return undefined;
  const t = new Date(d as string).getTime();
  return isNaN(t) ? undefined : new Date(t).toISOString();
}
