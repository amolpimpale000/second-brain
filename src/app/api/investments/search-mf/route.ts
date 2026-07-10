import { NextRequest, NextResponse } from "next/server";
import { searchMutualFunds } from "@/lib/investment-prices";

export const dynamic = "force-dynamic";

// GET /api/investments/search-mf?q=Axis+Small+Cap
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = await searchMutualFunds(q);
  return NextResponse.json({ results });
}
