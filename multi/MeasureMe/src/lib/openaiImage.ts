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
 * 타이트/루즈 정도를 이미지 생성 프롬프트 지시로 변환
 *
 * - 의류 단면값(가슴단면, 허리단면 등)은 절반 치수이므로 ×2하여 둘레로 환산
 * - 여유분(ease) = 의류 둘레 - 신체 둘레
 */
function buildFitInstruction(fitContext?: FitContext): string {
  if (!fitContext?.garmentMeasurements || !fitContext?.estimatedBodyMeasurements) {
    return "옷이 체형에 맞게 자연스럽게 입혀지도록 할 것 (주름, 실루엣 표현)";
  }

  const g = fitContext.garmentMeasurements;
  const b = fitContext.estimatedBodyMeasurements;
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
    return "옷이 체형에 맞게 자연스럽게 입혀지도록 할 것 (주름, 실루엣 표현)";
  }

  const easeValues = Object.values(easeMap);
  const avgEase = easeValues.reduce((a, b) => a + b, 0) / easeValues.length;
  const minEase = Math.min(...easeValues);

  const partDescriptions = Object.entries(easeMap)
    .map(([part, ease]) => {
      if (ease < -2) return `${part} 부위: 옷이 신체보다 ${Math.abs(ease).toFixed(1)}cm 작아 매우 꽉 끼는 상태`;
      if (ease < 2)  return `${part} 부위: 여유분 ${ease.toFixed(1)}cm로 타이트하게 맞는 상태`;
      if (ease < 8)  return `${part} 부위: 여유분 ${ease.toFixed(1)}cm로 적당히 맞는 상태`;
      return             `${part} 부위: 여유분 ${ease.toFixed(1)}cm로 넉넉한 상태`;
    })
    .join(", ");

  let overallInstruction: string;
  if (minEase < -3 || avgEase < -1) {
    overallInstruction =
      `옷이 신체보다 작아 전체적으로 매우 꽉 끼는 모습으로 사실적으로 표현할 것. ` +
      `옷감이 팽팽하게 당기고 몸의 곡선이 그대로 드러나며 솔기와 단추 부위에 긴장감이 보이도록 묘사.`;
  } else if (minEase < 0 || avgEase < 3) {
    overallInstruction =
      `옷이 체형에 비해 약간 작거나 딱 맞아 타이트하게 입혀진 모습으로 표현할 것. ` +
      `몸의 실루엣이 옷 위로 드러나고 옷감이 살짝 당기는 느낌을 표현.`;
  } else if (avgEase > 15) {
    overallInstruction =
      `옷이 체형보다 많이 커서 오버사이즈로 여유롭게 걸쳐진 모습으로 표현할 것. ` +
      `옷감이 자연스럽게 늘어지고 실루엣이 넉넉하게 표현.`;
  } else {
    overallInstruction =
      `옷이 체형에 적당히 맞는 자연스러운 핏으로 표현할 것. ` +
      `깔끔하게 떨어지는 실루엣으로 표현.`;
  }

  return `${overallInstruction}\n부위별 상세: ${partDescriptions}.`;
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
첫 번째 이미지의 사람이 두 번째 이미지의 옷을 입고 있는 사실적인 전신 사진을 생성해주세요.

요구사항:
- 사람의 얼굴, 체형, 헤어스타일, 피부톤을 그대로 유지할 것
- 옷의 색상, 패턴, 디자인, 질감을 정확하게 반영할 것
- ${fitInstruction}
- 배경과 조명은 원본 사람 사진과 비슷하게 유지할 것
- 사진처럼 사실적으로(photorealistic) 표현할 것`;

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
