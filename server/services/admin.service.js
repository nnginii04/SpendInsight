const pool = require("../db/pool");
const {
  CODE_TABLE_CONFIG,
  resolveCodeTable,
  getSelectColumns,
} = require("../utils/codeTables");

/** FR-14: 사용자 조회 */
async function listUsers() {
  const [rows] = await pool.query(
    `SELECT u.user_id, u.email, u.username, u.phone, u.role, u.is_active,
            u.created_at, d.age_code, d.sex_code, d.region_code
     FROM users u
     JOIN user_detail d ON u.user_id = d.user_id
     ORDER BY u.user_id`
  );
  return rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    username: r.username,
    phone: r.phone,
    role: r.role,
    isActive: Boolean(r.is_active),
    ageCode: r.age_code,
    sexCode: r.sex_code,
    regionCode: r.region_code,
    createdAt: r.created_at,
  }));
}

/** FR-15: 기준 코드 테이블 전체 조회 */
async function listCodes() {
  const [sex] = await pool.query(`SELECT sex_code, sex_name FROM sex_code ORDER BY sex_code`);
  const [age] = await pool.query(`SELECT age_code, age_range FROM age_group ORDER BY age_code`);
  const [day] = await pool.query(`SELECT day_code, day_name FROM day_of_week ORDER BY day_code`);
  const [hour] = await pool.query(
    `SELECT hour_code, hour_range, hour_start, hour_end FROM hour_band ORDER BY hour_code`
  );
  const [l1] = await pool.query(
    `SELECT ind_l1_id, ind_l1_name FROM industry_l1 ORDER BY ind_l1_id`
  );
  const [l2] = await pool.query(
    `SELECT ind_l2_id, ind_l1_id, ind_l2_name FROM industry_l2 ORDER BY ind_l1_id, ind_l2_id`
  );

  return {
    sexCode: sex,
    ageGroup: age,
    dayOfWeek: day,
    hourBand: hour,
    industryL1: l1,
    industryL2: l2,
  };
}

function validatePayload(config, body, isUpdate = false) {
  const data = {};
  for (const field of config.fields) {
    const val = body[field.key];
    if (val == null || val === "") {
      if (field.required && !isUpdate) {
        const err = new Error(`${field.label}은(는) 필수입니다.`);
        err.status = 400;
        throw err;
      }
      continue;
    }
    if (field.type === "number") {
      data[field.key] = Number(val);
      if (Number.isNaN(data[field.key])) {
        const err = new Error(`${field.label}은(는) 숫자여야 합니다.`);
        err.status = 400;
        throw err;
      }
    } else {
      data[field.key] = String(val).trim();
      if (field.maxLength && data[field.key].length > field.maxLength) {
        const err = new Error(`${field.label} 길이가 너무 깁니다.`);
        err.status = 400;
        throw err;
      }
    }
  }
  if (!isUpdate && !config.autoPk && body[config.pk] != null) {
    data[config.pk] = String(body[config.pk]).trim();
  }
  return data;
}

/** FR-15: 단일 코드 테이블 조회 */
async function listCodeTable(tableName) {
  const { table, config } = resolveCodeTable(tableName);
  const cols = getSelectColumns(config);
  const [rows] = await pool.query(
    `SELECT ${cols.join(", ")} FROM ${table} ORDER BY ${config.pk}`
  );
  return { table, label: config.label, pk: config.pk, fields: config.fields, rows };
}

/** FR-15: 코드 등록 */
async function createCodeRow(tableName, body) {
  const { table, config } = resolveCodeTable(tableName);
  const data = validatePayload(config, body, false);

  if (!config.autoPk && !data[config.pk]) {
    const err = new Error(`${config.pk}은(는) 필수입니다.`);
    err.status = 400;
    throw err;
  }

  const keys = Object.keys(data);
  const placeholders = keys.map(() => "?").join(", ");
  const [result] = await pool.query(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
    keys.map((k) => data[k])
  );

  const id = config.autoPk ? result.insertId : data[config.pk];
  return getCodeRow(tableName, id);
}

/** FR-15: 코드 수정 */
async function updateCodeRow(tableName, id, body) {
  const { table, config } = resolveCodeTable(tableName);
  const data = validatePayload(config, body, true);
  const keys = Object.keys(data);
  if (keys.length === 0) {
    const err = new Error("수정할 항목이 없습니다.");
    err.status = 400;
    throw err;
  }

  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const [result] = await pool.query(
    `UPDATE ${table} SET ${sets} WHERE ${config.pk} = ?`,
    [...keys.map((k) => data[k]), id]
  );
  if (result.affectedRows === 0) {
    const err = new Error("코드를 찾을 수 없습니다.");
    err.status = 404;
    throw err;
  }
  return getCodeRow(tableName, id);
}

/** FR-15: 코드 삭제 */
async function deleteCodeRow(tableName, id) {
  const { table, config } = resolveCodeTable(tableName);
  const [result] = await pool.query(
    `DELETE FROM ${table} WHERE ${config.pk} = ?`,
    [id]
  );
  if (result.affectedRows === 0) {
    const err = new Error("코드를 찾을 수 없습니다.");
    err.status = 404;
    throw err;
  }
  return { message: "삭제되었습니다." };
}

async function getCodeRow(tableName, id) {
  const { table, config } = resolveCodeTable(tableName);
  const cols = getSelectColumns(config);
  const [rows] = await pool.query(
    `SELECT ${cols.join(", ")} FROM ${table} WHERE ${config.pk} = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error("코드를 찾을 수 없습니다.");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

/** FR-16: 접근 로그 조회 */
async function listLogs(limit = 100) {
  const [rows] = await pool.query(
    `SELECT l.log_id, l.user_id, u.email, l.action, l.ip_address,
            l.user_agent, l.status, l.detail, l.created_at
     FROM access_log l
     LEFT JOIN users u ON l.user_id = u.user_id
     ORDER BY l.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows.map((r) => ({
    logId: r.log_id,
    userId: r.user_id,
    email: r.email,
    action: r.action,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    status: r.status,
    detail: r.detail,
    createdAt: r.created_at,
  }));
}

module.exports = {
  listUsers,
  listCodes,
  listCodeTable,
  createCodeRow,
  updateCodeRow,
  deleteCodeRow,
  listLogs,
  CODE_TABLE_CONFIG,
};
