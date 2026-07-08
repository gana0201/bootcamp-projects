import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  try {
    const result = await query(
      "SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [user.userId]
    );

    const analyses = result.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      bodyAnalysis: row.body_analysis,
      garmentData: row.garment_data,
      report: row.report,
      imageUrl: row.image_url,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "기록 조회 실패" }, { status: 500 });
  }
}
