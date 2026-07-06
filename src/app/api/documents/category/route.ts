import { NextRequest, NextResponse } from "next/server";
import { readManifest, writeManifest } from "@/lib/documents-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, category } = body;

    if (!id || typeof id !== "string" || !category || typeof category !== "string") {
      return NextResponse.json({ error: "Missing id or category" }, { status: 400 });
    }

    const manifest = await readManifest();
    const idx = manifest.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    manifest[idx] = { ...manifest[idx], category };
    await writeManifest(manifest);
    return NextResponse.json({ doc: manifest[idx] });
  } catch (err) {
    console.error("Change category error:", err);
    const msg = err instanceof Error ? err.message : "Change category failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
