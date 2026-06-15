import React, { useEffect, useState } from "react";

/** FR-04, FR-06: 지출 등록·수정 폼 */
export default function TransactionForm({
  industries,
  industriesLoading = false,
  initial,
  onSubmit,
  onCancel,
  submitLabel = "등록",
}) {
  const [taYmd, setTaYmd] = useState("");
  const [transTime, setTransTime] = useState("12:00");
  const [indL1Id, setIndL1Id] = useState("");
  const [indL2Id, setIndL2Id] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const l2Options = (industries?.l2 || []).filter(
    (x) => String(x.l1Id) === String(indL1Id)
  );

  useEffect(() => {
    if (initial) {
      setTaYmd(String(initial.taYmd).slice(0, 10));
      setIndL1Id(String(initial.indL1Id));
      setIndL2Id(String(initial.indL2Id));
      setAmount(String(initial.amount));
    }
  }, [initial]);

  useEffect(() => {
    if (industries?.l1?.length && !indL1Id) {
      setIndL1Id(String(industries.l1[0].id));
    }
  }, [industries, indL1Id]);

  useEffect(() => {
    if (!indL1Id || !industries?.l2?.length) return;
    const options = industries.l2.filter((x) => String(x.l1Id) === String(indL1Id));
    if (!options.length) return;
    const exists = options.some((o) => String(o.id) === String(indL2Id));
    if (!exists) setIndL2Id(String(options[0].id));
  }, [indL1Id, indL2Id, industries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (industriesLoading || !industries?.l1?.length) {
      alert("업종 목록을 불러온 뒤 다시 시도해 주세요.");
      return;
    }
    if (!taYmd || !indL1Id || !indL2Id || amount === "") {
      alert("거래일자, 업종, 카테고리, 금액을 모두 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        taYmd,
        transTime,
        indL1Id: Number(indL1Id),
        indL2Id: Number(indL2Id),
        amount: Number(amount),
      });
      if (!initial) {
        setTaYmd("");
        setTransTime("12:00");
        setAmount("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasL1 = industries?.l1?.length > 0;
  const l1Failed = !industriesLoading && !hasL1;

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      {industriesLoading && <p className="muted">업종 목록을 불러오는 중...</p>}
      {l1Failed && (
        <p className="alert alert-error">
          업종 목록을 불러오지 못했습니다. 서버를 재시작한 뒤 새로고침해 주세요.
        </p>
      )}
      <div className="form-grid">
        <div className="field">
          <label>거래일자</label>
          <input type="date" value={taYmd} onChange={(e) => setTaYmd(e.target.value)} required disabled={submitting} />
        </div>
        <div className="field">
          <label>시간대</label>
          <input type="time" value={transTime} onChange={(e) => setTransTime(e.target.value)} />
        </div>
        <div className="field">
          <label>업종(대분류)</label>
          <select
            value={indL1Id}
            onChange={(e) => setIndL1Id(e.target.value)}
            required
            disabled={industriesLoading || !hasL1 || submitting}
          >
            {industriesLoading ? (
              <option value="">불러오는 중...</option>
            ) : !hasL1 ? (
              <option value="">업종 로딩 실패</option>
            ) : (
              industries.l1.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="field">
          <label>카테고리(중분류)</label>
          <select
            value={indL2Id}
            onChange={(e) => setIndL2Id(e.target.value)}
            required
            disabled={industriesLoading || !hasL1 || l2Options.length === 0 || submitting}
          >
            {industriesLoading ? (
              <option value="">불러오는 중...</option>
            ) : l2Options.length === 0 ? (
              <option value="">카테고리 없음</option>
            ) : (
              l2Options.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="field">
          <label>소비 금액</label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            required
            disabled={submitting}
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting || industriesLoading || !hasL1}>
          {submitting ? "처리 중..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
}
