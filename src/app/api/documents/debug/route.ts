import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import { existsSync } from "fs";
import { getUploadDir } from "@/lib/documents-store";

// TEMPORARY diagnostic — reports where the app actually stores documents at runtime.
export async function GET() {
  const cwd = process.cwd();
  const home = process.env.HOME || os.homedir();
  const domain = process.env.APP_DOMAIN || "lightgreen-locust-357153.hostingersite.com";
  const domainPublicHtml = path.join(home, "domains", domain, "public_html");

  return NextResponse.json({
    cwd,
    home,
    uploadDir: getUploadDir(),
    checks: {
      domainPublicHtml,
      domainPublicHtmlExists: existsSync(domainPublicHtml),
      cwdPublicHtml: path.join(cwd, "public_html"),
      cwdPublicHtmlExists: existsSync(path.join(cwd, "public_html")),
      uploadDirExists: existsSync(getUploadDir()),
    },
  });
}
