import { NextRequest, NextResponse } from "next/server";
import { virtualTryOn } from "@/lib/openaiImage";

export interface FitContext {
  fitScore?: number;           // 1~10
  sizeRecommendation?: string; // S, M, L ...
  bodyType?: string;
  fitAnalysis?: string;
  details?: Record<string, string>;
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

    // OpenAI API 키가 없으면 Mock 모드로 원본 이미지 반환
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        resultImageUrl: humanImageUrl,
        mock: true,
      });
    }

    const resultImageUrl = await virtualTryOn(humanImageUrl, garmentImageUrl, fitContext);
    return NextResponse.json({ resultImageUrl });
  } catch (error) {
    console.error("Try-on error:", error);
    const message = error instanceof Error ? error.message : "가상 피팅 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
