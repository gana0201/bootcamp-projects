import { NextRequest, NextResponse } from "next/server";
import { virtualTryOn, checkWearability } from "@/lib/openaiImage";
import { predictBodyMeasurements } from "@/lib/bodyPredict";

export interface FitContext {
  // 의류 실측값 (cm) — GarmentInput.measurements
  garmentMeasurements?: Record<string, number>;
  // AI 추정 신체 치수 (cm) — BodyAnalysis.estimatedMeasurements
  estimatedBodyMeasurements?: {
    shoulderWidth?: string;
    chestCircumference?: string;
    waistCircumference?: string;
    hipCircumference?: string;
  };
  // 의류 카테고리
  category?: string;
  // 실측값 없을 때 대체 표시용 추천 사이즈
  sizeRecommendation?: string;
  // 키(cm) — 총장 기준 판단용
  height?: number;
  // IPYNB 모델 직접 예측값 (cm) — estimatedBodyMeasurements 보완용
  predictedBodyMeasurements?: {
    chest: number;
    waist: number;
    hip: number;
    shoulderWidth: number;
    armLength: number;
    legLength: number;
  };
}

interface TryOnRequestBody {
  humanImageUrl: string;
  garmentImageUrl: string;
  fitContext?: FitContext;
  // 클라이언트에서 직접 프로필 전달 시 모델 예측값 자동 계산
  profile?: {
    height?: string;
    weight?: string;
    gender?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { humanImageUrl, garmentImageUrl, fitContext, profile } =
      (await request.json()) as TryOnRequestBody;

    if (!humanImageUrl || !garmentImageUrl) {
      return NextResponse.json({ error: "이미지 URL이 필요합니다" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ resultImageUrl: humanImageUrl, mock: true });
    }

    // fitContext에 IPYNB 모델 예측값 보강
    let enrichedContext: FitContext = fitContext ?? {};

    // 프로필이 전달된 경우 → 모델 예측값 계산하여 주입
    if (profile?.height && profile?.weight && profile?.gender) {
      const h = Number(profile.height);
      const w = Number(profile.weight);
      const g = profile.gender === "male" ? "M" : "F";
      if (h > 0 && w > 0) {
        const predicted = predictBodyMeasurements(h, w, g);
        enrichedContext = {
          ...enrichedContext,
          height: enrichedContext.height ?? h,
          predictedBodyMeasurements: predicted,
          // estimatedBodyMeasurements가 없으면 모델 예측값으로 자동 채움
          estimatedBodyMeasurements: enrichedContext.estimatedBodyMeasurements ?? {
            shoulderWidth:     String(predicted.shoulderWidth),
            chestCircumference: String(predicted.chest),
            waistCircumference: String(predicted.waist),
            hipCircumference:   String(predicted.hip),
          },
        };
      }
    }

    // 착용 가능 여부 사전 검사
    const wearability = checkWearability(enrichedContext);
    if (!wearability.wearable) {
      return NextResponse.json(
        { error: `가상 피팅 불가 — ${wearability.reason}` },
        { status: 422 }
      );
    }

    const resultImageUrl = await virtualTryOn(
      humanImageUrl,
      garmentImageUrl,
      enrichedContext
    );
    return NextResponse.json({ resultImageUrl });
  } catch (error) {
    console.error("Try-on error:", error);
    const message = error instanceof Error ? error.message : "가상 피팅 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
