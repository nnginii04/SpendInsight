/** FR-15: 기준 코드 테이블 화이트리스트 (SQL Injection 방지) */

const CODE_TABLE_CONFIG = {
  sex_code: {
    label: "성별",
    pk: "sex_code",
    fields: [
      { key: "sex_code", label: "코드", required: true, maxLength: 1 },
      { key: "sex_name", label: "명칭", required: true, maxLength: 10 },
    ],
  },
  age_group: {
    label: "연령대",
    pk: "age_code",
    fields: [
      { key: "age_code", label: "코드", required: true, maxLength: 2 },
      { key: "age_range", label: "구간", required: true, maxLength: 20 },
    ],
  },
  day_of_week: {
    label: "요일",
    pk: "day_code",
    fields: [
      { key: "day_code", label: "코드", required: true, maxLength: 1 },
      { key: "day_name", label: "명칭", required: true, maxLength: 10 },
    ],
  },
  hour_band: {
    label: "시간대",
    pk: "hour_code",
    fields: [
      { key: "hour_code", label: "코드", required: true, maxLength: 2 },
      { key: "hour_range", label: "구간", required: true, maxLength: 30 },
      { key: "hour_start", label: "시작시", required: true, type: "number" },
      { key: "hour_end", label: "종료시", required: true, type: "number" },
    ],
  },
  industry_l1: {
    label: "업종 대분류",
    pk: "ind_l1_id",
    autoPk: true,
    fields: [{ key: "ind_l1_name", label: "명칭", required: true, maxLength: 50 }],
  },
  industry_l2: {
    label: "카테고리 중분류",
    pk: "ind_l2_id",
    autoPk: true,
    fields: [
      { key: "ind_l1_id", label: "대분류 ID", required: true, type: "number" },
      { key: "ind_l2_name", label: "명칭", required: true, maxLength: 50 },
    ],
  },
};

function resolveCodeTable(tableName) {
  const config = CODE_TABLE_CONFIG[tableName];
  if (!config) {
    const err = new Error("허용되지 않은 코드 테이블입니다.");
    err.status = 400;
    throw err;
  }
  return { table: tableName, config };
}

function getSelectColumns(config) {
  const cols = config.fields.map((f) => f.key);
  if (config.autoPk && !cols.includes(config.pk)) {
    return [config.pk, ...cols];
  }
  return cols;
}

module.exports = {
  CODE_TABLE_CONFIG,
  resolveCodeTable,
  getSelectColumns,
};
