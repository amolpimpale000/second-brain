// ---------------------------------------------------------------------------
// Read-only Google Ads spend for the business expense sheet on
// /journal-management. Uses the Google Ads REST API (GAQL search) — reporting
// queries only, nothing is ever written/mutated in any ad account.
//
// Each journal has its own Ads account (client account) under one shared
// MCC/manager account, so spend is fetched per journal and then summed for
// the combined total.
// ---------------------------------------------------------------------------

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v21";
const JOURNAL_CODES = ["IJPS", "IJSRT", "IJMPS", "IJES", "JPS"];

export type GoogleAdsCampaignSpend = { name: string; cost: number };

export type GoogleAdsJournalSpend = {
  code: string;
  connected: boolean;
  totalSpend: number;
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

async function getAccessToken(): Promise<string> {
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
  return json.access_token;
}

async function fetchJournalSpend(code: string, customerId: string, accessToken: string): Promise<GoogleAdsJournalSpend> {
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
  const query = `
    SELECT campaign.name, metrics.cost_micros
    FROM campaign
    WHERE segments.date DURING THIS_MONTH
  `;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  try {
    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
      { method: "POST", headers, body: JSON.stringify({ query }) }
    );
    if (!res.ok) {
      const text = await res.text();
      return { code, connected: false, totalSpend: 0, campaigns: [], error: `API error (${res.status}): ${text.slice(0, 200)}` };
    }
    const json = await res.json();
    const rows: any[] = json.results || [];
    const byCampaign = new Map<string, number>();
    for (const row of rows) {
      const name = row.campaign?.name || "Unnamed Campaign";
      const cost = Number(row.metrics?.costMicros || 0) / 1_000_000;
      byCampaign.set(name, (byCampaign.get(name) ?? 0) + cost);
    }
    const campaigns = Array.from(byCampaign.entries())
      .map(([name, cost]) => ({ name, cost: Math.round(cost) }))
      .sort((a, b) => b.cost - a.cost);
    const totalSpend = Math.round(campaigns.reduce((s, c) => s + c.cost, 0));
    return { code, connected: true, totalSpend, campaigns };
  } catch (err) {
    return { code, connected: false, totalSpend: 0, campaigns: [], error: err instanceof Error ? err.message : "Request failed" };
  }
}

export async function getGoogleAdsSpend(): Promise<GoogleAdsSpend> {
  const empty: GoogleAdsSpend = { connected: false, totalSpend: 0, currency: "INR", periodLabel: "This Month", byJournal: [] };
  if (!baseConfigured()) {
    return { ...empty, error: "Google Ads OAuth credentials are not configured." };
  }

  const journalsWithIds = JOURNAL_CODES.map((code) => ({ code, customerId: getCustomerId(code) })).filter(
    (j): j is { code: string; customerId: string } => !!j.customerId
  );
  if (journalsWithIds.length === 0) {
    return { ...empty, error: "No GOOGLE_ADS_CUSTOMER_ID_<JOURNAL> values are configured." };
  }

  try {
    const accessToken = await getAccessToken();
    const byJournal = await Promise.all(
      journalsWithIds.map((j) => fetchJournalSpend(j.code, j.customerId, accessToken))
    );
    const totalSpend = byJournal.reduce((s, j) => s + j.totalSpend, 0);
    const connected = byJournal.some((j) => j.connected);
    return { connected, totalSpend, currency: "INR", periodLabel: "This Month", byJournal };
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : "Failed to fetch Google Ads spend" };
  }
}
