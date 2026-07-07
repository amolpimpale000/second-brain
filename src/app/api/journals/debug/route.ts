import { NextResponse } from "next/server";
import { createIjpsConnection, getIjpsConfigFromEnv } from "@/lib/ijps-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const debug: Record<string, unknown> = {};

  try {
    const cfg = getIjpsConfigFromEnv();
    debug.host = cfg.host;
    debug.port = cfg.port;
    debug.database = cfg.database;
    debug.user = cfg.user;
    debug.passwordLength = cfg.password?.length ?? 0;
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
