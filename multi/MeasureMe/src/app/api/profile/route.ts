import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  try {
    const result = await query(
      "SELECT name, email, height, weight, gender, created_at FROM users WHERE id = $1",
      [user.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    const row = result.rows[0];
    return NextResponse.json({
      profile: {
        name: row.name,
        email: row.email,
        height: row.height ? Number(row.height) : null,
        weight: row.weight ? Number(row.weight) : null,
        gender: row.gender || null,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "프로필 조회 실패" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  try {
    const { height, weight, gender } = await request.json();

    await query(
      "UPDATE users SET height = $1, weight = $2, gender = $3 WHERE id = $4",
      [height || null, weight || null, gender || null, user.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "프로필 수정 실패" }, { status: 500 });
  }
}
