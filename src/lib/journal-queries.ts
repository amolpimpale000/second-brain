import {
  createIjpsConnection,
  type IjpsConnectionConfig,
} from "./ijps-db";

// ---------------------------------------------------------------------------
// Journal dashboard data layer — READ-ONLY queries.
// Every function here uses SELECT statements only. No INSERT/UPDATE/DELETE.
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

// Status IDs observed in ijps_tblstatus:
// 1 = Received, 2 = Accepted, 3 = Paid, 4 = Published, 5 = Rejected, 6 = Revision Required
const IJPS_STATUS = {
  RECEIVED: 1,
  ACCEPTED: 2,
  PAID: 3,
  PUBLISHED: 4,
  REJECTED: 5,
  REVISION_REQUIRED: 6,
} as const;

export async function getIjpsCounts(
  cfg?: IjpsConnectionConfig
): Promise<IjpsCounts> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [[totals]] = await conn.execute<any>(`
      SELECT
        COUNT(*) AS totalManuscripts,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS received,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS accepted,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS paid,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN statusID = ? THEN 1 ELSE 0 END) AS revisionRequired
      FROM ijps_tblmanuscript
      WHERE isActive = 1
    `, [
      IJPS_STATUS.RECEIVED,
      IJPS_STATUS.ACCEPTED,
      IJPS_STATUS.PAID,
      IJPS_STATUS.PUBLISHED,
      IJPS_STATUS.REJECTED,
      IJPS_STATUS.REVISION_REQUIRED,
    ]);

    const [[articles]] = await conn.execute<any>(
      "SELECT COUNT(*) AS cnt FROM ijps_tblarticle WHERE isActive = 1"
    );

    const [[authors]] = await conn.execute<any>(
      "SELECT COUNT(*) AS cnt FROM ijps_tblauthor WHERE isActive = 1"
    );

    const [[subscribers]] = await conn.execute<any>(
      "SELECT COUNT(*) AS cnt FROM ijps_tblsubscriber WHERE isActive = 1"
    );

    const [[employees]] = await conn.execute<any>(
      "SELECT COUNT(*) AS cnt FROM ijps_tblemployee WHERE isActive = 1"
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

export async function getIjpsRevenue(
  cfg?: IjpsConnectionConfig
): Promise<IjpsRevenue> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [apcRows] = await conn.execute<any>(
      "SELECT json_details FROM ijps_tblpayment WHERE is_deleted = 0"
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

export async function getIjpsMonthlyTrends(
  cfg?: IjpsConnectionConfig,
  months = 12
): Promise<MonthlyPoint[]> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [submissionRows] = await conn.execute<any>(`
      SELECT DATE_FORMAT(createdDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ijps_tblmanuscript
      WHERE isActive = 1 AND createdDate >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month
      ORDER BY month
    `, [months]);

    const [articleRows] = await conn.execute<any>(`
      SELECT DATE_FORMAT(createdDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ijps_tblarticle
      WHERE isActive = 1 AND createdDate >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month
      ORDER BY month
    `, [months]);

    const [acceptedRows] = await conn.execute<any>(`
      SELECT DATE_FORMAT(acceptedDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ijps_tblarticle
      WHERE isActive = 1 AND acceptedDate >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY month
      ORDER BY month
    `, [months]);

    const map = new Map<string, MonthlyPoint>();

    for (const r of submissionRows) {
      map.set(r.month, {
        month: r.month,
        submissions: Number(r.cnt),
        articles: 0,
        accepted: 0,
      });
    }

    for (const r of articleRows) {
      const existing = map.get(r.month) ?? {
        month: r.month,
        submissions: 0,
        articles: 0,
        accepted: 0,
      };
      existing.articles = Number(r.cnt);
      map.set(r.month, existing);
    }

    for (const r of acceptedRows) {
      const existing = map.get(r.month) ?? {
        month: r.month,
        submissions: 0,
        articles: 0,
        accepted: 0,
      };
      existing.accepted = Number(r.cnt);
      map.set(r.month, existing);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  } finally {
    await conn.end();
  }
}

export async function getIjpsArticleTypes(
  cfg?: IjpsConnectionConfig
): Promise<ArticleTypeStat[]> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [rows] = await conn.execute<any>(`
      SELECT at.articalTypeName AS name, COUNT(a.articleID) AS count
      FROM ijps_tblarticaltype at
      LEFT JOIN ijps_tblarticle a ON a.articalTypeID = at.articalTypeID AND a.isActive = 1
      GROUP BY at.articalTypeID, at.articalTypeName
      ORDER BY count DESC
    `);

    return rows.map((r: any) => ({
      name: r.name,
      count: Number(r.count ?? 0),
    }));
  } finally {
    await conn.end();
  }
}

export async function getIjpsRecentActivity(
  cfg?: IjpsConnectionConfig,
  limit = 8
): Promise<IjpsActivity[]> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [rows] = await conn.execute<any>(`
      SELECT description, createdDate
      FROM tblactivitylog
      WHERE isActive = 1
      ORDER BY createdDate DESC
      LIMIT ?
    `, [limit]);

    return rows.map((r: any, idx: number) => ({
      id: `ijps-act-${idx}`,
      text: r.description?.slice(0, 80) || "Activity",
      meta: "IJPS",
      time: formatRelativeTime(r.createdDate),
    }));
  } finally {
    await conn.end();
  }
}

export async function getIjpsEmployees(
  cfg?: IjpsConnectionConfig
): Promise<IjpsEmployee[]> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [rows] = await conn.execute<any>(`
      SELECT employeeID, name, email, designation, role
      FROM ijps_tblemployee
      WHERE isActive = 1
      ORDER BY employeeID
    `);

    return rows.map((r: any) => ({
      id: Number(r.employeeID),
      name: r.name,
      email: r.email,
      role: r.role || r.designation || "Staff",
      designation: r.designation,
    }));
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


// ---------------------------------------------------------------------------
// IJPS-specific page (/journals/ijps) data
// ---------------------------------------------------------------------------

export type IjpsPaymentMethod = {
  name: string;
  amount: number;
  pct: number;
  count: number;
};

export async function getIjpsPaymentMethods(
  cfg?: IjpsConnectionConfig
): Promise<IjpsPaymentMethod[]> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [rows] = await conn.execute<any>(
      "SELECT json_details FROM ijps_tblpayment WHERE is_deleted = 0"
    );

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

export async function getIjpsRecentTransactions(
  limit = 10,
  cfg?: IjpsConnectionConfig
): Promise<IjpsRecentTransaction[]> {
  const conn = await createIjpsConnection(cfg);
  try {
    const [rows] = await conn.execute<any>(`
      SELECT json_details, created_date, article_id
      FROM ijps_tblpayment
      WHERE is_deleted = 0
      ORDER BY created_date DESC
      LIMIT ?
    `, [limit]);

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
        id: `ijps-txn-${idx}`,
        date: new Date(r.created_date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        type: "Income" as const,
        category: "Article Processing",
        description: `Article ID: ${r.article_id || "N/A"}`,
        amount: Math.round(amount),
        mode: method,
        source: "Razorpay",
      };
    });
  } finally {
    await conn.end();
  }
}
