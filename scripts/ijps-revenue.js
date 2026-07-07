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
    // APC payments from ijps_tblpayment
    const [apcRows] = await conn.execute(
      "SELECT json_details, type, article_id FROM ijps_tblpayment WHERE is_deleted = 0"
    );

    let apcTotal = 0;
    let apcINR = 0;
    let apcUSD = 0;
    let apcCount = 0;
    let apcFailed = 0;
    let methodCounts = {};
    let currencyCounts = {};

    for (const row of apcRows) {
      try {
        const json = JSON.parse(row.json_details || "{}");
        const amount = json.amount;
        const currency = json.currency || "INR";
        const status = json.status;
        const method = json.method;

        if (!amount) {
          apcFailed++;
          continue;
        }

        apcCount++;
        const amountNum = Number(amount);
        const amountRs = currency === "INR" ? amountNum / 100 : amountNum;
        apcTotal += amountRs;

        if (currency === "INR") apcINR += amountNum / 100;
        if (currency === "USD") apcUSD += amountNum;

        currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;
        if (method) methodCounts[method] = (methodCounts[method] || 0) + 1;
      } catch (e) {
        apcFailed++;
      }
    }

    console.log("=== APC PAYMENTS (ijps_tblpayment) ===");
    console.log("Total rows:", apcRows.length);
    console.log("Parsed successfully:", apcCount);
    console.log("Failed to parse/no amount:", apcFailed);
    console.log("Total APC revenue (INR equivalent):", apcTotal.toFixed(2));
    console.log("INR payments:", apcINR.toFixed(2));
    console.log("USD payments (amount):", apcUSD.toFixed(2));
    console.log("Currency counts:", currencyCounts);
    console.log("Method counts:", methodCounts);

    // Plagiarism payments
    const [plagRows] = await conn.execute(
      "SELECT payment_response, status FROM tbl_check_plagarism WHERE is_deleted = 0 AND payment_response IS NOT NULL AND payment_response != ''"
    );

    let plagTotal = 0;
    let plagCount = 0;
    let plagFailed = 0;

    for (const row of plagRows) {
      try {
        const json = JSON.parse(row.payment_response || "{}");
        const amount = json.amount;
        const currency = json.currency || "INR";

        if (!amount) {
          plagFailed++;
          continue;
        }

        plagCount++;
        const plagAmountNum = Number(amount);
        plagTotal += currency === "INR" ? plagAmountNum / 100 : plagAmountNum;
      } catch (e) {
        plagFailed++;
      }
    }

    console.log("\n=== PLAGIARISM PAYMENTS ===");
    console.log("Total rows:", plagRows.length);
    console.log("Parsed successfully:", plagCount);
    console.log("Failed to parse/no amount:", plagFailed);
    console.log("Total plagiarism revenue (INR):", plagTotal.toFixed(2));

    // Revenue by month from APC
    const [monthlyApc] = await conn.execute(`
      SELECT json_details, created_date
      FROM ijps_tblpayment
      WHERE is_deleted = 0
      ORDER BY created_date
    `);

    const monthlyRevenue = {};
    for (const row of monthlyApc) {
      try {
        const json = JSON.parse(row.json_details || "{}");
        const amount = json.amount;
        const currency = json.currency || "INR";
        if (!amount || !row.created_date) continue;

        const month = row.created_date.toISOString().slice(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (currency === "INR" ? Number(amount) / 100 : Number(amount));
      } catch (e) {}
    }

    console.log("\n=== MONTHLY APC REVENUE ===");
    for (const [month, amount] of Object.entries(monthlyRevenue).sort()) {
      console.log(month, "=>", amount.toFixed(2));
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
