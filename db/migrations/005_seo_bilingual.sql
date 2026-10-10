-- ═══════════════════════════════════════════════════════════
-- 005_seo_bilingual.sql
-- Per-language SEO fields on course_translations + lesson_translations.
--
-- All statements are IDEMPOTENT (safe to re-run).
-- ═══════════════════════════════════════════════════════════

-- ── 1. Course translations: SEO fields (per-language) ──
ALTER TABLE "course_translations" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "course_translations" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
ALTER TABLE "course_translations" ADD COLUMN IF NOT EXISTS "seo_keywords" TEXT[];
ALTER TABLE "course_translations" ADD COLUMN IF NOT EXISTS "seo_faqs" JSONB;
ALTER TABLE "course_translations" ADD COLUMN IF NOT EXISTS "seo_intro_paragraph" TEXT;

-- ── 2. Lesson translations: SEO fields (per-language) ──
ALTER TABLE "lesson_translations" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;
ALTER TABLE "lesson_translations" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;

-- ── 3. Refresh PostgREST schema cache ──
NOTIFY pgrst, 'reload schema';
