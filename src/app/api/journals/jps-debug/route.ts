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
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name LIMIT 100"
    );
    tables = res.rows.map((r: any) => r.table_name);
  } catch (err: any) {
    auth = `error: ${err.message}`;
  } finally {
    await client.end().catch(() => {});
  }

  return Response.json({ host, port, tcp, auth, tableCount: tables.length, tables });
}
