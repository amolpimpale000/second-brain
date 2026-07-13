// ============================================================================
// Data-access layer. Each function reads from Supabase and falls back to the
// sample data in ./data.ts when the table is missing, empty, or unreachable —
// so the UI always renders, before AND after you run supabase/setup.sql.
//
// Uses a service-role client (like finance-store.ts / journal-expenses-store.ts)
// instead of the cookie-based SSR client: this app has no user-facing auth, and
// NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY aren't set in
// the Hostinger runtime, so the old cookie-based client always fell through to
// an unreachable placeholder host — a ~7s fetch-timeout on every single query.
// ============================================================================
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as sample from "./data";
import type { Txn, Holding, Business, Task, Note, VaultAccount, VaultCard } from "./data";

let _client: SupabaseClient | null = null;

function db(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

export async function getTransactions(): Promise<Txn[]> {
  try {
    const supabase = db();
    if (!supabase) return sample.transactions;
    const { data, error } = await supabase.from("transactions").select("*").order("position");
    if (error || !data?.length) return sample.transactions;
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      account: r.account,
      date: r.txn_date,
      amount: Number(r.amount),
      status: r.status,
    }));
  } catch {
    return sample.transactions;
  }
}

export async function getHoldings(): Promise<Holding[]> {
  try {
    const supabase = db();
    if (!supabase) return sample.holdings;
    const { data, error } = await supabase.from("holdings").select("*").order("position");
    if (error || !data?.length) return sample.holdings;
    return data.map((r) => ({
      name: r.name,
      type: r.type,
      invested: Number(r.invested),
      current: Number(r.current),
    }));
  } catch {
    return sample.holdings;
  }
}

export async function getBusinesses(): Promise<Business[]> {
  try {
    const supabase = db();
    if (!supabase) return sample.businesses;
    const { data, error } = await supabase.from("businesses").select("*").order("position");
    if (error || !data?.length) return sample.businesses;
    return data.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      revenue: Number(r.revenue),
      expenses: Number(r.expenses),
      submissions: r.submissions,
      published: r.published,
      growth: Number(r.growth),
      color: r.color,
    }));
  } catch {
    return sample.businesses;
  }
}

export async function getTasks(): Promise<Task[]> {
  try {
    const supabase = db();
    if (!supabase) return sample.tasks;
    const { data, error } = await supabase.from("tasks").select("*").order("position");
    if (error || !data?.length) return sample.tasks;
    return data.map((r) => ({
      id: r.id,
      title: r.title,
      project: r.project,
      due: r.due,
      priority: r.priority,
      done: r.done,
    }));
  } catch {
    return sample.tasks;
  }
}

export async function getNotes(): Promise<Note[]> {
  try {
    const supabase = db();
    if (!supabase) return sample.notes;
    const { data, error } = await supabase.from("notes").select("*").order("position");
    if (error || !data?.length) return sample.notes;
    return data.map((r) => ({
      id: r.id,
      title: r.title,
      preview: r.preview,
      tag: r.tag,
      color: r.color,
      updated: r.updated,
      pinned: r.pinned,
    }));
  } catch {
    return sample.notes;
  }
}

export async function getVault(): Promise<VaultAccount[]> {
  try {
    const supabase = db();
    if (!supabase) return sample.vaultAccounts;
    const { data, error } = await supabase.from("vault").select("*").order("position");
    if (error) return sample.vaultAccounts;
    if (!data?.length) return [];
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      username: r.identifier,
      category: r.category,
      lastUsed: r.updated,
      favorite: Boolean(r.favorite),
      color: r.color || "#64748b",
      initial: r.initial || (r.name?.[0] ?? "?").toUpperCase(),
      domain: r.domain ?? "",
      secret: r.secret,
      strength: r.strength,
      twoFactor: Boolean(r.two_factor),
      trashed: Boolean(r.trashed),
    }));
  } catch {
    return sample.vaultAccounts;
  }
}

export async function getVaultCards(): Promise<VaultCard[]> {
  try {
    const supabase = db();
    if (!supabase) return sample.vaultCards;
    const { data, error } = await supabase.from("vault_cards").select("*").order("position");
    if (error) return sample.vaultCards;
    if (!data?.length) return [];
    return data.map((r) => ({
      id: r.id,
      bank: r.bank ?? "",
      label: r.label ?? "",
      type: r.type ?? "Debit",
      network: r.network ?? "VISA",
      number: r.number ?? "",
      holder: r.holder ?? "",
      expiry: r.expiry ?? "",
      cvv: r.cvv ?? "",
      pin: r.pin ?? "",
      theme: r.theme ?? "blue",
    }));
  } catch {
    return sample.vaultCards;
  }
}
