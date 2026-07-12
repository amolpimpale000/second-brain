import { Database, Bell, Shield, User, Palette } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { owner } from "@/lib/data";

export const dynamic = "force-dynamic";

const rows = [
  { icon: <User className="h-5 w-5" />, title: "Profile", desc: "Name, email, and role", value: owner.email },
  { icon: <Database className="h-5 w-5" />, title: "Data Source", desc: "Finance, tasks, notes, documents & vault storage", value: "Supabase · Connected" },
  { icon: <Bell className="h-5 w-5" />, title: "Notifications", desc: "Journal alerts + WhatsApp triggers (hourly cron)", value: "On" },
  { icon: <Shield className="h-5 w-5" />, title: "Security", desc: "Vault access via service role, RLS enabled", value: "RLS" },
  { icon: <Palette className="h-5 w-5" />, title: "Appearance", desc: "Theme and accent", value: "Light · Blue" },
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
        <CardHeader title="Connected services" desc="Where this command center's data actually lives." />
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-sm text-muted">
          Finances, tasks, notes, documents and vault are stored in <span className="font-medium text-ink">Supabase</span> (Postgres + Storage).
          Journal metrics read live from the five journal databases (MySQL + Postgres), Razorpay and Google Ads.
          Investment prices refresh from Yahoo Finance / AMFI every 3 hours; WhatsApp alerts go out via Interakt on an hourly check.
        </div>
      </Card>
    </div>
  );
}
