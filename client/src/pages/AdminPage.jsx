/**
 * FR-14: 사용자 정보 관리 (조회)
 * FR-15: 기준 코드 테이블 관리 (조회·등록·수정·삭제)
 * FR-16: 접근 로그 조회
 */
import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import AdminCodeManager from "../components/AdminCodeManager";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === "codes") {
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetcher =
      tab === "users"
        ? apiFetch("/api/admin/users").then(setUsers)
        : apiFetch("/api/admin/logs?limit=50").then(setLogs);

    fetcher.catch(console.error).finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="page">
      <h1 className="page-title">관리자</h1>
      <p className="muted">사용자·코드·접근 로그를 관리합니다.</p>

      <div className="tab-bar">
        <button
          type="button"
          className={tab === "users" ? "tab active" : "tab"}
          onClick={() => setTab("users")}
        >
          사용자 (FR-14)
        </button>
        <button
          type="button"
          className={tab === "codes" ? "tab active" : "tab"}
          onClick={() => setTab("codes")}
        >
          코드 테이블 (FR-15)
        </button>
        <button
          type="button"
          className={tab === "logs" ? "tab active" : "tab"}
          onClick={() => setTab("logs")}
        >
          접근 로그 (FR-16)
        </button>
      </div>

      <div className="card">
        {tab === "codes" ? (
          <AdminCodeManager />
        ) : loading ? (
          <p className="muted">불러오는 중...</p>
        ) : tab === "users" ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이메일</th>
                  <th>이름</th>
                  <th>역할</th>
                  <th>활성</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId}>
                    <td>{u.userId}</td>
                    <td>{u.email}</td>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>{u.isActive ? "Y" : "N"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>이메일</th>
                  <th>액션</th>
                  <th>상태</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.logId}>
                    <td>{String(l.createdAt).slice(0, 19).replace("T", " ")}</td>
                    <td>{l.email || "-"}</td>
                    <td>{l.action}</td>
                    <td>{l.status}</td>
                    <td>{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
