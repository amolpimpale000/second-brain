// ---------------------------------------------------------------------------
// Best-effort parser for PhonePe / bank PDF statements. PDF text extraction
// loses table structure — different banks and PhonePe both lay text out
// differently — so this is a heuristic line-scanner, not a guaranteed-correct
// parser. It's designed to be conservative: a line it can't confidently read
// (no clear date + amount) is simply skipped rather than guessed wrong, and
// every parsed row is REVIEWED (checkbox select/deselect + editable
// category) before anything is written to the database.
// ---------------------------------------------------------------------------

export type ParsedTransaction = {
  date: string; // "YYYY-MM-DD"
  description: string;
  amount: number;
  direction: "debit" | "credit"; // debit = money out = expense; credit = money in = income
  category: string;
  likelyTransfer: boolean; // pre-unchecked in the review UI — probably a transfer to your own/another personal account, not a real expense
};

const EXPENSE_CATEGORIES = ["Housing", "Food & Dining", "Transport", "Shopping", "Utilities", "Entertainment", "Health", "Education", "Loan EMI", "Others"];

const CATEGORY_KEYWORDS: { category: string; patterns: RegExp[] }[] = [
  { category: "Food & Dining", patterns: [/zomato/i, /swiggy/i, /restaurant/i, /cafe/i, /food/i, /dominos/i, /pizza/i, /starbucks/i, /eatery/i, /dine/i, /bakery/i, /kitchen/i] },
  { category: "Transport", patterns: [/uber/i, /ola\b/i, /rapido/i, /petrol/i, /diesel/i, /fuel/i, /fastag/i, /irctc/i, /metro/i, /parking/i, /indian ?oil/i, /bharat petroleum/i, /hp petrol/i] },
  { category: "Shopping", patterns: [/amazon/i, /flipkart/i, /myntra/i, /ajio/i, /meesho/i, /nykaa/i, /mall\b/i, /store\b/i, /retail/i, /mart\b/i, /bazaar/i] },
  { category: "Utilities", patterns: [/electric/i, /power ?bill/i, /water ?bill/i, /gas ?bill/i, /broadband/i, /wifi/i, /internet/i, /airtel/i, /jio\b/i, /vodafone/i, /vi\b.*recharge/i, /bses/i, /mahavitaran/i] },
  { category: "Entertainment", patterns: [/netflix/i, /prime ?video/i, /hotstar/i, /spotify/i, /bookmyshow/i, /pvr/i, /inox/i, /movie/i, /cinema/i, /gaming/i, /steam/i, /youtube ?premium/i] },
  { category: "Health", patterns: [/pharmacy/i, /apollo/i, /hospital/i, /clinic/i, /medical/i, /medplus/i, /diagnostic/i, /doctor/i, /health/i, /1mg/i, /pharmeasy/i, /netmeds/i] },
  { category: "Education", patterns: [/school/i, /college/i, /university/i, /course/i, /udemy/i, /coursera/i, /tuition/i, /education/i, /books?\b/i] },
  { category: "Loan EMI", patterns: [/\bemi\b/i, /loan/i, /bajaj finserv/i, /hdfc ?ltd/i, /credit ?card ?bill/i] },
  { category: "Housing", patterns: [/rent\b/i, /landlord/i, /maintenance/i, /society/i, /housing/i] },
];

// Names/patterns suggesting the money moved to the user's OWN or another
// personal (non-merchant) account — a transfer, not a real expense. This is
// necessarily approximate (there's no way to know for certain from text
// alone), which is exactly why these start UNCHECKED in the review UI rather
// than being silently excluded or silently included.
const TRANSFER_PATTERNS = [
  /\bself\b/i, /own a\/?c/i, /to self/i, /savings a\/?c/i, /\bsb a\/?c/i,
  /fund transfer/i, /\bimps\b/i, /\bneft\b/i, /\brtgs\b/i,
];
const MERCHANT_HINT_PATTERNS = [
  /amazon|flipkart|zomato|swiggy|uber|ola\b|netflix|spotify|myntra|ajio|bookmyshow|pharmacy|petrol|electric|airtel|jio\b|hospital|restaurant|store\b|mart\b/i,
];

export function guessCategory(description: string): string {
  for (const { category, patterns } of CATEGORY_KEYWORDS) {
    if (patterns.some((p) => p.test(description))) return category;
  }
  return "Others";
}

