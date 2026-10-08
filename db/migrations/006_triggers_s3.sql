-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 006_triggers_s3.sql
-- Run AFTER 004_tables_s3.sql + 005_rls_s3.sql.
--
-- The skillsetu_set_updated_at() function was created in 002_triggers.sql.
-- This script attaches the updated_at trigger to all S3 tables that have
-- an updated_at column (questions, enrollments, notes, orders, etc.).
-- It is idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════

-- Ensure the trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION skillsetu_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to every table that has updated_at but doesn't yet have one.
-- Idempotent: uses DROP TRIGGER IF EXISTS first.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I;', tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION skillsetu_set_updated_at();',
      tbl
    );
  END LOOP;
END;
$$;
