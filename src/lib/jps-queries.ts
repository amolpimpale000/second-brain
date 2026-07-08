import { createJpsConnection } from "./jps-db";

// ---------------------------------------------------------------------------
// Read-only queries against JPS's Postgres schema (manuscripts, articles,
// payments, employees, issues, status_history, users). SELECT-only.
// ---------------------------------------------------------------------------

export type JpsCounts = {
  totalManuscripts: number;
  publishedArticles: number;
  submitted: number;
  underReview: number;
  accepted: number;
  rejected: number;
  revisionRequired: number;
  paid: number;
  published: number;
  totalEmployees: number;
  totalAuthors: number;
  totalSubscribers: number;
};

export type JpsRevenue = {
  completed: number;
  pending: number;
  total: number;
};

export type JpsMonthlyPoint = {
  month: string;
  submissions: number;
};

export type JpsTypeStat = {
  name: string;
  count: number;
};

const TYPE_LABEL: Record<string, string> = {
  research_paper: "Research Paper",
  review_paper: "Review Paper",
  case_study: "Case Study",
  mini_review: "Mini Review",
  short_communication: "Short Communication",
};

export type JpsEmployee = {
  id: number;
  name: string;
  email: string;
  role: string;
  designation?: string;
};

export type JpsTransaction = {
  id: string;
  date: string;
  type: "Income";
  category: string;
  description: string;
  amount: number;
  mode: string;
  source: string;
};

export type JpsActivity = {
  id: string;
  text: string;
  meta: string;
  time: string;
};

function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN");
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "submitted",
  under_review: "moved to review",
  accepted: "accepted",
  rejected: "rejected",
  revision_required: "sent for revision",
  paid: "marked paid",
  published: "published",
};

export async function getJpsCounts(): Promise<JpsCounts> {
  const client = await createJpsConnection();
  try {
    const [statusRes, employeeRes, authorRes, subscriberRes] = await Promise.all([
      client.query("SELECT status, count(*) FROM manuscripts GROUP BY status"),
      client.query("SELECT count(*) FROM employees WHERE is_active = true"),
      client.query("SELECT count(DISTINCT author_id) FROM manuscripts WHERE author_id IS NOT NULL"),
      client.query("SELECT count(*) FROM newsletter_subscriptions").catch(() => ({ rows: [{ count: 0 }] })),
    ]);
    const byStatus = new Map<string, number>();
    for (const row of statusRes.rows) byStatus.set(row.status, Number(row.count));

    const totalManuscripts = Array.from(byStatus.values()).reduce((s, n) => s + n, 0);
    const published = byStatus.get("published") ?? 0;

    return {
      totalManuscripts,
      publishedArticles: published,
      submitted: byStatus.get("submitted") ?? 0,
      underReview: byStatus.get("under_review") ?? 0,
      accepted: byStatus.get("accepted") ?? 0,
      rejected: byStatus.get("rejected") ?? 0,
      revisionRequired: byStatus.get("revision_required") ?? 0,
      paid: byStatus.get("paid") ?? 0,
      published,
      totalEmployees: Number(employeeRes.rows[0].count),
      totalAuthors: Number(authorRes.rows[0].count),
      totalSubscribers: Number(subscriberRes.rows[0].count),
    };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getJpsRevenue(): Promise<JpsRevenue> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      "SELECT status, coalesce(sum(amount), 0) AS total FROM payments WHERE status IN ('completed', 'pending') GROUP BY status"
    );
    let completed = 0;
    let pending = 0;
    for (const row of res.rows) {
      const rupees = Number(row.total) / 100;
      if (row.status === "completed") completed = rupees;
      if (row.status === "pending") pending = rupees;
    }
    return { completed, pending, total: completed };
  } finally {
    await client.end().catch(() => {});
  }
}

export type JpsPaymentMethod = {
  name: string;
  amount: number;
  pct: number;
  count: number;
};

