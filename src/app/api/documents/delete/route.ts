import { NextRequest, NextResponse } from "next/server";
import {
  getUploadDir,
  getTrashDir,
  readManifest,
  writeManifest,
  fileExists,
} from "@/lib/documents-store";
import path from "path";
import { mkdir, rename, unlink } from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, mode = "soft" } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing document id" }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    const manifest = await readManifest(uploadDir);
    const idx = manifest.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = manifest[idx];
    const filePath = path.join(uploadDir, doc.filename);
    const trashedPath = path.join(getTrashDir(uploadDir), doc.filename);

    if (mode === "hard") {
      try {
        await unlink(doc.trashed ? trashedPath : filePath);
      } catch {}
      manifest.splice(idx, 1);
    } else {
      await mkdir(getTrashDir(uploadDir), { recursive: true });
      if (await fileExists(filePath)) {
        await rename(filePath, trashedPath);
      }
      manifest[idx] = { ...doc, trashed: true };
    }

    await writeManifest(uploadDir, manifest);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
