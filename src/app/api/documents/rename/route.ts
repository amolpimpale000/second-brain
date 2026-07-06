import { NextRequest, NextResponse } from "next/server";
import { readManifest, writeManifest } from "@/lib/documents-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || typeof id !== "string" || !name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    const manifest = await readManifest();
    const idx = manifest.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    manifest[idx] = { ...manifest[idx], name: trimmed };
    await writeManifest(manifest);
    return NextResponse.json({ doc: manifest[idx] });
  } catch (err) {
    console.error("Rename error:", err);
    const msg = err instanceof Error ? err.message : "Rename failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
