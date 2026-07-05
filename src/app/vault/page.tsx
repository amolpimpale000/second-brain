"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check, KeyRound, Shield, Plus, Landmark, CreditCard, Mail, Briefcase } from "lucide-react";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { vault, type Vault } from "@/lib/data";
import { cn } from "@/lib/utils";

const catIcon: Record<Vault["category"], React.ReactNode> = {
  Bank: <Landmark className="h-4 w-4" />,
  "ATM / Card": <CreditCard className="h-4 w-4" />,
  Email: <Mail className="h-4 w-4" />,
  Business: <Briefcase className="h-4 w-4" />,
  Other: <KeyRound className="h-4 w-4" />,
};

const strengthStyle: Record<Vault["strength"], string> = {
  strong: "bg-brand-soft text-brand-ink",
  medium: "bg-amber-50 text-amber-600",
  weak: "bg-rose-50 text-rose-600",
};

const categories = ["All", "Bank", "ATM / Card", "Email", "Business"] as const;

export default function VaultPage() {
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [cat, setCat] = useState<(typeof categories)[number]>("All");

  const toggle = (id: string) => setShown((s) => ({ ...s, [id]: !s[id] }));
  const copy = (id: string, secret: string) => {
    navigator.clipboard?.writeText(secret);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  const items = vault.filter((v) => cat === "All" || v.category === cat);
  const strong = vault.filter((v) => v.strength === "strong").length;
  const weak = vault.filter((v) => v.strength === "weak").length;

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Password Vault"
        subtitle="Bank, ATM, email & business credentials — encrypted & in your control."
        action={<button className="btn-brand"><Plus className="h-4 w-4" /> Add credential</button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Stored Credentials" value={`${vault.length}`} icon={<KeyRound className="h-5 w-5" />} accent="var(--brand-soft)" />
        <StatCard label="Strong Passwords" value={`${strong}`} icon={<Shield className="h-5 w-5" />} accent="var(--brand-soft)" />
        <StatCard label="Needs Attention" value={`${weak}`} icon={<Shield className="h-5 w-5" />} accent="var(--surface-2)" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              cat === c ? "bg-ink text-white" : "text-muted hover:bg-surface-2"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((v) => {
          const visible = shown[v.id];
          return (
            <Card key={v.id} className="card-pad">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-muted">
                    {catIcon[v.category]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{v.name}</h3>
                    <p className="text-xs text-faint">{v.category}</p>
                  </div>
                </div>
                <span className={cn("chip", strengthStyle[v.strength])}>{v.strength}</span>
              </div>

              <div className="mt-4 space-y-2.5">
                <div>
                  <p className="text-xs text-faint">Username / ID</p>
                  <p className="truncate text-sm font-medium text-ink">{v.identifier}</p>
                </div>
                <div>
                  <p className="text-xs text-faint">Password</p>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2">
                    <span className="flex-1 truncate font-mono text-sm text-ink">
                      {visible ? v.secret : "•".repeat(Math.min(12, v.secret.length))}
                    </span>
                    <button onClick={() => toggle(v.id)} className="text-muted hover:text-ink" aria-label="Toggle visibility">
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => copy(v.id, v.secret)} className="text-muted hover:text-ink" aria-label="Copy">
                      {copied === v.id ? <Check className="h-4 w-4 text-brand-ink" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-faint">Updated {v.updated}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
