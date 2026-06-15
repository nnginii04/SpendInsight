/** FR-04~07: 지출 내역 등록·조회·수정·삭제 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";

const EMPTY_FILTERS = { dateFrom: "", dateTo: "", indL1Id: "", indL2Id: "" };

function buildListQuery(filters) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.indL1Id) params.set("industryId", filters.indL1Id);
  if (filters.indL2Id) params.set("categoryId", filters.indL2Id);
  const qs = params.toString();
  return `/api/transactions${qs ? `?${qs}` : ""}`;
}

export default function DetailsPage() {
  const [industries, setIndustries] = useState({ l1: [], l2: [] });
  const [list, setList] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");

  const [industriesError, setIndustriesError] = useState("");
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const listRef = useRef(null);

  const fetchList = useCallback((nextFilters = filters) => {
    return apiFetch(buildListQuery(nextFilters)).then(setList);
  }, [filters]);

  useEffect(() => {
    setIndustriesLoading(true);
    apiFetch("/api/meta/industries")
      .then((data) => {
        setIndustries(data);
        setIndustriesError("");
      })
      .catch((err) => {
        console.error(err);
        setIndustries({ l1: [], l2: [] });
        setIndustriesError(
          err.message || "업종 목록을 불러오지 못했습니다. 백엔드 서버를 재시작해 주세요."
        );
      })
      .finally(() => setIndustriesLoading(false));
  }, []);

  useEffect(() => {
    fetchList().finally(() => setLoading(false));
  }, [fetchList]);

  const handleCreate = async (body) => {
    try {
      if (editItem) {
        await apiFetch(`/api/transactions/${editItem.consumptionId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setEditItem(null);
        setSuccessMsg("지출 내역이 수정되었습니다.");
        await fetchList();
      } else {
        await apiFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setFilters(EMPTY_FILTERS);
        setFormKey((k) => k + 1);
        setSuccessMsg("지출 내역이 등록되었습니다.");
        await apiFetch("/api/transactions").then(setList);
      }
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      alert(e.message);
      throw e;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 지출 내역을 삭제할까요?")) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      setSuccessMsg("지출 내역이 삭제되었습니다.");
      await fetchList();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">지출 내역 관리</h1>
      <p className="muted">소비 내역을 등록하고 조회·수정·삭제할 수 있습니다.</p>

      {industriesError && <div className="alert alert-error">{industriesError}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="card">
        <h2 className="section-title">{editItem ? "내역 수정" : "새 지출 등록"}</h2>
        <TransactionForm
          key={formKey}
          industries={industries}
          industriesLoading={industriesLoading}
          initial={editItem}
          onSubmit={handleCreate}
          onCancel={editItem ? () => setEditItem(null) : undefined}
          submitLabel={editItem ? "수정 저장" : "등록"}
        />
      </div>

      <div className="card">
        <h2 className="section-title">조회 필터</h2>
        <div className="form-grid form-grid--filter">
          <div className="field">
            <label>시작일</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>종료일</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>업종</label>
            <select
              value={filters.indL1Id}
              onChange={(e) => setFilters((f) => ({ ...f, indL1Id: e.target.value, indL2Id: "" }))}
            >
              <option value="">전체</option>
              {industries.l1.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>카테고리</label>
            <select
              value={filters.indL2Id}
              onChange={(e) => setFilters((f) => ({ ...f, indL2Id: e.target.value }))}
            >
              <option value="">전체</option>
              {industries.l2
                .filter((x) => !filters.indL1Id || String(x.l1Id) === filters.indL1Id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card" ref={listRef}>
        <h2 className="section-title">내 지출 목록</h2>
        {loading ? (
          <p className="muted">불러오는 중...</p>
        ) : (
          <TransactionList items={list} onEdit={setEditItem} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
