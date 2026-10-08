-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 001_seed.sql
-- Run AFTER 003_rls.sql in the Supabase Dashboard SQL Editor.
--
-- This is DEMO / DEVELOPMENT seed data:
--   • RBAC roles + permissions
--   • One sample category (Office Skills) with EN + HI translations
--   • One sample course (Excel Fundamentals) with EN + HI translations
--   • One module, one lesson with blocks, in both languages
-- ═══════════════════════════════════════════════════════════

-- ── 1. ROLES ────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('super_admin',        'Full access to everything'),
  ('admin',              'Operational access'),
  ('editorial_manager',  'Manages content workflow and writers'),
  ('content_writer',     'Creates/edits assigned content'),
  ('reviewer',           'Reviews content'),
  ('translator',         'Translates assigned content'),
  ('quiz_editor',        'Creates/reviews questions'),
  ('commerce_manager',   'Books, products, orders'),
  ('marketing_manager',  'SEO, analytics, ads, affiliate'),
  ('analyst',            'Read-only analytics'),
  ('media_manager',      'Media management')
ON CONFLICT (name) DO NOTHING;

-- ── 2. PERMISSIONS ─────────────────────────────────────────
INSERT INTO permissions (name, description) VALUES
  ('course.read',         'Read courses'),
  ('course.create',       'Create courses'),
  ('course.update',       'Update courses'),
  ('course.publish',      'Publish/unpublish courses'),
  ('lesson.create',       'Create lessons'),
  ('lesson.update',       'Update lessons'),
  ('lesson.publish',      'Publish/unpublish lessons'),
  ('question.create',     'Create questions'),
  ('question.review',     'Review questions'),
  ('translation.edit',    'Edit translations'),
  ('translation.publish', 'Publish translations'),
  ('book.manage',         'Manage books and resources'),
  ('order.read',          'Read orders'),
  ('seo.manage',          'Manage SEO settings'),
  ('analytics.read',      'Read analytics'),
  ('settings.manage',     'Manage system settings'),
  ('users.manage',        'Manage users'),
  ('roles.manage',        'Manage roles and permissions'),
  ('audit.read',          'Read audit logs')
ON CONFLICT (name) DO NOTHING;

