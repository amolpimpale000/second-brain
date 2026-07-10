import {
  createJournalConnection,
  type JournalConnectionConfig,
} from "./journal-db";
import { type IjpsConnectionConfig } from "./ijps-db";

// ---------------------------------------------------------------------------
// Journal dashboard data layer — READ-ONLY queries.
// Every function here uses SELECT statements only. No INSERT/UPDATE/DELETE.
//
// All four connected journals (IJPS, IJSRT, IJMPS, IJES) run the same
// underlying PHP journal-management schema: <prefix>_tblmanuscript,
// <prefix>_tblarticle, <prefix>_tblauthor, <prefix>_tblsubscriber,
// <prefix>_tblemployee, <prefix>_tblstatus, <prefix>_tblarticaltype, plus two
// shared (unprefixed) tables: tbl_check_plagarism and tblactivitylog.
//
// The one real structural difference is where article-processing-charge
// payments live: IJPS/IJSRT have a dedicated <prefix>_tblpayment table;
// IJMPS/IJES don't, and use the shared tbl_payment_details table instead.
// Both have the same json_details / article_id / created_date / is_deleted
// columns, so resolvePaymentTable() picks whichever exists per journal.
// ---------------------------------------------------------------------------

export type IjpsCounts = {
  totalManuscripts: number;
  publishedArticles: number;
  received: number;
  accepted: number;
  paid: number;
  published: number;
  rejected: number;
  revisionRequired: number;
  underReview: number;
  totalAuthors: number;
  totalSubscribers: number;
  totalEmployees: number;
};

export type IjpsRevenue = {
  apc: number;
  plagiarism: number;
  total: number;
};

export type MonthlyPoint = {
  month: string;
  submissions: number;
  articles: number;
  accepted: number;
};

export type MonthlyRevenuePoint = {
  month: string;
  amount: number;
};

export type ArticleTypeStat = {
  name: string;
  count: number;
};

export type IjpsActivity = {
  id: string;
  text: string;
  meta: string;
  time: string;
};

export type IjpsEmployee = {
  id: number;
  name: string;
  email: string;
  role: string;
  designation?: string;
};

export type IjpsPaymentMethod = {
  name: string;
  amount: number;
  pct: number;
  count: number;
};

export type IjpsRecentTransaction = {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  description: string;
  amount: number;
  mode: string;
  source: string;
};

// Status IDs observed in <prefix>_tblstatus (consistent across all journals):
// 1 = Received, 2 = Accepted, 3 = Paid, 4 = Published, 5 = Rejected, 6 = Revision Required
const STATUS = {
  RECEIVED: 1,
  ACCEPTED: 2,
  PAID: 3,
  PUBLISHED: 4,
  REJECTED: 5,
  REVISION_REQUIRED: 6,
} as const;

async function connect(code: string, cfg?: JournalConnectionConfig) {
  return createJournalConnection(code, cfg);
}

/** Which payment table this journal actually has real rows in. Cached per journal code. */
const paymentTableCache = new Map<string, string>();

async function resolvePaymentTable(conn: any, code: string, prefix: string): Promise<string> {
  const cached = paymentTableCache.get(code);
  if (cached) return cached;

  // A dedicated <prefix>_tblpayment table can exist but be unused/legacy
  // (e.g. IJSRT's has 0 rows while its real payments live in
  // tbl_payment_details), so check for actual data, not just existence.
  const dedicated = `${prefix}_tblpayment`;
  try {
    const result: any = await conn.execute(`SELECT COUNT(*) AS cnt FROM ${dedicated}`);
    const row = result[0][0];
    if (Number(row.cnt) > 0) {
      paymentTableCache.set(code, dedicated);
      return dedicated;
    }
  } catch {
    // table doesn't exist — fall through to the shared table
  }
  paymentTableCache.set(code, "tbl_payment_details");
  return "tbl_payment_details";
}

