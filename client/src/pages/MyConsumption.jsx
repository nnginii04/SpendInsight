/** FR-08, FR-10, FR-14(최근 내역): 나의 소비 요약 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import SummaryCard from "../components/SummaryCard";
import { formatCurrency } from "../utils/format";

export default function MyConsumption() {
  const { user } = useAuth();
  const [monthly, setMonthly] = useState(null);
  const [category, setCategory] = useState(null);
  const [peer, setPeer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/reports/monthly"),
      apiFetch("/api/reports/category"),
      apiFetch("/api/reports/peer-average"),
    ])
      .then(([m, c, p]) => {
        setMonthly(m);
        setCategory(c);
        setPeer(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h1 className="page-title">나의 소비</h1>
        <p className="muted">불러오는 중...</p>
      </div>
    );
  }

  const top = category?.topCategory;
  const diff = (monthly?.totalAmount || 0) - (peer?.peerAverageTotal || 0);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">나의 소비</h1>
          <p className="muted">{user.username}님의 이번 달 소비 패턴</p>
        </div>
        <Link to="/details" className="btn-primary">
          지출 추가
        </Link>
      </header>

      <div className="summary-grid">
        <SummaryCard
          highlight
          title="이번 달 총 지출"
          value={formatCurrency(monthly?.totalAmount)}
        />
        <SummaryCard
          title="1위 카테고리"
          value={top ? top.category : "-"}
          subtitle={top ? formatCurrency(top.amount) : "내역 없음"}
        />
        <SummaryCard
          title="또래 평균 비교"
          value={diff >= 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
          subtitle={`또래 평균 ${formatCurrency(peer?.peerAverageTotal)}`}
        />
      </div>

      <div className="card">
        <h2 className="section-title">최근 내역</h2>
        {!monthly?.recent?.length ? (
          <p className="muted">등록된 내역이 없습니다.</p>
        ) : (
          <ul className="simple-list">
            {monthly.recent.slice(0, 8).map((item) => (
              <li key={item.consumptionId}>
                <div>
                  <div className="simple-list__sub">{String(item.taYmd).slice(0, 10)}</div>
                  <div>{item.category}</div>
                </div>
                <strong>{formatCurrency(item.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
