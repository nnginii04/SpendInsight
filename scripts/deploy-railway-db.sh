#!/usr/bin/env bash
# Railway MySQL에 스키마·샘플 데이터 적용
# 사용법:
#   export RAILWAY_MYSQL_HOST=thomas.proxy.rlwy.net
#   export RAILWAY_MYSQL_PORT=42565
#   export RAILWAY_MYSQL_PASSWORD=your-root-password
#   ./scripts/deploy-railway-db.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${RAILWAY_MYSQL_HOST:?RAILWAY_MYSQL_HOST 필요}"
PORT="${RAILWAY_MYSQL_PORT:?RAILWAY_MYSQL_PORT 필요}"
PASSWORD="${RAILWAY_MYSQL_PASSWORD:?RAILWAY_MYSQL_PASSWORD 필요}"

MYSQL_OPTS=(-h "$HOST" -P "$PORT" -u root --ssl-mode=REQUIRED railway)

echo "▶ schema.railway.sql 적용 중..."
MYSQL_PWD="$PASSWORD" mysql "${MYSQL_OPTS[@]}" < "$ROOT/database/schema.railway.sql"

echo "▶ sample_data.railway.sql 적용 중..."
MYSQL_PWD="$PASSWORD" mysql "${MYSQL_OPTS[@]}" < "$ROOT/database/sample_data.railway.sql"

echo "✅ Railway DB 배포 완료"
