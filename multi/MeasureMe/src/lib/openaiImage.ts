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
 * 의류 실측값과 추정 신체 치수를 비교하여 핏 지시 프롬프트 생성.
 *
 * 중요: 어깨너비는 직선 너비(cm)이므로 둘레 환산 없이 그대로 비교.
 * 가슴/허리/엉덩이 단면값은 ×2하여 둘레로 환산 후 비교.
 * 평균 계산 시 어깨너비 제외 — 둘레와 직선 너비를 혼합하면 수치가 왜곡됨.
 */
function buildFitInstruction(fitContext?: FitContext): string {
  const g = fitContext?.garmentMeasurements;
  const b = fitContext?.estimatedBodyMeasurements;
  const sizeRec = fitContext?.sizeRecommendation;

  if (!g || Object.keys(g).length === 0 || !b) {
    const sizeText = sizeRec ? `추천 사이즈 ${sizeRec} 기준으로` : "";
    return `${sizeText} 체형에 자연스럽게 맞는 핏으로 표현. 옷의 원래 디자인 실루엣을 유지하며 깔끔하게 착용된 모습으로 표현.`;
  }

  // 둘레 기반 부위 (단면 × 2 = 둘레 → 신체 둘레와 비교)
  const circumferenceEase: Record<string, number> = {};
  if (g["가슴단면"] && b.chestCircumference) {
    circumferenceEase["가슴"] = g["가슴단면"] * 2 - parseFloat(b.chestCircumference);
  }
  if (g["허리단면"] && b.waistCircumference) {
    circumferenceEase["허리"] = g["허리단면"] * 2 - parseFloat(b.waistCircumference);
  }
  if (g["엉덩이단면"] && b.hipCircumference) {
    circumferenceEase["엉덩이"] = g["엉덩이단면"] * 2 - parseFloat(b.hipCircumference);
  }

  // 어깨너비: 직선 너비끼리 비교 (별도 처리)
  let shoulderNote = "";
  if (g["어깨너비"] && b.shoulderWidth) {
    const shoulderEase = g["어깨너비"] - parseFloat(b.shoulderWidth);
    if (shoulderEase < -2) {
      shoulderNote = `어깨: 옷 어깨너비(${g["어깨너비"]}cm)가 신체(${b.shoulderWidth}cm)보다 ${Math.abs(shoulderEase).toFixed(1)}cm 좁아 어깨가 걸리는 모습`;
    } else if (shoulderEase < 2) {
      shoulderNote = `어깨: 딱 맞는 어깨너비`;
    } else if (shoulderEase < 8) {
      shoulderNote = `어깨: 어깨너비 여유 ${shoulderEase.toFixed(1)}cm로 자연스러운 핏`;
    } else {
      shoulderNote = `어깨: 어깨너비 여유 ${shoulderEase.toFixed(1)}cm로 어깨가 흘러내리는 오버핏`;
    }
  }

  if (Object.keys(circumferenceEase).length === 0 && !shoulderNote) {
    const sizeText = sizeRec ? `추천 사이즈 ${sizeRec} 기준으로` : "";
    return `${sizeText} 체형에 자연스럽게 맞는 핏으로 표현.`;
  }

  // 둘레 기반 부위만으로 전체 타이트 수준 판단 (어깨너비 제외)
  const circumEaseValues = Object.values(circumferenceEase);
  const avgEase = circumEaseValues.length > 0
    ? circumEaseValues.reduce((a, b) => a + b, 0) / circumEaseValues.length
    : 5; // 데이터 없으면 중간값
  const minEase = circumEaseValues.length > 0 ? Math.min(...circumEaseValues) : 5;

  // 둘레 부위별 묘사
  const circumLines = Object.entries(circumferenceEase).map(([part, ease]) => {
    if (ease < -8)  return `  - ${part}: 옷 둘레가 신체보다 ${Math.abs(ease).toFixed(1)}cm 작음 → 매우 꽉 끼고 옷감이 터질 듯 팽팽`;
    if (ease < -4)  return `  - ${part}: 옷 둘레가 신체보다 ${Math.abs(ease).toFixed(1)}cm 작음 → 꽉 끼고 몸 라인 그대로 드러남`;
    if (ease < 0)   return `  - ${part}: 옷 둘레가 신체보다 ${Math.abs(ease).toFixed(1)}cm 작음 → 타이트하게 달라붙음`;
    if (ease < 4)   return `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 딱 맞는 핏`;
    if (ease < 10)  return `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 자연스럽고 편안한 핏`;
    if (ease < 20)  return `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 루즈한 핏`;
    return              `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 매우 헐렁한 오버사이즈`;
  }).join("\n");

  const allPartLines = [circumLines, shoulderNote ? `  - ${shoulderNote}` : ""].filter(Boolean).join("\n");

  let overallDirective: string;
  if (minEase < -8 || avgEase < -4) {
    overallDirective =
      `[필수] 이 옷은 착용자 신체보다 훨씬 작아 억지로 끼워 입은 상태입니다.\n` +
      `옷감이 팽팽하게 당기고 몸의 굴곡이 그대로 드러나야 합니다.\n` +
      `절대 "보기 좋게" 보정하지 말고 실제로 작은 옷을 입은 모습을 사실적으로 묘사하세요.`;
  } else if (minEase < -2 || avgEase < 2) {
    overallDirective =
      `[필수] 이 옷은 착용자 신체에 비해 타이트합니다.\n` +
      `몸의 곡선이 옷 위로 드러나고 딱 달라붙는 느낌이 명확히 보여야 합니다.\n` +
      `여유 있는 핏으로 보정하지 마세요.`;
  } else if (minEase < 0 || avgEase < 4) {
    overallDirective =
      `이 옷은 착용자 신체에 딱 맞거나 약간 타이트합니다.\n` +
      `슬림하게 달라붙는 핏으로 표현하세요.`;
  } else if (avgEase > 20) {
    overallDirective =
      `[필수] 이 옷은 착용자 신체보다 매우 큽니다.\n` +
      `옷이 몸에서 떠 있고 헐렁하게 걸쳐진 오버사이즈 모습이 명확히 보여야 합니다.\n` +
      `타이트하게 보정하지 마세요.`;
  } else if (avgEase > 10) {
    overallDirective = `이 옷은 착용자 신체보다 약간 큽니다. 루즈하게 입혀진 모습으로 표현하세요.`;
  } else {
    overallDirective = `이 옷은 착용자 신체에 잘 맞습니다. 자연스럽고 편안하게 맞는 핏으로 표현하세요.`;
  }

  return `${overallDirective}\n\n부위별 수치:\n${allPartLines}`;
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

  const prompt = `첫 번째 이미지는 사람의 전신 사진이고, 두 번째 이미지는 의류입니다.
첫 번째 이미지의 사람이 두 번째 이미지의 옷을 입은 모습을 사실적으로 생성해주세요.

[절대 규칙]
- 핏 지시사항을 임의로 "보기 좋게" 수정하거나 보정하지 마세요
- 옷이 타이트하면 반드시 타이트하게, 헐렁하면 반드시 헐렁하게 표현하세요
- 사람의 얼굴, 체형, 헤어스타일, 피부톤을 그대로 유지하세요
- 옷의 색상, 패턴, 디자인, 질감을 정확히 반영하세요
- 배경과 조명은 원본 사람 사진과 동일하게 유지하세요
- 사진처럼 사실적으로(photorealistic) 표현하세요

[핏 지시사항 - 입력된 실측 수치 기반, 반드시 반영]
${fitInstruction}`;

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
