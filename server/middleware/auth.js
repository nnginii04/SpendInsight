const { verifyToken } = require("../utils/jwt");
const pool = require("../db/pool");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  try {
    const decoded = verifyToken(token);
    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, u.username, u.role, u.is_active,
              d.age_code, d.sex_code, d.region_code
       FROM users u
       JOIN user_detail d ON u.user_id = d.user_id
       WHERE u.user_id = ?`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: "비활성화된 계정입니다." });
    }

    req.user = {
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      ageCode: user.age_code,
      sexCode: user.sex_code,
      regionCode: user.region_code,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "토큰이 만료되었거나 유효하지 않습니다." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "관리자 권한이 필요합니다." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
