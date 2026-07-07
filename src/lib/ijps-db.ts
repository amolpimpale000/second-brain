// Thin IJPS-specific wrapper around the generic journal-db connection layer.
// Kept for backward compatibility with existing imports.
import {
  getJournalConfigFromEnv,
  createJournalConnection,
  type JournalConnectionConfig,
} from "./journal-db";

export type IjpsConnectionConfig = JournalConnectionConfig;

export function getIjpsConfigFromEnv(): IjpsConnectionConfig {
  return getJournalConfigFromEnv("IJPS");
}

export async function createIjpsConnection(cfg?: IjpsConnectionConfig) {
  return createJournalConnection("IJPS", cfg);
}
