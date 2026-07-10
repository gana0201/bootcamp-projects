import { NextRequest, NextResponse } from "next/server";
import { virtualTryOn } from "@/lib/openaiImage";

export interface FitContext {
  // 의류 실측값 (cm) - GarmentInput.measurements 그대로
  garmentMeasurements?: Record<string, number>;
  // AI가 추정한 신체 치수 (cm) - BodyAnalysis.estimatedMeasurements
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
}

export async function POST(request: NextRequest) {
  try {
    const { humanImageUrl, garmentImageUrl, fitContext } = await request.json() as {
      humanImageUrl: string;
      garmentImageUrl: string;
      fitContext?: FitContext;
    };

    if (!humanImageUrl || !garmentImageUrl) {
      return NextResponse.json({ error: "이미지 URL이 필요합니다" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ resultImageUrl: humanImageUrl, mock: true });
    }

    const resultImageUrl = await virtualTryOn(humanImageUrl, garmentImageUrl, fitContext);
    return NextResponse.json({ resultImageUrl });
  } catch (error) {
    console.error("Try-on error:", error);
    const message = error instanceof Error ? error.message : "가상 피팅 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