export async function getJournalCounts(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig
): Promise<IjpsCounts> {
  const conn = await connect(code, cfg);
  try {
    const [[totals]] = await conn.execute<any>(
      `
      SELECT
        COUNT(*) AS totalManuscripts,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS received,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS paid,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS revisionRequired
      FROM ${prefix}_tblmanuscript
      WHERE isActive = 1
    `,
      [
        STATUS.RECEIVED,
        STATUS.ACCEPTED,
        STATUS.PAID,
        STATUS.PUBLISHED,
        STATUS.REJECTED,
        STATUS.REVISION_REQUIRED,
      ]
    );

    const [[articles]] = await conn.execute<any>(
      `SELECT COUNT(*) AS cnt FROM ${prefix}_tblarticle WHERE isActive = 1`
    );
    const [[authors]] = await conn.execute<any>(
      `SELECT COUNT(*) AS cnt FROM ${prefix}_tblauthor WHERE isActive = 1`
    );
    const [[subscribers]] = await conn.execute<any>(
      `SELECT COUNT(*) AS cnt FROM ${prefix}_tblsubscriber WHERE isActive = 1`
    );
    const [[employees]] = await conn.execute<any>(
      `SELECT COUNT(*) AS cnt FROM ${prefix}_tblemployee WHERE isActive = 1`
    );

    const received = Number(totals.received ?? 0);
    const revisionRequired = Number(totals.revisionRequired ?? 0);

    return {
      totalManuscripts: Number(totals.totalManuscripts ?? 0),
      publishedArticles: Number(articles.cnt ?? 0),
      received,
      accepted: Number(totals.accepted ?? 0),
      paid: Number(totals.paid ?? 0),
      published: Number(totals.published ?? 0),
      rejected: Number(totals.rejected ?? 0),
      revisionRequired,
      underReview: received + revisionRequired,
      totalAuthors: Number(authors.cnt ?? 0),
      totalSubscribers: Number(subscribers.cnt ?? 0),
      totalEmployees: Number(employees.cnt ?? 0),
    };
  } finally {
    await conn.end();
  }
}

export type PeriodStats = { manuscripts: number; published: number; revenue: number };

/** Manuscript count/published/revenue scoped to a date range (for the period-filterable Journal Snapshot). */
export async function getJournalPeriodStats(
  code: string,
  prefix: string,
  from: string,
  to: string,
  cfg?: JournalConnectionConfig
): Promise<PeriodStats> {
  const conn = await connect(code, cfg);
  try {
    const [[totals]] = await conn.execute<any>(
      `
      SELECT COUNT(*) AS manuscripts, SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS published
      FROM ${prefix}_tblmanuscript
      WHERE isActive = 1 AND createdDate BETWEEN ? AND ?
    `,
      [STATUS.PUBLISHED, from, to]
    );

    const paymentTable = await resolvePaymentTable(conn, code, prefix);
    const [rows] = await conn.execute<any>(
      `SELECT json_details FROM ${paymentTable} WHERE is_deleted = 0 AND created_date BETWEEN ? AND ?`,
      [from, to]
    );
    let revenue = 0;
    for (const row of rows) {
      try {
        const json = JSON.parse(row.json_details || "{}");
        const amount = Number(json.amount);
        const currency = json.currency || "INR";
        if (!amount) continue;
        revenue += currency === "INR" ? amount / 100 : amount;
      } catch {
        // ignore malformed JSON
      }
    }

    return { manuscripts: Number(totals.manuscripts ?? 0), published: Number(totals.published ?? 0), revenue: Math.round(revenue) };
  } finally {
    await conn.end();
  }
}

export async function getJournalRevenue(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig
): Promise<IjpsRevenue> {
  const conn = await connect(code, cfg);
  try {
    const paymentTable = await resolvePaymentTable(conn, code, prefix);
    const [apcRows] = await conn.execute<any>(
      `SELECT json_details FROM ${paymentTable} WHERE is_deleted = 0`
    );

    let apc = 0;
    for (const row of apcRows) {
      try {
        const json = JSON.parse(row.json_details || "{}");
        const amount = Number(json.amount);
        const currency = json.currency || "INR";
        if (!amount) continue;
        apc += currency === "INR" ? amount / 100 : amount;
      } catch {
        // ignore malformed JSON
      }
    }

    const [plagRows] = await conn.execute<any>(
      "SELECT payment_response FROM tbl_check_plagarism WHERE is_deleted = 0 AND payment_response IS NOT NULL AND payment_response != ''"
    );

    let plagiarism = 0;
    for (const row of plagRows) {
      try {
        const json = JSON.parse(row.payment_response || "{}");
        const amount = Number(json.amount);
        const currency = json.currency || "INR";
        if (!amount) continue;
        plagiarism += currency === "INR" ? amount / 100 : amount;
      } catch {
        // ignore malformed JSON
      }
    }

    return {
      apc: Math.round(apc),
      plagiarism: Math.round(plagiarism),
      total: Math.round(apc + plagiarism),
    };
  } finally {
    await conn.end();
  }
}

