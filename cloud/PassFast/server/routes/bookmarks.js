// ============================================
// 북마크(스크랩) API - 문제 즐겨찾기 CRUD (사용자별)
// ============================================
const express = require("express");
const router = express.Router();
const { query } = require("../db");

// GET /api/bookmarks - 내 전체 북마크 조회
router.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT b.id, b.question_id, b.memo, b.created_at,
             q.cert_id, q.question, q.choices, q.answer, q.explanation,
             c.name as cert_name,
             s.name as subject_name
      FROM bookmarks b
      JOIN questions q ON b.question_id = q.id
      JOIN catalog c ON q.cert_id = c.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("[bookmarks] 조회 오류:", err.message);
    res.status(500).json({ error: "북마크 조회 실패" });
  }
});

// GET /api/bookmarks/cert/:certId - 특정 자격증의 내 북마크
router.get("/cert/:certId", async (req, res) => {
  try {
    const result = await query(`
      SELECT b.id, b.question_id, b.memo, b.created_at,
             q.cert_id, q.question, q.choices, q.answer, q.explanation,
             s.name as subject_name
      FROM bookmarks b
      JOIN questions q ON b.question_id = q.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE b.user_id = $1 AND q.cert_id = $2
      ORDER BY b.created_at DESC
    `, [req.userId, req.params.certId]);
    res.json(result.rows);
  } catch (err) {
    console.error("[bookmarks] 자격증별 조회 오류:", err.message);
    res.status(500).json({ error: "조회 실패" });
  }
});

// POST /api/bookmarks - 북마크 추가
router.post("/", async (req, res) => {
  const { question_id, memo } = req.body;

  if (!question_id) {
    return res.status(400).json({ error: "question_id는 필수입니다" });
  }

  try {
    const result = await query(
      `INSERT INTO bookmarks (user_id, question_id, memo)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, question_id) DO NOTHING
       RETURNING *`,
      [req.userId, question_id, memo || ""]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "이미 북마크된 문제입니다" });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[bookmarks] 추가 오류:", err.message);
    res.status(500).json({ error: "북마크 추가 실패" });
  }
});

// DELETE /api/bookmarks/:questionId - 북마크 제거
router.delete("/:questionId", async (req, res) => {
  try {
    const result = await query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND question_id = $2 RETURNING *",
      [req.userId, req.params.questionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "북마크를 찾을 수 없습니다" });
    }

    res.json({ message: "북마크 삭제 완료" });
  } catch (err) {
    console.error("[bookmarks] 삭제 오류:", err.message);
    res.status(500).json({ error: "삭제 실패" });
  }
});

// GET /api/bookmarks/check/:questionId - 내가 북마크했는지 확인
router.get("/check/:questionId", async (req, res) => {
  try {
    const result = await query(
      "SELECT id FROM bookmarks WHERE user_id = $1 AND question_id = $2",
      [req.userId, req.params.questionId]
    );
    res.json({ bookmarked: result.rows.length > 0 });
  } catch (err) {
    console.error("[bookmarks] 확인 오류:", err.message);
    res.status(500).json({ error: "확인 실패" });
  }
});

module.exports = router;
