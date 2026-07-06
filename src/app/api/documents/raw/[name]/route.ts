import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getUploadDir, getTrashDir, fileExists } from "@/lib/documents-store";

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

// Streams a stored document back to the browser. Files live in
// public_html/Documents (outside Next's own /public dir), so we read them off
// disk here instead of relying on static serving.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    // basename() strips any "../" — prevents path traversal outside the dir.
    const filename = path.basename(decodeURIComponent(name));
    const uploadDir = getUploadDir();

    let filePath = path.join(uploadDir, filename);
    if (!(await fileExists(filePath))) {
      const trashPath = path.join(getTrashDir(uploadDir), filename);
      if (await fileExists(trashPath)) filePath = trashPath;
      else return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buf = await readFile(filePath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("File serve error:", err);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
