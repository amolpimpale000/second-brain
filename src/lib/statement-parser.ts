// ---------------------------------------------------------------------------
// Best-effort parser for PhonePe / bank PDF statements. PDF text extraction
// loses table structure — different banks and PhonePe both lay text out
// differently — so this is a heuristic parser, not a guaranteed-correct one.
// It's designed to be conservative: a line/block it can't confidently read
// is simply skipped rather than guessed wrong, and every parsed row is
// REVIEWED (checkbox select/deselect + editable category) before anything is
// written to the database.
//
// Two strategies are tried, in order:
//   1. PhonePe block format — verified against a real PhonePe statement
//      export. Each transaction is a multi-line block starting with a
//      standalone "MMM DD, YYYY" date line, e.g.:
//        Jul 05, 2026
//        06:16 PM
//        Paid to SOME MERCHANT
//        Transaction ID : T260705...
//        UTR No : 241106902975
//        Debited from XX3356
//        Debit INR 1299.00
//   2. Generic line-based heuristic — for bank statements where each row is
//      roughly one line/table row (date ... description ... amount).
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
  { category: "Food & Dining", patterns: [/zomato/i, /swiggy/i, /restaurant/i, /cafe/i, /\bfood\b/i, /dominos/i, /pizza/i, /starbucks/i, /eatery/i, /\bdine/i, /bakery/i, /kitchen/i, /pedha/i, /mithai/i, /hotel/i] },
  { category: "Transport", patterns: [/uber/i, /ola\b/i, /rapido/i, /petrol/i, /diesel/i, /fuel/i, /fastag/i, /irctc/i, /metro/i, /parking/i, /indian ?oil/i, /bharat petroleum/i, /hp petrol/i, /auto garage/i, /\bgarage\b/i] },
  { category: "Shopping", patterns: [/amazon/i, /flipkart/i, /myntra/i, /ajio/i, /meesho/i, /nykaa/i, /mall\b/i, /\bstore\b/i, /retail/i, /\bmart\b/i, /bazaar/i, /shopvama/i] },
  { category: "Utilities", patterns: [/electric/i, /power ?bill/i, /water ?bill/i, /gas ?bill/i, /broadband/i, /wifi/i, /internet/i, /airtel/i, /jio\b/i, /vodafone/i, /vi\b.*recharge/i, /bses/i, /mahavitaran/i, /bill paid/i] },
  { category: "Entertainment", patterns: [/netflix/i, /prime ?video/i, /hotstar/i, /spotify/i, /bookmyshow/i, /pvr/i, /inox/i, /movie/i, /cinema/i, /gaming/i, /steam/i, /youtube ?premium/i] },
  { category: "Health", patterns: [/pharmacy/i, /apollo/i, /hospital/i, /clinic/i, /medical/i, /medplus/i, /diagnostic/i, /doctor/i, /\bhealth\b/i, /1mg/i, /pharmeasy/i, /netmeds/i, /traya/i] },
  { category: "Education", patterns: [/school/i, /college/i, /university/i, /\bcourse\b/i, /udemy/i, /coursera/i, /tuition/i, /education/i, /books?\b/i] },
  { category: "Loan EMI", patterns: [/\bemi\b/i, /\bloan\b/i, /bajaj finserv/i, /hdfc ?ltd/i, /credit ?card ?bill/i] },
  { category: "Housing", patterns: [/\brent\b/i, /landlord/i, /maintenance/i, /\bsociety\b/i, /housing/i] },
];

