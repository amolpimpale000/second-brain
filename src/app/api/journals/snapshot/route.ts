import { NextRequest, NextResponse } from "next/server";
import { getJournalPeriodStats } from "@/lib/journal-queries";
import { getJpsPeriodStats } from "@/lib/jps-queries";

export const dynamic = "force-dynamic";

const CONNECTED_JOURNALS = [
  { code: "IJPS", prefix: "ijps" },
  { code: "IJSRT", prefix: "ijsrt" },
  { code: "IJMPS", prefix: "ijmps" },
  { code: "IJES", prefix: "ijes" },
];

function dateRangeFor(period: string): { from: string; to: string } {
  const now = new Date();
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
  const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

  if (period === "last_30_days") {
    const from = new Date(todayEnd);
    from.setUTCDate(from.getUTCDate() - 30);
    return { from: fmt(from), to: fmt(todayEnd) };
  }
  if (period === "last_month") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));
    return { from: fmt(from), to: fmt(to) };
  }
  if (period === "all_time") {
    return { from: "2000-01-01 00:00:00", to: fmt(todayEnd) };
  }
  // this_month (default)
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  return { from: fmt(from), to: fmt(todayEnd) };
}

export async function GET(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get("period") || "this_month";
    const { from, to } = dateRangeFor(period);

    const results = await Promise.allSettled([
      ...CONNECTED_JOURNALS.map((j) => getJournalPeriodStats(j.code, j.prefix, from, to)),
      getJpsPeriodStats(from, to),
    ]);
    const codes = [...CONNECTED_JOURNALS.map((j) => j.code), "JPS"];

    const byJournal = results.map((r, idx) => {
      if (r.status === "fulfilled") {
        const acceptance = r.value.manuscripts ? Math.round((r.value.published / r.value.manuscripts) * 1000) / 10 : 0;
        return { code: codes[idx], manuscripts: r.value.manuscripts, published: r.value.published, revenue: r.value.revenue, acceptance };
      }
      return { code: codes[idx], manuscripts: 0, published: 0, revenue: 0, acceptance: 0, error: String(r.reason) };
    });

    return NextResponse.json({ period, byJournal });
  } catch (err) {
    console.error("Journal snapshot lookup error:", err);
    const msg = err instanceof Error ? err.message : "Failed to fetch snapshot";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
