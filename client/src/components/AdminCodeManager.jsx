/**
 * FR-15: 기준 코드 테이블 CRUD UI
 */
import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";

const TABLE_OPTIONS = [
  { value: "sex_code", label: "성별 (sex_code)" },
  { value: "age_group", label: "연령대 (age_group)" },
  { value: "day_of_week", label: "요일 (day_of_week)" },
  { value: "hour_band", label: "시간대 (hour_band)" },
  { value: "industry_l1", label: "업종 대분류 (industry_l1)" },
  { value: "industry_l2", label: "카테고리 중분류 (industry_l2)" },
];

function emptyForm(meta) {
  const form = {};
  if (!meta) return form;
  meta.fields.forEach((f) => {
    form[f.key] = "";
  });
  return form;
}

function rowToForm(meta, row) {
  const form = {};
  meta.fields.forEach((f) => {
    form[f.key] = row[f.key] ?? "";
  });
  return form;
}

export default function AdminCodeManager() {
  const [table, setTable] = useState("age_group");
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAutoPk = meta && !meta.fields.some((f) => f.key === meta.pk);
  const columns = meta
    ? isAutoPk
      ? [{ key: meta.pk, label: meta.pk }, ...meta.fields]
      : meta.fields
    : [];

  const loadTable = useCallback(() => {
    setLoading(true);
    setError("");
    return apiFetch(`/api/admin/codes/${table}`)
      .then((data) => {
        setMeta(data);
        setRows(data.rows || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [table]);

  useEffect(() => {
    setEditId(null);
    setForm({});
    loadTable();
  }, [loadTable]);

  useEffect(() => {
    if (meta && editId == null) {
      setForm(emptyForm(meta));
    }
  }, [meta, editId]);

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm(meta));
  };

  const startEdit = (row) => {
    setEditId(row[meta.pk]);
    setForm(rowToForm(meta, row));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editId != null) {
        await apiFetch(`/api/admin/codes/${table}/${editId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch(`/api/admin/codes/${table}`, {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      resetForm();
      await loadTable();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 코드를 삭제할까요?")) return;
    setError("");
    try {
      await apiFetch(`/api/admin/codes/${table}/${id}`, { method: "DELETE" });
      if (editId === id) resetForm();
      await loadTable();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-codes">
      <div className="admin-codes__toolbar">
        <div className="field">
          <label>코드 테이블</label>
          <select value={table} onChange={(e) => setTable(e.target.value)}>
            {TABLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-codes__grid">
        <section className="admin-codes__list">
          <h3>{meta?.label || "코드 목록"}</h3>
          {loading ? (
            <p className="muted">불러오는 중...</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key}>{col.label || col.key}</th>
                    ))}
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row[meta.pk]}>
                      {columns.map((col) => (
                        <td key={col.key}>{row[col.key]}</td>
                      ))}
                      <td className="admin-codes__actions">
                        <button type="button" className="btn-outline btn-sm" onClick={() => startEdit(row)}>
                          수정
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => handleDelete(row[meta.pk])}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 1} className="muted">
                        등록된 코드가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-codes__form card card--nested">
          <h3>{editId != null ? "코드 수정" : "코드 추가"}</h3>
          <form onSubmit={handleSave}>
            {meta?.fields.map((f) => (
              <div className="field" key={f.key}>
                <label>
                  {f.label} ({f.key})
                </label>
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  required={f.required && editId == null}
                  disabled={editId != null && f.key === meta.pk}
                />
              </div>
            ))}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving || !meta}>
                {saving ? "저장 중..." : editId != null ? "수정 저장" : "추가"}
              </button>
              {editId != null && (
                <button type="button" className="btn-outline" onClick={resetForm}>
                  취소
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
