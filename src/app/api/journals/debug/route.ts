import { NextResponse } from "next/server";
import { createIjpsConnection } from "@/lib/ijps-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const debug: Record<string, unknown> = {
    host: process.env.JOURNAL_IJPS_DB_HOST,
    port: process.env.JOURNAL_IJPS_DB_PORT,
    database: process.env.JOURNAL_IJPS_DB_NAME,
    user: process.env.JOURNAL_IJPS_DB_USER,
    hasPassword: !!process.env.JOURNAL_IJPS_DB_PASSWORD,
  };

  try {
    const conn = await createIjpsConnection();
    try {
      const [rows] = await conn.execute(
        "SELECT COUNT(*) AS cnt FROM ijps_tblmanuscript WHERE isActive = 1"
      );
      debug.status = "ok";
      debug.manuscriptCount = (rows as any[])[0].cnt;
    } finally {
      await conn.end();
    }
  } catch (err: any) {
    debug.status = "error";
    debug.error = err.message;
    debug.code = err.code;
  }

  return NextResponse.json(debug);
}
