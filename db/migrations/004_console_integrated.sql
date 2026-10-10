-- ═══════════════════════════════════════════════════════════
-- 004_console_integrated.sql
-- Integrated course editor + WYSIWYG content + lesson-attached
-- MCQ + QNA (descriptive) + orders↔profiles FK fix.
--
-- All statements are IDEMPOTENT (safe to re-run).
-- ═══════════════════════════════════════════════════════════

-- ── 1. Lesson video URL (language-agnostic, one YouTube link per lesson) ──
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "video_url" TEXT;

-- ── 2. Lesson rich-text content (HTML produced by the WYSIWYG editor) ──
--    Stored on the translation so each language can have its own body.
ALTER TABLE "lesson_translations" ADD COLUMN IF NOT EXISTS "content_html" TEXT;

-- ── 3. Descriptive / QNA question type ──
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'descriptive';

-- ── 4. Model answer for descriptive questions (HTML) ──
ALTER TABLE "question_translations" ADD COLUMN IF NOT EXISTS "model_answer" TEXT;

-- ── 5. Fix orphan FKs so questions/quizzes can be joined to lessons ──
--    (PostgREST needs these to embed; also enables ON DELETE CASCADE cleanup)
ALTER TABLE "questions"
  DROP CONSTRAINT IF EXISTS "questions_lesson_id_fkey";
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_lesson_id_fkey"
  FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quizzes"
  DROP CONSTRAINT IF EXISTS "quizzes_lesson_id_fkey";
ALTER TABLE "quizzes"
  ADD CONSTRAINT "quizzes_lesson_id_fkey"
  FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 6. Fix the orders↔profiles relationship (root cause of the console bug) ──
ALTER TABLE "orders"
  DROP CONSTRAINT IF EXISTS "orders_user_id_fkey";
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 7. updated_at on question_options (was missing; keeps audit consistent) ──
ALTER TABLE "question_options" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── 8. Refresh Supabase schema cache so PostgREST sees the new FKs/columns ──
--    (NOTIFY reloads the PostgREST schema cache immediately)
NOTIFY pgrst, 'reload schema';
