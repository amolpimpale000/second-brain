import { NextRequest, NextResponse } from "next/server";
import {
  StoredDoc,
  uid,
  fmtSize,
  getFileUrl,
  sanitize,
  admin,
  ensureBucket,
  readManifest,
  writeManifest,
  DOC_BUCKET,
} from "@/lib/documents-store";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_SIZE_MB = 50;

const MIME: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff", tif: "image/tiff",
  svg: "image/svg+xml", txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip", rar: "application/vnd.rar", "7z": "application/x-7z-compressed",
};

export async function GET() {
  try {
    await ensureBucket();
    const docs = await readManifest();
    return NextResponse.json({ docs });
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

    await ensureBucket();
    const sb = admin();
    const manifest = await readManifest();
    const saved: StoredDoc[] = [];

    for (const file of files) {
      const originalExt = path.extname(file.name).slice(1).toLowerCase();
      const ext = originalExt === "jpeg" ? "jpg" : originalExt || "bin";
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return NextResponse.json({ error: `File too large (max ${MAX_SIZE_MB}MB): ${file.name}` }, { status: 400 });
      }

      const baseName = file.name.replace(/\.[^.]+$/, "");
      const safeName = sanitize(baseName);
      const id = `${Date.now()}-${uid()}`;
      const filename = `${id}-${safeName}.${ext}`;

      const bytes = Buffer.from(await file.arrayBuffer());
      const contentType = MIME[ext] || file.type || "application/octet-stream";
      const { error } = await sb.storage
        .from(DOC_BUCKET)
        .upload(filename, bytes, { contentType, upsert: false });
      if (error) throw error;

      const isImg = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "svg", "raw", "cr2", "nef", "arw"].includes(ext);
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

    await writeManifest(manifest);
    return NextResponse.json({ docs: saved });
  } catch (err) {
    console.error("Upload error:", err);
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
