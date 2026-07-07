import { NextResponse } from "next/server";
import { createIjpsConnection, getIjpsConfigFromEnv } from "@/lib/ijps-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const debug: Record<string, unknown> = {};

  try {
    const raw = process.env.JOURNAL_IJPS_DB_PASSWORD ?? "";
    const cfg = getIjpsConfigFromEnv();
    debug.host = cfg.host;
    debug.port = cfg.port;
    debug.database = cfg.database;
    debug.user = cfg.user;
    debug.passwordLength = cfg.password?.length ?? 0;
    // Char codes only (never the actual characters) so the boundary/whitespace
    // structure of the stored secret can be diagnosed without exposing it.
    debug.rawLength = raw.length;
    debug.rawFirstCodes = Array.from(raw.slice(0, 3)).map((c) => c.charCodeAt(0));
    debug.rawLastCodes = Array.from(raw.slice(-3)).map((c) => c.charCodeAt(0));
    debug.cleanedFirstCodes = Array.from((cfg.password ?? "").slice(0, 3)).map((c) => c.charCodeAt(0));
    debug.cleanedLastCodes = Array.from((cfg.password ?? "").slice(-3)).map((c) => c.charCodeAt(0));
  } catch (err: any) {
    debug.configError = err.message;
    return NextResponse.json(debug);
  }

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
    debug.errno = err.errno;
  }

  return NextResponse.json(debug);
}
