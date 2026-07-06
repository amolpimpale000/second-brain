import { writeFile, mkdir, readFile, stat, rename, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { existsSync } from "fs";

const MANIFEST = "documents.json";
const TRASH_DIR = ".trashed";

// Hostinger deployment: files must live in <domain>/public_html/Documents so they
// (a) show up in the File Manager and (b) survive every git redeploy of the app.
const HOSTINGER_DOMAIN = "lightgreen-locust-357153.hostingersite.com";

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

/**
 * Ordered list of candidate `Documents` directories. The first one whose parent
 * `public_html` actually exists on disk wins. This makes storage resilient to how
 * Hostinger happens to launch the Node process (its cwd is not public_html).
 */
function candidateDirs(): string[] {
  const cwd = process.cwd().replace(/\\/g, "/");
  const list: string[] = [];

  // App launched from inside public_html (…/public_html or …/public_html/sub).
  const m = cwd.match(/^(.*\/public_html)(\/.*)?$/);
  if (m) list.push(path.join(m[1], "Documents"));

  // public_html sitting directly under the cwd.
  list.push(path.join(cwd, "public_html", "Documents"));

  // Standard Hostinger layout: /home/<user>/domains/<domain>/public_html.
  const home = process.env.HOME || os.homedir();
  const domain = process.env.APP_DOMAIN || HOSTINGER_DOMAIN;
  if (home) list.push(path.join(home, "domains", domain, "public_html", "Documents"));

  return list;
}

export function getUploadDir() {
  const envPath = process.env.DOCUMENTS_UPLOAD_PATH;
  if (envPath) return path.resolve(envPath);

  for (const dir of candidateDirs()) {
    if (existsSync(path.dirname(dir))) return dir; // parent public_html exists
  }
  // Local dev fallback (Next serves this via /public automatically).
  return path.join(process.cwd(), "public", "uploads", "documents");
}

export function getTrashDir(uploadDir: string) {
  return path.join(uploadDir, TRASH_DIR);
}

/**
 * Public URL for a stored file. Documents live outside the Next `public/` dir
 * (in public_html/Documents), and the whole domain is served by the Node app,
 * so files are streamed back through an API route rather than served statically.
 */
export function getFileUrl(filename: string) {
  return `/api/documents/raw/${encodeURIComponent(filename)}`;
}

export function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/_{2,}/g, "_");
}

export async function readManifest(uploadDir: string): Promise<StoredDoc[]> {
  try {
    const raw = await readFile(path.join(uploadDir, MANIFEST), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeManifest(uploadDir: string, docs: StoredDoc[]) {
  await writeFile(path.join(uploadDir, MANIFEST), JSON.stringify(docs, null, 2));
}

export async function fileExists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
