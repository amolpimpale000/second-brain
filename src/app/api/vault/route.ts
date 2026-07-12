import { NextRequest, NextResponse } from "next/server";
import {
  createAccount, updateAccount, deleteAccount, type AccountInput,
  createCard, updateCard, deleteCard, type CardInput,
} from "@/lib/vault-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, action, id, data } = body as {
      entity: "account" | "card";
      action: "create" | "update" | "delete";
      id?: string;
      data?: Record<string, unknown>;
    };

    if (entity !== "account" && entity !== "card") {
      return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
    }

    if (action === "create") {
      if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
      const row = entity === "account" ? await createAccount(data as AccountInput) : await createCard(data as CardInput);
      return NextResponse.json({ row });
    }
    if (action === "update") {
      if (!id || !data) return NextResponse.json({ error: "Missing id or data" }, { status: 400 });
      const row = entity === "account" ? await updateAccount(id, data) : await updateCard(id, data);
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ row });
    }
    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      const ok = entity === "account" ? await deleteAccount(id) : await deleteCard(id);
      if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Vault mutation error:", err);
    const msg = err instanceof Error ? err.message : "Mutation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
