// ---------------------------------------------------------------------------
// Read-only Google Ads spend for /journal-management and each individual
// journal page. Uses the Google Ads REST API (GAQL search) — reporting
// queries only, nothing is ever written/mutated in any ad account.
//
// Each journal has its own Ads account (client account) under one shared
// MCC/manager account, so spend is fetched per journal and can be summed
// for a combined total. Any calendar month can be queried, not just the
// current one, so the expense journal can be navigated month to month.
// ---------------------------------------------------------------------------

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v21";
export const GOOGLE_ADS_JOURNAL_CODES = ["IJPS", "IJSRT", "IJMPS", "IJES", "JPS"];

export type GoogleAdsCampaignSpend = { name: string; cost: number; impressions: number; clicks: number; conversions: number };

export type GoogleAdsJournalSpend = {
  code: string;
  connected: boolean;
  totalSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  campaigns: GoogleAdsCampaignSpend[];
  error?: string;
};

export type GoogleAdsSpend = {
  connected: boolean;
  totalSpend: number;
  currency: string;
  periodLabel: string;
  byJournal: GoogleAdsJournalSpend[];
  error?: string;
};

function baseConfigured() {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  );
}

function getCustomerId(code: string): string | undefined {
  return process.env[`GOOGLE_ADS_CUSTOMER_ID_${code}`]?.replace(/-/g, "");
}

/** "2026-07" -> { start: "2026-07-01", end: "2026-07-31" } */
function monthRange(monthKey?: string): { start: string; end: string; label: string } {
  const now = monthKey ? new Date(`${monthKey}-01T00:00:00Z`) : new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { start: fmt(start), end: fmt(end), label };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token refresh failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  cachedToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return json.access_token;
}

async function fetchJournalSpend(
  code: string,
  customerId: string,
  accessToken: string,
  range: { start: string; end: string }
): Promise<GoogleAdsJournalSpend> {
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
  const query = `
    SELECT campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${range.start}' AND '${range.end}'
  `;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const emptyResult: GoogleAdsJournalSpend = { code, connected: false, totalSpend: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: [] };

  try {
    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
      { method: "POST", headers, body: JSON.stringify({ query }) }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ...emptyResult, error: `API error (${res.status}): ${text.slice(0, 200)}` };
    }
    const json = await res.json();
    const rows: any[] = json.results || [];
    const byCampaign = new Map<string, { cost: number; impressions: number; clicks: number; conversions: number }>();
    for (const row of rows) {
      const name = row.campaign?.name || "Unnamed Campaign";
      const existing = byCampaign.get(name) ?? { cost: 0, impressions: 0, clicks: 0, conversions: 0 };
      existing.cost += Number(row.metrics?.costMicros || 0) / 1_000_000;
      existing.impressions += Number(row.metrics?.impressions || 0);
      existing.clicks += Number(row.metrics?.clicks || 0);
      existing.conversions += Number(row.metrics?.conversions || 0);
      byCampaign.set(name, existing);
    }
    const campaigns = Array.from(byCampaign.entries())
      .map(([name, m]) => ({
        name,
        cost: Math.round(m.cost),
        impressions: Math.round(m.impressions),
        clicks: Math.round(m.clicks),
        conversions: Math.round(m.conversions * 10) / 10,
      }))
      .sort((a, b) => b.cost - a.cost);
    const totalSpend = Math.round(campaigns.reduce((s, c) => s + c.cost, 0));
    const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const conversions = Math.round(campaigns.reduce((s, c) => s + c.conversions, 0) * 10) / 10;
    return { code, connected: true, totalSpend, impressions, clicks, conversions, campaigns };
  } catch (err) {
    return { ...emptyResult, error: err instanceof Error ? err.message : "Request failed" };
  }
}

/** Spend across every configured journal for one month (defaults to the current month). */
export async function getGoogleAdsSpend(monthKey?: string): Promise<GoogleAdsSpend> {
  const range = monthRange(monthKey);
  const empty: GoogleAdsSpend = { connected: false, totalSpend: 0, currency: "INR", periodLabel: range.label, byJournal: [] };
  if (!baseConfigured()) {
    return { ...empty, error: "Google Ads OAuth credentials are not configured." };
  }

  const journalsWithIds = GOOGLE_ADS_JOURNAL_CODES.map((code) => ({ code, customerId: getCustomerId(code) })).filter(
    (j): j is { code: string; customerId: string } => !!j.customerId
  );
  if (journalsWithIds.length === 0) {
    return { ...empty, error: "No GOOGLE_ADS_CUSTOMER_ID_<JOURNAL> values are configured." };
  }

  try {
    const accessToken = await getAccessToken();
    const byJournal = await Promise.all(
      journalsWithIds.map((j) => fetchJournalSpend(j.code, j.customerId, accessToken, range))
    );
    const totalSpend = byJournal.reduce((s, j) => s + j.totalSpend, 0);
    const connected = byJournal.some((j) => j.connected);
    return { connected, totalSpend, currency: "INR", periodLabel: range.label, byJournal };
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : "Failed to fetch Google Ads spend" };
  }
}

/** Spend for a single journal for one month (defaults to the current month). Used on each journal's own page. */
export async function getGoogleAdsSpendForJournal(code: string, monthKey?: string): Promise<GoogleAdsJournalSpend & { periodLabel: string }> {
  const range = monthRange(monthKey);
  const customerId = getCustomerId(code);
  if (!baseConfigured() || !customerId) {
    return { code, connected: false, totalSpend: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: [], periodLabel: range.label, error: "Not configured for this journal." };
  }
  try {
    const accessToken = await getAccessToken();
    const result = await fetchJournalSpend(code, customerId, accessToken, range);
    return { ...result, periodLabel: range.label };
  } catch (err) {
    return { code, connected: false, totalSpend: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: [], periodLabel: range.label, error: err instanceof Error ? err.message : "Request failed" };
  }
}

function lastMonthKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type GoogleAdsCardData = {
  connected: boolean;
  totalSpend: number;
  delta: number;
  impressions: number;
  clicks: number;
  conversions: number;
  metrics: { label: string; value: string; delta: number }[];
  error?: string;
};

/** This-month spend + delta vs last month + top campaigns, shaped for a single journal's own dashboard card. */
export async function getGoogleAdsCardData(code: string): Promise<GoogleAdsCardData> {
  const [thisMonth, prevMonth] = await Promise.all([
    getGoogleAdsSpendForJournal(code),
    getGoogleAdsSpendForJournal(code, lastMonthKey()),
  ]);
  if (!thisMonth.connected) {
    return { connected: false, totalSpend: 0, delta: 0, impressions: 0, clicks: 0, conversions: 0, metrics: [], error: thisMonth.error };
  }
  const delta = prevMonth.connected && prevMonth.totalSpend > 0
    ? Math.round(((thisMonth.totalSpend - prevMonth.totalSpend) / prevMonth.totalSpend) * 1000) / 10
    : 0;
  const metrics = thisMonth.campaigns.slice(0, 6).map((c) => ({
    label: c.name,
    value: `₹ ${c.cost.toLocaleString("en-IN")}`,
    delta: 0,
  }));
  return {
    connected: true,
    totalSpend: thisMonth.totalSpend,
    delta,
    impressions: thisMonth.impressions,
    clicks: thisMonth.clicks,
    conversions: thisMonth.conversions,
    metrics,
  };
}