-- ── 3. SUPER_ADMIN gets ALL permissions ──────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN gets operational permissions (no roles.manage, no audit.read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON p.name IN (
  'course.read','course.create','course.update','course.publish',
  'lesson.create','lesson.update','lesson.publish',
  'question.create','question.review',
  'translation.edit','translation.publish',
  'book.manage','order.read','seo.manage','analytics.read','settings.manage'
)
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- SAMPLE CONTENT (demo only)
-- ═══════════════════════════════════════════════════════════

-- ── 4. CATEGORY: Office Skills ─────────────────────────────
INSERT INTO categories (id, slug, sort_order, status, published_at)
VALUES
  ('cafe0000-0000-0000-0000-000000000001', 'office-skills', 1, 'published', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Category translations (EN + HI)
INSERT INTO category_translations (category_id, language_code, name, description, status) VALUES
  ('cafe0000-0000-0000-0000-000000000001', 'en', 'Office Skills',
   'Master essential office software: Excel, Word, PowerPoint and more.', 'published'),
  ('cafe0000-0000-0000-0000-000000000001', 'hi', 'ऑफिस स्किल्स',
   'ज़रूरी ऑफिस सॉफ्टवेयर सीखें: Excel, Word, PowerPoint और भी बहुत कुछ।', 'published')
ON CONFLICT (category_id, language_code) DO NOTHING;

-- ── 5. COURSE: Excel Fundamentals ─────────────────────────
INSERT INTO courses (id, slug, status, difficulty, estimated_duration, default_language, published_at)
VALUES
  ('c0ffe000-0000-0000-0000-000000000001', 'excel-fundamentals', 'published',
   'beginner', 300, 'en', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Course ↔ Category
INSERT INTO course_categories (course_id, category_id) VALUES
  ('c0ffe000-0000-0000-0000-000000000001', 'cafe0000-0000-0000-0000-000000000001')
ON CONFLICT (course_id, category_id) DO NOTHING;

-- Course translations (EN + HI)
INSERT INTO course_translations (course_id, language_code, title, short_description, description, learning_outcomes, prerequisites, target_audience, status) VALUES
  ('c0ffe000-0000-0000-0000-000000000001', 'en',
   'Excel Fundamentals',
   'Learn Excel from scratch — cells, formulas, formatting and charts.',
   'A practical, beginner-friendly course that takes you from opening Excel for the first time to building your first real-world spreadsheet with formulas and charts.',
   '["Navigate the Excel interface confidently","Enter and format data","Write basic formulas (SUM, AVERAGE, COUNT)","Understand absolute and relative references","Create simple charts"]'::jsonb,
   '["Basic computer skills","A computer with Microsoft Excel or Excel Online"]'::jsonb,
   '["Students","Office workers","Job seekers","Anyone new to Excel"]'::jsonb,
   'published'),
  ('c0ffe000-0000-0000-0000-000000000001', 'hi',
   'एक्सेल मूल बातें',
   'Excel शुरुआत से सीखें — सेल, फ़ॉर्मूला, फ़ॉर्मेटिंग और चार्ट।',
   'एक व्यावहारिक, शुरुआती-अनुकूल कोर्स जो आपको Excel पहली बार खोलने से लेकर फ़ॉर्मूला और चार्ट के साथ अपनी पहली वास्तविक स्प्रेडशीट बनाने तक ले जाता है।',
   '["Excel इंटरफ़ेस को आत्मविश्वास से नेविगेट करें","डेटा दर्ज करें और फ़ॉर्मेट करें","बुनियादी फ़ॉर्मूले लिखें (SUM, AVERAGE, COUNT)","Abs और Relative संदर्भ समझें","सरल चार्ट बनाएं"]'::jsonb,
   '["बुनियादी कंप्यूटर ज्ञान","Microsoft Excel या Excel Online वाला कंप्यूटर"]'::jsonb,
   '["छात्र","ऑफिस कर्मचारी","नौकरी तलाशने वाले","Excel में नए लोग"]'::jsonb,
   'published')
ON CONFLICT (course_id, language_code) DO NOTHING;

-- ── 6. MODULE: Getting Started ───────────────────────────
INSERT INTO modules (id, course_id, slug, sort_order, status, published_at)
VALUES
  ('b0b00000-0000-0000-0000-000000000001', 'c0ffe000-0000-0000-0000-000000000001',
   'getting-started', 1, 'published', NOW())
ON CONFLICT (course_id, slug) DO NOTHING;

-- Module translations
INSERT INTO module_translations (module_id, language_code, title, description, status) VALUES
  ('b0b00000-0000-0000-0000-000000000001', 'en', 'Getting Started',
   'Install Excel and get familiar with the interface.', 'published'),
  ('b0b00000-0000-0000-0000-000000000001', 'hi', 'शुरुआत करना',
   'Excel इंस्टॉल करें और इंटरफ़ेस से परिचित हों।', 'published')
ON CONFLICT (module_id, language_code) DO NOTHING;

-- ── 7. LESSON: What is Excel? ─────────────────────────────
INSERT INTO lessons (id, module_id, slug, sort_order, lesson_type, status, duration_minutes, published_at)
VALUES
  ('1e580000-0000-0000-0000-000000000001', 'b0b00000-0000-0000-0000-000000000001',
   'what-is-excel', 1, 'article', 'published', 10, NOW())
ON CONFLICT (module_id, slug) DO NOTHING;

-- Lesson translations (EN + HI)
INSERT INTO lesson_translations (id, lesson_id, language_code, title, summary, status) VALUES
  ('1d000000-0000-0000-0000-000000000001', '1e580000-0000-0000-0000-000000000001',
   'en', 'What is Excel?', 'Understand what Excel is and why it is used worldwide.', 'published'),
  ('1d000000-0000-0000-0000-000000000002', '1e580000-0000-0000-0000-000000000001',
   'hi', 'Excel क्या है?', 'समझें कि Excel क्या है और इसका उपयोग क्यों किया जाता है।', 'published')
ON CONFLICT (lesson_id, language_code) DO NOTHING;

-- ── 8. LESSON BLOCKS (EN) ─────────────────────────────────
INSERT INTO lesson_blocks (lesson_translation_id, block_type, sort_order, data) VALUES
  ('1d000000-0000-0000-0000-000000000001', 'heading', 1,
   '{"level":2,"text":"What is Excel?"}'::jsonb),
  ('1d000000-0000-0000-0000-000000000001', 'paragraph', 2,
   '{"text":"Microsoft Excel is a spreadsheet application used to organise, calculate, analyse and visualise data. It is one of the most widely used office tools in the world."}'::jsonb),
  ('1d000000-0000-0000-0000-000000000001', 'callout', 3,
   '{"variant":"info","title":"Did you know?","text":"Over a billion people use Excel worldwide."}'::jsonb),
  ('1d000000-0000-0000-0000-000000000001', 'heading', 4,
   '{"level":2,"text":"What can you do with Excel?"}'::jsonb),
  ('1d000000-0000-0000-0000-000000000001', 'paragraph', 5,
   '{"text":"Excel is used for budgeting, data analysis, project planning, inventory tracking, financial modelling and much more."}'::jsonb),
  ('1d000000-0000-0000-0000-000000000001', 'checklist', 6,
   '{"items":["Open Excel and create a new blank workbook","Identify the ribbon, formula bar and cell grid","Type text in a cell and press Enter"]}'::jsonb),
  ('1d000000-0000-0000-0000-000000000001', 'callout', 7,
   '{"variant":"summary","title":"Summary","text":"Excel is a spreadsheet tool for organising and analysing data. In the next lesson, we will explore the Excel interface in detail."}'::jsonb)
ON CONFLICT DO NOTHING;

-- ── 9. LESSON BLOCKS (HI) ─────────────────────────────────
INSERT INTO lesson_blocks (lesson_translation_id, block_type, sort_order, data) VALUES
  ('1d000000-0000-0000-0000-000000000002', 'heading', 1,
   '{"level":2,"text":"Excel क्या है?"}'::jsonb),
  ('1d000000-0000-0000-0000-000000000002', 'paragraph', 2,
   '{"text":"Microsoft Excel एक स्प्रेडशीट एप्लिकेशन है जिसका उपयोग डेटा को व्यवस्थित करने, गणना करने, विश्लेषण करने और दृश्य रूप में प्रस्तुत करने के लिए किया जाता है। यह दुनिया में सबसे व्यापक रूप से उपयोग किए जाने वाले ऑफिस टूल्स में से एक है।"}'::jsonb),
  ('1d000000-0000-0000-0000-000000000002', 'callout', 3,
   '{"variant":"info","title":"क्या आप जानते हैं?","text":"दुनिया भर में एक अरब से अधिक लोग Excel का उपयोग करते हैं।"}'::jsonb),
  ('1d000000-0000-0000-0000-000000000002', 'heading', 4,
   '{"level":2,"text":"Excel से क्या कर सकते हैं?"}'::jsonb),
  ('1d000000-0000-0000-0000-000000000002', 'paragraph', 5,
   '{"text":"Excel का उपयोग बजट बनाने, डेटा विश्लेषण, परियोजना योजना, इन्वेंट्री ट्रैकिंग, वित्तीय मॉडलिंग और बहुत कुछ के लिए किया जाता है।"}'::jsonb),
  ('1d000000-0000-0000-0000-000000000002', 'checklist', 6,
   '{"items":["Excel खोलें और एक नई खाली वर्कबुक बनाएं","रिबन, फ़ॉर्मूला बार और सेल ग्रिड को पहचानें","किसी सेल में टेक्स्ट टाइप करें और Enter दबाएं"]}'::jsonb),
  ('1d000000-0000-0000-0000-000000000002', 'callout', 7,
   '{"variant":"summary","title":"सारांश","text":"Excel डेटा को व्यवस्थित और विश्लेषित करने के लिए एक स्प्रेडशीट टूल है। अगले पाठ में, हम Excel इंटरफ़ेस का विस्तार से पता लगाएंगे।"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- END OF SEED
-- ═══════════════════════════════════════════════════════════
