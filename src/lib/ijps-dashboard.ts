import { getJournalPageData, type JournalPageData } from "./journal-page-data";

// Backward-compatible IJPS-specific wrapper around the generic journal page
// data layer. Kept so existing imports (/journals/ijps/page.tsx) don't change.
export type IjpsPageData = JournalPageData;

export async function getIjpsPageData(): Promise<IjpsPageData> {
  return getJournalPageData("IJPS", "ijps");
}
