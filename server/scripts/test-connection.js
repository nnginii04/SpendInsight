require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const pool = require("../db/pool");

async function main() {
  try {
    const [rows] = await pool.query("SELECT VERSION() AS v");
    const [tables] = await pool.query("SHOW TABLES");
    console.log("✅ 연결 성공:", rows[0].v);
    console.log("   테이블 수:", tables.length);
    process.exit(0);
  } catch (e) {
    console.error("❌ 연결 실패:", e.message);
    process.exit(1);
  }
}

main();
