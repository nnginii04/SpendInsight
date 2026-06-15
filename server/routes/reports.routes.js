const express = require("express");
const { requireAuth } = require("../middleware/auth");
const reportService = require("../services/report.service");
const { writeAccessLog } = require("../utils/audit");

const router = express.Router();

async function logReportView(req, name) {
  await writeAccessLog({
    userId: req.user.userId,
    action: "VIEW_REPORT",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    detail: name,
  });
}

/** FR-08: 월간 소비 리포트 조회 */
router.get("/monthly", requireAuth, async (req, res) => {
  try {
    const data = await reportService.getMonthlyReport(
      req.user.userId,
      req.query.yyyymm
    );
    await logReportView(req, `monthly ${data.yyyymm}`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "월간 리포트 조회 실패" });
  }
});

/** FR-09: 카테고리별 소비 분석 */
router.get("/category", requireAuth, async (req, res) => {
  try {
    const data = await reportService.getCategoryReport(
      req.user.userId,
      req.query.yyyymm
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "카테고리 분석 실패" });
  }
});

/** FR-10: 또래 평균 비교 */
router.get("/peer-average", requireAuth, async (req, res) => {
  try {
    const data = await reportService.getPeerAverage(
      req.user.userId,
      req.user.ageCode,
      req.query.yyyymm
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "또래 평균 비교 실패" });
  }
});

/** FR-11: 전월 대비 증감률 분석 */
router.get("/monthly-change", requireAuth, async (req, res) => {
  try {
    const data = await reportService.getMonthlyChange(
      req.user.userId,
      req.query.yyyymm
    );
    await logReportView(req, `monthly-change ${data.yyyymm}`);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "전월 대비 분석 실패" });
  }
});

/** FR-12: 이상 소비 탐지 */
router.get("/anomaly", requireAuth, async (req, res) => {
  try {
    const data = await reportService.getAnomalies(
      req.user.userId,
      req.user.ageCode
    );
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "이상 소비 탐지 실패" });
  }
});

/** FR-13: 카드 혜택 추천 */
router.get("/card-recommend", requireAuth, async (req, res) => {
  try {
    const data = await reportService.getCardRecommendations(
      req.user.userId,
      req.user.ageCode
    );
    await logReportView(req, "card-recommend");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "카드 혜택 추천 실패" });
  }
});

module.exports = router;
