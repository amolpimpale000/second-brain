import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Journal-level expenses aren't tracked in any journal's read-only MySQL
 * database (confirmed by schema inspection), so this app can't source real
 * expense figures from there — and must never write to those databases
 * regardless. Expenses are stored in this app's own Supabase Postgres table
 * (journal_expenses), completely separate from the journal databases.
 *
 * This used to be a single JSON blob in Supabase Storage, read-modified-then
 * rewritten on every change. That pattern proved unreliable in production —
 * reads shortly after a write could return a stale pre-write copy (observed
 * even after disabling Storage's default Cache-Control), and the next write
 * would then silently persist that stale copy, erasing recently-added
 * entries. A real table with atomic INSERT/UPDATE/DELETE avoids the entire
 * bug class since there's no read-all-then-write-all step.
 */

const TABLE = "journal_expenses";

export type JournalExpense = {
  id: string;
  journalCode: string;
  category: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  mode: string;
  description: string;
  paymentTo: string;
  billUrl?: string;
  billName?: string;
  createdAt: string;
};

type ExpenseRow = {
  id: string;
  journal_code: string;
  category: string;
  amount: number;
  date: string;
  mode: string;
  description: string;
  payment_to: string;
  bill_url: string | null;
  bill_name: string | null;
  created_at: string;
};

function rowToExpense(row: ExpenseRow): JournalExpense {
  return {
    id: row.id,
    journalCode: row.journal_code,
    category: row.category,
    amount: Number(row.amount),
    date: row.date,
    mode: row.mode,
    description: row.description,
    paymentTo: row.payment_to,
    billUrl: row.bill_url ?? undefined,
    billName: row.bill_name ?? undefined,
    createdAt: row.created_at,
  };
}

let _client: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Expense storage is not configured (url:${!!url} key:${!!key}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export async function listExpenses(journalCode: string): Promise<JournalExpense[]> {
  const sb = admin();
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .eq("journal_code", journalCode)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ExpenseRow[] | null ?? []).map(rowToExpense);
}

// All expenses across every journal, for the /journal-management expense journal.
export async function listCombinedExpenses(): Promise<JournalExpense[]> {
  const sb = admin();
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ExpenseRow[] | null ?? []).map(rowToExpense);
}

export async function addExpenses(inputs: Omit<JournalExpense, "id" | "createdAt">[]): Promise<JournalExpense[]> {
  const sb = admin();
  const rows = inputs.map((input) => ({
    id: uid(),
    journal_code: input.journalCode,
    category: input.category,
    amount: input.amount,
    date: input.date,
    mode: input.mode,
    description: input.description,
    payment_to: input.paymentTo,
    bill_url: input.billUrl ?? null,
    bill_name: input.billName ?? null,
  }));
  const { data, error } = await sb.from(TABLE).insert(rows).select();
  if (error) throw error;
  return (data as ExpenseRow[] | null ?? []).map(rowToExpense);
}

export async function addExpense(input: Omit<JournalExpense, "id" | "createdAt">): Promise<JournalExpense> {
  const [created] = await addExpenses([input]);
  return created;
}

export async function updateExpense(
  id: string,
  patch: Partial<Omit<JournalExpense, "id" | "createdAt">>
): Promise<JournalExpense | null> {
  const sb = admin();
  const dbPatch: Partial<ExpenseRow> = {};
  if (patch.journalCode !== undefined) dbPatch.journal_code = patch.journalCode;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.amount !== undefined) dbPatch.amount = patch.amount;
  if (patch.date !== undefined) dbPatch.date = patch.date;
  if (patch.mode !== undefined) dbPatch.mode = patch.mode;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.paymentTo !== undefined) dbPatch.payment_to = patch.paymentTo;
  if (patch.billUrl !== undefined) dbPatch.bill_url = patch.billUrl;
  if (patch.billName !== undefined) dbPatch.bill_name = patch.billName;

  const { data, error } = await sb.from(TABLE).update(dbPatch).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data ? rowToExpense(data as ExpenseRow) : null;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const sb = admin();
  const { data, error } = await sb.from(TABLE).delete().eq("id", id).select();
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
