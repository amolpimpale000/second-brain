import { NextRequest, NextResponse } from "next/server";
import {
  getFinanceData,
  createEntity,
  bulkCreateEntity,
  updateEntity,
  deleteEntity,
  isFinanceEntity,
} from "@/lib/finance-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getFinanceData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Finance data fetch error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load finance data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, action, id, data, items } = body as {
      entity: string;
      action: "create" | "bulkCreate" | "update" | "delete";
      id?: string;
      data?: Record<string, unknown>;
      items?: Record<string, unknown>[];
    };

    if (!entity || !isFinanceEntity(entity)) {
      return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
    }

    if (action === "create") {
      if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
      const row = await createEntity(entity, data);
      return NextResponse.json({ row });
    }
    if (action === "bulkCreate") {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Missing items" }, { status: 400 });
      }
      const rows = await bulkCreateEntity(entity, items);
      return NextResponse.json({ rows });
    }
    if (action === "update") {
      if (!id || !data) return NextResponse.json({ error: "Missing id or data" }, { status: 400 });
      const row = await updateEntity(entity, id, data);
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ row });
    }
    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      const ok = await deleteEntity(entity, id);
      if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Finance mutation error:", err);
    const msg = err instanceof Error ? err.message : "Mutation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
