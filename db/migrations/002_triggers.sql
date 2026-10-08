-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 002_triggers.sql
-- Run AFTER 001_schema.sql.
--
-- Contents:
--   1. updated_at trigger function (auto-updates updated_at on UPDATE)
--   2. Triggers on every table that has updated_at (all 60 tables)
--   3. profiles.id FK → auth.users(id) ON DELETE CASCADE
--   4. Auto-create a profile row when a new auth.users row is created
--   5. Enable RLS on every public table (policies in 003_rls.sql)
-- ═══════════════════════════════════════════════════════════

-- ── 1. updated_at trigger function ─────────────────────────
CREATE OR REPLACE FUNCTION skillsetu_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 2. Triggers on all tables with updated_at ──────────────
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

-- ── 3. profiles.id → auth.users(id) FK ─────────────────────
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 4. Auto-create profile on signup ───────────────────────
CREATE OR REPLACE FUNCTION skillsetu_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION skillsetu_handle_new_user();

-- ── 5. Enable RLS on every public table ───────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END;
$$;
