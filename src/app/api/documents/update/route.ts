import { NextRequest, NextResponse } from "next/server";
import {
  StoredDoc,
  fmtSize,
  getFileUrl,
  sanitize,
  admin,
  ensureBucket,
  readManifest,
  writeManifest,
  trashPath,
  DOC_BUCKET,
} from "@/lib/documents-store";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_EXTS = ["pdf", "jpg", "jpeg", "png", "docx", "doc", "xlsx", "xls", "txt", "webp"];
const MAX_SIZE_MB = 50;

const MIME: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Replaces the file behind an existing document (keeps its id + category).
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const file = (formData.getAll("files")[0] || formData.get("file")) as File | null;

    if (!id || !file) {
      return NextResponse.json({ error: "Missing id or file" }, { status: 400 });
    }

    const originalExt = path.extname(file.name).slice(1).toLowerCase();
    const ext = originalExt === "jpeg" ? "jpg" : originalExt;
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: `File type not allowed: ${ext}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large (max ${MAX_SIZE_MB}MB)` }, { status: 400 });
    }

    await ensureBucket();
    const sb = admin();
    const manifest = await readManifest();
    const idx = manifest.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const prev = manifest[idx];
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const safeName = sanitize(baseName);
    const filename = `${id}-${safeName}.${ext}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await sb.storage
      .from(DOC_BUCKET)
      .upload(filename, bytes, { contentType: MIME[ext] || "application/octet-stream", upsert: true });
    if (upErr) throw upErr;

    // Remove the previous object if the storage key changed.
    if (prev.filename !== filename) {
      const oldKey = prev.trashed ? trashPath(prev.filename) : prev.filename;
      await sb.storage.from(DOC_BUCKET).remove([oldKey]);
    }

    const isImg = ["jpg", "png", "webp"].includes(ext);
    const updated: StoredDoc = {
      ...prev,
      name: baseName,
      filename,
      ext: ext.toUpperCase(),
      size: fmtSize(file.size),
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      kind: isImg ? "image" : "doc",
      url: getFileUrl(filename),
      trashed: false,
    };
    manifest[idx] = updated;
    await writeManifest(manifest);

    return NextResponse.json({ doc: updated });
  } catch (err) {
    console.error("Update error:", err);
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
