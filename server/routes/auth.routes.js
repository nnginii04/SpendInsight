const express = require("express");
const authService = require("../services/auth.service");

const router = express.Router();

function clientMeta(req) {
  return {
    ip: req.ip || req.headers["x-forwarded-for"] || null,
    userAgent: req.headers["user-agent"] || null,
  };
}

/** FR-01: 회원가입 — 이메일 중복 검사, users·user_detail 저장 */
router.post("/register", async (req, res) => {
  const { email, password, username, phone, ageCode, sexCode, regionCode } =
    req.body;

  if (!email || !password || !username || !phone) {
    return res.status(400).json({ message: "이메일, 비밀번호, 사용자명, 전화번호는 필수입니다." });
  }

  try {
    const result = await authService.register(
      { email, password, username, phone, ageCode, sexCode, regionCode },
      clientMeta(req)
    );
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "회원가입 실패" });
  }
});

/** FR-02: 로그인 — 사용자 인증, JWT 발급 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "이메일과 비밀번호를 입력하세요." });
  }

  try {
    const result = await authService.login({ email, password }, clientMeta(req));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "로그인 실패" });
  }
});

module.exports = router;
