import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import {
  StoredDoc,
  uid,
  fmtSize,
  getUploadDir,
  getFileUrl,
  sanitize,
  readManifest,
  writeManifest,
  fileExists,
} from "@/lib/documents-store";
import path from "path";

const ALLOWED_EXTS = ["pdf", "jpg", "jpeg", "png", "docx", "doc", "xlsx", "xls", "txt", "webp"];
const MAX_SIZE_MB = 50;

export async function GET() {
  try {
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });
    const docs = await readManifest(uploadDir);

    // Verify files still exist; drop missing ones and rewrite manifest if needed.
    const existing: StoredDoc[] = [];
    let changed = false;
    for (const d of docs) {
      const filePath = path.join(uploadDir, d.trashed ? ".trashed" : "", d.filename);
      if (await fileExists(filePath)) {
        existing.push(d);
      } else {
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

      const isImg = ["jpg", "png", "webp"].includes(ext);
      const doc: StoredDoc = {
        id,
        name: baseName,
        filename,
        category,
        ext: ext.toUpperCase(),
        size: fmtSize(file.size),
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        kind: isImg ? "image" : "doc",
        url: getFileUrl(filename),
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
