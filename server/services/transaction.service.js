const pool = require("../db/pool");
const { getDayCode, getHourCode } = require("../utils/dateCodes");

const SELECT_BASE = `
  SELECT c.consumption_id, c.user_id, c.ta_ymd, c.day_code, c.hour_code,
         c.age_code, c.sex_code, c.ind_l1_id, c.ind_l2_id,
         c.amount, c.count, c.created_at,
         l1.ind_l1_name, l2.ind_l2_name
  FROM card_consumption c
  JOIN industry_l1 l1 ON c.ind_l1_id = l1.ind_l1_id
  JOIN industry_l2 l2 ON c.ind_l2_id = l2.ind_l2_id
`;

function formatDateField(value) {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

function mapRow(row) {
  return {
    consumptionId: row.consumption_id,
    taYmd: formatDateField(row.ta_ymd),
    dayCode: row.day_code,
    hourCode: row.hour_code,
    indL1Id: row.ind_l1_id,
    indL2Id: row.ind_l2_id,
    l1Name: row.ind_l1_name,
    l2Name: row.ind_l2_name,
    category: `${row.ind_l1_name} / ${row.ind_l2_name}`,
    amount: Number(row.amount),
    count: row.count,
    createdAt: row.created_at,
  };
}

async function listTransactions(userId, filters) {
  const conditions = ["c.user_id = ?"];
  const params = [userId];

  if (filters.dateFrom) {
    conditions.push("c.ta_ymd >= ?");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push("c.ta_ymd <= ?");
    params.push(filters.dateTo);
  }
  if (filters.indL1Id) {
    conditions.push("c.ind_l1_id = ?");
    params.push(Number(filters.indL1Id));
  }
  if (filters.indL2Id) {
    conditions.push("c.ind_l2_id = ?");
    params.push(Number(filters.indL2Id));
  }

  const [rows] = await pool.query(
    `${SELECT_BASE}
     WHERE ${conditions.join(" AND ")}
     ORDER BY c.ta_ymd DESC, c.consumption_id DESC`,
    params
  );
  return rows.map(mapRow);
}

async function createTransaction(userId, profile, body) {
  const { taYmd, amount, indL1Id, indL2Id, transTime, count = 1 } = body;

  if (!taYmd || amount == null || !indL1Id || !indL2Id) {
    const err = new Error("거래일자, 금액, 업종, 카테고리는 필수입니다.");
    err.status = 400;
    throw err;
  }
  if (Number(amount) < 0) {
    const err = new Error("금액은 0 이상이어야 합니다.");
    err.status = 400;
    throw err;
  }

  let hourCode = getHourCode(new Date().getHours());
  if (transTime && String(transTime).includes(":")) {
    hourCode = getHourCode(Number(String(transTime).split(":")[0]));
  }
  const dayCode = getDayCode(taYmd);

  const [l2check] = await pool.query(
    `SELECT ind_l1_id FROM industry_l2 WHERE ind_l2_id = ?`,
    [indL2Id]
  );
  if (l2check.length === 0 || l2check[0].ind_l1_id !== Number(indL1Id)) {
    const err = new Error("업종·카테고리 조합이 올바르지 않습니다.");
    err.status = 400;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO card_consumption
       (user_id, ta_ymd, day_code, hour_code, age_code, sex_code,
        ind_l1_id, ind_l2_id, amount, count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      taYmd,
      dayCode,
      hourCode,
      profile.ageCode,
      profile.sexCode,
      indL1Id,
      indL2Id,
      amount,
      count,
    ]
  );

  const [rows] = await pool.query(`${SELECT_BASE} WHERE c.consumption_id = ?`, [
    result.insertId,
  ]);
  return mapRow(rows[0]);
}

async function updateTransaction(userId, consumptionId, body) {
  const { taYmd, amount, indL1Id, indL2Id, count = 1 } = body;

  if (!taYmd || amount == null || !indL1Id || !indL2Id) {
    const err = new Error("거래일자, 금액, 업종, 카테고리는 필수입니다.");
    err.status = 400;
    throw err;
  }

  const [own] = await pool.query(
    `SELECT consumption_id FROM card_consumption
     WHERE consumption_id = ? AND user_id = ?`,
    [consumptionId, userId]
  );
  if (own.length === 0) {
    const err = new Error("내역을 찾을 수 없습니다.");
    err.status = 404;
    throw err;
  }

  const dayCode = getDayCode(taYmd);
  await pool.query(
    `UPDATE card_consumption
     SET ta_ymd = ?, day_code = ?, ind_l1_id = ?, ind_l2_id = ?, amount = ?, count = ?
     WHERE consumption_id = ? AND user_id = ?`,
    [taYmd, dayCode, indL1Id, indL2Id, amount, count, consumptionId, userId]
  );

  const [rows] = await pool.query(`${SELECT_BASE} WHERE c.consumption_id = ?`, [
    consumptionId,
  ]);
  return mapRow(rows[0]);
}

async function deleteTransaction(userId, consumptionId) {
  const [result] = await pool.query(
    `DELETE FROM card_consumption WHERE consumption_id = ? AND user_id = ?`,
    [consumptionId, userId]
  );
  if (result.affectedRows === 0) {
    const err = new Error("내역을 찾을 수 없습니다.");
    err.status = 404;
    throw err;
  }
}

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