// Names/patterns suggesting the money moved to the user's OWN or another
// personal (non-merchant) account — a transfer, not a real expense. This is
// necessarily approximate (there's no way to know for certain from text
// alone), which is exactly why these start UNCHECKED in the review UI rather
// than being silently excluded or silently included.
const TRANSFER_PATTERNS = [
  /\bself\b/i, /own a\/?c/i, /to self/i, /savings a\/?c/i, /\bsb a\/?c/i,
  /fund transfer/i, /\bimps\b/i, /\bneft\b/i, /\brtgs\b/i,
  /^[X*]{2,}\d{2,}$/i, // masked account/card number, e.g. "XXXXXX8875" or "******3175"
];
const MERCHANT_HINT_PATTERNS = [
  /amazon|flipkart|zomato|swiggy|uber|ola\b|netflix|spotify|myntra|ajio|bookmyshow|pharmacy|petrol|electric|airtel|jio\b|hospital|restaurant|\bstore\b|\bmart\b/i,
  /hotel|garage|\bcenter\b|\bcentre\b|pedha|mithai|enterprises|technologies|traya|hostinger|journal/i,
];

export function guessCategory(description: string): string {
  for (const { category, patterns } of CATEGORY_KEYWORDS) {
    if (patterns.some((p) => p.test(description))) return category;
  }
  return "Others";
}

function looksLikeTransfer(description: string): boolean {
  if (/^pos\s/i.test(description)) return false; // POS = card swipe at a real terminal, never a personal transfer
  if (MERCHANT_HINT_PATTERNS.some((p) => p.test(description))) return false; // has a clear merchant name — not a transfer

  // Strip the "Paid to"/"Sent to"/etc. prefix once, up front, so every check
  // below (masked account numbers, self/savings keywords, plain-name shape)
  // runs against the payee itself rather than the leading verb phrase.
  const core = description
    .replace(/^(paid to|sent to|transfer to|payment to|received from|upi[\s-]*)/i, "")
    .replace(/\b(mrs|mr|ms)\.?\s*/i, "")
    .trim();

  if (TRANSFER_PATTERNS.some((p) => p.test(core))) return true;

  // A payee that's just a plain personal name (2-4 alphabetic words, no
  // digits/@/business suffix) reads as a person-to-person UPI payment —
  // could be a bill split, a gift, or a real transfer, so it defaults
  // unchecked like the rest of this heuristic's ambiguous cases.
  const BUSINESS_SUFFIX = /\b(pvt|ltd|llp|inc|store|shop|mart|services|solutions|enterprises|traders|technologies|systems)\b/i;
  return /^[a-z]+(?:\s+[a-z]+){1,3}$/i.test(core) && !BUSINESS_SUFFIX.test(core) && !/\d|@/.test(core);
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function isoFromParts(d: string, moStr: string, y: string): string | null {
  const mo = MONTHS[moStr.toLowerCase()];
  if (!mo) return null;
  const year = y.length === 2 ? 2000 + Number(y) : Number(y);
  return `${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Tries to find a date at the start of a line; returns [isoDate, restOfLine] or null. */
function extractLeadingDate(line: string): [string, string] | null {
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  let m = line.match(/^\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\s*(.*)$/);
  if (m) {
    const [, d, mo, y, rest] = m;
    if (Number(mo) >= 1 && Number(mo) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      const year = y.length === 2 ? 2000 + Number(y) : Number(y);
      return [`${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, rest];
    }
  }
  // DD MMM YYYY / DD MMM YY / DD-MMM-YYYY
  m = line.match(/^\s*(\d{1,2})[\s\-](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-,]*(\d{2,4})\s*(.*)$/i);
  if (m) {
    const [, d, moStr, y, rest] = m;
    const iso = isoFromParts(d, moStr, y);
    return iso ? [iso, rest] : null;
  }
  return null;
}

/** Matches a standalone "MMM DD, YYYY" line (PhonePe's date-block header), e.g. "Jul 05, 2026". */
function matchPhonePeDateLine(line: string): string | null {
  const m = line.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),\s*(\d{4})$/i);
  if (!m) return null;
  const [, moStr, d, y] = m;
  return isoFromParts(d, moStr, y);
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

function buildTransaction(date: string, rawDescription: string, amount: number, direction: "debit" | "credit"): ParsedTransaction {
  const description = cleanDescription(rawDescription) || "Transaction";
  const category = direction === "debit" ? guessCategory(description) : "Other Income";
  return {
    date,
    description: description.slice(0, 120),
    amount: Math.round(amount * 100) / 100,
    direction,
    category,
    likelyTransfer: direction === "debit" && looksLikeTransfer(description),
  };
}

