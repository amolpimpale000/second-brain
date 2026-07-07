import mysql from "mysql2/promise";

export type IjpsConnectionConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

// Hosting panels often store env values exactly as pasted. If a value was
// copied from a .env file with surrounding quotes (e.g. PASSWORD="abc#123"),
// the quotes end up as literal characters in the stored value, which then
// fails auth with an otherwise-correct password. Strip them defensively.
function unquote(v: string | undefined): string | undefined {
  if (!v) return v;
  const trimmed = v.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

export function getIjpsConfigFromEnv(): IjpsConnectionConfig {
  const host = unquote(process.env.JOURNAL_IJPS_DB_HOST);
  const port = Number(unquote(process.env.JOURNAL_IJPS_DB_PORT) || "3306");
  const database = unquote(process.env.JOURNAL_IJPS_DB_NAME);
  const user = unquote(process.env.JOURNAL_IJPS_DB_USER);
  const password = unquote(process.env.JOURNAL_IJPS_DB_PASSWORD);

  if (!host || !database || !user || !password) {
    throw new Error(
      "IJPS database credentials are not fully configured. " +
        "Please set JOURNAL_IJPS_DB_HOST, JOURNAL_IJPS_DB_NAME, " +
        "JOURNAL_IJPS_DB_USER, and JOURNAL_IJPS_DB_PASSWORD."
    );
  }

  return { host, port, database, user, password };
}

export async function createIjpsConnection(cfg?: IjpsConnectionConfig) {
  const config = cfg ?? getIjpsConfigFromEnv();
  return mysql.createConnection(config);
}
