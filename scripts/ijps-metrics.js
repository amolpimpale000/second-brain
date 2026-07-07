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
    // Status names
    const [statuses] = await conn.execute(
      "SELECT statusID, statusName FROM ijps_tblstatus ORDER BY statusID"
    );
    console.log("=== STATUS NAMES ===");
    for (const s of statuses) {
      console.log(s.statusID, "=>", s.statusName);
    }

    // Manuscript counts by status
    const [statusCounts] = await conn.execute(`
      SELECT s.statusName, s.statusID, COUNT(m.manuscriptID) AS cnt
      FROM ijps_tblstatus s
      LEFT JOIN ijps_tblmanuscript m ON m.statusID = s.statusID
      GROUP BY s.statusID, s.statusName
      ORDER BY s.statusID
    `);
    console.log("\n=== MANUSCRIPT COUNTS BY STATUS ===");
    for (const r of statusCounts) {
      console.log(r.statusName, "=>", r.cnt);
    }

    // Total manuscripts
    const [totalMs] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM ijps_tblmanuscript WHERE isActive = 1"
    );
    console.log("\nTotal manuscripts:", totalMs[0].cnt);

    // Total articles (published)
    const [totalArticles] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM ijps_tblarticle WHERE isActive = 1"
    );
    console.log("Total published articles:", totalArticles[0].cnt);

    // Total authors
    const [totalAuthors] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM ijps_tblauthor WHERE isActive = 1"
    );
    console.log("Total authors:", totalAuthors[0].cnt);

    // Total employees
    const [totalEmployees] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM ijps_tblemployee WHERE isActive = 1"
    );
    console.log("Total employees:", totalEmployees[0].cnt);

    // Total subscribers
    const [totalSubscribers] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM ijps_tblsubscriber WHERE isActive = 1"
    );
    console.log("Total subscribers:", totalSubscribers[0].cnt);

    // Revenue from payments
    const [revenue] = await conn.execute(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM ijps_tblpayment WHERE amount IS NOT NULL"
    );
    console.log("Total revenue (ijps_tblpayment):", revenue[0].total);

    const [revenue2] = await conn.execute(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM tbl_payment_details WHERE amount IS NOT NULL AND is_deleted = 0"
    );
    console.log("Total revenue (tbl_payment_details):", revenue2[0].total);

    // Recent manuscripts
    const [recentMs] = await conn.execute(`
      SELECT m.manuscriptID, m.titleOfPaper, m.createdDate, s.statusName, m.authorName
      FROM ijps_tblmanuscript m
      JOIN ijps_tblstatus s ON s.statusID = m.statusID
      WHERE m.isActive = 1
      ORDER BY m.createdDate DESC
      LIMIT 5
    `);
    console.log("\n=== RECENT MANUSCRIPTS ===");
    for (const r of recentMs) {
      console.log(r.manuscriptID, r.titleOfPaper, r.statusName, r.createdDate, r.authorName);
    }

    // Manuscripts per month (last 12 months)
    const [monthly] = await conn.execute(`
      SELECT DATE_FORMAT(createdDate, '%Y-%m') AS month, COUNT(*) AS cnt
      FROM ijps_tblmanuscript
      WHERE isActive = 1 AND createdDate >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month
    `);
    console.log("\n=== MONTHLY SUBMISSIONS ===");
    for (const r of monthly) {
      console.log(r.month, "=>", r.cnt);
    }

    // Article types / subject areas
    const [articleTypes] = await conn.execute(`
      SELECT at.articalTypeName, COUNT(a.articleID) AS cnt
      FROM ijps_tblarticaltype at
      LEFT JOIN ijps_tblarticle a ON a.articalTypeID = at.articalTypeID AND a.isActive = 1
      GROUP BY at.articalTypeID, at.articalTypeName
      ORDER BY cnt DESC
    `);
    console.log("\n=== ARTICLE TYPES ===");
    for (const r of articleTypes) {
      console.log(r.articalTypeName, "=>", r.cnt);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
