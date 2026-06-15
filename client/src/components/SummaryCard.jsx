import React from "react";

export default function SummaryCard({ title, value, subtitle, highlight = false }) {
  return (
    <div className={`summary-card${highlight ? " summary-card--highlight" : ""}`}>
      <div className="summary-card__title">{title}</div>
      <div className="summary-card__value">{value}</div>
      {subtitle && <div className="summary-card__subtitle">{subtitle}</div>}
    </div>
  );
}
