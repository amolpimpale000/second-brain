import { NextRequest, NextResponse } from "next/server";
import { getEmployeeProductivity } from "@/lib/journal-employee-productivity";

export const dynamic = "force-dynamic";

// GET /api/journals/employee-productivity?days=30
export async function GET(request: NextRequest) {
  try {
    const daysParam = Number(request.nextUrl.searchParams.get("days") || "30");
    const days = [30, 45].includes(daysParam) ? daysParam : 30;
    const journals = await getEmployeeProductivity(days);
    return NextResponse.json({ days, journals });
  } catch (err) {
    console.error("Employee productivity error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load employee productivity";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
