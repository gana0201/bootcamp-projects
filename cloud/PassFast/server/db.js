// ============================================
// PostgreSQL 연결 설정
// ============================================
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 연결 테스트
pool.on("connect", () => {
  console.log("[DB] PostgreSQL 연결 성공");
});

pool.on("error", (err) => {
  console.error("[DB] PostgreSQL 연결 오류:", err.message);
});

// 쿼리 헬퍼
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
