import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-me");

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호를 입력하세요" }, { status: 400 });
    }

    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다" }, { status: 401 });
    }

    const token = await new SignJWT({ userId: user.id, name: user.name, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(rememberMe ? "7d" : "12h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, user: { name: user.name, email: user.email } });

    // rememberMe: 7일 유지, 아니면 세션 쿠키 (브라우저 닫으면 삭제)
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: "lax";
      path: string;
      maxAge?: number;
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };

    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 7; // 7 days
    }
    // maxAge 미설정 시 세션 쿠키 → 브라우저 종료 시 삭제

    response.cookies.set("auth-token", token, cookieOptions);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "로그인 실패" }, { status: 500 });
  }
}
