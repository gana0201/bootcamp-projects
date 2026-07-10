import OpenAI, { toFile } from "openai";
import { readFile } from "fs/promises";
import path from "path";
import type { FitContext } from "@/app/api/try-on/route";

const apiKey = process.env.OPENAI_API_KEY;

const IMAGE_MODEL = process.env.TRYON_IMAGE_MODEL || "gpt-image-1-mini";
const IMAGE_QUALITY = (process.env.TRYON_IMAGE_QUALITY || "medium") as
  | "low"
  | "medium"
  | "high";

// 착용 불가 판정 기준: 핵심 부위(가슴/허리) 여유분이 이 값 이하면 차단
const UNWEARABLE_THRESHOLD = -10; // cm

interface ImageBuffer {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

function extFromMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

async function imageToBuffer(imageUrl: string, label: string): Promise<ImageBuffer> {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`이미지를 불러올 수 없습니다: ${imageUrl}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type") || "image/png";
    return { buffer, fileName: `${label}.${extFromMime(mimeType)}`, mimeType };
  }
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:(.+?);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      return { buffer: Buffer.from(match[2], "base64"), fileName: `${label}.${extFromMime(mimeType)}`, mimeType };
    }
  }
  const filePath = path.join(process.cwd(), "public", imageUrl);
  const buffer = await readFile(filePath);
  const ext = path.extname(imageUrl).toLowerCase().replace(".", "") || "png";
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { buffer, fileName: `${label}.${ext}`, mimeType };
}

/**
 * 착용 가능 여부 사전 검사.
 * 가슴/허리 여유분이 UNWEARABLE_THRESHOLD 이하면 착용 불가로 판정.
 * 어깨너비는 직선값이라 둘레 계산에서 제외 (왜곡 방지).
 */
export function checkWearability(fitContext?: FitContext): {
  wearable: boolean;
  reason?: string;
} {
  const g = fitContext?.garmentMeasurements;
  const b = fitContext?.estimatedBodyMeasurements;

  if (!g || Object.keys(g).length === 0 || !b) return { wearable: true };

  // 가슴 여유분 (단면 × 2 = 둘레)
  if (g["가슴단면"] && b.chestCircumference) {
    const chestEase = g["가슴단면"] * 2 - parseFloat(b.chestCircumference);
    if (chestEase <= UNWEARABLE_THRESHOLD) {
      return {
        wearable: false,
        reason: `가슴 부위 사이즈가 너무 작습니다 (옷 가슴둘레 ${(g["가슴단면"] * 2).toFixed(0)}cm vs 신체 ${parseFloat(b.chestCircumference).toFixed(0)}cm, 여유분 ${chestEase.toFixed(1)}cm)`,
      };
    }
  }

  // 허리 여유분
  if (g["허리단면"] && b.waistCircumference) {
    const waistEase = g["허리단면"] * 2 - parseFloat(b.waistCircumference);
    if (waistEase <= UNWEARABLE_THRESHOLD) {
      return {
        wearable: false,
        reason: `허리 부위 사이즈가 너무 작습니다 (옷 허리둘레 ${(g["허리단면"] * 2).toFixed(0)}cm vs 신체 ${parseFloat(b.waistCircumference).toFixed(0)}cm, 여유분 ${waistEase.toFixed(1)}cm)`,
      };
    }
  }

  // 엉덩이 여유분
  if (g["엉덩이단면"] && b.hipCircumference) {
    const hipEase = g["엉덩이단면"] * 2 - parseFloat(b.hipCircumference);
    if (hipEase <= UNWEARABLE_THRESHOLD) {
      return {
        wearable: false,
        reason: `엉덩이 부위 사이즈가 너무 작습니다 (옷 엉덩이둘레 ${(g["엉덩이단면"] * 2).toFixed(0)}cm vs 신체 ${parseFloat(b.hipCircumference).toFixed(0)}cm, 여유분 ${hipEase.toFixed(1)}cm)`,
      };
    }
  }

  return { wearable: true };
}

/**
 * 의류 실측값과 추정 신체 치수를 비교하여
 * AI 이미지 모델이 이해하는 패션 용어로 핏을 묘사.
 * "타이트하게 당긴다" 같은 물리 표현 대신
 * "스킨핏", "크롭", "오버사이즈" 같은 시각적 패션 개념으로 지시.
 */
function buildFitInstruction(fitContext?: FitContext): string {
  const g = fitContext?.garmentMeasurements;
  const b = fitContext?.estimatedBodyMeasurements;
  const sizeRec = fitContext?.sizeRecommendation;
  const height = fitContext?.height;

  if (!g || Object.keys(g).length === 0 || !b) {
    return sizeRec
      ? `추천 사이즈 ${sizeRec}에 맞게 체형에 자연스럽게 착용된 모습으로 표현.`
      : `체형에 자연스럽게 맞는 핏으로 표현.`;
  }

  const fitTerms: string[] = [];   // 패션 핏 용어
  const visualCues: string[] = []; // 시각적 묘사

  // ── 가슴 핏 ──────────────────────────────────────────
  if (g["가슴단면"] && b.chestCircumference) {
    const ease = g["가슴단면"] * 2 - parseFloat(b.chestCircumference);
    if (ease < -8) {
      fitTerms.push("스킨핏(skin-fit)");
      visualCues.push("상체에 옷이 완전히 밀착되어 신체 굴곡이 그대로 드러나는 스킨핏 실루엣");
    } else if (ease < -2) {
      fitTerms.push("슬림핏(slim-fit)");
      visualCues.push("상체에 옷이 딱 붙는 슬림핏 실루엣, 여유 없이 몸 라인을 따라 떨어짐");
    } else if (ease < 4) {
      fitTerms.push("레귤러핏(regular-fit)");
      visualCues.push("가슴 부위가 자연스럽게 맞는 레귤러핏 실루엣");
    } else if (ease < 12) {
      fitTerms.push("루즈핏(loose-fit)");
      visualCues.push("상체에 여유가 있는 루즈핏 실루엣, 옷이 몸에서 살짝 떠 있음");
    } else {
      fitTerms.push("오버사이즈(oversized)");
      visualCues.push("상체에 옷이 헐렁하게 걸쳐진 오버사이즈 실루엣");
    }
  }

  // ── 어깨 핏 ──────────────────────────────────────────
  if (g["어깨너비"] && b.shoulderWidth) {
    const ease = g["어깨너비"] - parseFloat(b.shoulderWidth);
    if (ease < -2) {
      visualCues.push("어깨 솔기가 어깨 끝보다 안쪽에 위치하여 어깨가 걸리는 모습");
    } else if (ease < 3) {
      visualCues.push("어깨 솔기가 어깨 끝에 정확히 위치");
    } else if (ease < 8) {
      visualCues.push("어깨 솔기가 어깨 끝에서 약간 내려온 드롭숄더 스타일");
    } else {
      fitTerms.push("드롭숄더(drop-shoulder)");
      visualCues.push("어깨 솔기가 팔 위쪽까지 크게 내려온 오버사이즈 드롭숄더 스타일");
    }
  }

  // ── 총장 (기장) ───────────────────────────────────────
  if (g["총장"] && height) {
    const normalLength = height * 0.40;
    const diff = g["총장"] - normalLength;
    if (diff < -12) {
      fitTerms.push("크롭(crop)");
      visualCues.push(`총장 ${g["총장"]}cm로 배꼽 위에서 끝나는 크롭 기장 — 복부가 드러남`);
    } else if (diff < -5) {
      fitTerms.push("크롭(crop)");
      visualCues.push(`총장 ${g["총장"]}cm로 배꼽 근처에서 끝나는 짧은 기장`);
    } else if (diff < 5) {
      visualCues.push(`총장 ${g["총장"]}cm로 허리 아래 자연스러운 기장`);
    } else if (diff < 12) {
      visualCues.push(`총장 ${g["총장"]}cm로 엉덩이 근처까지 내려오는 긴 기장`);
    } else {
      fitTerms.push("롱핏(long-fit)");
      visualCues.push(`총장 ${g["총장"]}cm로 엉덩이 아래까지 내려오는 롱 기장`);
    }
  }

  // ── 소매 ─────────────────────────────────────────────
  if (g["소매길이"]) {
    const s = g["소매길이"];
    if (s < 45) {
      visualCues.push(`소매길이 ${s}cm — 팔꿈치 위에서 끝나는 반팔 기장`);
    } else if (s < 54) {
      visualCues.push(`소매길이 ${s}cm — 팔꿈치 아래 7부 기장, 손목보다 짧음`);
    } else if (s < 62) {
      visualCues.push(`소매길이 ${s}cm — 손목 근처 기장`);
    } else {
      visualCues.push(`소매길이 ${s}cm — 손목 아래까지 내려오는 긴 소매`);
    }
  }

  // ── 허리 ─────────────────────────────────────────────
  if (g["허리단면"] && b.waistCircumference) {
    const ease = g["허리단면"] * 2 - parseFloat(b.waistCircumference);
    if (ease < -4) {
      visualCues.push("허리가 몸에 완전히 밀착되어 허리 라인이 드러남");
    } else if (ease < 4) {
      visualCues.push("허리 부위가 딱 맞는 핏");
    } else if (ease > 12) {
      visualCues.push("허리 부위가 여유롭게 떨어지는 실루엣");
    }
  }

  if (fitTerms.length === 0 && visualCues.length === 0) {
    return `체형에 자연스럽게 맞는 핏으로 표현.`;
  }

  const fitStyle = fitTerms.length > 0
    ? `이 옷의 핏 스타일: **${fitTerms.join(", ")}**`
    : "";

  const visualDesc = visualCues.length > 0
    ? `시각적으로 반드시 표현해야 할 요소:\n${visualCues.map(v => `  - ${v}`).join("\n")}`
    : "";

  return [fitStyle, visualDesc].filter(Boolean).join("\n\n");
}

/**
 * OpenAI 이미지 편집 모델로 가상 피팅 이미지 생성.
 * - 실측값 기반으로 타이트/루즈 표현
 * - 착용 불가 수준이면 예외 던짐 (route에서 차단)
 */
export async function virtualTryOn(
  humanImageUrl: string,
  garmentImageUrl: string,
  fitContext?: FitContext
): Promise<string> {
  if (!apiKey) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다");

  const client = new OpenAI({ apiKey });

  const human = await imageToBuffer(humanImageUrl, "person");
  const garment = await imageToBuffer(garmentImageUrl, "garment");

  const images = [
    await toFile(human.buffer, human.fileName, { type: human.mimeType }),
    await toFile(garment.buffer, garment.fileName, { type: garment.mimeType }),
  ];

  const fitInstruction = buildFitInstruction(fitContext);

  const prompt = `두 장의 이미지가 있습니다. 첫 번째는 사람의 전신 사진, 두 번째는 의류 사진입니다.
아래 핏 스타일과 시각적 요소를 반영하여, 이 사람이 이 의류를 착용한 모습을 사실적으로 생성하세요.

${fitInstruction}

추가 규칙:
- 사람의 얼굴, 피부톤, 헤어스타일, 체형을 그대로 유지
- 의류의 색상, 패턴, 소재감, 디자인 디테일을 정확히 반영
- 배경과 조명은 원본 사람 사진과 동일하게 유지
- 사진처럼 사실적으로(photorealistic) 표현
- 위에 명시된 핏 스타일(슬림핏, 크롭, 오버사이즈 등)을 이미지에 명확하게 반영할 것`;

  const editParams: Parameters<typeof client.images.edit>[0] = {
    model: IMAGE_MODEL,
    image: images,
    prompt,
    quality: IMAGE_QUALITY,
    size: "1024x1536",
  };

  if (IMAGE_MODEL === "gpt-image-1") {
    editParams.input_fidelity = "high";
  }

  const response = (await client.images.edit(editParams)) as {
    data?: Array<{ b64_json?: string }>;
  };

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI가 이미지를 생성하지 못했습니다");

  return `data:image/png;base64,${b64}`;
}