function looksLikeTransfer(description: string): boolean {
  if (MERCHANT_HINT_PATTERNS.some((p) => p.test(description))) return false; // has a clear merchant name — not a transfer
  if (TRANSFER_PATTERNS.some((p) => p.test(description))) return true;

  // A payee that's just a plain personal name (2-4 alphabetic words, no
  // digits/@/business suffix) reads as a person-to-person UPI payment —
  // could be a bill split, a gift, or a real transfer, so it defaults
  // unchecked like the rest of this heuristic's ambiguous cases.
  const core = description
    .replace(/^(paid to|sent to|transfer to|payment to|upi[\s-]*)/i, "")
    .replace(/\b(mr|mrs|ms)\.?\s*/i, "")
    .trim();
  const BUSINESS_SUFFIX = /\b(pvt|ltd|llp|inc|store|shop|mart|services|solutions|enterprises|traders|technologies|systems)\b/i;
  return /^[a-z]+(?:\s+[a-z]+){1,3}$/i.test(core) && !BUSINESS_SUFFIX.test(core) && !/\d|@/.test(core);
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Tries to find a date at the start of a line; returns [isoDate, restOfLine] or null. */
function extractLeadingDate(line: string): [string, string] | null {
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let m = line.match(/^\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\s*(.*)$/);
  if (m) {
    const [, d, mo, y, rest] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    if (Number(mo) >= 1 && Number(mo) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return [`${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, rest];
    }
  }
  // DD MMM YYYY / DD MMM YY / DD-MMM-YYYY
  m = line.match(/^\s*(\d{1,2})[\s\-](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-,]*(\d{2,4})\s*(.*)$/i);
  if (m) {
    const [, d, moStr, y, rest] = m;
    const mo = MONTHS[moStr.toLowerCase()];
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    return [`${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, rest];
  }
  return null;
}

// Deliberately strict: requires a currency symbol, comma-grouping, or a
// 2-digit decimal — never a bare digit run — so long unformatted numbers
// like UPI reference IDs or account numbers can't be mistaken for amounts.
const AMOUNT_PATTERN =
  /(?:₹|Rs\.?|INR)\s?[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|(?<!\d)[0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]{1,2})?(?!\d)|(?<!\d)[0-9]+\.[0-9]{2}(?!\d)/g;

/** Finds the most plausible amount in a line, returning [amount, lineWithAllAmountsStripped]. */
function extractAmount(line: string): [number, string] | null {
  const matches = [...line.matchAll(AMOUNT_PATTERN)];
  const candidates = matches
    .map((m) => ({ raw: m[0], index: m.index ?? 0, value: Number(m[0].replace(/[₹,]|Rs\.?|INR/g, "").trim()) }))
    .filter((c) => Number.isFinite(c.value) && c.value > 0);
  if (candidates.length === 0) return null;

  // Statements often show the transaction amount followed by a running
  // balance — when there are 2+ candidates, the second-to-last is usually
  // the transaction amount and the last is the balance.
  const pickIdx = candidates.length >= 2 ? candidates.length - 2 : candidates.length - 1;
  const pick = candidates[pickIdx];

  // Strip every matched number (not just the picked one) so stray balance/
  // reference figures don't leak into the description.
  let cleaned = "";
  let cursor = 0;
  for (const m of matches) {
    cleaned += line.slice(cursor, m.index ?? 0);
    cursor = (m.index ?? 0) + m[0].length;
  }
  cleaned += line.slice(cursor);

  return [pick.value, cleaned];
}

function detectDirection(line: string): "debit" | "credit" | null {
  if (/\b(debited|debit|dr\.?)\b/i.test(line)) return "debit";
  if (/\b(credited|credit|cr\.?)\b/i.test(line)) return "credit";
  if (/\bpaid to\b|\bsent to\b|\bpayment to\b/i.test(line)) return "debit";
  if (/\breceived from\b|\bpayment from\b/i.test(line)) return "credit";
  return null;
}

function cleanDescription(s: string): string {
  return s
    .replace(/\b(debited|credited|debit|credit|dr\.?|cr\.?)\b/gi, "")
    .replace(/\b(upi ref|ref no|txn id|transaction id|reference)\.?:?\s*\d+/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-:|]+|[\s\-:|]+$/g, "")
    .trim();
}

/** Parses raw PDF-extracted text into candidate transactions. Lines without a confident date+amount are skipped. */
export function parseStatementText(rawText: string): ParsedTransaction[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: ParsedTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const dateMatch = extractLeadingDate(line);
    if (!dateMatch) continue;
    const [date, afterDate] = dateMatch;
    let workingLine = afterDate;

    // If the amount isn't on this line, look ahead up to 2 more lines (multi-line rows are common in extracted PDF text).
    let amountResult = extractAmount(workingLine);
    let mergedLine = workingLine;
    let consumedNext = 0;
    if (!amountResult) {
      for (let look = 1; look <= 2 && i + look < lines.length; look++) {
        const nextLine = lines[i + look];
        if (extractLeadingDate(nextLine)) break; // next transaction started — stop looking ahead
        mergedLine = `${mergedLine} ${nextLine}`;
        amountResult = extractAmount(mergedLine);
        if (amountResult) { consumedNext = look; break; }
      }
    }
    if (!amountResult) continue;

    const [amount, lineWithoutAmount] = amountResult;
    if (amount <= 0 || amount > 10_000_000) continue; // sanity bounds

    const direction = detectDirection(mergedLine) ?? (/\+/.test(lineWithoutAmount) ? "credit" : "debit");
    const description = cleanDescription(lineWithoutAmount) || "Transaction";
    const category = direction === "debit" ? guessCategory(description) : "Other Income";

    out.push({
      date,
      description: description.slice(0, 120),
      amount: Math.round(amount * 100) / 100,
      direction,
      category,
      likelyTransfer: direction === "debit" && looksLikeTransfer(description),
    });

    i += consumedNext;
  }

  return out;
}
