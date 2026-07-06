import { writeFile, mkdir, readFile, stat, rename, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MANIFEST = "documents.json";
const TRASH_DIR = ".trashed";

export type StoredDoc = {
  id: string;
  name: string;
  filename: string;
  category: string;
  ext: "PDF" | "JPG" | "PNG" | "DOCX";
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

function isHostingerCwd(cwd: string) {
  return existsSync(path.join(cwd, "public_html"));
}

export function getUploadDir() {
  const envPath = process.env.DOCUMENTS_UPLOAD_PATH;
  if (envPath) return path.resolve(envPath);

  const cwd = process.cwd();
  if (isHostingerCwd(cwd)) {
    return path.join(cwd, "public_html", "Documents");
  }
  return path.join(cwd, "public", "uploads", "documents");
}

export function getTrashDir(uploadDir: string) {
  return path.join(uploadDir, TRASH_DIR);
}

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_DOCUMENTS_BASE_URL) {
    return process.env.NEXT_PUBLIC_DOCUMENTS_BASE_URL.replace(/\/$/, "");
  }
  const cwd = process.cwd();
  if (isHostingerCwd(cwd)) {
    return "/Documents";
  }
  return "/uploads/documents";
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
