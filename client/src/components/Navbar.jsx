import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="site-header">
      <div className="nav-inner">
        <div className="nav-brand" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}>
          금융 소비 패턴 분석
        </div>

        {isAuthenticated && (
          <nav className="nav-links">
            <NavLink to="/dashboard" className={linkClass}>
              대시보드
            </NavLink>
            <NavLink to="/my-consumption" className={linkClass}>
              나의 소비
            </NavLink>
            <NavLink to="/details" className={linkClass}>
              지출 내역
            </NavLink>
            <NavLink to="/report" className={linkClass}>
              소비 리포트
            </NavLink>
            <NavLink to="/mypage" className={linkClass}>
              마이페이지
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                관리자
              </NavLink>
            )}
          </nav>
        )}

        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user.username}님</span>
              <button type="button" className="btn-outline" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-outline">
                로그인
              </NavLink>
              <NavLink to="/register" className="btn-primary btn-sm">
                회원가입
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
