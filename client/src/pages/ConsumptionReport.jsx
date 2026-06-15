/**
 * FR-08: 월간 소비 리포트
 * FR-09: 카테고리별 소비 분석
 * FR-10: 또래 평균 비교
 * FR-11: 전월 대비 증감률
 * FR-12: 이상 소비 탐지
 * FR-13: 카드 혜택 추천
 */
import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { apiFetch } from "../api/client";
import ChartCard from "../components/ChartCard";
import SummaryCard from "../components/SummaryCard";
import { CHART_COLORS, formatCurrency, formatPercent } from "../utils/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" } },
  scales: {
    y: {
      ticks: { callback: (v) => v.toLocaleString("ko-KR") + "원" },
    },
  },
};

export default function ConsumptionReport() {
  const [monthly, setMonthly] = useState(null);
  const [category, setCategory] = useState(null);
  const [peer, setPeer] = useState(null);
  const [change, setChange] = useState(null);
  const [anomaly, setAnomaly] = useState(null);
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/reports/monthly"),
      apiFetch("/api/reports/category"),
      apiFetch("/api/reports/peer-average"),
      apiFetch("/api/reports/monthly-change"),
      apiFetch("/api/reports/anomaly"),
      apiFetch("/api/reports/card-recommend"),
    ])
      .then(([m, c, p, ch, a, cr]) => {
        setMonthly(m);
        setCategory(c);
        setPeer(p);
        setChange(ch);
        setAnomaly(a);
        setCards(cr);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h1 className="page-title">소비 리포트</h1>
        <p className="muted">리포트를 생성하는 중...</p>
      </div>
    );
  }

  const cats = category?.categories || [];
  const doughnutData = {
    labels: cats.map((c) => c.category),
    datasets: [
      {
        data: cats.map((c) => c.amount),
        backgroundColor: cats.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      },
    ],
  };

  const peerBarData = {
    labels: (peer?.comparisons || []).map((c) => c.category),
    datasets: [
      {
        label: "나의 지출",
        data: (peer?.comparisons || []).map((c) => c.myAmount),
        backgroundColor: "#0064FF",
      },
      {
        label: "또래 평균",
        data: (peer?.comparisons || []).map((c) => c.peerAmount),
        backgroundColor: "#E5E7EB",
      },
    ],
  };

  const trendData = {
    labels: (monthly?.monthlyTrend || []).map((t) => t.month),
    datasets: [
      {
        label: "월별 지출",
        data: (monthly?.monthlyTrend || []).map((t) => t.amount),
        borderColor: "#0064FF",
        backgroundColor: "rgba(0,100,255,0.08)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const changeCats = (change?.categories || []).slice(0, 8);
  const changeBarData = {
    labels: changeCats.map((c) => c.category),
    datasets: [
      {
        label: "이번 달",
        data: changeCats.map((c) => c.currentAmount),
        backgroundColor: "#0064FF",
      },
      {
        label: "전월",
        data: changeCats.map((c) => c.previousAmount),
        backgroundColor: "#E5E7EB",
      },
    ],
  };

  const directionLabel =
    change?.direction === "INCREASE"
      ? "지출 증가"
      : change?.direction === "DECREASE"
      ? "지출 감소"
      : change?.direction === "SAME"
      ? "변동 없음"
      : "비교 불가";

  const allAnomalies = [
    ...(anomaly?.stored || []),
    ...(anomaly?.detected || []).filter(
      (d) => !anomaly?.stored?.some((s) => s.consumptionId === d.consumptionId)
    ),
  ];

  return (
    <div className="page">
      <h1 className="page-title">소비 리포트</h1>
      <p className="muted">Chart.js 기반 소비 패턴 분석 결과입니다.</p>

      <div className="summary-grid">
        <SummaryCard
          highlight
          title="이번 달 총 지출"
          value={formatCurrency(monthly?.totalAmount)}
          subtitle={`${monthly?.transactionCount || 0}건`}
        />
        <SummaryCard
          title="전월 대비 (FR-11)"
          value={formatPercent(change?.changeRate)}
          subtitle={`${directionLabel} · 전월 ${formatCurrency(change?.previousAmount)}`}
        />
        <SummaryCard
          title="또래 평균"
          value={formatCurrency(peer?.peerAverageTotal)}
          subtitle={`내 지출 ${formatCurrency(peer?.myTotal)}`}
        />
      </div>

      <div className="card">
        <h2 className="section-title">전월 대비 증감률 분석 (FR-11)</h2>
        <div className="change-summary">
          <div>
            <span className="muted">이번 달 ({change?.yyyymm})</span>
            <strong>{formatCurrency(change?.currentAmount)}</strong>
          </div>
          <div>
            <span className="muted">전월 ({change?.previousYyyymm})</span>
            <strong>{formatCurrency(change?.previousAmount)}</strong>
          </div>
          <div>
            <span className="muted">전체 증감률</span>
            <strong className={change?.changeRate > 0 ? "text-up" : change?.changeRate < 0 ? "text-down" : ""}>
              {formatPercent(change?.changeRate)}
            </strong>
          </div>
        </div>

        {changeCats.length > 0 ? (
          <>
            <div className="chart-wrap chart-wrap--short">
              <Bar data={changeBarData} options={chartOpts} />
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>업종</th>
                    <th>이번 달</th>
                    <th>전월</th>
                    <th>증감률</th>
                  </tr>
                </thead>
                <tbody>
                  {(change?.categories || []).map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td>{c.industry}</td>
                      <td>{formatCurrency(c.currentAmount)}</td>
                      <td>{formatCurrency(c.previousAmount)}</td>
                      <td>{formatPercent(c.changeRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="muted">비교할 카테고리 소비 내역이 없습니다.</p>
        )}
      </div>

      <div className="chart-grid">
        <ChartCard title="카테고리별 비중 (FR-09)">
          {cats.length > 0 ? (
            <div className="chart-wrap chart-wrap--doughnut">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: "bottom" } } }} />
            </div>
          ) : null}
        </ChartCard>

        <ChartCard title="또래 평균 비교 (FR-10)">
          {(peer?.comparisons || []).length > 0 ? (
            <div className="chart-wrap">
              <Bar data={peerBarData} options={chartOpts} />
            </div>
          ) : null}
        </ChartCard>

        <ChartCard title="월별 소비 추이 (FR-08)">
          <div className="chart-wrap">
            <Line data={trendData} options={chartOpts} />
          </div>
        </ChartCard>
      </div>

      {allAnomalies.length > 0 && (
        <div className="card alert-card">
          <h2 className="section-title">이상 소비 탐지 (FR-12)</h2>
          <ul className="simple-list">
            {allAnomalies.map((a) => (
              <li key={a.anomalyId || a.consumptionId}>
                <div>
                  <strong>{a.category}</strong>
                  <div className="muted">{a.reason}</div>
                </div>
                <span>{formatCurrency(a.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cards?.recommendations?.length > 0 && (
        <div className="card">
          <h2 className="section-title">카드 혜택 추천 (FR-13)</h2>
          <p className="muted">
            {cards.analysisType === "EVEN"
              ? "소비가 여러 업종에 고르게 분포되어 범용 카드를 추천합니다."
              : "최근 3개월 소비 패턴을 기반으로 추천합니다."}
          </p>
          <div className="recommend-grid">
            {cards.recommendations.map((r) => (
              <div key={r.rank} className="recommend-item">
                <div className="recommend-item__rank">{r.rank}위</div>
                <div>
                  <strong>{r.cardName || r.recommendedBenefit}</strong>
                  <p className="muted">적용 카테고리: {r.category}</p>
                  <p>{r.benefitDescription}</p>
                  <p className="muted">{r.reason}</p>
                  {r.spendingShare != null && (
                    <p className="muted">소비 비중 {r.spendingShare}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
