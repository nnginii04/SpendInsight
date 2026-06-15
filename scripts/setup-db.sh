#!/bin/bash
# MySQL 스키마·샘플 데이터·시드 일괄 적용
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/server/.env"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT/server/.env.example" "$ENV_FILE"
  echo "server/.env 파일을 생성했습니다. DB_PASSWORD를 입력한 뒤 다시 실행하세요."
  exit 1
fi

# .env 로드 (주석·빈 줄 제외)
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ -z "${DB_PASSWORD+x}" ] || [ -z "$DB_PASSWORD" ]; then
  echo "❌ server/.env 의 DB_PASSWORD가 비어 있습니다."
  echo "   예: DB_PASSWORD=1234"
  exit 1
fi

if [ "$DB_PASSWORD" = "여기에_MySQL_root_비밀번호" ]; then
  echo "❌ server/.env 의 DB_PASSWORD를 실제 MySQL 비밀번호로 바꿔주세요."
  exit 1
fi

MYSQL_OPTS=(-u"${DB_USER:-root}" -p"$DB_PASSWORD")
if [ -n "$DB_SOCKET" ]; then
  MYSQL_OPTS+=(--socket="$DB_SOCKET")
else
  MYSQL_OPTS+=(-h"${DB_HOST:-localhost}" -P"${DB_PORT:-3306}")
fi

echo "▶ MySQL 연결 확인..."
if ! mysql "${MYSQL_OPTS[@]}" -e "SELECT VERSION() AS mysql_version;" 2>/dev/null; then
  echo ""
  echo "❌ MySQL 로그인 실패 (비밀번호 또는 소켓 설정 확인)"
  echo "   - server/.env: DB_PASSWORD, DB_SOCKET=/tmp/mysql.sock"
  echo "   - 터미널 테스트: mysql -u root -p --socket=/tmp/mysql.sock"
  exit 1
fi

echo "▶ schema.sql 적용..."
mysql "${MYSQL_OPTS[@]}" < "$ROOT/database/schema.sql"

echo "▶ sample_data.sql 적용..."
mysql "${MYSQL_OPTS[@]}" < "$ROOT/database/sample_data.sql"

echo ""
echo "✅ DB 설정 완료"
echo "   데모 로그인: demo@example.com / 123"
echo "   관리자: admin@example.com / 123"
echo "   다음: cd server && npm start"
