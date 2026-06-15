/** FR-14: 사용자 정보 조회 (본인 프로필) */
import React from "react";
import { useAuth } from "../context/AuthContext";

const AGE_LABEL = {
  "10": "10대",
  "20": "20대",
  "30": "30대",
  "40": "40대",
  "50": "50대 이상",
};

const ROLE_LABEL = {
  USER: "일반 사용자",
  ANALYST: "분석가",
  ADMIN: "관리자",
};

export default function MyPage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1 className="page-title">마이페이지</h1>
      <p className="muted">회원 정보를 확인할 수 있습니다.</p>

      <div className="card profile-card">
        <div className="field">
          <label>사용자명</label>
          <input value={user.username} readOnly />
        </div>
        <div className="field">
          <label>이메일</label>
          <input value={user.email} readOnly />
        </div>
        <div className="field">
          <label>연령대</label>
          <input value={AGE_LABEL[user.ageCode] || user.ageCode} readOnly />
        </div>
        <div className="field">
          <label>성별</label>
          <input value={user.sexCode === "M" ? "남성" : "여성"} readOnly />
        </div>
        <div className="field">
          <label>권한</label>
          <input value={ROLE_LABEL[user.role] || user.role} readOnly />
        </div>
      </div>
    </div>
  );
}
