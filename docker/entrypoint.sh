#!/usr/bin/env sh
set -eu

DATA_DIR="${DATA_DIR:-/app/data}"
DB_DIR="${DB_DIR:-${DATA_DIR}/mysql}"
RUNTIME_DIR="${RUNTIME_DIR:-${DATA_DIR}/runtime}"
UPLOADS_DIR="${UPLOADS_DIR:-${DATA_DIR}/uploads}"
SOCKET_DIR="${SOCKET_DIR:-/run/mysqld}"
DB_SOCKET="${DB_SOCKET:-${SOCKET_DIR}/mysqld.sock}"
DB_NAME="${DB_NAME:-shanzhao}"
DB_USER="${DB_USER:-shanzhao}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 36 | tr -dc 'A-Za-z0-9' | cut -c 1-24)}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(openssl rand -base64 36 | tr -dc 'A-Za-z0-9' | cut -c 1-16)}"
APP_PORT="${PORT:-3000}"

mkdir -p "$DATA_DIR" "$DB_DIR" "$RUNTIME_DIR" "$UPLOADS_DIR" "$SOCKET_DIR"
chown -R mysql:mysql "$DB_DIR" "$SOCKET_DIR"
rm -rf /app/uploads
ln -s "$UPLOADS_DIR" /app/uploads

if [ ! -d "${DB_DIR}/mysql" ]; then
  echo "[初始化] 正在初始化内置 MariaDB..."
  mariadb-install-db --user=mysql --datadir="$DB_DIR" --skip-test-db >/dev/null
fi

echo "[数据库] 正在启动内置 MariaDB..."
mariadbd \
  --user=mysql \
  --datadir="$DB_DIR" \
  --socket="$DB_SOCKET" \
  --bind-address=127.0.0.1 \
  --port=3306 \
  --skip-networking=0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci &
DB_PID="$!"

for i in $(seq 1 90); do
  if mariadb-admin --socket="$DB_SOCKET" ping >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 90 ]; then
    echo "[数据库] MariaDB 启动超时。"
    exit 1
  fi
  sleep 1
done

if [ ! -f "${RUNTIME_DIR}/install.lock" ]; then
  echo "[初始化] 正在创建数据库和初始管理员..."
  mariadb --socket="$DB_SOCKET" <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
  mariadb --socket="$DB_SOCKET" "$DB_NAME" < /app/sql/container-init.sql

  ADMIN_HASH="$(node -e "const b=require('bcrypt');b.hash(process.argv[1],10).then(v=>process.stdout.write(v))" "$ADMIN_PASSWORD")"
  mariadb --socket="$DB_SOCKET" "$DB_NAME" <<SQL
INSERT INTO admin_users (id, username, password, nickname, isActive)
VALUES (UUID(), '${ADMIN_USER}', '${ADMIN_HASH}', 'Super Admin', 1)
ON DUPLICATE KEY UPDATE password=VALUES(password), isActive=1, updatedAt=NOW();
SQL

  JWT_SECRET="shan_mp_$(openssl rand -hex 32)"
  ADMIN_JWT_SECRET="shan_admin_$(openssl rand -hex 32)"
  cat > "${RUNTIME_DIR}/.env" <<EOF
APP_ENV=production
AUTO_INSTALLED=1
PORT=${APP_PORT}
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_NAME}
WX_APPID=${WX_APPID:-}
WX_SECRET=${WX_SECRET:-}
JWT_SECRET=${JWT_SECRET}
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
JWT_EXPIRES_IN=7d
STORAGE_DRIVER=local
EOF
  date -Iseconds > "${RUNTIME_DIR}/install.lock"
  cat > "${RUNTIME_DIR}/auto-install-info.txt" <<EOF
Admin URL: http://SERVER_IP:${APP_PORT}/
Admin username: ${ADMIN_USER}
Admin password: ${ADMIN_PASSWORD}
Database: built-in MariaDB
Data dir inside container: ${DATA_DIR}
EOF
fi

echo "[database] applying compatible schema migrations..."
mariadb --socket="$DB_SOCKET" "$DB_NAME" < /app/sql/container-init.sql

export INSTALL_STATE_DIR="$RUNTIME_DIR"
export PORT="$APP_PORT"

cat "${RUNTIME_DIR}/auto-install-info.txt" 2>/dev/null || true
echo "[应用] 正在启动后端和后台服务..."
node /app/dist/main.js &
APP_PID="$!"

term_handler() {
  kill "$APP_PID" "$DB_PID" 2>/dev/null || true
  wait "$APP_PID" "$DB_PID" 2>/dev/null || true
}
trap term_handler INT TERM

wait "$APP_PID"
