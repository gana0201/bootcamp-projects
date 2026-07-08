import { Pool } from "pg";

// PostgreSQL 연결 풀
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface Analysis {
  id: string;
  userId: string;
  imageUrl: string;
  garmentData: GarmentData;
  report: StyleReport | null;
  bodyAnalysis: object | null;
  createdAt: string;
}

export interface GarmentData {
  name: string;
  category: string;
  measurements: {
    [key: string]: number;
  };
}

export interface StyleReport {
  fitAnalysis: string;
  sizeRecommendation: string;
  fitScore: number;
  details: {
    shoulder: string;
    chest: string;
    waist: string;
    length: string;
    [key: string]: string;
  };
  styling: string[];
  cautions: string[];
}

// 테이블 초기화
export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
        image_url TEXT NOT NULL,
        garment_data JSONB NOT NULL,
        body_analysis JSONB,
        report JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
    `);
  } finally {
    client.release();
  }
}

export async function saveAnalysis(analysis: Analysis): Promise<Analysis> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO analyses (id, user_id, image_url, garment_data, body_analysis, report, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        analysis.id,
        analysis.userId,
        analysis.imageUrl,
        JSON.stringify(analysis.garmentData),
        JSON.stringify(analysis.bodyAnalysis),
        JSON.stringify(analysis.report),
        analysis.createdAt,
      ]
    );
    return analysis;
  } finally {
    client.release();
  }
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM analyses WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return rowToAnalysis(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getAnalysesByUser(userId: string): Promise<Analysis[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map(rowToAnalysis);
  } finally {
    client.release();
  }
}

function rowToAnalysis(row: Record<string, unknown>): Analysis {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    imageUrl: row.image_url as string,
    garmentData: row.garment_data as GarmentData,
    bodyAnalysis: row.body_analysis as object | null,
    report: row.report as StyleReport | null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}
