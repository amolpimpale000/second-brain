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

export type GoogleAdsAccountBudget = {
  approvedLimit: number;
  adjustments: number;
  served: number;
  remaining: number;
  pctRemaining: number; // 0-100
};

export type GoogleAdsJournalSpend = {
  code: string;
  connected: boolean;
  totalSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  campaigns: GoogleAdsCampaignSpend[];
  budget: GoogleAdsAccountBudget | null;
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

/** Returns a {start, end} range covering the last `n` complete months including the current one. */
function lastNMonthsRange(n: number): { start: string; end: string } {
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth();
  const start = new Date(Date.UTC(endYear, endMonth - n + 1, 1));
  const end = new Date(Date.UTC(endYear, endMonth + 1, 0));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
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

function adsHeaders(accessToken: string): Record<string, string> {
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;
  return headers;
}

// The current approved account budget's remaining balance. Google Ads doesn't
// expose a literal "prepaid wallet" figure via the API — but for these
// journals' invoiced monthly-budget setup, account_budget.approved_spending_limit
// (+ adjustments, e.g. refunds/credits) minus amount_served IS the real
// remaining balance before the account needs a new budget/top-up to keep
// serving ads. Picks the most recently created budget (ORDER BY id DESC).
async function fetchAccountBudget(customerId: string, accessToken: string): Promise<GoogleAdsAccountBudget | null> {
  const query = `
    SELECT account_budget.id, account_budget.status, account_budget.approved_spending_limit_micros,
           account_budget.total_adjustments_micros, account_budget.amount_served_micros
    FROM account_budget
    ORDER BY account_budget.id DESC
    LIMIT 1
  `;
  try {
    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
      { method: "POST", headers: adsHeaders(accessToken), body: JSON.stringify({ query }) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const row = json.results?.[0]?.accountBudget;
    if (!row) return null;
    const approvedLimit = Number(row.approvedSpendingLimitMicros || 0) / 1_000_000;
    const adjustments = Number(row.totalAdjustmentsMicros || 0) / 1_000_000;
    const served = Number(row.amountServedMicros || 0) / 1_000_000;
    const effectiveLimit = approvedLimit + adjustments;
    const remaining = Math.round(effectiveLimit - served);
    const pctRemaining = effectiveLimit > 0 ? Math.max(0, Math.round((remaining / effectiveLimit) * 1000) / 10) : 0;
    return { approvedLimit: Math.round(approvedLimit), adjustments: Math.round(adjustments), served: Math.round(served), remaining, pctRemaining };
  } catch {
    return null;
  }
}

async function fetchJournalSpend(
  code: string,
  customerId: string,
  accessToken: string,
  range: { start: string; end: string }
): Promise<GoogleAdsJournalSpend> {
  const query = `
    SELECT campaign.name, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${range.start}' AND '${range.end}'
  `;
  const emptyResult: GoogleAdsJournalSpend = { code, connected: false, totalSpend: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: [], budget: null };

  try {
    const [res, budget] = await Promise.all([
      fetch(
        `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
        { method: "POST", headers: adsHeaders(accessToken), body: JSON.stringify({ query }) }
      ),
      fetchAccountBudget(customerId, accessToken),
    ]);
    if (!res.ok) {
      const text = await res.text();
      return { ...emptyResult, budget, error: `API error (${res.status}): ${text.slice(0, 200)}` };
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
    return { code, connected: true, totalSpend, impressions, clicks, conversions, campaigns, budget };
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
    return { code, connected: false, totalSpend: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: [], budget: null, periodLabel: range.label, error: "Not configured for this journal." };
  }
  try {
    const accessToken = await getAccessToken();
    const result = await fetchJournalSpend(code, customerId, accessToken, range);
    return { ...result, periodLabel: range.label };
  } catch (err) {
    return { code, connected: false, totalSpend: 0, impressions: 0, clicks: 0, conversions: 0, campaigns: [], budget: null, periodLabel: range.label, error: err instanceof Error ? err.message : "Request failed" };
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

/** All-time spend for a single journal. Used to make the journal page's
 *  "Total Expenses" and "Net Profit" KPIs match the combined view in
 *  /journal-management's Expense Journal matrix. */
export async function getAllTimeGoogleAdsSpendForJournal(code: string): Promise<number> {
  const customerId = getCustomerId(code);
  if (!baseConfigured() || !customerId) return 0;
  const end = new Date().toISOString().slice(0, 10);
  const range = { start: "2020-01-01", end };
  try {
    const accessToken = await getAccessToken();
    const result = await fetchJournalSpend(code, customerId, accessToken, range);
    return result.connected ? result.totalSpend : 0;
  } catch (err) {
    console.error(`All-time Google Ads spend failed for ${code}:`, err instanceof Error ? err.message : err);
    return 0;
  }
}

export type MonthlyAdsSpend = { month: string; spend: number };

/** Monthly Google Ads spend for a single journal across a date range.
 *  Used for the /journal-management monthly revenue/profitability sections. */
export async function getGoogleAdsSpendByMonth(
  code: string,
  range: { start: string; end: string }
): Promise<MonthlyAdsSpend[]> {
  const customerId = getCustomerId(code);
  if (!baseConfigured() || !customerId) return [];
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await getAccessToken()}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;

  const query = `
    SELECT segments.date, metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${range.start}' AND '${range.end}'
  `;

  try {
    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
      { method: "POST", headers, body: JSON.stringify({ query }) }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error(`Google Ads monthly spend API error for ${code}:`, text.slice(0, 200));
      return [];
    }
    const json = await res.json();
    const rows: any[] = json.results || [];
    const byMonth = new Map<string, number>();
    for (const row of rows) {
      const month = row.segments?.date?.slice(0, 7);
      if (!month) continue;
      byMonth.set(month, (byMonth.get(month) ?? 0) + Number(row.metrics?.costMicros || 0) / 1_000_000);
    }
    return Array.from(byMonth.entries())
      .map(([month, spend]) => ({ month, spend: Math.round(spend) }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (err) {
    console.error(`Google Ads monthly spend failed for ${code}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

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
