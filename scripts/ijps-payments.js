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
    // Check ijps_tblpayment
    const [p1] = await conn.execute("SELECT COUNT(*) AS cnt FROM ijps_tblpayment");
    const [p1Sample] = await conn.execute("SELECT * FROM ijps_tblpayment LIMIT 5");
    console.log("ijps_tblpayment count:", p1[0].cnt);
    console.log("Sample rows:", JSON.stringify(p1Sample, null, 2));

    // Check tbl_payment_details
    const [p2] = await conn.execute("SELECT COUNT(*) AS cnt FROM tbl_payment_details");
    const [p2Sample] = await conn.execute("SELECT * FROM tbl_payment_details LIMIT 5");
    console.log("\ntbl_payment_details count:", p2[0].cnt);
    console.log("Sample rows:", JSON.stringify(p2Sample, null, 2));

    // Check referral_requests
    const [p3] = await conn.execute("SELECT COUNT(*) AS cnt FROM referral_requests");
    const [p3Sample] = await conn.execute("SELECT * FROM referral_requests LIMIT 5");
    console.log("\nreferral_requests count:", p3[0].cnt);
    console.log("Sample rows:", JSON.stringify(p3Sample, null, 2));

    // Check tbl_check_plagarism
    const [p4] = await conn.execute("SELECT COUNT(*) AS cnt FROM tbl_check_plagarism");
    const [p4Sample] = await conn.execute("SELECT * FROM tbl_check_plagarism LIMIT 5");
    console.log("\ntbl_check_plagarism count:", p4[0].cnt);
    console.log("Sample rows:", JSON.stringify(p4Sample, null, 2));

    // Look for any amount columns in all tables
    const [amountCols] = await conn.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND COLUMN_NAME LIKE '%amount%' AND DATA_TYPE IN ('decimal', 'int', 'float', 'double')
      ORDER BY TABLE_NAME, COLUMN_NAME
    `, [cfg.database]);
    console.log("\n=== AMOUNT COLUMNS ===");
    for (const c of amountCols) {
      console.log(c.TABLE_NAME, ".", c.COLUMN_NAME, "(", c.DATA_TYPE, ")");
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
