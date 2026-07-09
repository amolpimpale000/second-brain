import { DashboardClient } from "@/components/dashboard-client";
import { getDashboardData } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}
