import { JournalManagementClient } from "@/components/journal-management-client";
import { getJournalDashboardData } from "@/lib/journal-dashboard";

export const dynamic = "force-dynamic";

export default async function JournalManagementPage() {
  const data = await getJournalDashboardData();
  return <JournalManagementClient data={data} />;
}
