import { Client } from "pg";

// ---------------------------------------------------------------------------
// Read-only Postgres connection for JPS (Journal of Pharmaceutical Sciences),
// hosted on the user's own Hostinger VPS — a separate server/schema from the
// other four (MySQL) journals. Every query here must be SELECT-only.
// ---------------------------------------------------------------------------

function unquote(v: string | undefined): string | undefined {
  if (!v) return v;
  let s = v.trim();
  while (s.length > 0 && (s[0] === '"' || s[0] === "'")) s = s.slice(1);
  while (s.length > 0 && (s[s.length - 1] === '"' || s[s.length - 1] === "'")) s = s.slice(0, -1);
  s = s.replace(/\\#/g, "#");
  return s;
}

export function getJpsConfigFromEnv() {
  const host = unquote(process.env.JOURNAL_JPS_DB_HOST);
  const port = Number(unquote(process.env.JOURNAL_JPS_DB_PORT) || "5432");
  const database = unquote(process.env.JOURNAL_JPS_DB_NAME);
  const user = unquote(process.env.JOURNAL_JPS_DB_USER);
  const password = unquote(process.env.JOURNAL_JPS_DB_PASSWORD);

  if (!host || !database || !user || !password) {
    throw new Error(
      "JPS database credentials are not fully configured. Please set JOURNAL_JPS_DB_HOST, JOURNAL_JPS_DB_NAME, JOURNAL_JPS_DB_USER, and JOURNAL_JPS_DB_PASSWORD."
    );
  }

  return { host, port, database, user, password };
}

export async function createJpsConnection() {
  const config = getJpsConfigFromEnv();
  const client = new Client({ ...config, connectionTimeoutMillis: 10000 });
  await client.connect();
  return client;
}
