import { IjpsClient } from "@/components/ijps-client";
import { getIjpsPageData } from "@/lib/ijps-dashboard";

export const dynamic = "force-dynamic";

export default async function IjpsPage() {
  const data = await getIjpsPageData();
  return <IjpsClient data={data} />;
}
