import { NextRequest, NextResponse } from "next/server";
import { admin, DOC_BUCKET, trashPath, readManifest, writeManifest } from "@/lib/documents-store";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
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
    // move object back out of the trash prefix
    await sb.storage.from(DOC_BUCKET).move(trashPath(doc.filename), doc.filename);

    manifest[idx] = { ...doc, trashed: false };
    await writeManifest(manifest);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
