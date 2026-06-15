export function formatCurrency(v) {
  return (Number(v) || 0).toLocaleString("ko-KR") + "원";
}

/** DATE / ISO 문자열을 YYYY-MM-DD로 표시 (타임존 오차 방지) */
export function formatDate(v) {
  if (!v) return "-";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatPercent(v) {
  if (v == null) return "-";
  const n = Number(v);
  return `${n > 0 ? "+" : ""}${n}%`;
}

export const CHART_COLORS = [
  "#0064FF",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#F97316",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];
