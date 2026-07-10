import OpenAI, { toFile } from "openai";
import { readFile } from "fs/promises";
import path from "path";
import type { FitContext } from "@/app/api/try-on/route";

const apiKey = process.env.OPENAI_API_KEY;

// OpenAI 이미지 생성/편집 모델 (env로 전환 가능)
// - 개발/평소: gpt-image-1-mini (저렴)
// - 시연: gpt-image-1 (고품질, 비쌈)
const IMAGE_MODEL = process.env.TRYON_IMAGE_MODEL || "gpt-image-1-mini";
// 품질: low | medium | high (기본 low = 저렴)
const IMAGE_QUALITY = (process.env.TRYON_IMAGE_QUALITY || "low") as
  | "low"
  | "medium"
  | "high";

interface ImageBuffer {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
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

  // data URL 처리
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

function extFromMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

/**
 * OpenAI gpt-image-1을 이용한 가상 피팅 이미지 생성.
 * 사람 전신 사진에 의류 사진의 옷을 입힌 이미지를 생성한다.
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

  // fitScore 기반으로 핏 표현 방식 결정
  let fitInstruction = "옷이 체형에 맞게 자연스럽게 입혀지도록 할 것 (주름, 실루엣 표현)";
  if (fitContext?.fitScore !== undefined) {
    const score = fitContext.fitScore;
    if (score <= 4) {
      fitInstruction = `옷이 사람의 체형보다 작아서 매우 타이트하게 맞는 모습으로 표현할 것.
가슴, 어깨, 허리 부위에서 옷감이 당기고 팽팽하게 늘어난 주름을 표현할 것.
버튼 사이나 솔기 부분이 벌어질 듯한 긴장감을 사실적으로 묘사할 것.`;
    } else if (score <= 6) {
      fitInstruction = `옷이 체형보다 약간 작아서 타이트하게 맞는 모습으로 표현할 것.
몸의 곡선이 옷 위로 드러나고 옷감이 약간 당기는 느낌을 표현할 것.`;
    } else if (score <= 8) {
      fitInstruction = `옷이 체형에 잘 맞는 자연스러운 핏으로 표현할 것.
너무 타이트하거나 너무 여유롭지 않고 깔끔하게 떨어지는 실루엣을 표현할 것.`;
    } else {
      fitInstruction = `옷이 체형에 완벽하게 맞는 이상적인 핏으로 표현할 것.
자연스럽게 떨어지는 실루엣과 편안해 보이는 착용감을 표현할 것.`;
    }
  }

  // 부위별 핏 상세 정보 추가
  let detailInstruction = "";
  if (fitContext?.details) {
    const parts = Object.entries(fitContext.details)
      .map(([key, val]) => `- ${key}: ${val}`)
      .join("\n");
    if (parts) {
      detailInstruction = `\n\n부위별 핏 참고사항 (이미지에 반영할 것):\n${parts}`;
    }
  }

  const prompt = `첫 번째 이미지는 사람의 전신 사진이고, 두 번째 이미지는 의류입니다.
첫 번째 이미지의 사람이 두 번째 이미지의 옷을 입고 있는 사실적인 전신 사진을 생성해주세요.

요구사항:
- 사람의 얼굴, 체형, 헤어스타일, 피부톤을 그대로 유지할 것
- 옷의 색상, 패턴, 디자인, 질감을 정확하게 반영할 것
- ${fitInstruction}
- 배경과 조명은 원본 사람 사진과 비슷하게 유지할 것
- 사진처럼 사실적으로(photorealistic) 표현할 것${detailInstruction}`;

  const editParams: Parameters<typeof client.images.edit>[0] = {
    model: IMAGE_MODEL,
    image: images,
    prompt,
    quality: IMAGE_QUALITY,
    size: "1024x1536",
  };

  // input_fidelity는 gpt-image-1에서만 지원 (mini는 미지원)
  if (IMAGE_MODEL === "gpt-image-1") {
    editParams.input_fidelity = "high";
  }

  // edit()의 반환 타입은 스트림 union을 포함하므로 비스트림 응답 형태로 좁힌다
  const response = (await client.images.edit(editParams)) as {
    data?: Array<{ b64_json?: string }>;
  };

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI가 이미지를 생성하지 못했습니다");
  }

  return `data:image/png;base64,${b64}`;
}