export async function getJournalMonthlyRevenue(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig,
  months = 12
): Promise<MonthlyRevenuePoint[]> {
  const conn = await connect(code, cfg);
  try {
    const paymentTable = await resolvePaymentTable(conn, code, prefix);
    const [rows] = await conn.execute<any>(
      `
      SELECT DATE_FORMAT(created_date, '%Y-%m') AS month,
             json_details
      FROM ${paymentTable}
      WHERE is_deleted = 0 AND created_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      ORDER BY created_date
    `,
      [months]
    );

    const map = new Map<string, number>();
    for (const row of rows) {
      try {
        const json = JSON.parse(row.json_details || "{}");
        const amount = Number(json.amount);
        const currency = json.currency || "INR";
        if (!amount) continue;
        const amountRs = currency === "INR" ? amount / 100 : amount;
        const month = row.month;
        map.set(month, (map.get(month) ?? 0) + amountRs);
      } catch {
        // ignore malformed JSON
      }
    }

    return Array.from(map.entries())
      .map(([month, amount]) => ({ month, amount: Math.round(amount) }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } finally {
    await conn.end();
  }
}

export async function getJournalMonthlyTrends(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig,
  months = 12
): Promise<MonthlyPoint[]> {
  const conn = await connect(code, cfg);
  try {
    const [submissionRows] = await conn.execute<any>(
      `
      SELECT DATE_FORMAT(createdDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ${prefix}_tblmanuscript
      WHERE isActive = 1 AND createdDate >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month
      ORDER BY month
    `,
      [months]
    );

    const [articleRows] = await conn.execute<any>(
      `
      SELECT DATE_FORMAT(createdDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ${prefix}_tblarticle
      WHERE isActive = 1 AND createdDate >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month
      ORDER BY month
    `,
      [months]
    );

    const [acceptedRows] = await conn.execute<any>(
      `
      SELECT DATE_FORMAT(acceptedDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ${prefix}_tblarticle
      WHERE isActive = 1 AND acceptedDate >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month
      ORDER BY month
    `,
      [months]
    );

    const map = new Map<string, MonthlyPoint>();

    for (const r of submissionRows) {
      map.set(r.month, { month: r.month, submissions: Number(r.cnt), articles: 0, accepted: 0 });
    }
    for (const r of articleRows) {
      const existing = map.get(r.month) ?? { month: r.month, submissions: 0, articles: 0, accepted: 0 };
      existing.articles = Number(r.cnt);
      map.set(r.month, existing);
    }
    for (const r of acceptedRows) {
      const existing = map.get(r.month) ?? { month: r.month, submissions: 0, articles: 0, accepted: 0 };
      existing.accepted = Number(r.cnt);
      map.set(r.month, existing);
    }

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  } finally {
    await conn.end();
  }
}

export async function getJournalArticleTypes(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig
): Promise<ArticleTypeStat[]> {
  const conn = await connect(code, cfg);
  try {
    const [rows] = await conn.execute<any>(`
      SELECT at.articalTypeName AS name, COUNT(a.articleID) AS count
      FROM ${prefix}_tblarticaltype at
      LEFT JOIN ${prefix}_tblarticle a ON a.articalTypeID = at.articalTypeID AND a.isActive = 1
      GROUP BY at.articalTypeID, at.articalTypeName
      ORDER BY count DESC
    `);

    return rows.map((r: any) => ({ name: r.name, count: Number(r.count ?? 0) }));
  } finally {
    await conn.end();
  }
}

export type CountryStat = { name: string; count: number };

export async function getJournalCountryBreakdown(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig
): Promise<CountryStat[]> {
  const conn = await connect(code, cfg);
  try {
    const [rows] = await conn.execute<any>(`
      SELECT c.countryName AS name, COUNT(*) AS count
      FROM ${prefix}_tblmanuscript m
      JOIN ${prefix}_tblcountry c ON c.countryID = m.countryID
      WHERE m.isActive = 1
      GROUP BY c.countryName
      ORDER BY count DESC
    `);
    return rows.map((r: any) => ({ name: r.name, count: Number(r.count) }));
  } finally {
    await conn.end();
  }
}

export async function getJournalRecentActivity(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig,
  limit = 8
): Promise<IjpsActivity[]> {
  const conn = await connect(code, cfg);
  try {
    const [rows] = await conn.execute<any>(
      `
      SELECT description, createdDate
      FROM tblactivitylog
      WHERE isActive = 1
      ORDER BY createdDate DESC
      LIMIT ?
    `,
      [limit]
    );

    return rows.map((r: any, idx: number) => ({
      id: `${code.toLowerCase()}-act-${idx}`,
      text: r.description?.slice(0, 80) || "Activity",
      meta: code,
      time: formatRelativeTime(r.createdDate),
    }));
  } finally {
    await conn.end();
  }
}

export async function getJournalEmployees(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig
): Promise<IjpsEmployee[]> {
  const conn = await connect(code, cfg);
  try {
    // Role/title column naming varies per journal (designation, position,
    // role, ...), so select everything and read defensively below.
    const [rows] = await conn.execute<any>(`
      SELECT *
      FROM ${prefix}_tblemployee
      WHERE isActive = 1
      ORDER BY employeeID
    `);

    return rows.map((r: any) => ({
      id: Number(r.employeeID),
      name: r.name,
      email: r.email,
      role: r.role || r.designation || r.position || "Staff",
      designation: r.designation ?? r.position,
    }));
  } finally {
    await conn.end();
  }
}

export async function getJournalPaymentMethods(
  code: string,
  prefix: string,
  cfg?: JournalConnectionConfig
): Promise<IjpsPaymentMethod[]> {
  const conn = await connect(code, cfg);
  try {
    const paymentTable = await resolvePaymentTable(conn, code, prefix);
    const [rows] = await conn.execute<any>(`SELECT json_details FROM ${paymentTable} WHERE is_deleted = 0`);

    const methods = new Map<string, { amount: number; count: number }>();
    let total = 0;

    for (const row of rows) {
      try {
        const json = JSON.parse(row.json_details || "{}");
        const amount = Number(json.amount);
        const currency = json.currency || "INR";
        if (!amount) continue;

        const amountRs = currency === "INR" ? amount / 100 : amount;
        const method = json.method || "Other";
        const existing = methods.get(method) ?? { amount: 0, count: 0 };
        existing.amount += amountRs;
        existing.count += 1;
        methods.set(method, existing);
        total += amountRs;
      } catch {
        // ignore malformed JSON
      }
    }

    const result: IjpsPaymentMethod[] = [];
    for (const [method, data] of methods) {
      result.push({
        name: method.charAt(0).toUpperCase() + method.slice(1),
        amount: Math.round(data.amount),
        pct: total ? Math.round((data.amount / total) * 100) : 0,
        count: data.count,
      });
    }

    return result.sort((a, b) => b.amount - a.amount);
  } finally {
    await conn.end();
  }
}

export async function getJournalRecentTransactions(
  code: string,
  prefix: string,
  limit = 10,
  cfg?: JournalConnectionConfig
): Promise<IjpsRecentTransaction[]> {
  const conn = await connect(code, cfg);
  try {
    const paymentTable = await resolvePaymentTable(conn, code, prefix);
    // Column naming for the article reference differs between journals'
    // payment tables (article_id vs articleId), so select everything and
    // read defensively below instead of hardcoding one name.
    const [rows] = await conn.execute<any>(
      `
      SELECT *
      FROM ${paymentTable}
      WHERE is_deleted = 0
      ORDER BY created_date DESC
      LIMIT ?
    `,
      [limit]
    );

    return rows.map((r: any, idx: number) => {
      let amount = 0;
      let method = "Online";
      try {
        const json = JSON.parse(r.json_details || "{}");
        amount = Number(json.amount) || 0;
        const currency = json.currency || "INR";
        amount = currency === "INR" ? amount / 100 : amount;
        method = json.method ? json.method.toUpperCase() : "Online";
      } catch {
        // ignore
      }

      return {
        id: `${code.toLowerCase()}-txn-${idx}`,
        date: new Date(r.created_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        type: "Income" as const,
        category: "Article Processing",
        description: `Article ID: ${r.article_id ?? r.articleId ?? r.manuscriptID ?? "N/A"}`,
        amount: Math.round(amount),
        mode: method,
        source: "Razorpay",
      };
    });
  } finally {
    await conn.end();
  }
}

function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN");
}

export type DailyPublished = { date: string; series: Record<string, number>; total: number };

/**
 * Per-day published-paper counts, attributed to specific named employees
 * (article.createdByUserID = employeeID, the same verified attribution used
 * by the "employee idle" alert). Every day in the window is present even
 * with zero counts, so charts render a continuous, gap-free range.
 */
export async function getJournalDailyPublishedByEmployees(
  code: string,
  prefix: string,
  employeeNames: string[],
  days: number,
  cfg?: JournalConnectionConfig
): Promise<DailyPublished[]> {
  const conn = await connect(code, cfg);
  try {
    const [rows] = await conn.execute<any>(
      `SELECT DATE(a.createdDate) AS day, e.name AS empName, COUNT(*) AS cnt
       FROM ${prefix}_tblarticle a
       JOIN ${prefix}_tblemployee e ON e.employeeID = a.createdByUserID
       WHERE a.isActive = 1
         AND a.createdDate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND e.name IN (${employeeNames.map(() => "?").join(",")})
       GROUP BY DATE(a.createdDate), e.name
       ORDER BY day ASC`,
      [days, ...employeeNames]
    );
    return buildDailySeries(rows, employeeNames, days, (r) => r.empName);
  } finally {
    await conn.end();
  }
}

/** Per-day published-paper totals for the whole journal, no employee breakdown. */
export async function getJournalDailyPublishedTotal(
  code: string,
  prefix: string,
  days: number,
  cfg?: JournalConnectionConfig
): Promise<DailyPublished[]> {
  const conn = await connect(code, cfg);
  try {
    const [rows] = await conn.execute<any>(
      `SELECT DATE(createdDate) AS day, COUNT(*) AS cnt
       FROM ${prefix}_tblarticle
       WHERE isActive = 1 AND createdDate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(createdDate)
       ORDER BY day ASC`,
      [days]
    );
    return buildDailySeries(rows.map((r: any) => ({ ...r, empName: "Total" })), ["Total"], days, (r) => r.empName);
  } finally {
    await conn.end();
  }
}

/** Fills every day in [today-days+1, today] with zero, then overlays real counts per series key. */
function buildDailySeries(
  rows: any[],
  seriesKeys: string[],
  days: number,
  seriesKeyOf: (row: any) => string
): DailyPublished[] {
  const byDay = new Map<string, Record<string, number>>();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, Object.fromEntries(seriesKeys.map((k) => [k, 0])));
  }
  for (const row of rows) {
    const dayKey = row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10);
    const bucket = byDay.get(dayKey);
    if (!bucket) continue; // outside the requested window (shouldn't happen given the SQL filter)
    const key = seriesKeyOf(row);
    bucket[key] = (bucket[key] ?? 0) + Number(row.cnt);
  }
  return Array.from(byDay.entries()).map(([date, series]) => ({
    date,
    series,
    total: Object.values(series).reduce((s, n) => s + n, 0),
  }));
}

