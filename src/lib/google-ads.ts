// ---------------------------------------------------------------------------
// Read-only Google Ads spend for the business expense sheet on
// /journal-management. Uses the Google Ads REST API (GAQL search) — reporting
// queries only, nothing is ever written/mutated in the ad account.
// ---------------------------------------------------------------------------

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v19";

export type GoogleAdsCampaignSpend = { name: string; cost: number };

export type GoogleAdsSpend = {
  connected: boolean;
  totalSpend: number;
  currency: string;
  campaigns: GoogleAdsCampaignSpend[];
  periodLabel: string;
  error?: string;
};

function isConfigured() {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID
  );
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

export async function getGoogleAdsSpend(): Promise<GoogleAdsSpend> {
  const empty: GoogleAdsSpend = { connected: false, totalSpend: 0, currency: "INR", campaigns: [], periodLabel: "This Month" };
  if (!isConfigured()) {
    return { ...empty, error: "Google Ads credentials are not configured." };
  }

  try {
    const accessToken = await getAccessToken();
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
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

    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
      { method: "POST", headers, body: JSON.stringify({ query }) }
    );

    if (!res.ok) {
      const text = await res.text();
      return { ...empty, error: `Google Ads API error (${res.status}): ${text.slice(0, 300)}` };
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

    return { connected: true, totalSpend, currency: "INR", campaigns, periodLabel: "This Month" };
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : "Failed to fetch Google Ads spend" };
  }
}
