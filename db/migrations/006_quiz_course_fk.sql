-- ═══════════════════════════════════════════════════════════
-- 006_quiz_course_fk.sql
-- Add quizzes.course_id column + FK to courses (was missing).
-- Add mock_tests.course_id FK to courses (column existed, FK was missing).
-- Fixes: "Could not find a relationship between 'quizzes' and 'courses'"
-- and "Could not find a relationship between 'mock_tests' and 'courses'"
-- in the console quiz/mock-test managers.
-- ═══════════════════════════════════════════════════════════

-- ── 1. quizzes.course_id column (was missing) ──
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "course_id" UUID;

-- ── 2. FK: quizzes.course_id → courses(id) ──
ALTER TABLE "quizzes"
  DROP CONSTRAINT IF EXISTS "quizzes_course_id_fkey";
ALTER TABLE "quizzes"
  ADD CONSTRAINT "quizzes_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 3. FK: mock_tests.course_id → courses(id) ──
ALTER TABLE "mock_tests"
  DROP CONSTRAINT IF EXISTS "mock_tests_course_id_fkey";
ALTER TABLE "mock_tests"
  ADD CONSTRAINT "mock_tests_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 4. Refresh PostgREST schema cache ──
NOTIFY pgrst, 'reload schema';
