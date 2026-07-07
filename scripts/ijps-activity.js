const mysql = require("mysql2/promise");

async function main() {
  const cfg = {
    host: process.env.JOURNAL_IJPS_DB_HOST,
    port: Number(process.env.JOURNAL_IJPS_DB_PORT || "3306"),
    database: process.env.JOURNAL_IJPS_DB_NAME,
    user: process.env.JOURNAL_IJPS_DB_USER,
    password: process.env.JOURNAL_IJPS_DB_PASSWORD,
  };

  const conn = await mysql.createConnection(cfg);
  try {
    const [logs1] = await conn.execute("SELECT * FROM tblactivitylog ORDER BY createdDate DESC LIMIT 10");
    console.log("=== tblactivitylog ===");
    console.log(JSON.stringify(logs1, null, 2));

    const [logs2] = await conn.execute("SELECT * FROM ijps_tblactivitylogs ORDER BY createdDate DESC LIMIT 10");
    console.log("\n=== ijps_tblactivitylogs ===");
    console.log(JSON.stringify(logs2, null, 2));

    // Check article dates
    const [articleDates] = await conn.execute(`
      SELECT MIN(receivedDate) AS minReceived, MAX(receivedDate) AS maxReceived,
             MIN(acceptedDate) AS minAccepted, MAX(acceptedDate) AS maxAccepted,
             MIN(createdDate) AS minCreated, MAX(createdDate) AS maxCreated
      FROM ijps_tblarticle
      WHERE isActive = 1
    `);
    console.log("\n=== ARTICLE DATE RANGE ===");
    console.log(JSON.stringify(articleDates[0], null, 2));

    // Articles per month
    const [articlesMonthly] = await conn.execute(`
      SELECT DATE_FORMAT(createdDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ijps_tblarticle
      WHERE isActive = 1 AND createdDate IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    console.log("\n=== ARTICLES PER MONTH (createdDate) ===");
    for (const r of articlesMonthly) console.log(r.month, "=>", r.cnt);

    // Accepted per month
    const [acceptedMonthly] = await conn.execute(`
      SELECT DATE_FORMAT(acceptedDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ijps_tblarticle
      WHERE isActive = 1 AND acceptedDate IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
    console.log("\n=== ACCEPTED PER MONTH ===");
    for (const r of acceptedMonthly) console.log(r.month, "=>", r.cnt);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
