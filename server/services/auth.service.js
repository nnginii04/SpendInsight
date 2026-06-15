const bcrypt = require("bcryptjs");
const pool = require("../db/pool");
const { signToken } = require("../utils/jwt");
const { writeAccessLog } = require("../utils/audit");

async function register(
  { email, password, username, phone, ageCode, sexCode, regionCode },
  meta
) {
  const [dup] = await pool.query(
    `SELECT user_id FROM users WHERE email = ? OR phone = ?`,
    [email.trim(), phone.trim()]
  );
  if (dup.length > 0) {
    const err = new Error("이미 사용 중인 이메일 또는 전화번호입니다.");
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [userResult] = await conn.query(
      `INSERT INTO users (email, password, username, phone, role, is_active)
       VALUES (?, ?, ?, ?, 'USER', 1)`,
      [email.trim(), hash, username.trim(), phone.trim()]
    );
    const userId = userResult.insertId;
    await conn.query(
      `INSERT INTO user_detail (user_id, age_code, sex_code, region_code)
       VALUES (?, ?, ?, ?)`,
      [userId, ageCode || "20", sexCode === "M" ? "M" : "F", regionCode || "00"]
    );
    await conn.commit();

    await writeAccessLog({
      userId,
      action: "REGISTER",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      detail: `${email} 회원가입`,
    });

    const token = signToken({ userId, role: "USER" });
    return {
      token,
      user: {
        userId,
        email: email.trim(),
        username: username.trim(),
        role: "USER",
        ageCode: ageCode || "20",
        sexCode: sexCode === "M" ? "M" : "F",
      },
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function login({ email, password }, meta) {
  const [rows] = await pool.query(
    `SELECT u.user_id, u.email, u.username, u.password, u.role, u.is_active,
            d.age_code, d.sex_code
     FROM users u
     JOIN user_detail d ON u.user_id = d.user_id
     WHERE u.email = ?`,
    [email.trim()]
  );

  if (rows.length === 0) {
    await writeAccessLog({
      action: "LOGIN",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      status: "FAIL",
      detail: `존재하지 않는 이메일: ${email}`,
    });
    const err = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    err.status = 401;
    throw err;
  }

  const row = rows[0];
  if (!row.is_active) {
    const err = new Error("비활성화된 계정입니다.");
    err.status = 403;
    throw err;
  }

  const ok = await bcrypt.compare(password, row.password);
  if (!ok) {
    await writeAccessLog({
      userId: row.user_id,
      action: "LOGIN",
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      status: "FAIL",
      detail: "비밀번호 불일치",
    });
    const err = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    err.status = 401;
    throw err;
  }

  await writeAccessLog({
    userId: row.user_id,
    action: "LOGIN",
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
    detail: `${row.email} 로그인`,
  });

  const token = signToken({ userId: row.user_id, role: row.role });
  return {
    token,
    user: {
      userId: row.user_id,
      email: row.email,
      username: row.username,
      role: row.role,
      ageCode: row.age_code,
      sexCode: row.sex_code,
    },
  };
}

module.exports = { register, login };
