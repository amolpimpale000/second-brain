import { NextRequest, NextResponse } from "next/server";
import {
  getUploadDir,
  getTrashDir,
  readManifest,
  writeManifest,
  fileExists,
} from "@/lib/documents-store";
import path from "path";
import { rename } from "fs/promises";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

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

    if (await fileExists(trashedPath)) {
      await rename(trashedPath, filePath);
    }

    manifest[idx] = { ...doc, trashed: false };
    await writeManifest(uploadDir, manifest);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
