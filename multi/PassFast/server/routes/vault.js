// ============================================
// 보관함 API - 목표 자격증 CRUD (사용자별)
// ============================================
const express = require("express");
const router = express.Router();
const { query } = require("../db");

// GET /api/vault - 내 보관함 조회
router.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT v.id, v.cert_id, c.name, c.category, c.icon, c.passing_score, c.description,
             v.target_date, v.target_time, v.target_score, v.memo, v.created_at
      FROM vault v
      JOIN catalog c ON v.cert_id = c.id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("[vault] 조회 오류:", err.message);
    res.status(500).json({ error: "보관함 조회 실패" });
  }
});

// POST /api/vault - 보관함에 자격증 추가
router.post("/", async (req, res) => {
  const { cert_id, target_date, target_time, target_score, memo } = req.body;

  if (!cert_id) {
    return res.status(400).json({ error: "cert_id는 필수입니다" });
  }

  try {
    const result = await query(
      `INSERT INTO vault (user_id, cert_id, target_date, target_time, target_score, memo)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, cert_id) DO NOTHING
       RETURNING *`,
      [req.userId, cert_id, target_date || null, target_time || null, target_score || 85, memo || ""]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "이미 보관함에 등록된 종목입니다" });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[vault] 추가 오류:", err.message);
    res.status(500).json({ error: "보관함 등록 실패" });
  }
});

// PUT /api/vault/:certId - 보관함 항목 수정
router.put("/:certId", async (req, res) => {
  const { target_date, target_score, memo } = req.body;

  try {
    const result = await query(
      `UPDATE vault SET target_date = $1, target_score = $2, memo = $3
       WHERE user_id = $4 AND cert_id = $5 RETURNING *`,
      [target_date, target_score, memo, req.userId, req.params.certId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "보관함에서 찾을 수 없습니다" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[vault] 수정 오류:", err.message);
    res.status(500).json({ error: "수정 실패" });
  }
});

// DELETE /api/vault/:certId - 보관함에서 제거
router.delete("/:certId", async (req, res) => {
  try {
    const result = await query(
      "DELETE FROM vault WHERE user_id = $1 AND cert_id = $2 RETURNING *",
      [req.userId, req.params.certId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "보관함에서 찾을 수 없습니다" });
    }

    res.json({ message: "삭제 완료", deleted: result.rows[0] });
  } catch (err) {
    console.error("[vault] 삭제 오류:", err.message);
    res.status(500).json({ error: "삭제 실패" });
  }
});

module.exports = router;
