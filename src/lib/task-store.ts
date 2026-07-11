import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "./data";

let _client: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(`Task storage is not configured (url:${!!url} key:${!!key}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`);
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fromRow(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    project: (row.project as string) ?? "",
    due: (row.due as string) ?? "",
    priority: (row.priority as Task["priority"]) ?? "medium",
    done: Boolean(row.done),
  };
}

export async function createTask(data: { title: string; project: string; due: string; priority: string }): Promise<Task> {
  const sb = admin();
  const { data: last } = await sb.from("tasks").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const nextPosition = (Number(last?.position) || 0) + 1;
  const row = { id: uid(), position: nextPosition, title: data.title, project: data.project, due: data.due, priority: data.priority || "medium", done: false };
  const { data: created, error } = await sb.from("tasks").insert(row).select().single();
  if (error) throw error;
  return fromRow(created);
}

export async function updateTask(id: string, patch: Partial<{ title: string; project: string; due: string; priority: string; done: boolean }>): Promise<Task | null> {
  const sb = admin();
  const { data, error } = await sb.from("tasks").update(patch).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const sb = admin();
  const { data, error } = await sb.from("tasks").delete().eq("id", id).select();
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
