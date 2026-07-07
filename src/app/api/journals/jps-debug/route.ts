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
    const focus = ["manuscripts", "articles", "payments", "employees", "issues", "status_history", "users"];
    const cols: Record<string, any[]> = {};
    for (const t of focus) {
      const r = await client.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
        [t]
      );
      cols[t] = r.rows;
    }
    tables = Object.keys(cols);
    return Response.json({ host, port, tcp, auth, cols });
  } catch (err: any) {
    auth = `error: ${err.message}`;
  } finally {
    await client.end().catch(() => {});
  }

  return Response.json({ host, port, tcp, auth, tableCount: tables.length, tables });
}
