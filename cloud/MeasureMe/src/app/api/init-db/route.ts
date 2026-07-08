import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";

export async function GET() {
  try {
    await initDB();
    return NextResponse.json({ success: true, message: "DB 초기화 완료" });
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json(
      { error: "DB 초기화 실패", details: String(error) },
      { status: 500 }
    );
  }
}
