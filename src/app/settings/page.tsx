import { Database, Bell, Shield, User, Palette, AlertTriangle } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { owner } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const authEnabled = Boolean(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD);

  const rows = [
    { icon: <User className="h-5 w-5" />, title: "Profile", desc: "Name, email, and role", value: owner.email },
    { icon: <Database className="h-5 w-5" />, title: "Data Source", desc: "Finance, tasks, notes, documents & vault storage", value: "Supabase · Connected" },
    { icon: <Bell className="h-5 w-5" />, title: "Notifications", desc: "Journal alerts + WhatsApp triggers (hourly cron)", value: "On" },
    {
      icon: <Shield className="h-5 w-5" />, title: "Site Login",
      desc: authEnabled ? "HTTP Basic Auth gate is active on every page and API route" : "No login required — anyone with the URL can see everything",
      value: authEnabled ? "Protected" : "Unprotected",
    },
    { icon: <Palette className="h-5 w-5" />, title: "Appearance", desc: "Theme and accent", value: "Light · Blue" },
  ];

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader title="Settings" subtitle="Configure your command center." />

      {!authEnabled && (
        <Card className="card-pad !border-amber-200 !bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-ink">This site has no login</p>
              <p className="mt-1 text-sm text-muted">
                Anyone with the URL can see your finances, journal revenue, and vault. Set <code className="rounded bg-white px-1.5 py-0.5 text-amber-700">AUTH_USERNAME</code> and{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-amber-700">AUTH_PASSWORD</code> as environment variables in Hostinger to turn on a login prompt for the whole site.
              </p>
            </div>
          </div>
        </Card>
      )}

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
              <span className={r.title === "Site Login" ? `ml-auto text-sm font-medium ${authEnabled ? "text-emerald-600" : "text-amber-600"}` : "ml-auto text-sm text-faint"}>{r.value}</span>
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
