import type { Metadata } from "next";
import { InvestmentsClient } from "@/components/investments-client";
import { listEntity, type FinInvestment } from "@/lib/finance-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investments — Second Brain",
  description: "Portfolio, holdings and asset allocation across all your investments.",
};

export default async function InvestmentsPage() {
  let investments: FinInvestment[] = [];
  try {
    investments = (await listEntity("investments")) as FinInvestment[];
  } catch (err) {
    console.error("Investments failed to load:", err instanceof Error ? err.message : err);
  }
  return <InvestmentsClient initial={investments} />;
}
