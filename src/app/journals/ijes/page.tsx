import { IjpsClient } from "@/components/ijps-client";
import { getJournalPageData } from "@/lib/journal-page-data";

export const dynamic = "force-dynamic";

export default async function IjesPage() {
  const data = await getJournalPageData("IJES", "ijes");
  return (
    <IjpsClient
      data={data}
      journalCode="IJES"
      journalName="International Journal of Engineering & Science"
    />
  );
}
