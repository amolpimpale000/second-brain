import { NextResponse } from "next/server";
import { Client } from "pg";

export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — checks whether Hostinger's server can reach the
// JPS PostgreSQL host at all. No credentials/content ever returned.
export async function GET() {
  const host = process.env.JOURNAL_JPS_DB_HOST;
  const port = Number(process.env.JOURNAL_JPS_DB_PORT || "5432");
  const database = process.env.JOURNAL_JPS_DB_NAME;
  const user = process.env.JOURNAL_JPS_DB_USER;
  const password = process.env.JOURNAL_JPS_DB_PASSWORD;

  const debug: Record<string, unknown> = { host, port, hasDb: !!database, hasUser: !!user, hasPassword: !!password };

  if (!host || !database || !user || !password) {
    debug.status = "config-missing";
    return NextResponse.json(debug);
  }

  const client = new Client({ host, port, database, user, password, connectionTimeoutMillis: 8000, ssl: false });
  try {
    await client.connect();
    const res = await client.query("SELECT current_database() AS db");
    debug.status = "ok";
    debug.db = res.rows[0]?.db;
    await client.end();
  } catch (err: any) {
    debug.status = "error";
    debug.error = err.message;
    debug.code = err.code;
  }
  return NextResponse.json(debug);
}
