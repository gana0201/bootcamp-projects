import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        image_url TEXT,
        garment_data JSONB,
        body_analysis JSONB,
        report JSONB,
        created_at TEXT
      )
    `);

    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("Init DB error:", error);
    return NextResponse.json({ error: "DB 초기화 실패" }, { status: 500 });
  }
}
