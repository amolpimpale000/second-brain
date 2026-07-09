// ---------------------------------------------------------------------------
// Real income pulled live from each journal's own Razorpay account (each
// journal has its own separate Key ID / Key Secret — no shared account).
// Read-only: only GET /v1/payments is used, nothing is ever created,
// captured, or refunded from here.
// ---------------------------------------------------------------------------

export const RAZORPAY_JOURNAL_CODES = ["IJPS", "IJSRT", "IJMPS", "IJES", "JPS"];

export type RazorpaySource = { name: string; amount: number; pct: number };

export type RazorpayIncome = {
  connected: boolean;
  total: number;
  delta: number;
  sources: RazorpaySource[];
  transactionCount: number;
  periodLabel: string;
  error?: string;
};

function getCreds(code: string): { keyId: string; keySecret: string } | null {
  const keyId = process.env[`Razorpay_Key_ID_${code}`];
  const keySecret = process.env[`Razorpay_Key_Secret_${code}`];
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

/** "2026-07" -> { from: unixStart, to: unixEnd, label } for that calendar month (defaults to current month). */
function monthRange(monthKey?: string): { from: number; to: number; label: string } {
  const now = monthKey ? new Date(`${monthKey}-01T00:00:00Z`) : new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = Date.UTC(year, month, 1) / 1000;
  const end = Date.UTC(year, month + 1, 1) / 1000 - 1;
  const label = new Date(start * 1000).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { from: start, to: end, label };
}

function lastMonthKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

type RazorpayPayment = {
  id: string;
  amount: number;
  status: string;
  method: string;
  email?: string;
  contact?: string;
  created_at: number;
};

async function fetchPage(auth: string, from: number, to: number, skip: number): Promise<RazorpayPayment[]> {
  const res = await fetch(
    `https://api.razorpay.com/v1/payments?from=${from}&to=${to}&count=100&skip=${skip}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay API error (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.items || []) as RazorpayPayment[];
}

// Pages through /v1/payments (100 per page, max). Fetches pages in concurrent
// batches instead of one-at-a-time so large windows (this year / all time,
// which can be thousands of payments = dozens of pages) resolve in seconds
// rather than minutes. A page shorter than 100 marks the end.
async function fetchAllPayments(keyId: string, keySecret: string, from: number, to: number, maxPages = 20): Promise<RazorpayPayment[]> {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const BATCH = 10; // concurrent requests per round
  const all: RazorpayPayment[] = [];
  let base = 0;
  let done = false;

  while (!done && base < maxPages) {
    const skips: number[] = [];
    for (let i = 0; i < BATCH && base + i < maxPages; i++) skips.push((base + i) * 100);
    const pages = await Promise.all(skips.map((skip) => fetchPage(auth, from, to, skip)));
    for (const items of pages) {
      all.push(...items);
      if (items.length < 100) done = true; // reached the last page in this window
    }
    base += BATCH;
  }
  return all;
}

async function fetchMonthIncome(code: string, keyId: string, keySecret: string, monthKey?: string) {
  const range = monthRange(monthKey);
  const payments = await fetchAllPayments(keyId, keySecret, range.from, range.to);
  const captured = payments.filter((p) => p.status === "captured");
  const total = Math.round(captured.reduce((s, p) => s + p.amount, 0) / 100);
  return { total, captured, range };
}

/** Real income for one journal's own Razorpay account, this month, with delta vs last month and a per-method breakdown. */
export async function getRazorpayIncomeForJournal(code: string, monthKey?: string): Promise<RazorpayIncome> {
  const creds = getCreds(code);
  const range = monthRange(monthKey);
  if (!creds) {
    return { connected: false, total: 0, delta: 0, sources: [], transactionCount: 0, periodLabel: range.label, error: "Razorpay credentials are not configured for this journal." };
  }
  try {
    const [thisMonth, prevMonth] = await Promise.all([
      fetchMonthIncome(code, creds.keyId, creds.keySecret, monthKey),
      fetchMonthIncome(code, creds.keyId, creds.keySecret, monthKey || lastMonthKey()),
    ]);
    const delta = prevMonth.total > 0
      ? Math.round(((thisMonth.total - prevMonth.total) / prevMonth.total) * 1000) / 10
      : 0;

    const byMethod = new Map<string, number>();
    for (const p of thisMonth.captured) {
      const method = (p.method || "other").toUpperCase();
      byMethod.set(method, (byMethod.get(method) ?? 0) + p.amount / 100);
    }
    const sources: RazorpaySource[] = Array.from(byMethod.entries())
      .map(([name, amount]) => ({ name, amount: Math.round(amount), pct: thisMonth.total ? Math.round((amount / thisMonth.total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return {
      connected: true,
      total: thisMonth.total,
      delta,
      sources,
      transactionCount: thisMonth.captured.length,
      periodLabel: thisMonth.range.label,
    };
  } catch (err) {
    return { connected: false, total: 0, delta: 0, sources: [], transactionCount: 0, periodLabel: range.label, error: err instanceof Error ? err.message : "Request failed" };
  }
}

// ---------------------------------------------------------------------------
// Selectable-period income (drives the dropdown on each journal's Razorpay
// card). "This Month" = current calendar month; "Last 30 Days" = rolling
// window matching Razorpay's own dashboard default; plus year / all-time.
// ---------------------------------------------------------------------------

export type RazorpayPeriod = "this_month" | "last_30_days" | "this_year" | "all_time";

export const RAZORPAY_PERIODS: { value: RazorpayPeriod; label: string }[] = [
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
];

function periodRange(period: RazorpayPeriod): { from: number; to: number; label: string; maxPages: number } {
  const now = new Date();
  const to = Math.floor(now.getTime() / 1000);
  switch (period) {
    case "this_month": {
      const from = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000);
      const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
      return { from, to, label: `This month (${monthName})`, maxPages: 40 };
    }
    case "last_30_days":
      return { from: to - 30 * 86400, to, label: "Last 30 days", maxPages: 40 };
    case "this_year": {
      const from = Math.floor(Date.UTC(now.getUTCFullYear(), 0, 1) / 1000);
      return { from, to, label: `This year (${now.getUTCFullYear()})`, maxPages: 150 };
    }
    case "all_time":
      return { from: Math.floor(Date.UTC(2015, 0, 1) / 1000), to, label: "All time", maxPages: 400 };
  }
}

/** Real captured income for one journal's Razorpay account over a selectable period. */
export async function getRazorpayIncomeForJournalPeriod(code: string, period: RazorpayPeriod): Promise<RazorpayIncome> {
  const creds = getCreds(code);
  const { from, to, label, maxPages } = periodRange(period);
  if (!creds) {
    return { connected: false, total: 0, delta: 0, sources: [], transactionCount: 0, periodLabel: label, error: "Razorpay credentials are not configured for this journal." };
  }
  try {
    const payments = await fetchAllPayments(creds.keyId, creds.keySecret, from, to, maxPages);
    const captured = payments.filter((p) => p.status === "captured");
    const total = Math.round(captured.reduce((s, p) => s + p.amount, 0) / 100);

    const byMethod = new Map<string, number>();
    for (const p of captured) {
      const method = (p.method || "other").toUpperCase();
      byMethod.set(method, (byMethod.get(method) ?? 0) + p.amount / 100);
    }
    const sources: RazorpaySource[] = Array.from(byMethod.entries())
      .map(([name, amount]) => ({ name, amount: Math.round(amount), pct: total ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);

    // Delta vs the immediately-preceding equal-length window — only for the
    // two short, cheap windows (comparing a whole prior year/all-time would
    // double an already-expensive fetch for little value).
    let delta = 0;
    if (period === "this_month" || period === "last_30_days") {
      const span = to - from;
      const prev = await fetchAllPayments(creds.keyId, creds.keySecret, from - span, from - 1, maxPages).catch(() => []);
      const prevTotal = Math.round(prev.filter((p) => p.status === "captured").reduce((s, p) => s + p.amount, 0) / 100);
      delta = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : 0;
    }

    return { connected: true, total, delta, sources, transactionCount: captured.length, periodLabel: label };
  } catch (err) {
    return { connected: false, total: 0, delta: 0, sources: [], transactionCount: 0, periodLabel: label, error: err instanceof Error ? err.message : "Request failed" };
  }
}

export type RazorpayJournalIncome = { code: string } & RazorpayIncome;

/** Real income across every configured journal's Razorpay account, for one month (defaults to current). */
export async function getRazorpayIncomeAll(monthKey?: string): Promise<{ connected: boolean; total: number; periodLabel: string; byJournal: RazorpayJournalIncome[] }> {
  const results = await Promise.all(
    RAZORPAY_JOURNAL_CODES.map(async (code) => ({ code, ...(await getRazorpayIncomeForJournal(code, monthKey)) }))
  );
  const total = results.reduce((s, r) => s + r.total, 0);
  const connected = results.some((r) => r.connected);
  const range = monthRange(monthKey);
  return { connected, total, periodLabel: range.label, byJournal: results };
}
