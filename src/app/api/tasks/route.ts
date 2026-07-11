import { NextRequest, NextResponse } from "next/server";
import { createTask, updateTask, deleteTask } from "@/lib/task-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, data } = body as {
      action: "create" | "update" | "delete";
      id?: string;
      data?: Record<string, unknown>;
    };

    if (action === "create") {
      if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
      const row = await createTask(data as { title: string; project: string; due: string; priority: string });
      return NextResponse.json({ row });
    }
    if (action === "update") {
      if (!id || !data) return NextResponse.json({ error: "Missing id or data" }, { status: 400 });
      const row = await updateTask(id, data);
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ row });
    }
    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      const ok = await deleteTask(id);
      if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Task mutation error:", err);
    const msg = err instanceof Error ? err.message : "Mutation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
