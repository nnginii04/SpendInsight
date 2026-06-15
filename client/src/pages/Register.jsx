/** FR-01: 회원가입 — 이메일 중복 검사, 사용자 정보 저장 */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
    password2: "",
    username: "",
    phone: "",
    ageCode: "20",
    sexCode: "F",
    regionCode: "11",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          username: form.username,
          phone: form.phone,
          ageCode: form.ageCode,
          sexCode: form.sexCode,
          regionCode: form.regionCode,
        }),
      });
      login(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card auth-card--wide">
        <h1 className="page-title">회원가입</h1>
        <p className="muted">소비 분석을 시작하려면 계정을 만드세요.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>사용자명</label>
              <input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>전화번호</label>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="010-0000-0000"
                required
              />
            </div>
            <div className="field">
              <label>연령대</label>
              <select value={form.ageCode} onChange={(e) => update("ageCode", e.target.value)}>
                <option value="10">10대</option>
                <option value="20">20대</option>
                <option value="30">30대</option>
                <option value="40">40대</option>
                <option value="50">50대 이상</option>
              </select>
            </div>
            <div className="field">
              <label>성별</label>
              <select value={form.sexCode} onChange={(e) => update("sexCode", e.target.value)}>
                <option value="F">여성</option>
                <option value="M">남성</option>
              </select>
            </div>
            <div className="field">
              <label>지역 코드</label>
              <input
                value={form.regionCode}
                onChange={(e) => update("regionCode", e.target.value)}
              />
            </div>
            <div className="field">
              <label>비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>비밀번호 확인</label>
              <input
                type="password"
                value={form.password2}
                onChange={(e) => update("password2", e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
