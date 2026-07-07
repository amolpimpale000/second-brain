import { IjpsClient } from "@/components/ijps-client";
import { getJpsPageData } from "@/lib/jps-page-data";

export const dynamic = "force-dynamic";

export default async function JpsPage() {
  const data = await getJpsPageData();
  return <IjpsClient data={data} journalCode="JPS" journalName="Journal of Pharmaceutical Sciences" />;
}
