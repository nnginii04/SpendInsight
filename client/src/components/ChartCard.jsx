import React from "react";

export default function ChartCard({ title, children, emptyMessage = "데이터가 없습니다." }) {
  return (
    <div className="chart-card">
      <h3 className="chart-card__title">{title}</h3>
      {children ? <div className="chart-card__body">{children}</div> : <p className="muted">{emptyMessage}</p>}
    </div>
  );
}
