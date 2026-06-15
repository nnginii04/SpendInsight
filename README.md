# 금융 소비 패턴 분석 웹 시스템

React + Node.js(Express) + MySQL 기반 개인 소비 입력·분석 서비스입니다.  
ERD·클래스 다이어그램 관계를 반영했으며, 기능별 FR 번호는 [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)를 참고하세요.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, React Router, Chart.js |
| Backend | Node.js, Express, express-session |
| Database | MySQL 8+ |

## 폴더 구조

```
금융소비패턴_프로젝트/
├── README.md
├── docs/
│   ├── REQUIREMENTS.md     # FR 추적 매트릭스
│   └── MYSQL_SETUP.md
├── database/
│   ├── schema.sql          # DDL (ERD)
│   └── sample_data.sql     # 코드·업종·또래평균
├── scripts/
│   └── setup-db.sh         # DB 일괄 설정
├── server/                 # Express API
│   ├── index.js
│   ├── db.js
│   ├── routes/             # auth, consumptions, report, meta
│   ├── middleware/
│   ├── utils/
│   └── scripts/seed.js
└── client/                 # React SPA
    └── src/
        ├── App.js
        ├── api.js
        ├── components/
        ├── pages/
        └── utils/
```

## DB 테이블 (ERD)

- `USER` ↔ `USER_DETAIL` (1:1)
- `CARD_CONSUMPTION` — 소비 Fact
- `INDUSTRY_L1` → `INDUSTRY_L2` (1:N)
- `AGE_GROUP`, `SEX_CODE`, `DAY_OF_WEEK`, `HOUR_BAND` — 코드
- `AGE_INDUSTRY_PREF` — 연령대×중분류 또래 평균

## 사전 요구

- Node.js 18+
- MySQL 8+

## 실행 방법

### 1. MySQL 기동 (macOS Homebrew 예시)

```bash
brew services start mysql
```

### 2. 환경 변수

```bash
cp server/.env.example server/.env
```

`server/.env` 예시:

```env
DB_USER=root
DB_PASSWORD=본인_MySQL_비밀번호
DB_SOCKET=/tmp/mysql.sock
DB_NAME=geumso_pae
```

### 3. 데이터베이스

```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

연결 확인: `cd server && npm run test:db`

### 4. 백엔드

```bash
cd server
npm install
npm start
```

API: http://localhost:3001

### 5. 프론트엔드

```bash
cd client
npm install
npm start
```

앱: http://localhost:3000

### 데모 계정

- 아이디: `demo`
- 비밀번호: `123`

## API 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/auth/check-username` | 아이디 중복 확인 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 세션 사용자 |
| GET/POST/PUT/DELETE | `/api/consumptions` | 지출 CRUD |
| GET | `/api/report` | 소비 리포트 |
| GET | `/api/meta/industries` | 업종 목록 |

## 구현 단계 (FR)

| 단계 | 내용 | FR |
|------|------|-----|
| 1 | MySQL DDL·시드 (ERD 테이블·FK) | — |
| 2 | Express 서버·DB 연결·메타 API | — |
| 3 | 회원가입·로그인·세션 | FR-01 ~ FR-06 |
| 4 | 마이페이지 | FR-07 |
| 5 | 소비 내역 CRUD | FR-08 ~ FR-11 |
| 6 | 나의 소비 대시보드 | FR-12 ~ FR-14 |
| 7 | 소비 리포트·차트 | FR-15 ~ FR-18 |
