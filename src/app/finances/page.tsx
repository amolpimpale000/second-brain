import type { Metadata } from "next";
import { FinancesClient } from "@/components/finances-client";
import { getFinanceData } from "@/lib/finance-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Finances — Second Brain",
  description: "Every rupee in and out — income, expenses, and cash flow.",
};

export default async function FinancesPage() {
  const initial = await getFinanceData();
  return <FinancesClient initial={initial} />;
}
