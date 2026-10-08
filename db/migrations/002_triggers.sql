-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 002_triggers.sql
-- Run AFTER 001_tables.sql in the Supabase Dashboard SQL Editor.
--
-- Contents:
--   1. updated_at trigger function (auto-updates updated_at on UPDATE)
--   2. Triggers on every table that has updated_at
--   3. profiles.id FK → auth.users(id) ON DELETE CASCADE
--   4. Auto-create a profile row when a new auth.users row is created
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

-- ── 5. Enable RLS on every table ──────────────────────────
-- Policies are defined in 003_rls.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usages ENABLE ROW LEVEL SECURITY;
