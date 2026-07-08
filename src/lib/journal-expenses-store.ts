import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Journal-level expenses aren't tracked in any journal's read-only MySQL
 * database (confirmed by schema inspection), so this app can't source real
 * expense figures from there — and must never write to those databases
 * regardless. Expenses entered here are stored in their own private Supabase
 * Storage bucket (same proven pattern as documents-store.ts), completely
 * separate from the journal databases.
 */

const BUCKET = "journal-expenses";
const MANIFEST = "expenses.json";

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

export async function ensureExpensesBucket() {
  const sb = admin();
  const { data } = await sb.storage.getBucket(BUCKET);
  if (!data) {
    await sb.storage.createBucket(BUCKET, { public: false, fileSizeLimit: "5MB" });
  }
}

export async function readAllExpenses(): Promise<JournalExpense[]> {
  const sb = admin();
  const { data, error } = await sb.storage.from(BUCKET).download(MANIFEST);
  if (error || !data) return [];
  try {
    return JSON.parse(await data.text());
  } catch {
    return [];
  }
}

async function writeAllExpenses(expenses: JournalExpense[]) {
  const sb = admin();
  const body = new Blob([JSON.stringify(expenses, null, 2)], { type: "application/json" });
  const { error } = await sb.storage.from(BUCKET).upload(MANIFEST, body, {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw error;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export async function listExpenses(journalCode: string): Promise<JournalExpense[]> {
  await ensureExpensesBucket();
  const all = await readAllExpenses();
  return all
    .filter((e) => e.journalCode === journalCode)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

// All expenses across every journal, for the /journal-management expense journal.
export async function listCombinedExpenses(): Promise<JournalExpense[]> {
  await ensureExpensesBucket();
  const all = await readAllExpenses();
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

// The manifest is a single JSON blob (see readAllExpenses/writeAllExpenses),
// so concurrent addExpense() calls race on read-modify-write and can silently
// drop entries (last write wins). Anything adding more than one expense at
// once — e.g. splitting a shared cost across all journals — must go through
// this batch function instead, which does exactly one read and one write.
export async function addExpenses(inputs: Omit<JournalExpense, "id" | "createdAt">[]): Promise<JournalExpense[]> {
  await ensureExpensesBucket();
  const all = await readAllExpenses();
  const now = new Date().toISOString();
  const created = inputs.map((input) => ({ ...input, id: uid(), createdAt: now }));
  all.unshift(...created);
  await writeAllExpenses(all);
  return created;
}

export async function addExpense(input: Omit<JournalExpense, "id" | "createdAt">): Promise<JournalExpense> {
  await ensureExpensesBucket();
  const all = await readAllExpenses();
  const expense: JournalExpense = { ...input, id: uid(), createdAt: new Date().toISOString() };
  all.unshift(expense);
  await writeAllExpenses(all);
  return expense;
}

export async function updateExpense(
  id: string,
  patch: Partial<Omit<JournalExpense, "id" | "journalCode" | "createdAt">>
): Promise<JournalExpense | null> {
  await ensureExpensesBucket();
  const all = await readAllExpenses();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  await writeAllExpenses(all);
  return all[idx];
}

export async function deleteExpense(id: string): Promise<boolean> {
  await ensureExpensesBucket();
  const all = await readAllExpenses();
  const next = all.filter((e) => e.id !== id);
  if (next.length === all.length) return false;
  await writeAllExpenses(next);
  return true;
}
