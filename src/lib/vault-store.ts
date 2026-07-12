import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { VaultAccount, VaultCard } from "./data";

let _client: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`Vault storage is not configured (url:${!!url} key:${!!key}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`);
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ── Accounts (logins) ────────────────────────────────────────────────────── */

export type AccountInput = {
  name: string; username: string; category: string; domain?: string;
  secret: string; strength: string; color: string; initial: string;
  favorite?: boolean; twoFactor?: boolean;
};

function accountFromRow(row: Record<string, unknown>): VaultAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    username: (row.identifier as string) ?? "",
    category: (row.category as VaultAccount["category"]) ?? "Business",
    lastUsed: (row.updated as string) ?? "",
    favorite: Boolean(row.favorite),
    color: (row.color as string) || "#64748b",
    initial: (row.initial as string) || ((row.name as string)?.[0] ?? "?").toUpperCase(),
    domain: (row.domain as string) ?? "",
    secret: (row.secret as string) ?? "",
    strength: (row.strength as VaultAccount["strength"]) ?? "weak",
    twoFactor: Boolean(row.two_factor),
    trashed: Boolean(row.trashed),
  };
}

function accountToRow(data: Partial<AccountInput> & { lastUsed?: string; trashed?: boolean }): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.username !== undefined) row.identifier = data.username;
  if (data.category !== undefined) row.category = data.category;
  if (data.domain !== undefined) row.domain = data.domain;
  if (data.secret !== undefined) row.secret = data.secret;
  if (data.strength !== undefined) row.strength = data.strength;
  if (data.color !== undefined) row.color = data.color;
  if (data.initial !== undefined) row.initial = data.initial;
  if (data.favorite !== undefined) row.favorite = data.favorite;
  if (data.twoFactor !== undefined) row.two_factor = data.twoFactor;
  if (data.trashed !== undefined) row.trashed = data.trashed;
  if (data.lastUsed !== undefined) row.updated = data.lastUsed;
  return row;
}

export async function createAccount(data: AccountInput): Promise<VaultAccount> {
  const sb = admin();
  const { data: last } = await sb.from("vault").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const nextPosition = (Number(last?.position) || 0) + 1;
  const row = { id: uid(), position: nextPosition, updated: "Just now", ...accountToRow(data) };
  const { data: created, error } = await sb.from("vault").insert(row).select().single();
  if (error) throw error;
  return accountFromRow(created);
}

export async function updateAccount(id: string, patch: Partial<AccountInput> & { lastUsed?: string; trashed?: boolean }): Promise<VaultAccount | null> {
  const sb = admin();
  const { data, error } = await sb.from("vault").update(accountToRow(patch)).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data ? accountFromRow(data) : null;
}

export async function deleteAccount(id: string): Promise<boolean> {
  const sb = admin();
  const { data, error } = await sb.from("vault").delete().eq("id", id).select();
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/* ── Cards (ATM / debit / credit) ────────────────────────────────────────── */

export type CardInput = {
  bank: string; label: string; type: string; network: string;
  number: string; holder: string; expiry: string; cvv: string; pin: string; theme: string;
};

function cardFromRow(row: Record<string, unknown>): VaultCard {
  return {
    id: row.id as string,
    bank: (row.bank as string) ?? "",
    label: (row.label as string) ?? "",
    type: (row.type as VaultCard["type"]) ?? "Debit",
    network: (row.network as VaultCard["network"]) ?? "VISA",
    number: (row.number as string) ?? "",
    holder: (row.holder as string) ?? "",
    expiry: (row.expiry as string) ?? "",
    cvv: (row.cvv as string) ?? "",
    pin: (row.pin as string) ?? "",
    theme: (row.theme as VaultCard["theme"]) ?? "blue",
  };
}

export async function createCard(data: CardInput): Promise<VaultCard> {
  const sb = admin();
  const { data: last } = await sb.from("vault_cards").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const nextPosition = (Number(last?.position) || 0) + 1;
  const row = { id: uid(), position: nextPosition, ...data };
  const { data: created, error } = await sb.from("vault_cards").insert(row).select().single();
  if (error) throw error;
  return cardFromRow(created);
}

export async function updateCard(id: string, patch: Partial<CardInput>): Promise<VaultCard | null> {
  const sb = admin();
  const { data, error } = await sb.from("vault_cards").update(patch).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data ? cardFromRow(data) : null;
}

export async function deleteCard(id: string): Promise<boolean> {
  const sb = admin();
  const { data, error } = await sb.from("vault_cards").delete().eq("id", id).select();
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
