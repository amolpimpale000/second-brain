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
        const [countryTables]: any = await conn.execute(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%countr%'`
        );
        const [sampleRows]: any = await conn.execute(
          `SELECT countryID, COUNT(*) as cnt FROM ${j.prefix}_tblmanuscript GROUP BY countryID ORDER BY cnt DESC LIMIT 10`
        );
        let countryTableCols: any = null;
        let countryTableSample: any = null;
        if (countryTables.length > 0) {
          const tname = countryTables[0].TABLE_NAME;
          const [cols]: any = await conn.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [tname]
          );
          const [sample]: any = await conn.execute(`SELECT * FROM \`${tname}\` LIMIT 5`);
          countryTableCols = { table: tname, cols: cols.map((c: any) => c.COLUMN_NAME) };
          countryTableSample = sample;
        }
        results[j.code] = { countryTables: countryTables.map((t: any) => t.TABLE_NAME), sampleRows, countryTableCols, countryTableSample };
      } finally {
        await conn.end();
      }
    } catch (err) {
      results[j.code] = { error: err instanceof Error ? err.message : "failed" };
    }
  }
  return NextResponse.json(results);
}
