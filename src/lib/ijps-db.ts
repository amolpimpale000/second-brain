import mysql from "mysql2/promise";

export type IjpsConnectionConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

export function getIjpsConfigFromEnv(): IjpsConnectionConfig {
  const host = process.env.JOURNAL_IJPS_DB_HOST;
  const port = Number(process.env.JOURNAL_IJPS_DB_PORT || "3306");
  const database = process.env.JOURNAL_IJPS_DB_NAME;
  const user = process.env.JOURNAL_IJPS_DB_USER;
  const password = process.env.JOURNAL_IJPS_DB_PASSWORD;

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
