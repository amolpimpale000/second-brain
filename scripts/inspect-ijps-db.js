const mysql = require("mysql2/promise");

async function main() {
  const cfg = {
    host: process.env.JOURNAL_IJPS_DB_HOST,
    port: Number(process.env.JOURNAL_IJPS_DB_PORT || "3306"),
    database: process.env.JOURNAL_IJPS_DB_NAME,
    user: process.env.JOURNAL_IJPS_DB_USER,
    password: process.env.JOURNAL_IJPS_DB_PASSWORD,
    ssl: process.env.JOURNAL_IJPS_DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  };

  console.log("Connecting to:", cfg.host, "database:", cfg.database);
  const conn = await mysql.createConnection(cfg);

  try {
    // List all tables
    const [tables] = await conn.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [cfg.database]
    );
    console.log("\n=== TABLES ===");
    for (const t of tables) {
      console.log("-", t.TABLE_NAME);
    }

    // For each table, show column info
    console.log("\n=== COLUMNS ===");
    for (const t of tables.slice(0, 50)) {
      const tableName = t.TABLE_NAME;
      const [columns] = await conn.execute(
        "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT " +
          "FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? " +
          "ORDER BY ORDINAL_POSITION",
        [cfg.database, tableName]
      );
      console.log(`\n[${tableName}]`);
      for (const c of columns) {
        console.log(
          `  ${c.COLUMN_NAME} | ${c.DATA_TYPE} | nullable=${c.IS_NULLABLE} | default=${c.COLUMN_DEFAULT} | comment=${c.COLUMN_COMMENT}`
        );
      }
    }

    // Try to detect status values in common tables
    const statusCandidates = tables
      .map((t) => t.TABLE_NAME)
      .filter((n) => /manuscript|submission|article|paper|review/i.test(n));

    console.log("\n=== STATUS CANDIDATE TABLES ===");
    for (const tableName of statusCandidates) {
      const [columns] = await conn.execute(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
        [cfg.database, tableName]
      );
      const colNames = columns.map((c) => c.COLUMN_NAME);
      const statusCol = colNames.find((c) => /status|state|stage/i.test(c));
      if (statusCol) {
        const [rows] = await conn.execute(
          `SELECT DISTINCT \`${statusCol}\` AS val FROM \`${tableName}\` WHERE \`${statusCol}\` IS NOT NULL LIMIT 50`
        );
        console.log(`\n[${tableName}.${statusCol}] distinct values:`);
        for (const r of rows) {
          console.log("  -", r.val);
        }
      }
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
