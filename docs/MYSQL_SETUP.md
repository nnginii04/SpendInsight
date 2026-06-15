# MySQL 설정 가이드 (macOS + Homebrew)

## 1. MySQL 실행 확인

```bash
brew services start mysql
brew services list | grep mysql   # Running: true 여야 함
```

Homebrew MySQL 소켓 경로: **`/tmp/mysql.sock`**  
→ `server/.env` 에 이미 반영되어 있습니다.

## 2. `.env` 비밀번호 설정

```bash
cd server
cp .env.example .env   # 이미 있으면 생략
```

`server/.env` 파일을 열고 **본인 MySQL root 비밀번호**를 입력합니다.

```env
DB_SOCKET=/tmp/mysql.sock
DB_USER=root
DB_PASSWORD=실제비밀번호
DB_NAME=geumso_pae
```

## 3. DB 일괄 생성 (스키마 + 샘플 + 데모 계정)

프로젝트 루트에서:

```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

또는 수동:

```bash
mysql -u root -p --socket=/tmp/mysql.sock < database/schema.sql
mysql -u root -p --socket=/tmp/mysql.sock < database/sample_data.sql
cd server && npm run seed
```

## 4. 연결 테스트

```bash
cd server
node scripts/test-connection.js
```

## 5. 서버·프론트 실행

```bash
# 터미널 1
cd server && npm start

# 터미널 2
cd client && npm start
```

브라우저: http://localhost:3000  
데모: **demo** / **123**

---

## root 비밀번호를 모를 때 (재설정)

1. MySQL 중지

```bash
brew services stop mysql
```

2. 안전 모드로 기동 (새 터미널 탭)

```bash
mysqld_safe --skip-grant-tables --socket=/tmp/mysql.sock &
```

3. 비밀번호 없이 접속 후 변경

```bash
mysql -u root --socket=/tmp/mysql.sock

# MySQL 콘솔에서:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '새비밀번호';
FLUSH PRIVILEGES;
EXIT;
```

4. 안전 모드 프로세스 종료 후 정상 기동

```bash
killall mysqld
brew services start mysql
```

5. `server/.env` 의 `DB_PASSWORD`에 **새비밀번호** 입력 → `./scripts/setup-db.sh` 재실행
