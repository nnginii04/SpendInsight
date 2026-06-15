/** 거래일자·시간으로 요일·시간대 코드 계산 (FR-04) */
function getDayCode(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const jsDay = d.getDay();
  return jsDay === 0 ? "7" : String(jsDay);
}

function getHourCode(hour) {
  const h = Number(hour);
  if (h >= 0 && h <= 5) return "00";
  if (h >= 6 && h <= 11) return "06";
  if (h >= 12 && h <= 17) return "12";
  return "18";
}

function formatYyyymm(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function prevYyyymm(yyyymm) {
  const y = Number(yyyymm.slice(0, 4));
  const m = Number(yyyymm.slice(4, 6));
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthStartFromYyyymm(yyyymm) {
  return `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}-01`;
}

module.exports = {
  getDayCode,
  getHourCode,
  formatYyyymm,
  prevYyyymm,
  monthStartFromYyyymm,
};
