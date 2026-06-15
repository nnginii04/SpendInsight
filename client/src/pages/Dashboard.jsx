/** FR-08, FR-11: 월간 리포트 요약·전월 대비 — 대시보드 진입 화면 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import SummaryCard from "../components/SummaryCard";
import { formatCurrency, formatPercent } from "../utils/format";

export default function Dashboard() {
  const { user } = useAuth();
  const [monthly, setMonthly] = useState(null);
  const [change, setChange] = useState(null);
  const [peer, setPeer] = useState(null);
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/reports/monthly"),
      apiFetch("/api/reports/monthly-change"),
      apiFetch("/api/reports/peer-average"),
      apiFetch("/api/reports/card-recommend"),
    ])
      .then(([m, c, p, cr]) => {
        setMonthly(m);
        setChange(c);
        setPeer(p);
        setCards(cr);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h1 className="page-title">대시보드</h1>
        <p className="muted">데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">대시보드</h1>
          <p className="muted">{user.username}님, 이번 달 소비 현황입니다.</p>
        </div>
        <Link to="/details" className="btn-primary">
          지출 등록
        </Link>
      </header>

      <div className="summary-grid">
        <SummaryCard
          highlight
          title="이번 달 총 소비"
          value={formatCurrency(monthly?.totalAmount)}
          subtitle={`${monthly?.transactionCount || 0}건`}
        />
        <SummaryCard
          title="전월 대비 (FR-11)"
          value={formatPercent(change?.changeRate)}
          subtitle={
            change?.direction === "INCREASE"
              ? `지출 증가 · 전월 ${formatCurrency(change?.previousAmount)}`
              : change?.direction === "DECREASE"
              ? `지출 감소 · 전월 ${formatCurrency(change?.previousAmount)}`
              : change?.direction === "SAME"
              ? `변동 없음 · 전월 ${formatCurrency(change?.previousAmount)}`
              : "전월 소비 없음"
          }
        />
        <SummaryCard
          title="또래 평균"
          value={formatCurrency(peer?.peerAverageTotal)}
          subtitle={`내 지출 ${formatCurrency(peer?.myTotal)}`}
        />
      </div>

      {change?.categories?.length > 0 && (
        <div className="card">
          <h2 className="section-title">전월 대비 TOP 카테고리 (FR-11)</h2>
          <ul className="simple-list">
            {change.categories.slice(0, 5).map((c) => (
              <li key={c.category}>
                <span>
                  {c.category} · 이번 달 {formatCurrency(c.currentAmount)}
                </span>
                <strong>{formatPercent(c.changeRate)}</strong>
              </li>
            ))}
          </ul>
          <Link to="/report" className="btn-outline btn-sm" style={{ marginTop: 12 }}>
            상세 리포트 보기
          </Link>
        </div>
      )}

      {cards?.recommendations?.length > 0 && (
        <div className="card">
          <h2 className="section-title">추천 카드 (FR-13)</h2>
          <div className="recommend-grid">
            {cards.recommendations.slice(0, 2).map((r) => (
              <div key={r.rank} className="recommend-item">
                <div className="recommend-item__rank">{r.rank}</div>
                <div>
                  <strong>{r.cardName || r.recommendedBenefit}</strong>
                  <p className="muted">{r.benefitDescription}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/report" className="btn-outline btn-sm" style={{ marginTop: 12 }}>
            카드 추천 전체 보기
          </Link>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">빠른 이동</h2>
        <div className="quick-links">
          <Link to="/my-consumption" className="quick-link">
            나의 소비
          </Link>
          <Link to="/details" className="quick-link">
            지출 내역 관리
          </Link>
          <Link to="/report" className="quick-link">
            소비 리포트
          </Link>
          <Link to="/mypage" className="quick-link">
            마이페이지
          </Link>
        </div>
      </div>

      {monthly?.recent?.length > 0 && (
        <div className="card">
          <h2 className="section-title">최근 지출</h2>
          <ul className="simple-list">
            {monthly.recent.slice(0, 5).map((r) => (
              <li key={r.consumptionId}>
                <span>{String(r.taYmd).slice(0, 10)} · {r.category}</span>
                <strong>{formatCurrency(r.amount)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
