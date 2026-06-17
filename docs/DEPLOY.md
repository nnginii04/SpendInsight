# 배포 가이드 (Railway + Vercel)

| 구성요소 | 플랫폼 | 비고 |
|---------|--------|------|
| MySQL | Railway | DB 이름 `railway` |
| 백엔드 API | Railway (권장) 또는 Render | Express, `server/` |
| 프론트엔드 | Vercel | React, `client/` |

GitHub 저장소: https://github.com/nnginii04/SpendInsight

---

## 1. Railway MySQL (완료 시 건너뛰기)

Railway 대시보드 → MySQL 서비스 → **Variables** 에서 확인:

- `MYSQLDATABASE` = `railway`
- `MYSQL_ROOT_PASSWORD`
- Public TCP Proxy: `호스트:포트` (예: `thomas.proxy.rlwy.net:42565`)

로컬에서 DB 초기화:

```bash
export RAILWAY_MYSQL_HOST=thomas.proxy.rlwy.net
export RAILWAY_MYSQL_PORT=42565
export RAILWAY_MYSQL_PASSWORD=여기에_MYSQL_ROOT_PASSWORD
chmod +x scripts/deploy-railway-db.sh
./scripts/deploy-railway-db.sh
```

> 로컬 개발용 SQL은 `database/schema.sql` / `sample_data.sql` (geumso_pae)  
> Railway용은 `database/schema.railway.sql` / `sample_data.railway.sql` (railway)

---

## 2. Railway 백엔드 배포

### 2-1. GitHub 연동

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. `nnginii04/SpendInsight` 선택
3. **Web Service** 추가 (MySQL과 같은 프로젝트 안에)

### 2-2. 서비스 설정

| 항목 | 값 |
|------|-----|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check | `/api/health` |

### 2-3. 환경 변수 (Web Service → Variables)

MySQL 서비스와 **같은 프로젝트**에 있으면 변수 참조로 연결:

| 변수 | 값 |
|------|-----|
| `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` (Reference 변수) |
| `JWT_SECRET` | 임의의 긴 문자열 (32자 이상) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | Vercel URL (아래 3단계 후 설정, 예: `https://spend-insight.vercel.app`) |

> `MYSQL_URL`은 Railway 내부 주소(`mysql.railway.internal`)를 씁니다. `DB_SSL`은 설정하지 않아도 됩니다.

### 2-4. 공개 URL 발급

Web Service → **Settings** → **Networking** → **Generate Domain**

예: `https://spendinsight-api-production.up.railway.app`

동작 확인:

```bash
curl https://YOUR-RAILWAY-API.up.railway.app/api/health
```

---

## 3. Vercel 프론트엔드 배포

### 3-1. 프로젝트 연결

1. [Vercel](https://vercel.com) → **Add New Project** → GitHub `SpendInsight`
2. **Root Directory** → `client` 선택
3. Framework: Create React App (자동 감지)

### 3-2. 환경 변수

| 변수 | 값 |
|------|-----|
| `REACT_APP_API_URL` | Railway 백엔드 URL (끝에 `/` 없이) |

예: `https://spendinsight-api-production.up.railway.app`

### 3-3. 배포 후 CORS 설정

Vercel 배포가 끝나면 URL이 생깁니다 (예: `https://spend-insight.vercel.app`).

Railway Web Service의 `CLIENT_ORIGIN`을 Vercel URL로 업데이트 → **Redeploy**.

여러 도메인은 쉼표로 구분:

```
https://spend-insight.vercel.app,https://spend-insight-xxx.vercel.app
```

---

## 4. (대안) Render 백엔드

Railway 대신 Render를 쓸 경우 `render.yaml` Blueprint 사용.

Render는 Railway **외부**에서 DB에 접속하므로 Public TCP Proxy URL이 필요합니다.

| 변수 | 값 |
|------|-----|
| `DATABASE_URL` | `mysql://root:비밀번호@thomas.proxy.rlwy.net:42565/railway` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | 임의 문자열 |
| `CLIENT_ORIGIN` | Vercel URL |

---

## 5. 데모 계정

| 항목 | 값 |
|------|-----|
| 이메일 | `demo@example.com` |
| 비밀번호 | `123` |

---

## 6. 트러블슈팅

| 증상 | 확인 |
|------|------|
| CORS 오류 | Railway `CLIENT_ORIGIN`이 Vercel URL과 정확히 일치하는지 (https, 끝 `/` 없음) |
| DB 연결 실패 | `MYSQL_URL` 참조가 같은 프로젝트 MySQL을 가리키는지 |
| 로그인 안 됨 | Railway DB에 `sample_data.railway.sql` 적용 여부 |
| API 404 | `REACT_APP_API_URL`이 백엔드 루트 URL인지 (`/api` 붙이지 않음) |

---

## 7. 로컬 개발 (배포와 별도)

```bash
./scripts/setup-db.sh          # geumso_pae 로컬 DB
cd server && npm start         # :3001
cd client && npm start         # :3000
```
