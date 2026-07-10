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
 * 의류 실측값과 추정 신체 치수를 비교하여 시각적으로 표현 가능한 핏 묘사를 생성.
 * "타이트하게 당긴다" 같은 물리 표현 대신,
 * 옷 길이가 짧다, 소매가 짧다, 몸에 붙는다 같은 시각적 결과로 표현.
 */
function buildFitInstruction(fitContext?: FitContext): string {
  const g = fitContext?.garmentMeasurements;
  const b = fitContext?.estimatedBodyMeasurements;
  const sizeRec = fitContext?.sizeRecommendation;

  if (!g || Object.keys(g).length === 0 || !b) {
    const sizeText = sizeRec ? `추천 사이즈 ${sizeRec} 기준으로` : "";
    return `${sizeText} 체형에 자연스럽게 맞는 핏으로 표현. 옷의 원래 디자인 실루엣을 유지하며 깔끔하게 착용된 모습.`;
  }

  const lines: string[] = [];

  // ── 가슴 ──────────────────────────────────────────────
  if (g["가슴단면"] && b.chestCircumference) {
    const garmentChest = g["가슴단면"] * 2;
    const bodyChest = parseFloat(b.chestCircumference);
    const ease = garmentChest - bodyChest;
    if (ease < -4) {
      lines.push(`가슴에 옷감이 팽팽하게 밀착되어 몸의 굴곡이 그대로 드러나는 실루엣`);
    } else if (ease < 2) {
      lines.push(`가슴 부위가 몸에 딱 붙는 슬림한 실루엣`);
    } else if (ease < 8) {
      lines.push(`가슴 부위가 자연스럽게 맞는 핏`);
    } else if (ease < 16) {
      lines.push(`가슴 부위에 여유가 있어 약간 루즈한 실루엣`);
    } else {
      lines.push(`가슴 부위가 매우 넉넉하여 헐렁하게 걸쳐진 실루엣`);
    }
  }

  // ── 어깨 (직선값 비교) ────────────────────────────────
  if (g["어깨너비"] && b.shoulderWidth) {
    const ease = g["어깨너비"] - parseFloat(b.shoulderWidth);
    if (ease < -2) {
      lines.push(`어깨가 옷보다 넓어 어깨 솔기가 팔 쪽으로 당겨진 모습`);
    } else if (ease < 4) {
      lines.push(`어깨 솔기가 어깨 끝에 딱 맞게 위치`);
    } else if (ease < 10) {
      lines.push(`어깨 솔기가 어깨 끝에서 약간 흘러내린 드롭숄더 스타일`);
    } else {
      lines.push(`어깨 솔기가 어깨에서 많이 흘러내린 오버사이즈 드롭숄더`);
    }
  }

  // ── 총장 (키 대비 상의 길이) ──────────────────────────
  if (g["총장"] && b.chestCircumference) {
    // 키를 직접 받지 않으므로 가슴둘레로 체격 추정 후 상의 기준 길이와 비교
    // 일반적으로 상의 정상 길이: 키 × 0.38~0.42 (허리~엉덩이 중간까지)
    // fitContext에 키 정보가 있으면 사용
    const height = fitContext?.height;
    if (height) {
      const normalLength = height * 0.40; // 키의 40%가 일반 상의 기준
      const diff = g["총장"] - normalLength;
      if (diff < -10) {
        lines.push(`총장 ${g["총장"]}cm로 키 대비 매우 짧아 배꼽 위까지만 내려오는 크롭 기장`);
      } else if (diff < -4) {
        lines.push(`총장 ${g["총장"]}cm로 키 대비 짧아 배꼽 근처까지 내려오는 기장`);
      } else if (diff < 4) {
        lines.push(`총장 ${g["총장"]}cm로 키에 적당한 기장`);
      } else {
        lines.push(`총장 ${g["총장"]}cm로 엉덩이 아래까지 내려오는 긴 기장`);
      }
    }
  }

  // ── 소매 ─────────────────────────────────────────────
  if (g["소매길이"]) {
    const sleeve = g["소매길이"];
    if (sleeve < 50) {
      lines.push(`소매길이 ${sleeve}cm로 손목보다 짧게 올라오는 7부~반팔 기장`);
    } else if (sleeve < 58) {
      lines.push(`소매길이 ${sleeve}cm로 손목 근처 기장`);
    } else {
      lines.push(`소매길이 ${sleeve}cm로 손목 아래까지 내려오는 긴 소매`);
    }
  }

  // ── 허리/엉덩이 ───────────────────────────────────────
  if (g["허리단면"] && b.waistCircumference) {
    const ease = g["허리단면"] * 2 - parseFloat(b.waistCircumference);
    if (ease < -4) lines.push(`허리 부위가 몸에 꽉 끼어 몸 라인이 드러나는 실루엣`);
    else if (ease < 4) lines.push(`허리 부위가 딱 맞는 핏`);
    else if (ease > 12) lines.push(`허리 부위가 넉넉하게 여유로운 핏`);
  }

  if (lines.length === 0) {
    const sizeText = sizeRec ? `추천 사이즈 ${sizeRec} 기준으로` : "";
    return `${sizeText} 체형에 자연스럽게 맞는 핏으로 표현.`;
  }

  // 전체 요약 지시
  const summary = lines.join(", ");
  return `이 옷의 착용 모습을 아래 수치 기반으로 정확하게 표현하세요:\n${lines.map(l => `  - ${l}`).join("\n")}\n\n이 시각적 특성들이 이미지에 명확하게 드러나야 합니다. 실루엣과 기장을 수치에 맞게 반드시 표현하세요.`;
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
