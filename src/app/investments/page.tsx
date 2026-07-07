import type { Metadata } from "next";
import { InvestmentsClient } from "@/components/investments-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investments — Second Brain",
  description: "Portfolio, holdings, SIPs and asset allocation across all your investments.",
};

export default function InvestmentsPage() {
  return <InvestmentsClient />;
}
