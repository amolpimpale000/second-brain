import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { parseStatementText } from "@/lib/statement-parser";

export const dynamic = "force-dynamic";

// POST /api/finance/import-statement (multipart/form-data, field "file")
// Extracts text from an uploaded PDF (PhonePe / bank statement) and returns
// candidate transactions for review — nothing is written to the database
// here. The client shows a checkbox list; only rows the user confirms get
// sent to /api/finance with action "bulkCreate".
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const transactions = parseStatementText(result.text);

    if (transactions.length === 0) {
      return NextResponse.json({
        transactions: [],
        error: "Couldn't find any transaction rows in this PDF. It may use a layout this parser doesn't recognize yet — try adding the entries manually, or share a sample so the parser can be tuned to your statement's format.",
      });
    }

    return NextResponse.json({ transactions });
  } catch (err) {
    console.error("Statement import error:", err);
    const msg = err instanceof Error ? err.message : "Failed to parse statement";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
