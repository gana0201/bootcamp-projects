import OpenAI, { toFile } from "openai";
import { readFile } from "fs/promises";
import path from "path";
import type { FitContext } from "@/app/api/try-on/route";

const apiKey = process.env.OPENAI_API_KEY;

// OpenAI 이미지 생성/편집 모델 (env로 전환 가능)
// 평소: gpt-image-1-mini (저렴) / 시연: gpt-image-1 (고품질)
const IMAGE_MODEL = process.env.TRYON_IMAGE_MODEL || "gpt-image-1-mini";
const IMAGE_QUALITY = (process.env.TRYON_IMAGE_QUALITY || "medium") as
  | "low"
  | "medium"
  | "high";

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

/**
 * 이미지 URL(로컬 경로, http URL, data URL)을 Buffer로 변환
 */
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
      return {
        buffer: Buffer.from(match[2], "base64"),
        fileName: `${label}.${extFromMime(mimeType)}`,
        mimeType,
      };
    }
  }

  // 로컬 파일 (/uploads/...)
  const filePath = path.join(process.cwd(), "public", imageUrl);
  const buffer = await readFile(filePath);
  const ext = path.extname(imageUrl).toLowerCase().replace(".", "") || "png";
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { buffer, fileName: `${label}.${ext}`, mimeType };
}

/**
 * 의류 실측값(cm)과 AI 추정 신체 치수(cm)를 직접 비교하여
 * 이미지 생성 프롬프트 지시를 생성한다.
 *
 * 의류 단면값(가슴단면, 허리단면 등)은 절반 치수이므로 ×2하여 둘레로 환산.
 * 여유분(ease) = 의류 둘레 - 신체 둘레
 */
function buildFitInstruction(fitContext?: FitContext): string {
  const g = fitContext?.garmentMeasurements;
  const b = fitContext?.estimatedBodyMeasurements;
  const sizeRec = fitContext?.sizeRecommendation;

  // 실측값이 없으면 추천 사이즈 기준으로 자연스럽게
  if (!g || Object.keys(g).length === 0 || !b) {
    const sizeText = sizeRec ? `추천 사이즈 ${sizeRec} 기준으로` : "";
    return `${sizeText} 체형에 자연스럽게 맞는 핏으로 표현할 것. 옷의 원래 디자인 실루엣을 유지하며 깔끔하게 착용된 모습으로 표현.`;
  }

  // 부위별 여유분 계산
  const easeMap: Record<string, number> = {};

  if (g["가슴단면"] && b.chestCircumference) {
    easeMap["가슴"] = g["가슴단면"] * 2 - parseFloat(b.chestCircumference);
  }
  if (g["어깨너비"] && b.shoulderWidth) {
    easeMap["어깨"] = g["어깨너비"] - parseFloat(b.shoulderWidth);
  }
  if (g["허리단면"] && b.waistCircumference) {
    easeMap["허리"] = g["허리단면"] * 2 - parseFloat(b.waistCircumference);
  }
  if (g["엉덩이단면"] && b.hipCircumference) {
    easeMap["엉덩이"] = g["엉덩이단면"] * 2 - parseFloat(b.hipCircumference);
  }

  if (Object.keys(easeMap).length === 0) {
    const sizeText = sizeRec ? `추천 사이즈 ${sizeRec} 기준으로` : "";
    return `${sizeText} 체형에 자연스럽게 맞는 핏으로 표현할 것.`;
  }

  const easeValues = Object.values(easeMap);
  const avgEase = easeValues.reduce((a, b) => a + b, 0) / easeValues.length;
  const minEase = Math.min(...easeValues);

  // 부위별 수치 묘사
  const partLines = Object.entries(easeMap).map(([part, ease]) => {
    const absEase = Math.abs(ease).toFixed(1);
    if (ease < -4)  return `  - ${part}: 옷이 신체보다 ${absEase}cm 작음 → 극도로 꽉 끼고 옷감이 터질 듯 팽팽하게 당겨지는 모습`;
    if (ease < 0)   return `  - ${part}: 옷이 신체보다 ${absEase}cm 작음 → 타이트하게 달라붙어 몸 라인이 그대로 드러나는 모습`;
    if (ease < 3)   return `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 딱 맞게 밀착된 모습`;
    if (ease < 8)   return `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 자연스럽고 편안하게 맞는 모습`;
    if (ease < 15)  return `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 약간 여유 있는 루즈핏 모습`;
    return              `  - ${part}: 여유분 ${ease.toFixed(1)}cm → 매우 헐렁한 오버사이즈 모습`;
  }).join("\n");

  // 전체 지시
  let overallDirective: string;
  if (minEase < -4 || avgEase < -2) {
    overallDirective =
      `[매우 중요] 이 옷은 착용자의 신체보다 훨씬 작습니다. 반드시 아래 수치를 그대로 이미지에 반영하세요:\n` +
      `옷감이 몸 전체에 팽팽하게 달라붙어 있고, 특히 타이트한 부위에서 옷감이 늘어나거나 주름이 당기는 모습이 사실적으로 보여야 합니다. ` +
      `"보기 좋게" 보정하지 말고, 실제로 작은 옷을 억지로 입은 것처럼 표현하세요.`;
  } else if (minEase < 0 || avgEase < 3) {
    overallDirective =
      `[중요] 이 옷은 착용자의 신체에 비해 타이트합니다. 반드시 아래 수치를 그대로 반영하세요:\n` +
      `몸의 곡선이 옷 위로 드러나고 딱 달라붙는 느낌이 명확히 보여야 합니다. 여유 있는 핏으로 보정하지 마세요.`;
  } else if (avgEase > 15) {
    overallDirective =
      `[중요] 이 옷은 착용자의 신체보다 매우 큽니다. 반드시 아래 수치를 그대로 반영하세요:\n` +
      `옷이 몸에서 떠 있고 헐렁하게 걸쳐진 오버사이즈 모습이 명확히 보여야 합니다. 타이트하게 보정하지 마세요.`;
  } else if (avgEase > 8) {
    overallDirective =
      `이 옷은 착용자의 신체보다 약간 큽니다. 아래 수치를 반영하세요:\n` +
      `약간 루즈한 핏으로 편안하게 입혀진 모습으로 표현.`;
  } else {
    overallDirective =
      `이 옷은 착용자의 신체에 잘 맞습니다. 아래 수치를 반영하세요:\n` +
      `자연스럽고 편안하게 맞는 핏으로 표현.`;
  }

  return `${overallDirective}\n부위별 여유분 수치:\n${partLines}`;
}

