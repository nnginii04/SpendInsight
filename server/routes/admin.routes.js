const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const adminService = require("../services/admin.service");
const { writeAccessLog } = require("../utils/audit");

const router = express.Router();

router.use(requireAuth, requireAdmin);

async function logCodeAction(req, action, detail) {
  await writeAccessLog({
    userId: req.user.userId,
    action: "MANAGE_CODE",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    detail,
  });
}

/** FR-14: 사용자 정보 조회 (관리자) */
router.get("/users", async (req, res) => {
  try {
    const users = await adminService.listUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "사용자 조회 실패" });
  }
});

/** FR-15: 기준 코드 테이블 전체 조회 (관리자) */
router.get("/codes", async (req, res) => {
  try {
    const codes = await adminService.listCodes();
    res.json(codes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "코드 조회 실패" });
  }
});

/** FR-15: 단일 코드 테이블 조회 (관리자) */
router.get("/codes/:table", async (req, res) => {
  try {
    const data = await adminService.listCodeTable(req.params.table);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "코드 조회 실패" });
  }
});

/** FR-15: 코드 등록 (관리자) */
router.post("/codes/:table", async (req, res) => {
  try {
    const created = await adminService.createCodeRow(req.params.table, req.body);
    await logCodeAction(req, "CREATE", `${req.params.table} create`);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "코드 등록 실패" });
  }
});

/** FR-15: 코드 수정 (관리자) */
router.put("/codes/:table/:id", async (req, res) => {
  try {
    const updated = await adminService.updateCodeRow(
      req.params.table,
      req.params.id,
      req.body
    );
    await logCodeAction(req, "UPDATE", `${req.params.table} id=${req.params.id}`);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "코드 수정 실패" });
  }
});

/** FR-15: 코드 삭제 (관리자) */
router.delete("/codes/:table/:id", async (req, res) => {
  try {
    const result = await adminService.deleteCodeRow(req.params.table, req.params.id);
    await logCodeAction(req, "DELETE", `${req.params.table} id=${req.params.id}`);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "코드 삭제 실패" });
  }
});

/** FR-16: 접근 로그 조회 (관리자) */
router.get("/logs", async (req, res) => {
  try {
    const logs = await adminService.listLogs(req.query.limit);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "로그 조회 실패" });
  }
});

module.exports = router;
