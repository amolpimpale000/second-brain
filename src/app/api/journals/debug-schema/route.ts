import { NextRequest, NextResponse } from "next/server";
import { createJournalConnection } from "@/lib/journal-db";
import { createJpsConnection } from "@/lib/jps-db";

export const dynamic = "force-dynamic";

// TEMPORARY diagnostic route — inspects manuscript table schema to locate a
// "note_flag" column. Remove after use. Read-only (DESCRIBE / information_schema).
const CONNECTED_JOURNALS = [
  { code: "IJPS", prefix: "ijps" },
  { code: "IJSRT", prefix: "ijsrt" },
  { code: "IJMPS", prefix: "ijmps" },
  { code: "IJES", prefix: "ijes" },
];

export async function GET(request: NextRequest) {
  const expected = process.env.WHATSAPP_ALERTS_CRON_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result: Record<string, unknown> = {};

  for (const j of CONNECTED_JOURNALS) {
    try {
      const conn = await createJournalConnection(j.code);
      try {
        const [cols] = await conn.execute<any>(`DESCRIBE ${j.prefix}_tblmanuscript`);
        result[j.code] = cols.map((c: any) => ({ field: c.Field, type: c.Type }));
      } finally {
        await conn.end();
      }
    } catch (e) {
      result[j.code] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  try {
    const client = await createJpsConnection();
    try {
      const res = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'manuscripts'`
      );
      result["JPS"] = res.rows;
    } finally {
      await client.end().catch(() => {});
    }
  } catch (e) {
    result["JPS"] = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(result);
}
