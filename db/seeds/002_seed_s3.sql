-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 002_seed_s3.sql
-- Run AFTER 006_triggers_s3.sql (and after 001_seed.sql from S2).
--
-- Demo / development seed data for S3 tables:
--   • 1 sample question (single-choice) with EN + HI translations + 4 options
--   • 1 quiz linked to the sample lesson, containing the question
--   • 1 sample book product (Excel Practice Workbook)
--   • 1 coupon (WELCOME10 — 10% off)
--   • 1 course-book link
-- ═══════════════════════════════════════════════════════════

-- ── 1. SAMPLE QUESTION ────────────────────────────────────
-- Links to the S2 seed lesson l0000000-...-000001 (What is Excel?)
INSERT INTO questions (id, slug, question_type, difficulty, status, lesson_id, published_at)
VALUES
  ('q0000000-0000-0000-0000-000000000001', 'what-is-excel-used-for',
   'single_choice', 'easy', 'published',
   'l0000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Question translations (EN + HI)
INSERT INTO question_translations (question_id, language_code, question_text, explanation, status) VALUES
  ('q0000000-0000-0000-0000-000000000001', 'en',
   'What is Microsoft Excel primarily used for?',
   'Excel is a spreadsheet application used to organise, calculate, analyse and visualise data.',
   'published'),
  ('q0000000-0000-0000-0000-000000000001', 'hi',
   'Microsoft Excel का मुख्य रूप से उपयोग किसके लिए किया जाता है?',
   'Excel एक स्प्रेडशीट एप्लिकेशन है जिसका उपयोग डेटा को व्यवस्थित करने, गणना करने, विश्लेषण करने और दृश्य रूप में प्रस्तुत करने के लिए किया जाता है।',
   'published')
ON CONFLICT (question_id, language_code) DO NOTHING;

-- Question options (4 options, text stored as JSONB per-language)
-- Option A (correct)
INSERT INTO question_options (id, question_id, sort_order, text, is_correct) VALUES
  ('o0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000001', 1,
   '{"en":"Organising and calculating data in spreadsheets","hi":"स्प्रेडशीट में डेटा को व्यवस्थित और गणना करना"}'::jsonb, true),
  ('o0000000-0000-0000-0000-000000000002', 'q0000000-0000-0000-0000-000000000001', 2,
   '{"en":"Editing videos","hi":"वीडियो संपादित करना"}'::jsonb, false),
  ('o0000000-0000-0000-0000-000000000003', 'q0000000-0000-0000-0000-000000000001', 3,
   '{"en":"Browsing the internet","hi":"इंटरनेट ब्राउज़ करना"}'::jsonb, false),
  ('o0000000-0000-0000-0000-000000000004', 'q0000000-0000-0000-0000-000000000001', 4,
   '{"en":"Sending emails","hi":"ईमेल भेजना"}'::jsonb, false)
ON CONFLICT DO NOTHING;

-- ── 2. SAMPLE QUIZ ───────────────────────────────────────
-- Linked to the sample lesson
INSERT INTO quizzes (id, slug, lesson_id, status, passing_score, published_at)
VALUES
  ('z0000000-0000-0000-0000-000000000001', 'excel-intro-quiz',
   'l0000000-0000-0000-0000-000000000001', 'published', 60, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Quiz translations
INSERT INTO quiz_translations (quiz_id, language_code, title, instructions, status) VALUES
  ('z0000000-0000-0000-0000-000000000001', 'en', 'Excel Basics Quiz',
   'Answer the following question to test your understanding.', 'published'),
  ('z0000000-0000-0000-0000-000000000001', 'hi', 'Excel मूल बातें प्रश्नोत्तरी',
   'अपनी समझ का परीक्षण करने के लिए निम्नलिखित प्रश्न का उत्तर दें।', 'published')
ON CONFLICT (quiz_id, language_code) DO NOTHING;

-- Link question to quiz
INSERT INTO quiz_questions (quiz_id, question_id, sort_order) VALUES
  ('z0000000-0000-0000-0000-000000000001', 'q0000000-0000-0000-0000-000000000001', 1)
ON CONFLICT (quiz_id, question_id) DO NOTHING;

-- ── 3. SAMPLE BOOK PRODUCT ────────────────────────────────
INSERT INTO products (id, slug, product_type, status, price_cents, currency, published_at)
VALUES
  ('p0000000-0000-0000-0000-000000000001', 'excel-practice-workbook', 'book',
   'published', 19900, 'INR', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Product variant (digital PDF download)
INSERT INTO product_variants (id, product_id, sku, name, price_cents, format, storage_path, is_default) VALUES
  ('v0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001',
   'EXCEL-WB-PDF-001', 'Excel Practice Workbook (PDF)', 19900, 'pdf',
   'downloads/excel-practice-workbook.pdf', true)
ON CONFLICT (sku) DO NOTHING;

-- Link book to the Excel Fundamentals course
INSERT INTO course_books (course_id, book_id, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 1)
ON CONFLICT (course_id, book_id) DO NOTHING;

-- ── 4. SAMPLE COUPON ─────────────────────────────────────
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_cents, usage_limit, starts_at, status)
VALUES
  ('WELCOME10', '10% off your first purchase', 'percentage', 10, 0, 100, NOW(), 'active')
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- END OF S3 SEED
-- ═══════════════════════════════════════════════════════════
