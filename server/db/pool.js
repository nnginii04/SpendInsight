const mysql = require("mysql2/promise");
require("dotenv").config();

const base = {
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "geumso_pae",
  waitForConnections: true,
  connectionLimit: 10,
};

if (process.env.DB_SOCKET) {
  base.socketPath = process.env.DB_SOCKET;
} else {
  base.host = process.env.DB_HOST || "localhost";
  base.port = Number(process.env.DB_PORT) || 3306;
}

const pool = mysql.createPool(base);

module.exports = pool;
