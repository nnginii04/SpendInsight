const express = require("express");
const { requireAuth } = require("../middleware/auth");
const transactionService = require("../services/transaction.service");
const pool = require("../db/pool");
const { writeAccessLog } = require("../utils/audit");

const router = express.Router();

/** 이상 소비 탐지 후 anomaly_record 저장 (FR-12) */
async function maybeRecordAnomaly(userId, consumptionId, ageCode) {
  const [rows] = await pool.query(
    `SELECT c.amount, c.ind_l2_id, l2.ind_l2_name
     FROM card_consumption c
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     WHERE c.consumption_id = ? AND c.user_id = ?`,
    [consumptionId, userId]
  );
  if (rows.length === 0) return;

  const row = rows[0];
  const [pref] = await pool.query(
    `SELECT avg_amount FROM age_industry_pref
     WHERE age_code = ? AND ind_l2_id = ?`,
    [ageCode, row.ind_l2_id]
  );
  const peer = pref[0] ? Number(pref[0].avg_amount) : 0;
  if (peer <= 0 || Number(row.amount) < peer * 3) return;

  const compareRate = Math.round((Number(row.amount) / peer) * 10000) / 100;
  const reason = `${row.ind_l2_name} 카테고리 또래 평균(${peer.toLocaleString()}원) 대비 3배 이상 소비 발생`;

  const [exists] = await pool.query(
    `SELECT anomaly_id FROM anomaly_record WHERE consumption_id = ?`,
    [consumptionId]
  );
  if (exists.length > 0) return;

  await pool.query(
    `INSERT INTO anomaly_record (user_id, consumption_id, compare_rate, reason)
     VALUES (?, ?, ?, ?)`,
    [userId, consumptionId, compareRate, reason]
  );
}

/** FR-05: 지출 내역 조회 (날짜·카테고리·업종 필터) */
router.get("/", requireAuth, async (req, res) => {
  try {
    const list = await transactionService.listTransactions(req.user.userId, {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      indL1Id: req.query.industryId || req.query.indL1Id,
      indL2Id: req.query.categoryId || req.query.indL2Id,
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "조회 실패" });
  }
});

/** FR-04: 지출 내역 등록 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const created = await transactionService.createTransaction(
      req.user.userId,
      req.user,
      req.body
    );
    await maybeRecordAnomaly(
      req.user.userId,
      created.consumptionId,
      req.user.ageCode
    );
    await writeAccessLog({
      userId: req.user.userId,
      action: "CREATE_TX",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      detail: `consumption_id=${created.consumptionId}`,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "등록 실패" });
  }
});

/** FR-06: 지출 내역 수정 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const updated = await transactionService.updateTransaction(
      req.user.userId,
      req.params.id,
      req.body
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "수정 실패" });
  }
});

/** FR-07: 지출 내역 삭제 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await transactionService.deleteTransaction(req.user.userId, req.params.id);
    res.json({ message: "삭제되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "삭제 실패" });
  }
});

module.exports = router;
