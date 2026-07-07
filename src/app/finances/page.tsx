import type { Metadata } from "next";
import { FinancesClient } from "@/components/finances-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Finances — Second Brain",
  description: "Every rupee in and out — income, expenses, and cash flow.",
};

export default function FinancesPage() {
  return <FinancesClient />;
}