export async function getJpsPaymentMethods(): Promise<JpsPaymentMethod[]> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      "SELECT coalesce(payment_method, 'Online') AS method, count(*), coalesce(sum(amount), 0) AS total FROM payments WHERE status = 'completed' GROUP BY 1"
    );
    const totalAmount = res.rows.reduce((s, r) => s + Number(r.total), 0);
    return res.rows
      .map((r) => {
        const amount = Math.round(Number(r.total) / 100);
        return {
          name: String(r.method).charAt(0).toUpperCase() + String(r.method).slice(1),
          amount,
          pct: totalAmount ? Math.round((Number(r.total) / totalAmount) * 100) : 0,
          count: Number(r.count),
        };
      })
      .sort((a, b) => b.amount - a.amount);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getJpsMonthlyTrends(): Promise<JpsMonthlyPoint[]> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      `SELECT to_char(date_trunc('month', submission_date), 'YYYY-MM') AS month,
              date_trunc('month', submission_date) AS sort_key,
              count(*) AS count
       FROM manuscripts
       WHERE submission_date IS NOT NULL
       GROUP BY 1, 2
       ORDER BY 2 ASC
       LIMIT 12`
    );
    return res.rows.map((r) => ({ month: r.month, submissions: Number(r.count) }));
  } finally {
    await client.end().catch(() => {});
  }
}

export type JpsMonthlyRevenuePoint = { month: string; amount: number };

export async function getJpsMonthlyRevenue(): Promise<JpsMonthlyRevenuePoint[]> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      `SELECT to_char(date_trunc('month', paid_at), 'YYYY-MM') AS month,
              date_trunc('month', paid_at) AS sort_key,
              coalesce(sum(amount), 0) AS total
       FROM payments
       WHERE status = 'completed' AND paid_at IS NOT NULL
       GROUP BY 1, 2
       ORDER BY 2 ASC
       LIMIT 12`
    );
    return res.rows.map((r) => ({ month: r.month, amount: Math.round(Number(r.total) / 100) }));
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getJpsTypeBreakdown(): Promise<JpsTypeStat[]> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      "SELECT article_type, count(*) FROM manuscripts GROUP BY article_type ORDER BY count(*) DESC"
    );
    return res.rows.map((r) => ({
      name: TYPE_LABEL[r.article_type] || r.article_type,
      count: Number(r.count),
    }));
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getJpsEmployees(): Promise<JpsEmployee[]> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      `SELECT e.id, e.department, e.position, e.is_active, u.first_name, u.last_name, u.email
       FROM employees e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.is_active = true
       ORDER BY e.created_at ASC`
    );
    return res.rows.map((r) => ({
      id: Number(r.id),
      name: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Staff",
      email: r.email || "—",
      role: r.position || r.department || "Staff",
      designation: r.department,
    }));
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getJpsRecentTransactions(limit = 30): Promise<JpsTransaction[]> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      `SELECT id, amount, status, customer_name, article_id, payment_method, paid_at, created_at
       FROM payments
       WHERE status = 'completed'
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map((r) => ({
      id: `jps-txn-${r.id}`,
      date: new Date(r.paid_at || r.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      type: "Income" as const,
      category: "Article Processing",
      description: `Article ID: ${r.article_id || "N/A"}`,
      amount: Math.round(Number(r.amount) / 100),
      mode: r.payment_method ? String(r.payment_method).toUpperCase() : "Online",
      source: "Razorpay",
    }));
  } finally {
    await client.end().catch(() => {});
  }
}

export async function getJpsRecentActivity(limit = 8): Promise<JpsActivity[]> {
  const client = await createJpsConnection();
  try {
    const res = await client.query(
      `SELECT sh.id, sh.new_status, sh.created_at, m.manuscript_id, m.title
       FROM status_history sh
       JOIN manuscripts m ON m.id = sh.manuscript_id
       ORDER BY sh.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map((r) => ({
      id: `jps-act-${r.id}`,
      text: `${r.manuscript_id} ${STATUS_LABEL[r.new_status] || r.new_status}: ${String(r.title).slice(0, 60)}`,
      meta: "JPS",
      time: formatRelativeTime(r.created_at),
    }));
  } finally {
    await client.end().catch(() => {});
  }
}
