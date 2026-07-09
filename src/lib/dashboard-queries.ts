// Aggregates real data for the landing dashboard (/) from the app's actual
// data sources — no fabricated numbers. Falls back to null/empty per-section
// so one failing source never blanks the whole page.
import { getFinanceData, type FinanceData } from "./finance-store";
import { getTasks, getNotes, getVault } from "./queries";
import { tasks as sampleTasks, notes as sampleNotes, vaultAccounts as sampleVaultAccounts, type Task, type Note, type VaultAccount } from "./data";
import { getJournalDashboardData } from "./journal-dashboard";

export type BusinessSummary = {
  revenue: number; revenueDelta: number; revenueSpark: number[];
  expenses: number; expensesDelta: number; expenseSpark: number[];
  profit: number; profitDelta: number; profitSpark: number[];
  clients: number; clientsSpark: number[];
};

export type DashboardData = {
  finance: FinanceData;
  // null means the underlying table is empty (no real rows entered yet) —
  // distinguished from [] so the UI can show an honest empty state instead
  // of the sample-data fallback these queries use elsewhere.
  tasks: Task[] | null;
  notes: Note[] | null;
  vault: VaultAccount[] | null;
  business: BusinessSummary | null;
};

const EMPTY_FINANCE: FinanceData = { accounts: [], transactions: [], goals: [], loans: [], investments: [], bills: [], dues: [], budgets: [] };

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

export async function getDashboardData(): Promise<DashboardData> {
  const [finance, tasksRaw, notesRaw, vaultRaw, journal] = await Promise.all([
    getFinanceData().catch((err) => { console.error("Dashboard finance fetch failed:", err); return EMPTY_FINANCE; }),
    getTasks().catch(() => sampleTasks),
    getNotes().catch(() => sampleNotes),
    getVault().catch(() => sampleVaultAccounts),
    getJournalDashboardData().catch((err) => { console.error("Dashboard journal fetch failed:", err); return null; }),
  ]);

  const tasks = tasksRaw === sampleTasks ? null : tasksRaw;
  const notes = notesRaw === sampleNotes ? null : notesRaw;
  const vault = vaultRaw === sampleVaultAccounts ? null : vaultRaw;

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

  return { finance, tasks, notes, vault, business };
}
