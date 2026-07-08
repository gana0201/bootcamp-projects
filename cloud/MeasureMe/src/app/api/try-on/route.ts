import { NextRequest, NextResponse } from "next/server";
import { virtualTryOn } from "@/lib/replicate";

const MOCK_MODE = !process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_MOCK === "true";

export async function POST(request: NextRequest) {
  try {
    const { humanImageUrl, garmentImageUrl } = await request.json();

    if (!humanImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: "전신 사진과 의류 사진이 모두 필요합니다" },
        { status: 400 }
      );
    }

    // Mock 모드: 실제 API 호출 없이 플로우 테스트
    if (MOCK_MODE) {
      // 원본 전신 사진을 그대로 반환 (UI 플로우 확인용)
      return NextResponse.json({
        success: true,
        resultImageUrl: humanImageUrl,
        mock: true,
        message: "Mock 모드: 실제 API 연동 시 합성 이미지가 표시됩니다",
      });
    }

    const resultImageUrl = await virtualTryOn(humanImageUrl, garmentImageUrl);

    return NextResponse.json({
      success: true,
      resultImageUrl,
    });
  } catch (error) {
    console.error("Try-on error:", error);
    return NextResponse.json(
      { error: "가상 피팅 생성 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
