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

async function fetchAllPayments(keyId: string, keySecret: string, from: number, to: number): Promise<RazorpayPayment[]> {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const all: RazorpayPayment[] = [];
  let skip = 0;
  for (let page = 0; page < 20; page++) {
    const res = await fetch(
      `https://api.razorpay.com/v1/payments?from=${from}&to=${to}&count=100&skip=${skip}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Razorpay API error (${res.status}): ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const items: RazorpayPayment[] = json.items || [];
    all.push(...items);
    if (items.length < 100) break;
    skip += 100;
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
