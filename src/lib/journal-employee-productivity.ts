import { unstable_cache } from "next/cache";
import { getJournalDailyPublishedByEmployees, getJournalDailyPublishedTotal, type DailyPublished } from "./journal-queries";
import { getJpsDailyPublishedTotal } from "./jps-queries";

// ---------------------------------------------------------------------------
// Real per-day published-paper counts for the redesigned Employee
// Productivity section on /journal-management. Attribution is via
// article.createdByUserID = employeeID (the same verified signal used by the
// "employee idle" alert) — only for the specific employees the owner named;
// two journals (IJES, JPS) show a journal-wide total instead of per-employee
// breakdown, per instruction.
// ---------------------------------------------------------------------------

export type JournalCode = "IJPS" | "IJSRT" | "IJMPS" | "IJES" | "JPS";

// Which employees to track per journal — undefined series list = journal-wide total.
const TRACKED: Record<JournalCode, { prefix?: string; employees?: string[]; color: Record<string, string> }> = {
  IJPS: {
    prefix: "ijps",
    employees: ["Akanksha", "Pranita", "Bhakti"],
    color: { Akanksha: "#6366f1", Pranita: "#22c55e", Bhakti: "#f59e0b" },
  },
  IJSRT: { prefix: "ijsrt", employees: ["Tejaswini"], color: { Tejaswini: "#0ea5e9" } },
  IJMPS: { prefix: "ijmps", employees: ["Jyoti"], color: { Jyoti: "#14b8a6" } },
  IJES: { prefix: "ijes", color: { Total: "#f97316" } },
  JPS: { color: { Total: "#ec4899" } },
};

export type JournalProductivity = {
  code: JournalCode;
  name: string;
  seriesKeys: string[]; // employee names, or ["Total"]
  color: Record<string, string>;
  days: DailyPublished[];
  totalInPeriod: number;
};

async function fetchJournalProductivity(code: JournalCode, days: number): Promise<JournalProductivity> {
  const cfg = TRACKED[code];
  let series: DailyPublished[];
  let seriesKeys: string[];

  try {
    if (code === "JPS") {
      series = await getJpsDailyPublishedTotal(days);
      seriesKeys = ["Total"];
    } else if (cfg.employees) {
      series = await getJournalDailyPublishedByEmployees(code, cfg.prefix!, cfg.employees, days);
      seriesKeys = cfg.employees;
    } else {
      series = await getJournalDailyPublishedTotal(code, cfg.prefix!, days);
      seriesKeys = ["Total"];
    }
  } catch (err) {
    console.error(`Employee productivity fetch failed for ${code}:`, err instanceof Error ? err.message : err);
    series = [];
    seriesKeys = cfg.employees ?? ["Total"];
  }

  const totalInPeriod = series.reduce((s, d) => s + d.total, 0);
  return { code, name: `${code} Journal`, seriesKeys, color: cfg.color, days: series, totalInPeriod };
}

async function fetchAllProductivity(days: number): Promise<JournalProductivity[]> {
  const codes: JournalCode[] = ["IJPS", "IJSRT", "IJMPS", "IJES", "JPS"];
  return Promise.all(codes.map((c) => fetchJournalProductivity(c, days)));
}

// Cached per distinct `days` value (30 or 45) for 30 minutes — this reads 5
// journal databases with a day-by-day aggregation, not something that needs
// per-request freshness.
const cachedProductivity = unstable_cache(fetchAllProductivity, ["journal-employee-productivity"], { revalidate: 1800 });

export async function getEmployeeProductivity(days: number): Promise<JournalProductivity[]> {
  return cachedProductivity(days);
}
