// ============================================
// AI 문제 생성 API (Google Gemini)
// ============================================
const express = require("express");
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// POST /api/generate/questions
// body: { certName, certDescription, count, weakSubjects }
router.post("/questions", async (req, res) => {
  const { certName, certDescription, count = 5, weakSubjects } = req.body;

  if (!certName) {
    return res.status(400).json({ error: "certName은 필수입니다" });
  }

  let prompt = `당신은 한국 자격증 시험 출제 전문가입니다.
"${certName}" 자격증 시험 문제를 ${count}개 생성해주세요.

자격증 설명: ${certDescription || certName + " 관련 시험"}

요구사항:
- 4지선다형 객관식 문제
- 각 문제에 정답 번호(0~3)와 해설 포함
- 각 문제에 과목/주제 분류 포함
- 실제 시험 수준의 난이도
- 한국어로 작성`;

  if (weakSubjects && weakSubjects.length > 0) {
    prompt += `\n- 다음 취약 과목에서 더 많이 출제: ${weakSubjects.join(", ")}`;
  }

  prompt += `\n\n반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만:
[
  {
    "question": "문제 내용",
    "choices": ["보기1", "보기2", "보기3", "보기4"],
    "answer": 0,
    "explanation": "해설 내용",
    "subject_name": "과목명"
  }
]`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Gemini] API 오류:", err);
      return res.status(500).json({ error: "AI 문제 생성 실패", detail: err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // JSON 추출 (마크다운 코드블록 제거)
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const questions = JSON.parse(jsonStr);

    // 유효성 검증
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: "AI가 유효한 문제를 생성하지 못했습니다" });
    }

    // 각 문제 검증
    const validated = questions.filter(
      (q) => q.question && Array.isArray(q.choices) && q.choices.length === 4 && typeof q.answer === "number"
    );

    res.json(validated);
  } catch (err) {
    console.error("[Gemini] 오류:", err.message);
    res.status(500).json({ error: "AI 문제 생성 중 오류 발생" });
  }
});

// POST /api/generate/briefing
// body: { certName, certDescription, weakSubjects, wrongCount, totalAttempts }
router.post("/briefing", async (req, res) => {
  const { certName, certDescription, weakSubjects, wrongCount, totalAttempts } = req.body;

  if (!certName) {
    return res.status(400).json({ error: "certName은 필수입니다" });
  }

  let context = `자격증: ${certName}\n설명: ${certDescription || ""}`;
  if (totalAttempts) context += `\n총 응시 횟수: ${totalAttempts}회`;
  if (wrongCount) context += `\n총 오답 수: ${wrongCount}개`;
  if (weakSubjects && weakSubjects.length > 0) {
    context += `\n취약 과목(오답 많은 순): ${weakSubjects.map(w => w.name + "(" + w.count + "회 오답)").join(", ")}`;
  }

  const prompt = `당신은 한국 자격증 시험 학습 코치입니다.
아래 학습자의 상황을 분석하고 맞춤 브리핑을 작성해주세요.

${context}

다음 형식으로 간결하게 한국어로 작성해주세요 (HTML 태그 사용 가능):

1. **취약 과목**: 가장 취약한 과목 1~3개와 이유를 한 줄씩
2. **공부할 개념**: 해당 취약 과목에서 반드시 복습해야 할 핵심 개념 3~5개
3. **충고**: 학습 전략에 대한 실질적 조언 2~3문장

응시 이력이 없는 경우에는 해당 자격증의 주요 출제 범위와 학습 팁을 알려주세요.
HTML로 작성하되, 간결하게. 전체 200자 이내.`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      return res.status(500).json({ error: "AI 브리핑 생성 실패" });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ briefing: text.trim() });
  } catch (err) {
    console.error("[Gemini] 브리핑 오류:", err.message);
    res.status(500).json({ error: "브리핑 생성 실패" });
  }
});

module.exports = router;
