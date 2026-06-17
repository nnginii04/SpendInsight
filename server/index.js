const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transactions.routes");
const reportRoutes = require("./routes/reports.routes");
const adminRoutes = require("./routes/admin.routes");
const metaRoutes = require("./routes/meta.routes");

const app = express();
const PORT = Number(process.env.PORT) || 3001;

/** Vercel 등 여러 프론트 도메인 허용 (쉼표 구분) */
function getAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:3000";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      // Postman·서버 간 호출 등 Origin 없는 요청 허용
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, service: "SpendInsight API" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "금융 소비 패턴 분석 API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);

app.use((err, req, res, next) => {
  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ message: "허용되지 않은 출처입니다." });
  }
  console.error(err);
  res.status(500).json({ message: "서버 오류" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`서버 실행: port ${PORT}`);
  console.log(`허용 Origin: ${allowedOrigins.join(", ")}`);
});
