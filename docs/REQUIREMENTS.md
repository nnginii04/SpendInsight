# 기능 요구사항 (FR) — 금융 소비 패턴 분석 시스템

홍익대 DB 팀프로젝트 요구사항 정의서·유스케이스·클래스 다이어그램 기준 추적 매트릭스입니다.

## 기능 요구사항 목록

| FR | 요구사항 | 구현 위치 |
|----|----------|-----------|
| FR-01 | 로그인 화면 제공 | `client/src/pages/Login.jsx` |
| FR-02 | 회원가입 시 아이디 중복 확인 | `GET /api/auth/check-username`, Login.jsx |
| FR-03 | 회원가입 — USER·USER_DETAIL 저장 | `POST /api/auth/register`, auth.js |
| FR-04 | 로그인 인증 | `POST /api/auth/login`, auth.js |
| FR-05 | 로그아웃 | `POST /api/auth/logout`, Navbar |
| FR-06 | 로그인 상태 유지 (세션 + localStorage) | express-session, App.js |
| FR-07 | 마이페이지 — 회원 정보 조회 | `client/src/pages/MyPage.jsx` |
| FR-08 | 소비 내역 등록 (날짜·금액·대/중분류) | `POST /api/consumptions`, DetailsPage.jsx |
| FR-09 | 소비 내역 목록 조회 | `GET /api/consumptions`, DetailsPage.jsx |
| FR-10 | 소비 내역 수정 | `PUT /api/consumptions/:id`, DetailsPage.jsx |
| FR-11 | 소비 내역 삭제 | `DELETE /api/consumptions/:id`, DetailsPage.jsx |
| FR-12 | 나의 소비 — 이번 달 지출 요약 | `client/src/pages/MyConsumption.jsx` |
| FR-13 | 나의 소비 — 또래 평균 비교 | report API + MyConsumption.jsx |
| FR-14 | 나의 소비 — 최근 내역 표시 | report API + MyConsumption.jsx |
| FR-15 | 소비 리포트 — 카테고리별 비중 | ConsumptionReport.jsx (Doughnut) |
| FR-16 | 소비 리포트 — 월별 소비 추이 | ConsumptionReport.jsx (Line) |
| FR-17 | 소비 리포트 — 또래 평균 비교 | ConsumptionReport.jsx (Bar) |
| FR-18 | 소비 리포트 — 최근 소비 내역 | report API `recent` 필드 |

## 클래스 다이어그램 ↔ DB 매핑

| 클래스(논리) | DB 테이블 | 관계 |
|--------------|-----------|------|
| User | `USER` | 1 |
| UserDetail | `USER_DETAIL` | User 1:1 |
| CardConsumption | `CARD_CONSUMPTION` | User 1:N |
| IndustryL1 | `INDUSTRY_L1` | IndustryL2 1:N |
| IndustryL2 | `INDUSTRY_L2` | Consumption N:1 |
| AgeGroup | `AGE_GROUP` | UserDetail, Consumption N:1 |
| SexCode | `SEX_CODE` | UserDetail, Consumption N:1 |
| DayOfWeek | `DAY_OF_WEEK` | Consumption N:1 |
| HourBand | `HOUR_BAND` | Consumption N:1 |
| AgeIndustryPref | `AGE_INDUSTRY_PREF` | AgeGroup × IndustryL2 N:M |
