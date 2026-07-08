import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Documents are stored in a private Supabase Storage bucket so they survive
 * Hostinger redeploys (which wipe public_html). File bytes and a small
 * `documents.json` manifest both live in the bucket. Files are streamed back
 * to the browser through /api/documents/raw/[name], keeping them private.
 */

export const DOC_BUCKET = "documents";
const MANIFEST = "documents.json";
export const TRASH_PREFIX = ".trashed";

export type StoredDoc = {
  id: string;
  name: string;
  filename: string;
  category: string;
  ext: string;
  size: string;
  date: string;
  kind: "doc" | "image";
  url: string;
  trashed?: boolean;
};

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function fmtSize(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

export function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/_{2,}/g, "_");
}

/** Public path (streamed via the API route, not a raw Supabase URL). */
export function getFileUrl(filename: string) {
  return `/api/documents/raw/${encodeURIComponent(filename)}`;
}

export function trashPath(filename: string) {
  return `${TRASH_PREFIX}/${filename}`;
}

/* ── Supabase admin (service role, server-only) ───────────────────────────── */
let _client: SupabaseClient | null = null;

export function admin(): SupabaseClient {
  if (_client) return _client;
  // At server runtime Hostinger exposes the project URL as SUPABASE_URL;
  // NEXT_PUBLIC_* names only exist at build time (inlined into the bundle).
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Document storage is not configured (url:${!!url} key:${!!key}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

/** Create the private bucket on first use. */
export async function ensureBucket() {
  const sb = admin();
  const { data } = await sb.storage.getBucket(DOC_BUCKET);
  if (!data) {
    await sb.storage.createBucket(DOC_BUCKET, {
      public: false,
      fileSizeLimit: "50MB",
    });
  }
}

/* ── Manifest (stored as an object in the bucket) ─────────────────────────── */
export async function readManifest(): Promise<StoredDoc[]> {
  const sb = admin();
  const { data, error } = await sb.storage.from(DOC_BUCKET).download(MANIFEST);
  if (error || !data) return [];
  try {
    return JSON.parse(await data.text());
  } catch {
    return [];
  }
}

export async function writeManifest(docs: StoredDoc[]) {
  const sb = admin();
  const body = new Blob([JSON.stringify(docs, null, 2)], { type: "application/json" });
  // cacheControl: "0" avoids Supabase Storage's default 1hr Cache-Control,
  // which can otherwise serve a stale read shortly after a write and cause
  // the next write to silently persist that stale state (see the same fix
  // in journal-expenses-store.ts for the incident that surfaced this).
  const { error } = await sb.storage
    .from(DOC_BUCKET)
    .upload(MANIFEST, body, { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw error;
}
