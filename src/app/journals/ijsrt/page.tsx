import { IjpsClient } from "@/components/ijps-client";
import { getJournalPageData } from "@/lib/journal-page-data";

export const dynamic = "force-dynamic";

export default async function IjsrtPage() {
  const data = await getJournalPageData("IJSRT", "ijsrt");
  return (
    <IjpsClient
      data={data}
      journalCode="IJSRT"
      journalName="International Journal of Scientific Research & Technology"
    />
  );
}
