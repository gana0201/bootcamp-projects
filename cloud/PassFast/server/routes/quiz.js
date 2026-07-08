// ============================================
// 퀴즈 API - 결과 저장 및 히스토리 조회 (사용자별)
// ============================================
const express = require("express");
const router = express.Router();
const { query } = require("../db");

// GET /api/quiz/history - 내 퀴즈 히스토리 조회
router.get("/history", async (req, res) => {
  try {
    const result = await query(`
      SELECT qr.id, qr.cert_id, c.name as cert_name,
             qr.total_questions, qr.correct_count, qr.wrong_count,
             qr.score_percent, qr.passed, qr.answers, qr.completed_at
      FROM quiz_results qr
      JOIN catalog c ON qr.cert_id = c.id
      WHERE qr.user_id = $1
      ORDER BY qr.completed_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("[quiz] 히스토리 조회 오류:", err.message);
    res.status(500).json({ error: "히스토리 조회 실패" });
  }
});

// GET /api/quiz/history/:certId - 특정 자격증 히스토리
router.get("/history/:certId", async (req, res) => {
  try {
    const result = await query(
      `SELECT qr.id, qr.cert_id, c.name as cert_name,
              qr.total_questions, qr.correct_count, qr.wrong_count,
              qr.score_percent, qr.passed, qr.answers, qr.completed_at
       FROM quiz_results qr
       JOIN catalog c ON qr.cert_id = c.id
       WHERE qr.user_id = $1 AND qr.cert_id = $2
       ORDER BY qr.completed_at DESC`,
      [req.userId, req.params.certId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[quiz] 자격증별 히스토리 조회 오류:", err.message);
    res.status(500).json({ error: "조회 실패" });
  }
});

// POST /api/quiz/result - 퀴즈 결과 저장
router.post("/result", async (req, res) => {
  const {
    cert_id,
    total_questions,
    correct_count,
    wrong_count,
    score_percent,
    passed,
    answers,
  } = req.body;

  if (!cert_id || total_questions == null) {
    return res.status(400).json({ error: "cert_id와 total_questions는 필수입니다" });
  }

  try {
    const result = await query(
      `INSERT INTO quiz_results (user_id, cert_id, total_questions, correct_count, wrong_count, score_percent, passed, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.userId,
        cert_id,
        total_questions,
        correct_count || 0,
        wrong_count || 0,
        score_percent || 0,
        passed || false,
        JSON.stringify(answers || []),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[quiz] 결과 저장 오류:", err.message);
    res.status(500).json({ error: "결과 저장 실패" });
  }
});

// DELETE /api/quiz/history - 내 히스토리 초기화
router.delete("/history", async (req, res) => {
  try {
    await query("DELETE FROM quiz_results WHERE user_id = $1", [req.userId]);
    res.json({ message: "히스토리 초기화 완료" });
  } catch (err) {
    console.error("[quiz] 초기화 오류:", err.message);
    res.status(500).json({ error: "초기화 실패" });
  }
});

module.exports = router;
