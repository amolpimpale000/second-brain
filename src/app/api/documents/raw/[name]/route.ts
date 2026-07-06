import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { admin, DOC_BUCKET, trashPath } from "@/lib/documents-store";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain; charset=utf-8",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Streams a stored document from the private Supabase bucket. Checks the live
// path first, then the trash prefix (so trashed files still preview/restore).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const filename = path.basename(decodeURIComponent(name)); // block traversal
    const download = req.nextUrl.searchParams.get("dl") === "1";
    const sb = admin();

    let blob = (await sb.storage.from(DOC_BUCKET).download(filename)).data;
    if (!blob) {
      blob = (await sb.storage.from(DOC_BUCKET).download(trashPath(filename))).data;
    }
    if (!blob) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const buf = Buffer.from(await blob.arrayBuffer());
    const ext = path.extname(filename).slice(1).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    console.error("File serve error:", err);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
