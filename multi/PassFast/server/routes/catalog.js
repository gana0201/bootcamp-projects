// ============================================
// 카탈로그 API - 자격증 종목 조회
// ============================================
const express = require("express");
const router = express.Router();
const { query } = require("../db");

// GET /api/catalog - 전체 카탈로그 조회
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, category, icon, description, passing_score, total_questions, exam_time FROM catalog ORDER BY category, name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[catalog] 조회 오류:", err.message);
    res.status(500).json({ error: "카탈로그 조회 실패" });
  }
});

// GET /api/catalog/:id - 특정 자격증 조회
router.get("/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM catalog WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "자격증을 찾을 수 없습니다" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[catalog] 상세 조회 오류:", err.message);
    res.status(500).json({ error: "조회 실패" });
  }
});

// GET /api/catalog/:id/questions - 특정 자격증의 문제 조회
router.get("/:id/questions", async (req, res) => {
  try {
    const result = await query(
      `SELECT q.id, q.question, q.choices, q.answer, q.explanation,
              q.subject_id, s.name as subject_name
       FROM questions q
       LEFT JOIN subjects s ON q.subject_id = s.id
       WHERE q.cert_id = $1 ORDER BY q.id`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[catalog] 문제 조회 오류:", err.message);
    res.status(500).json({ error: "문제 조회 실패" });
  }
});

// GET /api/catalog/:id/subjects - 특정 자격증의 과목 목록 조회
router.get("/:id/subjects", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, description, sort_order FROM subjects WHERE cert_id = $1 ORDER BY sort_order",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[catalog] 과목 조회 오류:", err.message);
    res.status(500).json({ error: "과목 조회 실패" });
  }
});

module.exports = router;
