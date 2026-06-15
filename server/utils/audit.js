const pool = require("../db/pool");

/** FR-16: 접근 로그 기록 */
async function writeAccessLog({
  userId = null,
  action,
  ipAddress = null,
  userAgent = null,
  status = "SUCCESS",
  detail = null,
}) {
  await pool.query(
    `INSERT INTO access_log (user_id, action, ip_address, user_agent, status, detail)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, ipAddress, userAgent, status, detail]
  );
}

module.exports = { writeAccessLog };
