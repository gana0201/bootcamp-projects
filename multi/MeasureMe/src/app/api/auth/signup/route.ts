import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-me");

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, rememberMe } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "모든 필드를 입력하세요" }, { status: 400 });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다" }, { status: 409 });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      "INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)",
      [id, name, email, passwordHash]
    );

    const token = await new SignJWT({ userId: id, name, email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(rememberMe ? "7d" : "12h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, user: { name, email } });

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
      cookieOptions.maxAge = 60 * 60 * 24 * 7;
    }

    response.cookies.set("auth-token", token, cookieOptions);

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "회원가입 실패" }, { status: 500 });
  }
}
