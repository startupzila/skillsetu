-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 005_rls_s3.sql
-- Run AFTER 004_tables_s3.sql in the Supabase Dashboard SQL Editor.
--
-- RLS policies for S3 tables:
--   • Assessment (published questions/quizzes/tests): public read
--   • Learner (enrollments, progress, bookmarks, notes): self only
--   • Editorial (assignments, reviews, revisions, comments, translation_tasks): service-role only
--   • Commerce (products, orders, payments, coupons, entitlements): public read published products;
--     orders/payments/entitlements self only; coupons service-role only
--   • SEO/Ops (seo_metadata, redirects, ad_slots, affiliate_links, custom_code, notifications,
--     system_settings): seo_metadata/redirects public read active; notifications self; rest service-role
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all S3 tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ── ASSESSMENT: public read published ─────────────────────

-- Questions: public read only published (correct answers never exposed via RLS,
-- but the service layer must also strip is_correct from options in public responses)
CREATE POLICY "questions_public_read"
  ON questions FOR SELECT
  USING (status = 'published');

CREATE POLICY "question_translations_public_read"
  ON question_translations FOR SELECT
  USING (status = 'published');

-- Question options: public read only if the parent question is published
CREATE POLICY "question_options_public_read"
  ON question_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_options.question_id AND q.status = 'published'
    )
  );

-- Quizzes / tests: public read published
CREATE POLICY "quizzes_public_read"
  ON quizzes FOR SELECT
  USING (status = 'published');

CREATE POLICY "quiz_translations_public_read"
  ON quiz_translations FOR SELECT
  USING (status = 'published');

CREATE POLICY "quiz_questions_public_read"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_questions.quiz_id AND status = 'published')
  );

CREATE POLICY "mock_tests_public_read"
  ON mock_tests FOR SELECT
  USING (status = 'published');

CREATE POLICY "test_translations_public_read"
  ON test_translations FOR SELECT
  USING (status = 'published');

CREATE POLICY "test_questions_public_read"
  ON test_questions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM mock_tests WHERE id = test_questions.test_id AND status = 'published')
  );

-- ── ASSESSMENT: attempts (self only) ──────────────────────
-- A user can read/create/update only their own attempts.
CREATE POLICY "attempts_self_select"
  ON attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "attempts_self_insert"
  ON attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attempts_self_update"
  ON attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Attempt answers: self only (via parent attempt ownership)
CREATE POLICY "attempt_answers_self_select"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid())
  );

CREATE POLICY "attempt_answers_self_insert"
  ON attempt_answers FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid())
  );

-- ── LEARNER: self only ───────────────────────────────────

-- Enrollments
CREATE POLICY "enrollments_self_select"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "enrollments_self_insert"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enrollments_self_update"
  ON enrollments FOR UPDATE
  USING (auth.uid() = user_id);

-- Lesson progress
CREATE POLICY "lesson_progress_self_select"
  ON lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "lesson_progress_self_insert"
  ON lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lesson_progress_self_update"
  ON lesson_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Bookmarks
CREATE POLICY "bookmarks_self_select"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_self_insert"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_self_delete"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Notes (private by default)
CREATE POLICY "notes_self_select"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notes_self_insert"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_self_update"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "notes_self_delete"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

-- ── EDITORIAL: service-role only (no public policies) ────
-- assignments, reviews, revisions, editorial_comments, translation_tasks, audit_logs
-- → no SELECT/INSERT/UPDATE/DELETE policies = blocked for anon/authenticated.
-- Only the service-role admin client bypasses RLS (server-side, behind permission checks).

-- ── COMMERCE ────────────────────────────────────────────

-- Products: public read published (price + metadata visible)
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (status = 'published');

CREATE POLICY "product_variants_public_read"
  ON product_variants FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM products WHERE id = product_variants.product_id AND status = 'published')
  );

-- Junction tables (course_products, course_books, lesson_books): public read
CREATE POLICY "course_products_public_read"
  ON course_products FOR SELECT
  USING (true);

CREATE POLICY "course_books_public_read"
  ON course_books FOR SELECT
  USING (true);

CREATE POLICY "lesson_books_public_read"
  ON lesson_books FOR SELECT
  USING (true);

-- Orders: self only
CREATE POLICY "orders_self_select"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_self_insert"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order items: self only (via parent order ownership)
CREATE POLICY "order_items_self_select"
  ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );

-- Payments: self only (via parent order)
CREATE POLICY "payments_self_select"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE id = payments.order_id AND user_id = auth.uid())
  );

-- Entitlements: self only
CREATE POLICY "entitlements_self_select"
  ON entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Coupons: public read active+valid (so users can apply them at checkout)
-- But the full coupon details (usage limits, internal fields) stay service-role.
-- For MVP: no public read of coupons — validation happens server-side.
-- (No policy = blocked for anon/authenticated.)

-- ── SEO / OPS ───────────────────────────────────────────

-- SEO metadata: public read (needed for meta tags)
CREATE POLICY "seo_metadata_public_read"
  ON seo_metadata FOR SELECT
  USING (true);

-- Redirects: public read active only
CREATE POLICY "redirects_public_read"
  ON redirects FOR SELECT
  USING (is_active = true);

-- Ad slots: public read active (so the site can render ads)
CREATE POLICY "ad_slots_public_read"
  ON ad_slots FOR SELECT
  USING (is_active = true);

-- Affiliate links: public read active
CREATE POLICY "affiliate_links_public_read"
  ON affiliate_links FOR SELECT
  USING (is_active = true);

-- Custom code: public read active (head/body scripts must be readable to render)
CREATE POLICY "custom_code_public_read"
  ON custom_code FOR SELECT
  USING (is_active = true);

-- Notifications: self only
CREATE POLICY "notifications_self_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_self_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System settings: public read only if is_public = true
CREATE POLICY "system_settings_public_read"
  ON system_settings FOR SELECT
  USING (is_public = true);
