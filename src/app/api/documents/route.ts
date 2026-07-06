import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile, stat } from "fs/promises";
import path from "path";

const MANIFEST = "documents.json";
const ALLOWED_EXTS = ["pdf", "jpg", "jpeg", "png", "docx", "doc", "xlsx", "xls", "txt", "webp"];
const MAX_SIZE_MB = 50;

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
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmtSize(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

function getUploadDir() {
  const envPath = process.env.DOCUMENTS_UPLOAD_PATH;
  if (envPath) return path.resolve(envPath);
  return path.join(process.cwd(), "public", "uploads", "documents");
}

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_DOCUMENTS_BASE_URL || "/uploads/documents").replace(/\/$/, "");
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/_{2,}/g, "_");
}

async function readManifest(uploadDir: string): Promise<StoredDoc[]> {
  try {
    const raw = await readFile(path.join(uploadDir, MANIFEST), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeManifest(uploadDir: string, docs: StoredDoc[]) {
  await writeFile(path.join(uploadDir, MANIFEST), JSON.stringify(docs, null, 2));
}

export async function GET() {
  try {
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });
    const docs = await readManifest(uploadDir);

    // Verify files still exist; drop missing ones and rewrite manifest if needed.
    const existing: StoredDoc[] = [];
    let changed = false;
    for (const d of docs) {
      try {
        await stat(path.join(uploadDir, d.filename));
        existing.push(d);
      } catch {
        changed = true;
      }
    }
    if (changed) await writeManifest(uploadDir, existing);

    return NextResponse.json({ docs: existing });
  } catch (err) {
    console.error("Documents list error:", err);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const category = (formData.get("category") as string) || "Important Docs";

    if (!files?.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const manifest = await readManifest(uploadDir);
    const saved: StoredDoc[] = [];

    for (const file of files) {
      const originalExt = path.extname(file.name).slice(1).toLowerCase();
      const ext = originalExt === "jpeg" ? "jpg" : originalExt;
      if (!ALLOWED_EXTS.includes(ext)) {
        return NextResponse.json({ error: `File type not allowed: ${ext}` }, { status: 400 });
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return NextResponse.json({ error: `File too large (max ${MAX_SIZE_MB}MB): ${file.name}` }, { status: 400 });
      }

      const baseName = file.name.replace(/\.[^.]+$/, "");
      const safeName = sanitize(baseName);
      const id = `${Date.now()}-${uid()}`;
      const filename = `${id}-${safeName}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      const isImg = file.type.startsWith("image/");
      const displayExt = ext.toUpperCase() as StoredDoc["ext"];
      const doc: StoredDoc = {
        id,
        name: baseName,
        filename,
        category,
        ext: displayExt,
        size: fmtSize(file.size),
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        kind: isImg ? "image" : "doc",
        url: `${getBaseUrl()}/${filename}`,
      };

      saved.push(doc);
      manifest.unshift(doc);
    }

    await writeManifest(uploadDir, manifest);
    return NextResponse.json({ docs: saved });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
