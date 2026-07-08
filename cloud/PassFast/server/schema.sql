-- ============================================
-- PassFast Database Schema
-- PostgreSQL
-- ============================================

-- 자격증 카탈로그 (마스터 데이터)
CREATE TABLE IF NOT EXISTS catalog (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(50) DEFAULT 'monitor',
  description TEXT,
  passing_score INTEGER DEFAULT 60,
  total_questions INTEGER DEFAULT 100,
  exam_time INTEGER DEFAULT 150
);

-- 시험 과목 (자격증별 세부 과목)
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  cert_id VARCHAR(50) NOT NULL REFERENCES catalog(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_subjects_cert_id ON subjects(cert_id);

-- 문제 데이터
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  cert_id VARCHAR(50) NOT NULL REFERENCES catalog(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  answer INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 보관함 (목표 자격증)
CREATE TABLE IF NOT EXISTS vault (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  cert_id VARCHAR(50) NOT NULL REFERENCES catalog(id) ON DELETE CASCADE,
  target_date DATE,
  target_time VARCHAR(5),
  target_score INTEGER DEFAULT 85,
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, cert_id)
);

-- 퀴즈 결과 히스토리
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  cert_id VARCHAR(50) NOT NULL REFERENCES catalog(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  score_percent INTEGER NOT NULL,
  passed BOOLEAN DEFAULT FALSE,
  answers JSONB,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_questions_cert_id ON questions(cert_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_cert_id ON quiz_results(cert_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_user_id ON vault(user_id);

-- 문제 스크랩/즐겨찾기
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question_id ON bookmarks(question_id);
