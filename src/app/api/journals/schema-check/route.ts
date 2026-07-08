import { NextResponse } from "next/server";
import { createJournalConnection } from "@/lib/journal-db";

export const dynamic = "force-dynamic";

const JOURNALS = [
  { code: "IJPS", prefix: "ijps" },
  { code: "IJSRT", prefix: "ijsrt" },
  { code: "IJMPS", prefix: "ijmps" },
  { code: "IJES", prefix: "ijes" },
];

export async function GET() {
  const results: Record<string, any> = {};
  for (const j of JOURNALS) {
    try {
      const conn = await createJournalConnection(j.code);
      try {
        const [manuscriptCols]: any = await conn.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME LIKE '%countr%'`,
          [`${j.prefix}_tblmanuscript`]
        );
        const [authorCols]: any = await conn.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME LIKE '%countr%'`,
          [`${j.prefix}_tblauthor`]
        );
        results[j.code] = {
          manuscriptCountryCols: manuscriptCols.map((r: any) => r.COLUMN_NAME),
          authorCountryCols: authorCols.map((r: any) => r.COLUMN_NAME),
        };
      } finally {
        await conn.end();
      }
    } catch (err) {
      results[j.code] = { error: err instanceof Error ? err.message : "failed" };
    }
  }
  return NextResponse.json(results);
}