// ---------------------------------------------------------------------------
// IJPS-specific wrappers (backward compatible with existing callers)
// ---------------------------------------------------------------------------

export async function getIjpsCounts(cfg?: IjpsConnectionConfig) {
  return getJournalCounts("IJPS", "ijps", cfg);
}
export async function getIjpsRevenue(cfg?: IjpsConnectionConfig) {
  return getJournalRevenue("IJPS", "ijps", cfg);
}
export async function getIjpsMonthlyTrends(cfg?: IjpsConnectionConfig, months = 12) {
  return getJournalMonthlyTrends("IJPS", "ijps", cfg, months);
}
export async function getIjpsArticleTypes(cfg?: IjpsConnectionConfig) {
  return getJournalArticleTypes("IJPS", "ijps", cfg);
}
export async function getIjpsRecentActivity(cfg?: IjpsConnectionConfig, limit = 8) {
  return getJournalRecentActivity("IJPS", "ijps", cfg, limit);
}
export async function getIjpsEmployees(cfg?: IjpsConnectionConfig) {
  return getJournalEmployees("IJPS", "ijps", cfg);
}
export async function getIjpsPaymentMethods(cfg?: IjpsConnectionConfig) {
  return getJournalPaymentMethods("IJPS", "ijps", cfg);
}
export async function getIjpsRecentTransactions(limit = 10, cfg?: IjpsConnectionConfig) {
  return getJournalRecentTransactions("IJPS", "ijps", limit, cfg);
}
