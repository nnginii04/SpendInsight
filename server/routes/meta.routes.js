const express = require("express");
const { requireAuth } = require("../middleware/auth");
const pool = require("../db/pool");

const router = express.Router();

/** 지출 등록 폼용 업종·카테고리 목록 (FR-04) */
router.get("/industries", requireAuth, async (req, res) => {
  try {
    const [l1] = await pool.query(
      `SELECT ind_l1_id AS id, ind_l1_name AS name FROM industry_l1 ORDER BY ind_l1_id`
    );
    const [l2] = await pool.query(
      `SELECT ind_l2_id AS id, ind_l1_id AS l1Id, ind_l2_name AS name
       FROM industry_l2 ORDER BY ind_l1_id, ind_l2_id`
    );
    res.json({ l1, l2 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "업종 조회 실패" });
  }
});

module.exports = router;
