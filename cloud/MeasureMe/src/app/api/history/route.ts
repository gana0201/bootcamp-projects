import { NextResponse } from "next/server";
import { getAnalysesByUser } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const analyses = await getAnalysesByUser(user.userId);
    return NextResponse.json({ success: true, data: analyses });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "이력 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
