import { NextRequest, NextResponse } from "next/server";
import { admin, DOC_BUCKET, trashPath, readManifest, writeManifest } from "@/lib/documents-store";

export async function POST(request: NextRequest) {
  try {
    const { id, mode = "soft" } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing document id" }, { status: 400 });
    }

    const sb = admin();
    const manifest = await readManifest();
    const idx = manifest.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = manifest[idx];

    if (mode === "hard") {
      const target = doc.trashed ? trashPath(doc.filename) : doc.filename;
      await sb.storage.from(DOC_BUCKET).remove([target]);
      manifest.splice(idx, 1);
    } else {
      // soft delete: move object into the trash prefix
      await sb.storage.from(DOC_BUCKET).move(doc.filename, trashPath(doc.filename));
      manifest[idx] = { ...doc, trashed: true };
    }

    await writeManifest(manifest);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
