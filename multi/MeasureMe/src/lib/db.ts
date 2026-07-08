import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function saveAnalysis(data: {
  id: string;
  userId: string;
  imageUrl: string;
  garmentData: unknown;
  bodyAnalysis: unknown;
  report: unknown;
  createdAt: string;
}) {
  try {
    await query(
      `INSERT INTO analyses (id, user_id, image_url, garment_data, body_analysis, report, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        data.id,
        data.userId,
        data.imageUrl,
        JSON.stringify(data.garmentData),
        JSON.stringify(data.bodyAnalysis),
        JSON.stringify(data.report),
        data.createdAt,
      ]
    );
  } catch (error) {
    console.error("Failed to save analysis:", error);
  }
}
