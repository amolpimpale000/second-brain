import net from "net";
import { Client } from "pg";

export const dynamic = "force-dynamic";

function tcpProbe(host: string, port: number, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      socket.destroy();
      resolve("connected");
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve("timeout");
    });
    socket.on("error", (err) => {
      resolve(`error: ${err.message}`);
    });
    socket.connect(port, host);
  });
}

export async function GET() {
  const host = process.env.JOURNAL_JPS_DB_HOST || "147.93.31.183";
  const port = Number(process.env.JOURNAL_JPS_DB_PORT || "5432");
  const database = process.env.JOURNAL_JPS_DB_NAME || "jpsjournal";
  const user = process.env.JOURNAL_JPS_DB_USER || "jpsjournal";
  const password = process.env.JOURNAL_JPS_DB_PASSWORD || "";

  const tcp = await tcpProbe(host, port);

  let auth = "not attempted";
  let tables: string[] = [];
  const client = new Client({ host, port, database, user, password, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    await client.query("SELECT 1");
    auth = "success";

    const [
      manuscriptCount,
      articleCount,
      paymentCount,
      employeeCount,
      statusBreakdown,
      typeBreakdown,
      paymentStatusBreakdown,
      paymentSample,
      manuscriptSample,
      monthlySubmissions,
      employeeSample,
    ] = await Promise.all([
      client.query("SELECT count(*) FROM manuscripts"),
      client.query("SELECT count(*) FROM articles"),
      client.query("SELECT count(*) FROM payments"),
      client.query("SELECT count(*) FROM employees"),
      client.query("SELECT status, count(*) FROM manuscripts GROUP BY status ORDER BY count(*) DESC"),
      client.query("SELECT article_type, count(*) FROM manuscripts GROUP BY article_type ORDER BY count(*) DESC"),
      client.query("SELECT status, count(*), sum(amount) FROM payments GROUP BY status ORDER BY count(*) DESC"),
      client.query("SELECT amount, currency, status, payment_method, paid_at, created_at FROM payments ORDER BY created_at DESC LIMIT 5"),
      client.query("SELECT manuscript_id, title, status, article_type, submission_date, publication_date FROM manuscripts ORDER BY created_at DESC LIMIT 5"),
      client.query(
        "SELECT to_char(submission_date, 'YYYY-MM') AS month, count(*) FROM manuscripts WHERE submission_date IS NOT NULL GROUP BY 1 ORDER BY 1 DESC LIMIT 12"
      ),
      client.query(
        "SELECT e.department, e.position, e.can_manage_manuscripts, e.can_manage_users, e.is_active, u.first_name, u.last_name, u.email FROM employees e LEFT JOIN users u ON u.id = e.user_id LIMIT 20"
      ),
    ]);

    return Response.json({
      host, port, tcp, auth,
      manuscriptCount: manuscriptCount.rows[0].count,
      articleCount: articleCount.rows[0].count,
      paymentCount: paymentCount.rows[0].count,
      employeeCount: employeeCount.rows[0].count,
      statusBreakdown: statusBreakdown.rows,
      typeBreakdown: typeBreakdown.rows,
      paymentStatusBreakdown: paymentStatusBreakdown.rows,
      paymentSample: paymentSample.rows,
      manuscriptSample: manuscriptSample.rows,
      monthlySubmissions: monthlySubmissions.rows,
      employeeSample: employeeSample.rows,
    });
  } catch (err: any) {
    auth = `error: ${err.message}`;
  } finally {
    await client.end().catch(() => {});
  }

  return Response.json({ host, port, tcp, auth, tableCount: tables.length, tables });
}
