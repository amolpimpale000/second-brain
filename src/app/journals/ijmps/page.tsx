import { IjpsClient } from "@/components/ijps-client";
import { getJournalPageData } from "@/lib/journal-page-data";

export const dynamic = "force-dynamic";

export default async function IjmpsPage() {
  const data = await getJournalPageData("IJMPS", "ijmps");
  return (
    <IjpsClient
      data={data}
      journalCode="IJMPS"
      journalName="International Journal of Medical & Pharmaceutical Sciences"
    />
  );
}
