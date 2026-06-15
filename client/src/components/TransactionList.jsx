import React from "react";
import { formatCurrency, formatDate } from "../utils/format";

/** FR-05, FR-07: 지출 목록·삭제 */
export default function TransactionList({ items, onEdit, onDelete }) {
  if (!items.length) {
    return <p className="muted">등록된 지출 내역이 없습니다.</p>;
  }

  return (
    <div className="tx-list">
      {items.map((item) => (
        <div key={item.consumptionId} className="tx-item">
          <div className="tx-item__main">
            <div className="tx-item__date">{formatDate(item.taYmd)}</div>
            <div className="tx-item__category">{item.category}</div>
          </div>
          <div className="tx-item__actions">
            <span className="tx-item__amount">{formatCurrency(item.amount)}</span>
            {onEdit && (
              <button type="button" className="btn-outline btn-sm" onClick={() => onEdit(item)}>
                수정
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => onDelete(item.consumptionId)}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