// Lines that carry no transaction-identifying information — headers, page
// markers, and the fixed disclaimer footer PhonePe appends to every export.
const PHONEPE_NOISE_LINE = /^(date transaction details type amount|page \d+ of \d+|this is (a|an) (automatically generated|system generated) statement|--\s*\d+ of \d+\s*--|transaction statement for|visit for phonepe|do not fall prey|the contents of this|received this message|errors in the statement|for privacy policy)/i;

/**
 * PhonePe's block format: a standalone "MMM DD, YYYY" line starts each
 * transaction; everything until the next such line (or end of input)
 * belongs to that transaction.
 */
function parsePhonePeBlocks(lines: string[]): ParsedTransaction[] {
  const out: ParsedTransaction[] = [];
  let i = 0;
  while (i < lines.length) {
    const date = matchPhonePeDateLine(lines[i]);
    if (!date) { i++; continue; }

    // Collect this block's lines (up to the next date line).
    const block: string[] = [];
    let j = i + 1;
    while (j < lines.length && !matchPhonePeDateLine(lines[j])) {
      if (!PHONEPE_NOISE_LINE.test(lines[j])) block.push(lines[j]);
      j++;
    }

    // Time line (e.g. "10:02 AM") — identify and skip, not otherwise used.
    const contentLines = block.filter((l) => !/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(l));

    // Description = first line that isn't a known field (Transaction ID / UTR / Debited-Credited-from / Debit-Credit INR / a bare amount).
    const FIELD_LINE = /^(transaction id|utr no)\s*:/i;
    const ACCOUNT_LINE = /^(debited from|credited to)\s/i;
    const AMOUNT_LINE = /^(debit|credit)\s*inr(\s+[\d,]+\.\d{1,2})?$/i;
    const BARE_AMOUNT_LINE = /^[\d,]+\.\d{1,2}$/;

    const descLine = contentLines.find((l) => !FIELD_LINE.test(l) && !ACCOUNT_LINE.test(l) && !AMOUNT_LINE.test(l) && !BARE_AMOUNT_LINE.test(l));

    // Direction + amount from the "Debit INR"/"Credit INR" line, with the
    // amount either inline or on the very next content line.
    let direction: "debit" | "credit" | null = null;
    let amount: number | null = null;
    for (let k = 0; k < contentLines.length; k++) {
      const m = contentLines[k].match(/^(debit|credit)\s*inr(?:\s+([\d,]+\.\d{1,2}))?$/i);
      if (m) {
        direction = m[1].toLowerCase() === "debit" ? "debit" : "credit";
        if (m[2]) {
          amount = Number(m[2].replace(/,/g, ""));
        } else if (k + 1 < contentLines.length && BARE_AMOUNT_LINE.test(contentLines[k + 1])) {
          amount = Number(contentLines[k + 1].replace(/,/g, ""));
        }
        break;
      }
    }

    if (descLine && direction && amount && amount > 0) {
      out.push(buildTransaction(date, descLine, amount, direction));
    }

    i = j;
  }
  return out;
}

/** Generic line-based heuristic for bank statements laid out roughly one row per line. */
function parseGenericLines(lines: string[]): ParsedTransaction[] {
  const out: ParsedTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const dateMatch = extractLeadingDate(lines[i]);
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
    out.push(buildTransaction(date, lineWithoutAmount, amount, direction));
    i += consumedNext;
  }

  return out;
}

/** Parses raw PDF-extracted text into candidate transactions, trying the PhonePe block format first. */
export function parseStatementText(rawText: string): ParsedTransaction[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const hasPhonePeBlocks = lines.some((l) => matchPhonePeDateLine(l));
  if (hasPhonePeBlocks) {
    const parsed = parsePhonePeBlocks(lines);
    if (parsed.length > 0) return parsed;
  }

  return parseGenericLines(lines);
}
