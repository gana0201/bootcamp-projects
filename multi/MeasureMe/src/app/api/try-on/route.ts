import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { humanImageUrl, garmentImageUrl } = await request.json();

    if (!humanImageUrl || !garmentImageUrl) {
      return NextResponse.json({ error: "이미지 URL이 필요합니다" }, { status: 400 });
    }

    // Mock mode: return the human image as the result
    return NextResponse.json({
      resultImageUrl: humanImageUrl,
      mock: true,
    });
  } catch (error) {
    console.error("Try-on error:", error);
    return NextResponse.json({ error: "가상 피팅 실패" }, { status: 500 });
  }
}
