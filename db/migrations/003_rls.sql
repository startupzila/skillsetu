-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 003_rls.sql
-- Run AFTER 002_triggers.sql in the Supabase Dashboard SQL Editor.
--
-- RLS Policy model:
--   • Published content:  public read (anon + authenticated)
--   • Drafts / unpublished:  service-role only (no public policy)
--   • profiles:  users read/update their own row only
--   • roles / permissions:  service-role only (no public read)
--   • user_roles / role_permissions:  users read their own only
-- ═══════════════════════════════════════════════════════════

-- ── profiles: self-read + self-update ──────────────────────
CREATE POLICY "profiles_self_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow new profile inserts (trigger creates them with service role,
-- but explicit policy is safe for future direct inserts).
CREATE POLICY "profiles_self_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── roles / permissions: no public read (service-role only) ─
-- No policies = blocked for anon/authenticated. Only service role bypasses RLS.

-- ── user_roles: self-read ──────────────────────────────────
CREATE POLICY "user_roles_self_select"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- ── role_permissions: no public read ───────────────────────

-- ── categories: public read published ──────────────────────
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (status = 'published');

-- ── category_translations: public read published ──────────
CREATE POLICY "category_translations_public_read"
  ON category_translations FOR SELECT
  USING (status = 'published');

-- ── skills: public read published ─────────────────────────
CREATE POLICY "skills_public_read"
  ON skills FOR SELECT
  USING (status = 'published');

-- ── tags: public read (all tags are visible) ──────────────
CREATE POLICY "tags_public_read"
  ON tags FOR SELECT
  USING (true);

-- ── course_tags / lesson_tags: public read (junctions) ────
CREATE POLICY "course_tags_public_read"
  ON course_tags FOR SELECT
  USING (true);

CREATE POLICY "lesson_tags_public_read"
  ON lesson_tags FOR SELECT
  USING (true);

-- ── courses: public read published ─────────────────────────
CREATE POLICY "courses_public_read"
  ON courses FOR SELECT
  USING (status = 'published');

-- ── course_translations: public read published ─────────────
CREATE POLICY "course_translations_public_read"
  ON course_translations FOR SELECT
  USING (status = 'published');

-- ── course_categories: public read ─────────────────────────
CREATE POLICY "course_categories_public_read"
  ON course_categories FOR SELECT
  USING (true);

-- ── course_authors: public read ───────────────────────────
CREATE POLICY "course_authors_public_read"
  ON course_authors FOR SELECT
  USING (true);

-- ── modules: public read published ────────────────────────
CREATE POLICY "modules_public_read"
  ON modules FOR SELECT
  USING (status = 'published');

-- ── module_translations: public read published ─────────────
CREATE POLICY "module_translations_public_read"
  ON module_translations FOR SELECT
  USING (status = 'published');

-- ── lessons: public read published ─────────────────────────
CREATE POLICY "lessons_public_read"
  ON lessons FOR SELECT
  USING (status = 'published');

-- ── lesson_translations: public read published ─────────────
CREATE POLICY "lesson_translations_public_read"
  ON lesson_translations FOR SELECT
  USING (status = 'published');

-- ── lesson_blocks: public read (if parent translation is published) ──
CREATE POLICY "lesson_blocks_public_read"
  ON lesson_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lesson_translations lt
      WHERE lt.id = lesson_blocks.lesson_translation_id
        AND lt.status = 'published'
    )
  );

-- ── media_assets: public read (images/thumbnails visible) ──
CREATE POLICY "media_assets_public_read"
  ON media_assets FOR SELECT
  USING (true);

-- ── media_usages: public read ──────────────────────────────
CREATE POLICY "media_usages_public_read"
  ON media_usages FOR SELECT
  USING (true);
