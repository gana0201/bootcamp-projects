import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "measureme-secret-key-change-in-production"
);

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// 회원가입
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING id, email, name, created_at`,
      [id, email, passwordHash, name]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at.toISOString(),
    };
  } finally {
    client.release();
  }
}

// 로그인 검증
export async function verifyUser(
  email: string,
  password: string
): Promise<User | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, email, password_hash, name, created_at FROM users WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at.toISOString(),
    };
  } finally {
    client.release();
  }
}

// JWT 토큰 생성
export async function createToken(user: User): Promise<string> {
  return new SignJWT({ userId: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

// JWT 토큰 검증
export async function verifyToken(
  token: string
): Promise<{ userId: string; email: string; name: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string; name: string };
  } catch {
    return null;
  }
}

// 현재 로그인된 유저 가져오기
export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
