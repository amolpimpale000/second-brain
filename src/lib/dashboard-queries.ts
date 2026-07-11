// Aggregates real data for the landing dashboard (/) from the app's actual
// data sources — no fabricated numbers. Falls back to null/empty per-section
// so one failing source never blanks the whole page.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getFinanceData, type FinanceData } from "./finance-store";
import { getTasks, getVault } from "./queries";
import { tasks as sampleTasks, vaultAccounts as sampleVaultAccounts, type Task, type VaultAccount } from "./data";
import { getJournalDashboardData } from "./journal-dashboard";
import { readManifest, type StoredDoc } from "./documents-store";

export type BusinessSummary = {
  revenue: number; revenueDelta: number; revenueSpark: number[];
  expenses: number; expensesDelta: number; expenseSpark: number[];
  profit: number; profitDelta: number; profitSpark: number[];
  clients: number; clientsSpark: number[];
};

// The real Notes page reads/writes the richer `user_notes` table directly
// (client-side) — this is a separate, minimal read-only mirror of that same
// table for the dashboard preview, not the old `notes` table getNotes() uses.
export type QuickNote = { id: string; title: string; time: string };

let _notesAdmin: SupabaseClient | null = null;
async function getQuickNotes(limit = 3): Promise<QuickNote[] | null> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!_notesAdmin) _notesAdmin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await _notesAdmin
    .from("user_notes")
    .select("id,title,time")
    .eq("trashed", false)
    .order("sort", { ascending: true })
    .limit(limit);
  if (error || !data) return null;
  return data.map((r) => ({ id: r.id as string, title: r.title as string, time: r.time as string }));
}

export type DashboardData = {
  finance: FinanceData;
  // null means the underlying table is empty (no real rows entered yet) —
  // distinguished from [] so the UI can show an honest empty state instead
  // of the sample-data fallback these queries use elsewhere.
  tasks: Task[] | null;
  notes: QuickNote[] | null;
  vault: VaultAccount[] | null;
  documents: StoredDoc[];
  business: BusinessSummary | null;
};

const EMPTY_FINANCE: FinanceData = { accounts: [], transactions: [], goals: [], loans: [], investments: [], bills: [], dues: [], budgets: [] };

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

export async function getDashboardData(): Promise<DashboardData> {
  const [finance, tasksRaw, notes, vaultRaw, documentsRaw, journal] = await Promise.all([
    getFinanceData().catch((err) => { console.error("Dashboard finance fetch failed:", err); return EMPTY_FINANCE; }),
    getTasks().catch(() => sampleTasks),
    getQuickNotes().catch((err) => { console.error("Dashboard notes fetch failed:", err); return null; }),
    getVault().catch(() => sampleVaultAccounts),
    readManifest().catch((err) => { console.error("Dashboard documents fetch failed:", err); return []; }),
    getJournalDashboardData().catch((err) => { console.error("Dashboard journal fetch failed:", err); return null; }),
  ]);

  const tasks = tasksRaw === sampleTasks ? null : tasksRaw;
  const vault = vaultRaw === sampleVaultAccounts ? null : vaultRaw;
  const documents = documentsRaw.filter((d) => !d.trashed).slice(0, 4);

  let business: BusinessSummary | null = null;
  if (journal) {
    const revenue = journal.businessProfitability.reduce((s, b) => s + b.revenue, 0);
    const expenses = journal.businessProfitability.reduce((s, b) => s + b.expenses, 0);
    const profit = revenue - expenses;

    const clientsStr = journal.jmStats.find((s) => s.label === "Total Users")?.value ?? "0";
    const clients = Number(String(clientsStr).replace(/[^0-9]/g, "")) || 0;

    const now = new Date();
    const thisKey = monthKey(now);
    const lastKey = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

    const revenueForMonth = (key: string) => {
      const row = journal.monthlyRevenueByBusiness.data.find((r) => String(r.label) === key);
      if (!row) return 0;
      return journal.monthlyRevenueByBusiness.series.reduce((s, ser) => s + Number(row[ser.key] ?? 0), 0);
    };
    const expenseForMonth = (key: string) =>
      journal.businessExpenses.filter((e) => e.date.slice(0, 7) === key).reduce((s, e) => s + e.amount, 0);

    const revenueDelta = (() => {
      const last = revenueForMonth(lastKey);
      return last > 0 ? Math.round(((revenueForMonth(thisKey) - last) / last) * 1000) / 10 : 0;
    })();
    const expensesDelta = (() => {
      const last = expenseForMonth(lastKey);
      return last > 0 ? Math.round(((expenseForMonth(thisKey) - last) / last) * 1000) / 10 : 0;
    })();
    const profitDelta = Math.round((revenueDelta - expensesDelta) * 10) / 10;

    const revenueSpark = journal.monthlyRevenueByBusiness.data.map((row) =>
      journal.monthlyRevenueByBusiness.series.reduce((s, ser) => s + Number(row[ser.key] ?? 0), 0)
    );
    const expenseSpark = journal.monthlyRevenueByBusiness.data.map((row) => expenseForMonth(String(row.label)));
    const profitSpark = revenueSpark.map((r, i) => r - (expenseSpark[i] ?? 0));
    const clientsSpark = new Array(Math.max(revenueSpark.length, 2)).fill(clients);

    business = {
      revenue, revenueDelta, revenueSpark: revenueSpark.length ? revenueSpark : [0, 0],
      expenses, expensesDelta, expenseSpark: expenseSpark.length ? expenseSpark : [0, 0],
      profit, profitDelta, profitSpark: profitSpark.length ? profitSpark : [0, 0],
      clients, clientsSpark,
    };
  }

  return { finance, tasks, notes, vault, documents, business };
}
