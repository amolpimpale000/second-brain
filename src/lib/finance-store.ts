import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Personal-finance persistence: proper Supabase Postgres tables (see
 * db/finance-schema.sql), one per entity, with atomic row operations —
 * same pattern as journal-expenses-store.ts after its migration away from
 * JSON-blob storage. Every list function degrades to [] on failure so the
 * page renders (empty) even if the tables don't exist yet.
 */

let _client: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Finance storage is not configured (url:${!!url} key:${!!key}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ── Types (camelCase, as used by the UI) ────────────────────────────────── */

export type FinAccount = {
  id: string; name: string; institution: string; type: string; last4: string;
  balance: number; createdAt: string;
};
export type FinTransaction = {
  id: string; type: "income" | "expense"; category: string; description: string;
  amount: number; date: string; mode: string; accountId: string | null; createdAt: string;
};
export type FinGoal = {
  id: string; name: string; icon: string; color: string; target: number; saved: number; createdAt: string;
};
export type FinLoan = {
  id: string; name: string; kind: string; lender: string; principal: number;
  outstanding: number; rate: number; emi: number; createdAt: string;
};
export type FinInvestment = {
  id: string; name: string; type: string; invested: number; currentValue: number;
  subtitle?: string; logoDomain?: string; sipAmount?: number; createdAt: string;
  quantity?: number; symbol?: string; sipDay?: number;
  lastSipCreditedMonth?: string; priceUpdatedAt?: string;
};
export type FinBill = {
  id: string; name: string; amount: number; dueDay: number; createdAt: string;
};
export type FinDue = {
  id: string; person: string; amount: number; direction: "to" | "from";
  dueDate: string | null; status: string; createdAt: string;
};
export type FinBudget = {
  id: string; category: string; amount: number; createdAt: string;
};

export type FinanceData = {
  accounts: FinAccount[];
  transactions: FinTransaction[];
  goals: FinGoal[];
  loans: FinLoan[];
  investments: FinInvestment[];
  bills: FinBill[];
  dues: FinDue[];
  budgets: FinBudget[];
};

/* ── Generic table plumbing ──────────────────────────────────────────────── */

// camelCase field -> snake_case column, per entity
const ENTITY_CONFIG = {
  accounts: {
    table: "finance_accounts",
    fields: { name: "name", institution: "institution", type: "type", last4: "last4", balance: "balance" },
    order: [{ col: "created_at", asc: true }],
  },
  transactions: {
    table: "finance_transactions",
    fields: { type: "type", category: "category", description: "description", amount: "amount", date: "date", mode: "mode", accountId: "account_id" },
    order: [{ col: "date", asc: false }, { col: "created_at", asc: false }],
  },
  goals: {
    table: "finance_goals",
    fields: { name: "name", icon: "icon", color: "color", target: "target", saved: "saved" },
    order: [{ col: "created_at", asc: true }],
  },
  loans: {
    table: "finance_loans",
    fields: { name: "name", kind: "kind", lender: "lender", principal: "principal", outstanding: "outstanding", rate: "rate", emi: "emi" },
    order: [{ col: "created_at", asc: true }],
  },
  investments: {
    table: "finance_investments",
    fields: {
      name: "name", type: "type", invested: "invested", currentValue: "current_value",
      subtitle: "subtitle", logoDomain: "logo_domain", sipAmount: "sip_amount",
      quantity: "quantity", symbol: "symbol", sipDay: "sip_day",
      lastSipCreditedMonth: "last_sip_credited_month", priceUpdatedAt: "price_updated_at",
    },
    order: [{ col: "created_at", asc: true }],
  },
  bills: {
    table: "finance_bills",
    fields: { name: "name", amount: "amount", dueDay: "due_day" },
    order: [{ col: "due_day", asc: true }],
  },
  dues: {
    table: "finance_dues",
    fields: { person: "person", amount: "amount", direction: "direction", dueDate: "due_date", status: "status" },
    order: [{ col: "created_at", asc: false }],
  },
  budgets: {
    table: "finance_budgets",
    fields: { category: "category", amount: "amount" },
    order: [{ col: "created_at", asc: true }],
  },
} as const;

export type FinanceEntity = keyof typeof ENTITY_CONFIG;

export function isFinanceEntity(v: string): v is FinanceEntity {
  return v in ENTITY_CONFIG;
}

function toRow(entity: FinanceEntity, data: Record<string, unknown>): Record<string, unknown> {
  const cfg = ENTITY_CONFIG[entity];
  const row: Record<string, unknown> = {};
  for (const [camel, snake] of Object.entries(cfg.fields)) {
    if (data[camel] !== undefined) row[snake] = data[camel];
  }
  return row;
}

function fromRow(entity: FinanceEntity, row: Record<string, unknown>): Record<string, unknown> {
  const cfg = ENTITY_CONFIG[entity];
  const out: Record<string, unknown> = { id: row.id, createdAt: row.created_at };
  for (const [camel, snake] of Object.entries(cfg.fields)) {
    let v = row[snake];
    // numeric columns come back as strings from Postgres — coerce
    if (["amount", "balance", "target", "saved", "principal", "outstanding", "rate", "emi", "invested", "currentValue", "dueDay", "sipAmount", "quantity", "sipDay"].includes(camel) || snake === "current_value" || snake === "due_day" || snake === "sip_amount" || snake === "quantity" || snake === "sip_day") {
      v = v == null ? v : Number(v);
    }
    out[camel] = v ?? (camel === "accountId" || camel === "dueDate" ? null : v);
  }
  return out;
}

export async function listEntity(entity: FinanceEntity): Promise<Record<string, unknown>[]> {
  const cfg = ENTITY_CONFIG[entity];
  const sb = admin();
  let query = sb.from(cfg.table).select("*");
  for (const o of cfg.order) query = query.order(o.col, { ascending: o.asc });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(entity, r));
}

export async function createEntity(entity: FinanceEntity, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sb = admin();
  const cfg = ENTITY_CONFIG[entity];
  const row = { id: uid(), ...toRow(entity, data) };
  const { data: created, error } = await sb.from(cfg.table).insert(row).select().single();
  if (error) throw error;
  return fromRow(entity, created);
}

export async function updateEntity(entity: FinanceEntity, id: string, patch: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const sb = admin();
  const cfg = ENTITY_CONFIG[entity];
  const row = toRow(entity, patch);
  const { data, error } = await sb.from(cfg.table).update(row).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data ? fromRow(entity, data) : null;
}

export async function deleteEntity(entity: FinanceEntity, id: string): Promise<boolean> {
  const sb = admin();
  const cfg = ENTITY_CONFIG[entity];
  const { data, error } = await sb.from(cfg.table).delete().eq("id", id).select();
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/* ── Bulk fetch for the page ─────────────────────────────────────────────── */

export async function getFinanceData(): Promise<FinanceData> {
  const safe = async <T>(entity: FinanceEntity): Promise<T[]> => {
    try {
      return (await listEntity(entity)) as T[];
    } catch (err) {
      console.error(`finance ${entity} failed to load:`, err instanceof Error ? err.message : err);
      return [];
    }
  };
  const [accounts, transactions, goals, loans, investments, bills, dues, budgets] = await Promise.all([
    safe<FinAccount>("accounts"),
    safe<FinTransaction>("transactions"),
    safe<FinGoal>("goals"),
    safe<FinLoan>("loans"),
    safe<FinInvestment>("investments"),
    safe<FinBill>("bills"),
    safe<FinDue>("dues"),
    safe<FinBudget>("budgets"),
  ]);
  return { accounts, transactions, goals, loans, investments, bills, dues, budgets };
}
