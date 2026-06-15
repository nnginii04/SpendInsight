const pool = require("../db/pool");
const {
  formatYyyymm,
  prevYyyymm,
  monthStartFromYyyymm,
} = require("../utils/dateCodes");

/** FR-11: 전월 대비 증감률 계산 (전월 0원이면 null) */
function calcChangeRate(current, previous) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

function changeDirection(changeRate) {
  if (changeRate == null) return "N/A";
  if (changeRate > 0) return "INCREASE";
  if (changeRate < 0) return "DECREASE";
  return "SAME";
}

function resolveYyyymm(queryYyyymm) {
  return queryYyyymm || formatYyyymm();
}

async function sumMonth(userId, yyyymm) {
  const monthStart = monthStartFromYyyymm(yyyymm);
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS tx_count
     FROM card_consumption
     WHERE user_id = ?
       AND ta_ymd >= ?
       AND ta_ymd < DATE_ADD(?, INTERVAL 1 MONTH)`,
    [userId, monthStart, monthStart]
  );
  return {
    total: Number(rows[0].total),
    txCount: Number(rows[0].tx_count),
  };
}

/** FR-08: 월간 소비 리포트 */
async function getMonthlyReport(userId, yyyymm) {
  const ym = resolveYyyymm(yyyymm);
  const monthStart = monthStartFromYyyymm(ym);
  const current = await sumMonth(userId, ym);

  const [stored] = await pool.query(
    `SELECT total_amount, previous_month_rate, generated_at
     FROM monthly_report WHERE user_id = ? AND yyyymm = ?`,
    [userId, ym]
  );

  const [trend] = await pool.query(
    `SELECT DATE_FORMAT(ta_ymd, '%Y-%m') AS month, SUM(amount) AS amount
     FROM card_consumption
     WHERE user_id = ?
       AND ta_ymd >= DATE_SUB(?, INTERVAL 5 MONTH)
     GROUP BY DATE_FORMAT(ta_ymd, '%Y-%m')
     ORDER BY month`,
    [userId, monthStart]
  );

  const [recent] = await pool.query(
    `SELECT c.consumption_id, c.ta_ymd, c.amount,
            l1.ind_l1_name, l2.ind_l2_name
     FROM card_consumption c
     JOIN industry_l1 l1 ON c.ind_l1_id = l1.ind_l1_id
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     WHERE c.user_id = ?
     ORDER BY c.ta_ymd DESC, c.consumption_id DESC
     LIMIT 10`,
    [userId]
  );

  return {
    yyyymm: ym,
    totalAmount: current.total,
    transactionCount: current.txCount,
    previousMonthRate: stored[0] ? Number(stored[0].previous_month_rate) : null,
    monthlyTrend: trend.map((r) => ({
      month: r.month,
      amount: Number(r.amount),
    })),
    recent: recent.map((r) => ({
      consumptionId: r.consumption_id,
      taYmd: r.ta_ymd,
      amount: Number(r.amount),
      category: `${r.ind_l1_name} / ${r.ind_l2_name}`,
    })),
  };
}

/** FR-09: 카테고리별 소비 분석 */
async function getCategoryReport(userId, yyyymm) {
  const ym = resolveYyyymm(yyyymm);
  const monthStart = monthStartFromYyyymm(ym);

  const [rows] = await pool.query(
    `SELECT l2.ind_l2_id, l2.ind_l2_name AS category,
            l1.ind_l1_name AS industry,
            COALESCE(SUM(c.amount), 0) AS amount
     FROM card_consumption c
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     JOIN industry_l1 l1 ON c.ind_l1_id = l1.ind_l1_id
     WHERE c.user_id = ?
       AND c.ta_ymd >= ?
       AND c.ta_ymd < DATE_ADD(?, INTERVAL 1 MONTH)
     GROUP BY l2.ind_l2_id, l2.ind_l2_name, l1.ind_l1_name
     ORDER BY amount DESC`,
    [userId, monthStart, monthStart]
  );

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const categories = rows.map((r) => {
    const amount = Number(r.amount);
    return {
      category: r.category,
      industry: r.industry,
      amount,
      ratio: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
    };
  });

  return {
    yyyymm: ym,
    totalAmount: total,
    categories,
    topCategory: categories[0] || null,
  };
}

/** FR-10: 또래 평균 비교 */
async function getPeerAverage(userId, ageCode, yyyymm) {
  const ym = resolveYyyymm(yyyymm);
  const monthStart = monthStartFromYyyymm(ym);

  const [myRows] = await pool.query(
    `SELECT l2.ind_l2_id, l2.ind_l2_name AS category,
            COALESCE(SUM(c.amount), 0) AS myAmount
     FROM card_consumption c
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     WHERE c.user_id = ?
       AND c.ta_ymd >= ?
       AND c.ta_ymd < DATE_ADD(?, INTERVAL 1 MONTH)
     GROUP BY l2.ind_l2_id, l2.ind_l2_name`,
    [userId, monthStart, monthStart]
  );

  if (myRows.length === 0) {
    return { yyyymm: ym, ageCode, comparisons: [], peerAverageTotal: 0 };
  }

  const l2Ids = myRows.map((r) => r.ind_l2_id);
  const [peerRows] = await pool.query(
    `SELECT ind_l2_id, avg_amount
     FROM age_industry_pref
     WHERE age_code = ? AND ind_l2_id IN (?)`,
    [ageCode, l2Ids]
  );
  const peerMap = Object.fromEntries(
    peerRows.map((p) => [p.ind_l2_id, Number(p.avg_amount)])
  );

  const comparisons = myRows.map((r) => {
    const myAmount = Number(r.myAmount);
    const peerAmount = peerMap[r.ind_l2_id] || 0;
    const ratio =
      peerAmount > 0 ? Math.round((myAmount / peerAmount) * 10000) / 100 : null;
    return {
      category: r.category,
      myAmount,
      peerAmount,
      ratioPercent: ratio,
    };
  });

  const totalMy = comparisons.reduce((s, c) => s + c.myAmount, 0);
  const weightedPeer =
    totalMy > 0
      ? Math.round(
          comparisons.reduce(
            (s, c) => s + c.peerAmount * (c.myAmount / totalMy),
            0
          )
        )
      : 0;

  return {
    yyyymm: ym,
    ageCode,
    myTotal: totalMy,
    peerAverageTotal: weightedPeer,
    comparisons,
  };
}

/** FR-11: 전월 대비 증감률 (전체 + 카테고리별) */
async function sumMonthByCategory(userId, yyyymm) {
  const monthStart = monthStartFromYyyymm(yyyymm);
  const [rows] = await pool.query(
    `SELECT l2.ind_l2_id, l2.ind_l2_name AS category,
            l1.ind_l1_name AS industry,
            COALESCE(SUM(c.amount), 0) AS amount
     FROM card_consumption c
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     JOIN industry_l1 l1 ON c.ind_l1_id = l1.ind_l1_id
     WHERE c.user_id = ?
       AND c.ta_ymd >= ?
       AND c.ta_ymd < DATE_ADD(?, INTERVAL 1 MONTH)
     GROUP BY l2.ind_l2_id, l2.ind_l2_name, l1.ind_l1_name`,
    [userId, monthStart, monthStart]
  );
  return Object.fromEntries(
    rows.map((r) => [
      r.ind_l2_id,
      {
        category: r.category,
        industry: r.industry,
        amount: Number(r.amount),
      },
    ])
  );
}

async function getMonthlyChange(userId, yyyymm) {
  const ym = resolveYyyymm(yyyymm);
  const prev = prevYyyymm(ym);

  const current = await sumMonth(userId, ym);
  const previous = await sumMonth(userId, prev);
  const changeRate = calcChangeRate(current.total, previous.total);

  const currentCats = await sumMonthByCategory(userId, ym);
  const previousCats = await sumMonthByCategory(userId, prev);
  const allCatIds = new Set([
    ...Object.keys(currentCats),
    ...Object.keys(previousCats),
  ]);

  const categories = [...allCatIds]
    .map((id) => {
      const cur = currentCats[id]?.amount || 0;
      const prevAmt = previousCats[id]?.amount || 0;
      const meta = currentCats[id] || previousCats[id];
      return {
        category: meta.category,
        industry: meta.industry,
        currentAmount: cur,
        previousAmount: prevAmt,
        changeRate: calcChangeRate(cur, prevAmt),
      };
    })
    .sort((a, b) => b.currentAmount - a.currentAmount);

  return {
    yyyymm: ym,
    previousYyyymm: prev,
    currentAmount: current.total,
    previousAmount: previous.total,
    changeRate,
    direction: changeDirection(changeRate),
    overall: {
      currentAmount: current.total,
      previousAmount: previous.total,
      changeRate,
      direction: changeDirection(changeRate),
    },
    categories,
  };
}

/** FR-12: 이상 소비 탐지 (평균 대비 3배 이상) */
async function getAnomalies(userId, ageCode) {
  const [stored] = await pool.query(
    `SELECT a.anomaly_id, a.consumption_id, a.compare_rate, a.reason, a.detected_at,
            c.ta_ymd, c.amount, l2.ind_l2_name
     FROM anomaly_record a
     JOIN card_consumption c ON a.consumption_id = c.consumption_id
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     WHERE a.user_id = ?
     ORDER BY a.detected_at DESC`,
    [userId]
  );

  const [live] = await pool.query(
    `SELECT c.consumption_id, c.ta_ymd, c.amount, c.ind_l2_id, l2.ind_l2_name
     FROM card_consumption c
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     WHERE c.user_id = ?
       AND c.ta_ymd >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)`,
    [userId]
  );

  const l2Ids = [...new Set(live.map((r) => r.ind_l2_id))];
  let peerMap = {};
  if (l2Ids.length > 0) {
    const [prefs] = await pool.query(
      `SELECT ind_l2_id, avg_amount FROM age_industry_pref
       WHERE age_code = ? AND ind_l2_id IN (?)`,
      [ageCode, l2Ids]
    );
    peerMap = Object.fromEntries(
      prefs.map((p) => [p.ind_l2_id, Number(p.avg_amount)])
    );
  }

  const detected = [];
  for (const row of live) {
    const peer = peerMap[row.ind_l2_id] || 0;
    if (peer > 0 && Number(row.amount) >= peer * 3) {
      const compareRate = Math.round((Number(row.amount) / peer) * 10000) / 100;
      detected.push({
        consumptionId: row.consumption_id,
        taYmd: row.ta_ymd,
        amount: Number(row.amount),
        category: row.ind_l2_name,
        peerAverage: peer,
        compareRate,
        reason: `${row.ind_l2_name} 카테고리 또래 평균(${peer.toLocaleString()}원) 대비 3배 이상`,
      });
    }
  }

  return {
    stored: stored.map((r) => ({
      anomalyId: r.anomaly_id,
      consumptionId: r.consumption_id,
      compareRate: Number(r.compare_rate),
      reason: r.reason,
      detectedAt: r.detected_at,
      taYmd: r.ta_ymd,
      amount: Number(r.amount),
      category: r.ind_l2_name,
    })),
    detected,
  };
}

/** FR-13: 카드 혜택 추천 (card_benefit 테이블 기반) */
async function findCardBenefit({ indL2Id, indL1Id, general = false }) {
  if (general) {
    const [rows] = await pool.query(
      `SELECT benefit_id, card_name, category_label, benefit_desc
       FROM card_benefit WHERE target_type = 'GENERAL' ORDER BY benefit_id LIMIT 1`
    );
    return rows[0] || null;
  }
  if (indL2Id) {
    const [l2rows] = await pool.query(
      `SELECT benefit_id, card_name, category_label, benefit_desc
       FROM card_benefit WHERE target_type = 'L2' AND ind_l2_id = ? LIMIT 1`,
      [indL2Id]
    );
    if (l2rows[0]) return l2rows[0];
  }
  if (indL1Id) {
    const [l1rows] = await pool.query(
      `SELECT benefit_id, card_name, category_label, benefit_desc
       FROM card_benefit WHERE target_type = 'L1' AND ind_l1_id = ? LIMIT 1`,
      [indL1Id]
    );
    if (l1rows[0]) return l1rows[0];
  }
  const [fallback] = await pool.query(
    `SELECT benefit_id, card_name, category_label, benefit_desc
     FROM card_benefit WHERE target_type = 'GENERAL' ORDER BY benefit_id LIMIT 1`
  );
  return fallback[0] || null;
}

async function getCardRecommendations(userId, ageCode) {
  const [l1Spend] = await pool.query(
    `SELECT l1.ind_l1_id, l1.ind_l1_name, SUM(c.amount) AS total
     FROM card_consumption c
     JOIN industry_l1 l1 ON c.ind_l1_id = l1.ind_l1_id
     WHERE c.user_id = ?
       AND c.ta_ymd >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
     GROUP BY l1.ind_l1_id, l1.ind_l1_name
     ORDER BY total DESC`,
    [userId]
  );

  const [topCats] = await pool.query(
    `SELECT l2.ind_l2_id, l2.ind_l2_name, l2.ind_l1_id, l1.ind_l1_name,
            SUM(c.amount) AS total
     FROM card_consumption c
     JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
     JOIN industry_l1 l1 ON c.ind_l1_id = l1.ind_l1_id
     WHERE c.user_id = ?
       AND c.ta_ymd >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
     GROUP BY l2.ind_l2_id, l2.ind_l2_name, l2.ind_l1_id, l1.ind_l1_name
     ORDER BY total DESC
     LIMIT 3`,
    [userId]
  );

  if (topCats.length === 0) {
    return { recommendations: [], analysisType: "NONE" };
  }

  const grandTotal = topCats.reduce((s, r) => s + Number(r.total), 0);
  const l1Total = l1Spend.reduce((s, r) => s + Number(r.total), 0);
  const l1Shares = l1Spend.map((r) =>
    l1Total > 0 ? Number(r.total) / l1Total : 0
  );
  const maxL1Share = l1Shares.length ? Math.max(...l1Shares) : 1;
  const isEvenDistribution =
    l1Shares.length >= 3 && maxL1Share < 0.35;

  const recommendations = [];

  if (isEvenDistribution) {
    const benefit = await findCardBenefit({ general: true });
    if (benefit) {
      recommendations.push({
        rank: 1,
        cardName: benefit.card_name,
        category: benefit.category_label,
        benefitDescription: benefit.benefit_desc,
        reason: "최근 3개월 소비가 여러 업종에 고르게 분포되어 범용 카드를 추천합니다.",
        spendingShare: null,
        recommendedBenefit: benefit.card_name,
      });
    }
  } else {
    for (let idx = 0; idx < topCats.length; idx++) {
      const row = topCats[idx];
      const share = grandTotal > 0 ? Number(row.total) / grandTotal : 0;
      const benefit = await findCardBenefit({
        indL2Id: row.ind_l2_id,
        indL1Id: row.ind_l1_id,
      });
      if (!benefit) continue;

      const l1Name = row.ind_l1_name;
      let reason = `최근 3개월 '${row.ind_l2_name}' 소비 비중이 ${Math.round(share * 100)}%로 가장 높습니다.`;
      if (l1Name.includes("식") || ["음식", "배달", "커피/디저트"].includes(row.ind_l2_name)) {
        reason = `식음료·외식 소비가 많아 ${benefit.card_name}을 추천합니다.`;
      } else if (l1Name.includes("교통") || row.ind_l2_name === "교통") {
        reason = `교통 소비 비중이 높아 ${benefit.card_name}을 추천합니다.`;
      } else if (l1Name.includes("쇼핑") || ["패션", "쇼핑"].includes(row.ind_l2_name)) {
        reason = `쇼핑 소비가 많아 ${benefit.card_name}을 추천합니다.`;
      }

      recommendations.push({
        rank: recommendations.length + 1,
        cardName: benefit.card_name,
        category: benefit.category_label,
        benefitDescription: benefit.benefit_desc,
        reason,
        spendingShare: Math.round(share * 10000) / 100,
        recommendedBenefit: benefit.card_name,
      });
      if (recommendations.length >= 3) break;
    }
  }

  return {
    analysisType: isEvenDistribution ? "EVEN" : "TOP_CATEGORY",
    recommendations,
  };
}

module.exports = {
  getMonthlyReport,
  getCategoryReport,
  getPeerAverage,
  getMonthlyChange,
  getAnomalies,
  getCardRecommendations,
};
