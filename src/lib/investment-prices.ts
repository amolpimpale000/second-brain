// ---------------------------------------------------------------------------
// Live investment pricing — free, public, no-API-key data sources:
//
//   Stocks / US Stocks  — Yahoo Finance's public chart endpoint. Indian
//                         tickers use the ".NS" (NSE) or ".BO" (BSE) suffix,
//                         e.g. "RELIANCE.NS"; US tickers are plain, e.g. "AAPL".
//   Mutual Funds        — mfapi.in, a free JSON wrapper around AMFI's daily
//                         NAV data (AMFI's own site isn't reachable from this
//                         app's dev sandbox, but mfapi.in mirrors the same
//                         data and also offers fund-name search).
//   Gold                — Yahoo's COMEX gold futures ticker "GC=F" (USD per
//                         troy ounce) converted to INR per gram via the
//                         live USD/INR rate and the troy-ounce-to-gram factor.
//
// Every function returns null on failure instead of throwing, so a sync run
// can skip one bad symbol without failing the whole batch.
// ---------------------------------------------------------------------------

const YAHOO_HEADERS = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
const TROY_OUNCE_GRAMS = 31.1034768;

export type PriceQuote = { price: number; currency: "INR" | "USD" };

async function yahooQuote(symbol: string): Promise<PriceQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { headers: YAHOO_HEADERS }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const currency = meta?.currency;
    if (typeof price !== "number" || (currency !== "INR" && currency !== "USD")) return null;
    return { price, currency };
  } catch {
    return null;
  }
}

/** Live price for an Indian or US stock/ETF ticker (Yahoo Finance symbol format). */
export async function getStockPrice(symbol: string): Promise<PriceQuote | null> {
  return yahooQuote(symbol);
}

/** Live USD→INR exchange rate. */
export async function getUsdInrRate(): Promise<number | null> {
  const q = await yahooQuote("USDINR=X");
  return q?.price ?? null;
}

/** Live gold price in INR per gram, derived from COMEX futures (USD/oz) × USD-INR. */
export async function getGoldPricePerGram(): Promise<number | null> {
  const [gold, usdInr] = await Promise.all([yahooQuote("GC=F"), getUsdInrRate()]);
  if (!gold || !usdInr) return null;
  const usdPerOz = gold.currency === "USD" ? gold.price : gold.price / usdInr;
  return (usdPerOz * usdInr) / TROY_OUNCE_GRAMS;
}

/** Live NAV (₹ per unit) for a mutual fund, by its AMFI scheme code. */
export async function getMutualFundNav(schemeCode: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`, { headers: YAHOO_HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    const nav = Number(json?.data?.[0]?.nav);
    return Number.isFinite(nav) && nav > 0 ? nav : null;
  } catch {
    return null;
  }
}

export type MfSearchResult = { schemeCode: string; schemeName: string };

/** Search mutual fund schemes by name — used by the Add/Edit form to find the right scheme code. */
export async function searchMutualFunds(query: string): Promise<MfSearchResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`, { headers: YAHOO_HEADERS });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.slice(0, 20).map((r: any) => ({ schemeCode: String(r.schemeCode), schemeName: r.schemeName }));
  } catch {
    return [];
  }
}

/**
 * Resolves a live current value (in ₹) for one investment, given its type,
 * quantity, and symbol. Returns null when the type isn't live-priced or the
 * required fields are missing — callers should leave currentValue untouched
 * in that case (manual entry stays authoritative).
 */
export async function getLiveValueInr(type: string, quantity: number, symbol: string | undefined): Promise<number | null> {
  if (!quantity || quantity <= 0) return null;
  if (type === "Gold") {
    const perGram = await getGoldPricePerGram();
    return perGram != null ? Math.round(perGram * quantity) : null;
  }
  if (!symbol) return null;
  if (type === "Mutual Funds") {
    const nav = await getMutualFundNav(symbol);
    return nav != null ? Math.round(nav * quantity) : null;
  }
  if (type === "Stocks" || type === "US Stocks" || type === "ETFs") {
    const quote = await getStockPrice(symbol);
    if (!quote) return null;
    if (quote.currency === "INR") return Math.round(quote.price * quantity);
    const usdInr = await getUsdInrRate();
    return usdInr != null ? Math.round(quote.price * usdInr * quantity) : null;
  }
  return null;
}

/** Live per-unit price (not multiplied by quantity) — used when buying new SIP units. */
export async function getLivePricePerUnitInr(type: string, symbol: string | undefined): Promise<number | null> {
  if (type === "Gold") return getGoldPricePerGram();
  if (!symbol) return null;
  if (type === "Mutual Funds") return getMutualFundNav(symbol);
  if (type === "Stocks" || type === "US Stocks" || type === "ETFs") {
    const quote = await getStockPrice(symbol);
    if (!quote) return null;
    if (quote.currency === "INR") return quote.price;
    const usdInr = await getUsdInrRate();
    return usdInr != null ? quote.price * usdInr : null;
  }
  return null;
}

export const LIVE_PRICED_TYPES = ["Stocks", "US Stocks", "ETFs", "Mutual Funds", "Gold"];