/**
 * OpenAI 이미지 편집 모델을 이용한 가상 피팅 이미지 생성.
 * 사람 전신 사진 + 의류 사진을 입력으로 받아, 실측값 기반 타이트/루즈 표현을 포함한 피팅 이미지를 생성.
 * 결과는 data URL(base64) 형태로 반환.
 */
export async function virtualTryOn(
  humanImageUrl: string,
  garmentImageUrl: string,
  fitContext?: FitContext
): Promise<string> {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다");
  }

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

[절대 규칙 - 반드시 준수]
- 아래 핏 지시사항을 임의로 "보기 좋게" 수정하거나 보정하지 마세요
- 옷이 타이트하다고 지시되면 반드시 타이트하게, 헐렁하다고 지시되면 반드시 헐렁하게 표현하세요
- 사람의 얼굴, 체형, 헤어스타일, 피부톤을 그대로 유지하세요
- 옷의 색상, 패턴, 디자인, 질감을 정확하게 반영하세요
- 배경과 조명은 원본 사람 사진과 동일하게 유지하세요
- 사진처럼 사실적으로(photorealistic) 표현하세요

[핏 지시사항 - 입력된 실측 수치 기반]
${fitInstruction}`;

  const editParams: Parameters<typeof client.images.edit>[0] = {
    model: IMAGE_MODEL,
    image: images,
    prompt,
    quality: IMAGE_QUALITY,
    size: "1024x1536",
  };

  // input_fidelity는 gpt-image-1에서만 지원
  if (IMAGE_MODEL === "gpt-image-1") {
    editParams.input_fidelity = "high";
  }

  const response = (await client.images.edit(editParams)) as {
    data?: Array<{ b64_json?: string }>;
  };

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI가 이미지를 생성하지 못했습니다");
  }

  return `data:image/png;base64,${b64}`;
}
