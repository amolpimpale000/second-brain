// ============================================================================
// Data-access layer. Each function reads from Supabase and falls back to the
// sample data in ./data.ts when the table is missing, empty, or unreachable —
// so the UI always renders, before AND after you run supabase/setup.sql.
// ============================================================================
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import * as sample from "./data";
import type { Txn, Holding, Loan, Goal, Business, Task, Note, Vault } from "./data";

async function db() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export async function getTransactions(): Promise<Txn[]> {
  try {
    const supabase = await db();
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
    const supabase = await db();
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

export async function getLoans(): Promise<Loan[]> {
  try {
    const supabase = await db();
    const { data, error } = await supabase.from("loans").select("*").order("position");
    if (error || !data?.length) return sample.loans;
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      lender: r.lender,
      principal: Number(r.principal),
      outstanding: Number(r.outstanding),
      emi: Number(r.emi),
      rate: Number(r.rate),
      tenureLeft: r.tenure_left,
      nextDue: r.next_due,
    }));
  } catch {
    return sample.loans;
  }
}

export async function getGoals(): Promise<Goal[]> {
  try {
    const supabase = await db();
    const { data, error } = await supabase.from("goals").select("*").order("position");
    if (error || !data?.length) return sample.goals;
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      target: Number(r.target),
      saved: Number(r.saved),
      deadline: r.deadline,
      monthly: Number(r.monthly),
      color: r.color,
    }));
  } catch {
    return sample.goals;
  }
}

export async function getBusinesses(): Promise<Business[]> {
  try {
    const supabase = await db();
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
    const supabase = await db();
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
    const supabase = await db();
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

// Vault is intentionally locked at the DB layer (no public read policy), so this
// returns the local sample until Supabase Auth + owner-scoped RLS are added.
export async function getVault(): Promise<Vault[]> {
  try {
    const supabase = await db();
    const { data, error } = await supabase.from("vault").select("*").order("position");
    if (error || !data?.length) return sample.vault;
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      identifier: r.identifier,
      secret: r.secret,
      updated: r.updated,
      strength: r.strength,
    }));
  } catch {
    return sample.vault;
  }
}
