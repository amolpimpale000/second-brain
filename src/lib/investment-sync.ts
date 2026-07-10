import { listEntity, updateEntity, type FinInvestment } from "./finance-store";
import { getLiveValueInr, getLivePricePerUnitInr, LIVE_PRICED_TYPES } from "./investment-prices";

export type SyncLogEntry = {
  id: string;
  name: string;
  action: "priced" | "sip_bought" | "skipped";
  detail: string;
};

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Refreshes current_value for every live-priced holding (Stocks, US Stocks,
 * ETFs, Mutual Funds, Gold) that has a quantity set, and — once per calendar
 * month, on or after each holding's sip_day — buys new units with that
 * month's SIP amount at the live price, exactly like a real SIP would.
 *
 * "On or after sip_day" (not a strict date match) so a missed cron run
 * doesn't skip the month entirely; last_sip_credited_month is the dedup
 * guard that stops it from buying twice in the same month.
 */
export async function runInvestmentPriceSync(): Promise<SyncLogEntry[]> {
  const log: SyncLogEntry[] = [];
  const investments = (await listEntity("investments")) as FinInvestment[];
  const now = new Date();
  const today = now.getUTCDate();
  const curMonthKey = monthKey(now);

  for (const inv of investments) {
    if (!LIVE_PRICED_TYPES.includes(inv.type)) continue;
    if (!inv.quantity || inv.quantity <= 0) {
      log.push({ id: inv.id, name: inv.name, action: "skipped", detail: "no quantity set" });
      continue;
    }
    if (inv.type !== "Gold" && !inv.symbol) {
      log.push({ id: inv.id, name: inv.name, action: "skipped", detail: "no symbol set" });
      continue;
    }

    let quantity = inv.quantity;
    let invested = inv.invested;
    let lastSipCreditedMonth = inv.lastSipCreditedMonth;

    // SIP auto-buy: on/after sip_day, once per month, buy units at today's live price.
    const dueThisMonth = inv.sipAmount && inv.sipAmount > 0 && inv.sipDay && today >= inv.sipDay;
    const alreadyCreditedThisMonth = lastSipCreditedMonth === curMonthKey;
    if (dueThisMonth && !alreadyCreditedThisMonth) {
      const pricePerUnit = await getLivePricePerUnitInr(inv.type, inv.symbol);
      if (pricePerUnit && pricePerUnit > 0) {
        const newUnits = inv.sipAmount! / pricePerUnit;
        quantity += newUnits;
        invested += inv.sipAmount!;
        lastSipCreditedMonth = curMonthKey;
        log.push({
          id: inv.id, name: inv.name, action: "sip_bought",
          detail: `+₹${inv.sipAmount} bought ${newUnits.toFixed(4)} units @ ₹${pricePerUnit.toFixed(2)}`,
        });
      }
    }

    const liveValue = await getLiveValueInr(inv.type, quantity, inv.symbol);
    if (liveValue == null) {
      log.push({ id: inv.id, name: inv.name, action: "skipped", detail: "live price unavailable" });
      continue;
    }

    const patch: Record<string, unknown> = {
      currentValue: liveValue,
      priceUpdatedAt: new Date().toISOString(),
    };
    if (quantity !== inv.quantity) patch.quantity = quantity;
    if (invested !== inv.invested) patch.invested = invested;
    if (lastSipCreditedMonth !== inv.lastSipCreditedMonth) patch.lastSipCreditedMonth = lastSipCreditedMonth;

    await updateEntity("investments", inv.id, patch);
    log.push({ id: inv.id, name: inv.name, action: "priced", detail: `₹${liveValue.toLocaleString("en-IN")}` });
  }

  return log;
}
