import { NextRequest, NextResponse } from "next/server";
import { createUser, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "이메일, 비밀번호, 이름을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상이어야 합니다" },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);
    const token = await createToken(user);

    const response = NextResponse.json({ success: true, user });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("duplicate key")
    ) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다" },
        { status: 409 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
