const mysql = require("mysql2/promise");
require("dotenv").config();

function useSsl() {
  return process.env.DB_SSL === "true";
}

function buildConfigFromUrl(urlString) {
  const url = new URL(urlString);
  const config = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  };
  if (useSsl()) {
    config.ssl = { rejectUnauthorized: true };
  }
  return config;
}

function buildConfigFromEnv() {
  const config = {
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "geumso_pae",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  };

  // 로컬 Homebrew MySQL 소켓 (배포 환경에서는 사용하지 않음)
  if (process.env.DB_SOCKET) {
    config.socketPath = process.env.DB_SOCKET;
  } else {
    config.host = process.env.DB_HOST || "localhost";
    config.port = Number(process.env.DB_PORT) || 3306;
  }

  if (useSsl() && !process.env.DB_SOCKET) {
    config.ssl = { rejectUnauthorized: true };
  }

  return config;
}

function createPoolConfig() {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (databaseUrl) {
    return buildConfigFromUrl(databaseUrl);
  }
  return buildConfigFromEnv();
}

const pool = mysql.createPool(createPoolConfig());

module.exports = pool;
