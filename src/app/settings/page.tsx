import { Database, Bell, Shield, User, Palette } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { owner } from "@/lib/data";

export const dynamic = "force-dynamic";

const rows = [
  { icon: <User className="h-5 w-5" />, title: "Profile", desc: "Name, email, and role", value: owner.email },
  { icon: <Database className="h-5 w-5" />, title: "Data Source", desc: "Connect your database to replace sample data", value: "Not connected" },
  { icon: <Bell className="h-5 w-5" />, title: "Notifications", desc: "EMI reminders, goal milestones, task alerts", value: "On" },
  { icon: <Shield className="h-5 w-5" />, title: "Security", desc: "Vault encryption & 2FA", value: "AES-256" },
  { icon: <Palette className="h-5 w-5" />, title: "Appearance", desc: "Theme and accent", value: "Light · Lime" },
];

export default function SettingsPage() {
  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader title="Settings" subtitle="Configure your command center." />

      <Card className="card-pad">
        <CardHeader title="Preferences" />
        <div className="mt-2 divide-y divide-border">
          {rows.map((r) => (
            <div key={r.title} className="flex items-center gap-4 py-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-muted">{r.icon}</div>
              <div className="min-w-0">
                <p className="font-medium text-ink">{r.title}</p>
                <p className="text-sm text-muted">{r.desc}</p>
              </div>
              <span className="ml-auto text-sm text-faint">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="card-pad">
        <CardHeader title="Connect your database" desc="This dashboard runs on sample data in src/lib/data.ts. Point it at your real DB to go live." />
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-sm text-muted">
          Swap the exports in <code className="rounded bg-card px-1.5 py-0.5 text-brand-ink">src/lib/data.ts</code> for
          queries (Postgres, Supabase, Neon, or your own API). Every page reads from that single file, so the UI updates automatically.
        </div>
      </Card>
    </div>
  );
}
