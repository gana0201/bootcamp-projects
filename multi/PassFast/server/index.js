// ============================================
// PassFast Express Server
// ============================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const { pool, query } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// 사용자 식별 미들웨어 - 쿠키에서 UUID 읽기
app.use("/api", (req, res, next) => {
  let userId = req.cookies.pf_user_id;
  if (!userId) {
    // 쿠키가 없으면 서버에서 생성하여 응답에 세팅
    const { randomUUID } = require("crypto");
    userId = randomUUID();
    res.cookie("pf_user_id", userId, {
      maxAge: 5 * 365 * 24 * 60 * 60 * 1000, // 5년
      httpOnly: false,
      sameSite: "lax",
    });
  }
  req.userId = userId;
  next();
});

// 정적 파일 서빙 (client 폴더)
app.use(express.static(path.join(__dirname, "..", "client")));

// API 라우트
app.use("/api/catalog", require("./routes/catalog"));
app.use("/api/vault", require("./routes/vault"));
app.use("/api/quiz", require("./routes/quiz"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/generate", require("./routes/generate"));

// SPA 폴백 - HTML 파일 직접 서빙
app.get("/:page.html", (req, res) => {
  const filePath = path.join(__dirname, "..", "client", `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("페이지를 찾을 수 없습니다");
  }
});

// 루트 → index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

// DB 스키마 초기화 후 서버 시작
async function startServer() {
  try {
    // schema.sql 실행하여 테이블 생성
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await query(schema);
    console.log("[DB] 스키마 초기화 완료");

    app.listen(PORT, () => {
      console.log(`[서버] PassFast 실행 중: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[서버] 시작 실패:", err.message);
    process.exit(1);
  }
}

startServer();
