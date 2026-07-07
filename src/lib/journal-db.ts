import mysql from "mysql2/promise";

export type JournalConnectionConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

// Hosting panels often store env values exactly as pasted. If a value was
// copied from a .env file with surrounding quotes (e.g. PASSWORD="abc#123"),
// stray quote characters (matched pair, or just one from a partial
// selection) end up as literal characters in the stored value, which then
// fails auth with an otherwise-correct password. Strip them defensively.
function unquote(v: string | undefined): string | undefined {
  if (!v) return v;
  let s = v.trim();
  while (s.length > 0 && (s[0] === '"' || s[0] === "'")) s = s.slice(1);
  while (s.length > 0 && (s[s.length - 1] === '"' || s[s.length - 1] === "'")) s = s.slice(0, -1);
  // Hostinger's env-var import treats "#" as a special/comment character and
  // stores it backslash-escaped ("\#") instead of literal "#". Undo that.
  s = s.replace(/\\#/g, "#");
  return s;
}

/**
 * Reads JOURNAL_<CODE>_DB_{HOST,PORT,NAME,USER,PASSWORD} for the given
 * journal code (e.g. "IJPS", "IJSRT", "IJMPS", "IJES").
 */
export function getJournalConfigFromEnv(code: string): JournalConnectionConfig {
  const prefix = `JOURNAL_${code}_DB_`;
  const host = unquote(process.env[`${prefix}HOST`]);
  const port = Number(unquote(process.env[`${prefix}PORT`]) || "3306");
  const database = unquote(process.env[`${prefix}NAME`]);
  const user = unquote(process.env[`${prefix}USER`]);
  const password = unquote(process.env[`${prefix}PASSWORD`]);

  if (!host || !database || !user || !password) {
    throw new Error(
      `${code} database credentials are not fully configured. ` +
        `Please set ${prefix}HOST, ${prefix}NAME, ${prefix}USER, and ${prefix}PASSWORD.`
    );
  }

  return { host, port, database, user, password };
}

export async function createJournalConnection(code: string, cfg?: JournalConnectionConfig) {
  const config = cfg ?? getJournalConfigFromEnv(code);
  return mysql.createConnection(config);
}
