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
 * AI 이미지 모델에 전달할 핏 지시문 생성.
 *
 * 핵심: 추상적 용어("슬림핏")만으로는 크기 차이를 반영 불가.
 * → 옷의 절대 치수와 신체 대비 비율(%)을 명시하여
 *   AI가 사이즈별 차이를 시각적으로 구분하도록 강제함.
 */
function buildFitInstruction(fitContext?: FitContext): string {
  const g = fitContext?.garmentMeasurements;
  const b = fitContext?.estimatedBodyMeasurements;
  const sizeRec = fitContext?.sizeRecommendation;
  const height = fitContext?.height;

  if (!g || Object.keys(g).length === 0) {
    return sizeRec
      ? `추천 사이즈 ${sizeRec}에 맞게 체형에 자연스럽게 착용된 모습으로 표현.`
      : `체형에 자연스럽게 맞는 핏으로 표현.`;
  }

  const lines: string[] = [];

  // ── 실측 수치 테이블 (AI에 절대값 직접 전달) ──
  lines.push("## 의류 실측 수치 (반드시 이 크기로 표현할 것)");
  if (g["총장"]) lines.push(`- 총장: ${g["총장"]}cm`);
  if (g["어깨너비"]) lines.push(`- 어깨너비: ${g["어깨너비"]}cm`);
  if (g["가슴단면"]) lines.push(`- 가슴단면: ${g["가슴단면"]}cm (둘레 ${g["가슴단면"] * 2}cm)`);
  if (g["소매길이"]) lines.push(`- 소매길이: ${g["소매길이"]}cm`);
  if (g["허리단면"]) lines.push(`- 허리단면: ${g["허리단면"]}cm (둘레 ${g["허리단면"] * 2}cm)`);
  if (g["엉덩이단면"]) lines.push(`- 엉덩이단면: ${g["엉덩이단면"]}cm`);

  // ── 신체 대비 비율 계산 (핵심: 여유분 %) ──
  if (b) {
    lines.push("");
    lines.push("## 신체 대비 옷 크기 비율 (이 비율대로 시각 표현)");

    if (g["가슴단면"] && b.chestCircumference) {
      const bodyChest = parseFloat(b.chestCircumference);
      const garmentChest = g["가슴단면"] * 2;
      const ratio = ((garmentChest / bodyChest) * 100).toFixed(0);
      const ease = garmentChest - bodyChest;
      lines.push(`- 가슴: 옷둘레 ${garmentChest}cm / 신체 ${bodyChest.toFixed(0)}cm = ${ratio}% (여유분 ${ease > 0 ? "+" : ""}${ease.toFixed(0)}cm)`);
      if (ease < -6) lines.push("  → 가슴이 옷보다 크므로 옷이 몸에 바짝 달라붙어 당겨지는 모습");
      else if (ease < 0) lines.push("  → 옷이 살짝 타이트하게 밀착, 몸 라인이 드러남");
      else if (ease < 8) lines.push("  → 적절한 여유, 자연스럽게 떨어짐");
      else lines.push("  → 상당한 여유로 옷이 몸에서 떠 있는 실루엣");
    }

    if (g["어깨너비"] && b.shoulderWidth) {
      const bodyShoulder = parseFloat(b.shoulderWidth);
      const garmentShoulder = g["어깨너비"];
      const diff = garmentShoulder - bodyShoulder;
      lines.push(`- 어깨: 옷 ${garmentShoulder}cm / 신체 ${bodyShoulder.toFixed(0)}cm (차이 ${diff > 0 ? "+" : ""}${diff.toFixed(0)}cm)`);
      if (diff < -2) lines.push("  → 어깨솔기가 어깨 안쪽에 위치, 어깨가 옷에 걸리는 모습");
      else if (diff < 4) lines.push("  → 어깨솔기가 어깨끝과 일치");
      else lines.push("  → 드롭숄더 — 어깨솔기가 팔 위쪽으로 내려옴");
    }

    if (g["허리단면"] && b.waistCircumference) {
      const bodyWaist = parseFloat(b.waistCircumference);
      const garmentWaist = g["허리단면"] * 2;
      const ease = garmentWaist - bodyWaist;
      lines.push(`- 허리: 옷둘레 ${garmentWaist}cm / 신체 ${bodyWaist.toFixed(0)}cm (여유분 ${ease > 0 ? "+" : ""}${ease.toFixed(0)}cm)`);
    }
  }

  // ── 기장 vs 키 비율 ──
  if (g["총장"] && height) {
    lines.push("");
    const lengthRatio = ((g["총장"] / height) * 100).toFixed(1);
    lines.push(`## 기장 비율: 총장 ${g["총장"]}cm / 키 ${height}cm = ${lengthRatio}%`);
    const ratio = g["총장"] / height;
    if (ratio < 0.35) lines.push("→ 매우 짧은 크롭 기장 — 배꼽 위. 복부가 보여야 함");
    else if (ratio < 0.38) lines.push("→ 크롭 기장 — 배꼽 근처. 하복부 일부 노출");
    else if (ratio < 0.42) lines.push("→ 허리 아래~벨트라인 기장. 일반적 상의 길이");
    else if (ratio < 0.47) lines.push("→ 엉덩이 윗부분까지 덮는 긴 기장");
    else lines.push("→ 엉덩이 아래까지 내려오는 롱 기장");
  }

  // ── 소매 길이 ──
  if (g["소매길이"]) {
    const s = g["소매길이"];
    if (s < 30) lines.push(`\n소매: ${s}cm — 민소매~캡소매`);
    else if (s < 45) lines.push(`\n소매: ${s}cm — 반팔 (팔꿈치 위)`);
    else if (s < 54) lines.push(`\n소매: ${s}cm — 7부 소매 (팔꿈치~손목 사이)`);
    else if (s < 62) lines.push(`\n소매: ${s}cm — 긴 소매 (손목 근처)`);
    else lines.push(`\n소매: ${s}cm — 손목 아래로 내려오는 긴 소매`);
  }

  // ── 종합 핏 키워드 ──
  lines.push("");
  lines.push("## 종합 핏 지시");

  // 전체적인 사이즈 판단
  let overallFit = "레귤러핏";
  if (g["가슴단면"] && b?.chestCircumference) {
    const ease = g["가슴단면"] * 2 - parseFloat(b.chestCircumference);
    if (ease < -6) overallFit = "스킨핏 — 옷이 몸에 꽉 끼는 모습";
    else if (ease < -1) overallFit = "슬림핏 — 옷이 몸에 밀착, 약간 당겨지는 모습";
    else if (ease < 6) overallFit = "레귤러핏 — 자연스러운 여유";
    else if (ease < 14) overallFit = "루즈핏 — 옷이 몸에서 떠있고 실루엣이 넓음";
    else overallFit = "오버사이즈 — 옷이 매우 크게 걸쳐진 헐렁한 실루엣";
  }
  lines.push(`전체 핏: ${overallFit}`);
  lines.push("※ 위 수치와 비율을 반드시 이미지에 시각적으로 반영하세요.");
  lines.push("※ 같은 옷이라도 사이즈가 작으면 더 짧고 타이트하게, 크면 더 길고 헐렁하게 보여야 합니다.");

  return lines.join("\n");
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

중요: 아래 의류의 실측 수치와 신체 대비 비율을 **정확히** 반영하여 이미지를 생성하세요.
사이즈가 작은 옷은 반드시 짧고 타이트하게, 큰 옷은 길고 헐렁하게 표현해야 합니다.

${fitInstruction}

필수 규칙:
- 사람의 얼굴, 피부톤, 헤어스타일, 체형을 그대로 유지
- 의류의 색상, 패턴, 소재감, 디자인 디테일을 정확히 반영
- 배경과 조명은 원본 사람 사진과 동일하게 유지
- 위 수치대로 옷의 크기감(총장, 폭, 소매길이)을 사실적으로 표현
- 사진처럼 사실적으로(photorealistic) 표현할 것`;

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
