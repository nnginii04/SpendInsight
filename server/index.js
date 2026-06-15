const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const transactionRoutes = require("./routes/transactions.routes");
const reportRoutes = require("./routes/reports.routes");
const adminRoutes = require("./routes/admin.routes");
const metaRoutes = require("./routes/meta.routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "금융 소비 패턴 분석 API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "서버 오류" });
});

app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
