-- ═══════════════════════════════════════════════════════════
-- SkillSetu — 003_seed_extra_courses.sql
-- Run AFTER 001_seed.sql + 002_seed_s3.sql.
--
-- Additional demo courses + categories for richer public pages.
-- Adds: Digital Skills category, Word Fundamentals, PowerPoint
-- Fundamentals, Digital Marketing Basics, plus a second module to
-- the Excel course.
-- ═══════════════════════════════════════════════════════════

-- ── 1. CATEGORY: Digital Skills ─────────────────────────────
INSERT INTO categories (id, slug, sort_order, status, published_at)
VALUES
  ('cafe0000-0000-0000-0000-000000000002', 'digital-skills', 2, 'published', NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO category_translations (category_id, language_code, name, description, status) VALUES
  ('cafe0000-0000-0000-0000-000000000002', 'en', 'Digital Skills',
   'Master digital marketing, SEO, social media and AI tools.', 'published'),
  ('cafe0000-0000-0000-0000-000000000002', 'hi', 'डिजिटल स्किल्स',
   'डिजिटल मार्केटिंग, SEO, सोशल मीडिया और AI टूल्स में महारत हासिल करें।', 'published')
ON CONFLICT (category_id, language_code) DO NOTHING;

-- ── 2. COURSE: Word Fundamentals ─────────────────────────
INSERT INTO courses (id, slug, status, difficulty, estimated_duration, default_language, published_at)
VALUES
  ('c0ffe000-0000-0000-0000-000000000002', 'word-fundamentals', 'published',
   'beginner', 180, 'en', NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_categories (course_id, category_id) VALUES
  ('c0ffe000-0000-0000-0000-000000000002', 'cafe0000-0000-0000-0000-000000000001')
ON CONFLICT (course_id, category_id) DO NOTHING;

INSERT INTO course_translations (course_id, language_code, title, short_description, description, learning_outcomes, prerequisites, target_audience, status) VALUES
  ('c0ffe000-0000-0000-0000-000000000002', 'en',
   'Word Fundamentals',
   'Master Microsoft Word — formatting, styles, tables and documents.',
   'Learn to create professional documents with Microsoft Word. From basic text formatting to advanced styles, tables and templates, this course covers everything you need to work confidently with documents.',
   '["Create and format documents","Apply styles and themes","Insert tables, images and headers","Use templates effectively","Collaborate and track changes"]'::jsonb,
   '["Basic computer skills","A computer with Microsoft Word or Word Online"]'::jsonb,
   '["Students","Office workers","Writers","Anyone who creates documents"]'::jsonb,
   'published'),
  ('c0ffe000-0000-0000-0000-000000000002', 'hi',
   'वर्ड मूल बातें',
   'Microsoft Word में महारत — फ़ॉर्मेटिंग, स्टाइल, टेबल और दस्तावेज़।',
   'Microsoft Word के साथ पेशेवर दस्तावेज़ बनाना सीखें। बेसिक टेक्स्ट फ़ॉर्मेटिंग से लेकर एडवांस्ड स्टाइल, टेबल और टेम्पलेट तक, यह कोर्स दस्तावेज़ों के साथ आत्मविश्वास से काम करने के लिए सब कुछ कवर करता है।',
   '["दस्तावेज़ बनाएं और फ़ॉर्मेट करें","स्टाइल और थीम लागू करें","टेबल, इमेज और हेडर डालें","टेम्पलेट प्रभावी ढंग से उपयोग करें","सहयोग करें और बदलाव ट्रैक करें"]'::jsonb,
   '["बुनियादी कंप्यूटर ज्ञान","Microsoft Word या Word Online वाला कंप्यूटर"]'::jsonb,
   '["छात्र","ऑफिस कर्मचारी","लेखक","दस्तावेज़ बनाने वाले सभी"]'::jsonb,
   'published')
ON CONFLICT (course_id, language_code) DO NOTHING;

-- Word: module + lesson
INSERT INTO modules (id, course_id, slug, sort_order, status, published_at)
VALUES ('b0b00000-0000-0000-0000-000000000002', 'c0ffe000-0000-0000-0000-000000000002', 'document-basics', 1, 'published', NOW())
ON CONFLICT (course_id, slug) DO NOTHING;

INSERT INTO module_translations (module_id, language_code, title, description, status) VALUES
  ('b0b00000-0000-0000-0000-000000000002', 'en', 'Document Basics', 'Get started with creating and saving documents.', 'published'),
  ('b0b00000-0000-0000-0000-000000000002', 'hi', 'दस्तावेज़ मूल बातें', 'दस्तावेज़ बनाना और सहेजना शुरू करें।', 'published')
ON CONFLICT (module_id, language_code) DO NOTHING;

INSERT INTO lessons (id, module_id, slug, sort_order, lesson_type, status, duration_minutes, published_at)
VALUES ('1e580000-0000-0000-0000-000000000002', 'b0b00000-0000-0000-0000-000000000002', 'creating-your-first-document', 1, 'article', 'published', 8, NOW())
ON CONFLICT (module_id, slug) DO NOTHING;

INSERT INTO lesson_translations (id, lesson_id, language_code, title, summary, status) VALUES
  ('1d000000-0000-0000-0000-000000000003', '1e580000-0000-0000-0000-000000000002', 'en', 'Creating Your First Document', 'Learn to create, save and open Word documents.', 'published'),
  ('1d000000-0000-0000-0000-000000000004', '1e580000-0000-0000-0000-000000000002', 'hi', 'अपना पहला दस्तावेज़ बनाना', 'Word दस्तावेज़ बनाना, सहेजना और खोलना सीखें।', 'published')
ON CONFLICT (lesson_id, language_code) DO NOTHING;

-- ── 3. COURSE: PowerPoint Fundamentals ───────────────────
INSERT INTO courses (id, slug, status, difficulty, estimated_duration, default_language, published_at)
VALUES
  ('c0ffe000-0000-0000-0000-000000000003', 'powerpoint-fundamentals', 'published',
   'beginner', 150, 'en', NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_categories (course_id, category_id) VALUES
  ('c0ffe000-0000-0000-0000-000000000003', 'cafe0000-0000-0000-0000-000000000001')
ON CONFLICT (course_id, category_id) DO NOTHING;

INSERT INTO course_translations (course_id, language_code, title, short_description, description, learning_outcomes, prerequisites, target_audience, status) VALUES
  ('c0ffe000-0000-0000-0000-000000000003', 'en',
   'PowerPoint Fundamentals',
   'Create stunning presentations with PowerPoint — slides, animations and design.',
   'Master the art of presentations with Microsoft PowerPoint. Learn to design slides, use animations, create charts and deliver impactful presentations that engage your audience.',
   '["Create and design slides","Apply themes and transitions","Add charts and multimedia","Use animations effectively","Deliver professional presentations"]'::jsonb,
   '["Basic computer skills","A computer with Microsoft PowerPoint or PowerPoint Online"]'::jsonb,
   '["Students","Professionals","Teachers","Anyone who presents"]'::jsonb,
   'published'),
  ('c0ffe000-0000-0000-0000-000000000003', 'hi',
   'पावरपॉइंट मूल बातें',
   'PowerPoint के साथ शानदार प्रेजेंटेशन बनाएं — स्लाइड, एनिमेशन और डिज़ाइन।',
   'Microsoft PowerPoint के साथ प्रेजेंटेशन की कला में महारत हासिल करें। स्लाइड डिज़ाइन करना, एनिमेशन का उपयोग करना, चार्ट बनाना और प्रभावशाली प्रेजेंटेशन देना सीखें।',
   '["स्लाइड बनाएं और डिज़ाइन करें","थीम और ट्रांज़िशन लागू करें","चार्ट और मल्टीमीडिया जोड़ें","एनिमेशन प्रभावी ढंग से उपयोग करें","पेशेवर प्रेजेंटेशन दें"]'::jsonb,
   '["बुनियादी कंप्यूटर ज्ञान","Microsoft PowerPoint या PowerPoint Online वाला कंप्यूटर"]'::jsonb,
   '["छात्र","पेशेवर","शिक्षक","प्रेजेंट करने वाले सभी"]'::jsonb,
   'published')
ON CONFLICT (course_id, language_code) DO NOTHING;

-- PowerPoint: module + lesson
INSERT INTO modules (id, course_id, slug, sort_order, status, published_at)
VALUES ('b0b00000-0000-0000-0000-000000000003', 'c0ffe000-0000-0000-0000-000000000003', 'getting-started-with-powerpoint', 1, 'published', NOW())
ON CONFLICT (course_id, slug) DO NOTHING;

INSERT INTO module_translations (module_id, language_code, title, description, status) VALUES
  ('b0b00000-0000-0000-0000-000000000003', 'en', 'Getting Started with PowerPoint', 'Understand the PowerPoint interface and create your first presentation.', 'published'),
  ('b0b00000-0000-0000-0000-000000000003', 'hi', 'पावरपॉइंट के साथ शुरुआत', 'PowerPoint इंटरफ़ेस समझें और अपनी पहली प्रेजेंटेशन बनाएं।', 'published')
ON CONFLICT (module_id, language_code) DO NOTHING;

INSERT INTO lessons (id, module_id, slug, sort_order, lesson_type, status, duration_minutes, published_at)
VALUES ('1e580000-0000-0000-0000-000000000003', 'b0b00000-0000-0000-0000-000000000003', 'introduction-to-powerpoint', 1, 'article', 'published', 7, NOW())
ON CONFLICT (module_id, slug) DO NOTHING;

INSERT INTO lesson_translations (id, lesson_id, language_code, title, summary, status) VALUES
  ('1d000000-0000-0000-0000-000000000005', '1e580000-0000-0000-0000-000000000003', 'en', 'Introduction to PowerPoint', 'Learn what PowerPoint is and how to navigate its interface.', 'published'),
  ('1d000000-0000-0000-0000-000000000006', '1e580000-0000-0000-0000-000000000003', 'hi', 'पावरपॉइंट परिचय', 'जानें कि PowerPoint क्या है और इसके इंटरफ़ेस को कैसे नेविगेट करें।', 'published')
ON CONFLICT (lesson_id, language_code) DO NOTHING;

-- ── 4. COURSE: Digital Marketing Basics ──────────────────
INSERT INTO courses (id, slug, status, difficulty, estimated_duration, default_language, published_at)
VALUES
  ('c0ffe000-0000-0000-0000-000000000004', 'digital-marketing-basics', 'published',
   'intermediate', 240, 'en', NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_categories (course_id, category_id) VALUES
  ('c0ffe000-0000-0000-0000-000000000004', 'cafe0000-0000-0000-0000-000000000002')
ON CONFLICT (course_id, category_id) DO NOTHING;

INSERT INTO course_translations (course_id, language_code, title, short_description, description, learning_outcomes, prerequisites, target_audience, status) VALUES
  ('c0ffe000-0000-0000-0000-000000000004', 'en',
   'Digital Marketing Basics',
   'Learn SEO, social media, content marketing and online advertising fundamentals.',
   'A comprehensive introduction to digital marketing. Understand how to build an online presence, optimize for search engines, leverage social media, and create content that converts. Perfect for small business owners and aspiring marketers.',
   '["Understand the digital marketing landscape","Learn SEO fundamentals","Create a social media strategy","Build content that engages","Measure and optimize campaigns"]'::jsonb,
   '["Basic internet skills","A laptop or smartphone"]'::jsonb,
   '["Small business owners","Aspiring marketers","Freelancers","Content creators"]'::jsonb,
   'published'),
  ('c0ffe000-0000-0000-0000-000000000004', 'hi',
   'डिजिटल मार्केटिंग मूल बातें',
   'SEO, सोशल मीडिया, कंटेंट मार्केटिंग और ऑनलाइन विज्ञापन की मूल बातें सीखें।',
   'डिजिटल मार्केटिंग का व्यापक परिचय। ऑनलाइन उपस्थिति कैसे बनाएं, सर्च इंजन के लिए ऑप्टिमाइज़ करें, सोशल मीडिया का लाभ उठाएं और कन्वर्ट करने वाला कंटेंट बनाएं — यह सब सीखें।',
   '["डिजिटल मार्केटिंग परिदृश्य समझें","SEO मूल बातें सीखें","सोशल मीडिया रणनीति बनाएं","जुड़ने वाला कंटेंट बनाएं","कैंपेन मापें और ऑप्टिमाइज़ करें"]'::jsonb,
   '["बुनियादी इंटरनेट ज्ञान","लैपटॉप या स्मार्टफ़ोन"]'::jsonb,
   '["छोटे व्यवसाय के मालिक","उभरते मार्केटर","फ्रीलांसर","कंटेंट क्रिएटर"]'::jsonb,
   'published')
ON CONFLICT (course_id, language_code) DO NOTHING;

-- Digital Marketing: module + lesson
INSERT INTO modules (id, course_id, slug, sort_order, status, published_at)
VALUES ('b0b00000-0000-0000-0000-000000000004', 'c0ffe000-0000-0000-0000-000000000004', 'introduction-to-digital-marketing', 1, 'published', NOW())
ON CONFLICT (course_id, slug) DO NOTHING;

INSERT INTO module_translations (module_id, language_code, title, description, status) VALUES
  ('b0b00000-0000-0000-0000-000000000004', 'en', 'Introduction to Digital Marketing', 'Understand the fundamentals of digital marketing.', 'published'),
  ('b0b00000-0000-0000-0000-000000000004', 'hi', 'डिजिटल मार्केटिंग परिचय', 'डिजिटल मार्केटिंग की मूल बातें समझें।', 'published')
ON CONFLICT (module_id, language_code) DO NOTHING;

INSERT INTO lessons (id, module_id, slug, sort_order, lesson_type, status, duration_minutes, published_at)
VALUES ('1e580000-0000-0000-0000-000000000004', 'b0b00000-0000-0000-0000-000000000004', 'what-is-digital-marketing', 1, 'article', 'published', 12, NOW())
ON CONFLICT (module_id, slug) DO NOTHING;

INSERT INTO lesson_translations (id, lesson_id, language_code, title, summary, status) VALUES
  ('1d000000-0000-0000-0000-000000000007', '1e580000-0000-0000-0000-000000000004', 'en', 'What is Digital Marketing?', 'Understand the scope and channels of digital marketing.', 'published'),
  ('1d000000-0000-0000-0000-000000000008', '1e580000-0000-0000-0000-000000000004', 'hi', 'डिजिटल मार्केटिंग क्या है?', 'डिजिटल मार्केटिंग के दायरे और चैनलों को समझें।', 'published')
ON CONFLICT (lesson_id, language_code) DO NOTHING;

-- ── 5. Add a second module to Excel course ────────────────
INSERT INTO modules (id, course_id, slug, sort_order, status, published_at)
VALUES ('b0b00000-0000-0000-0000-000000000005', 'c0ffe000-0000-0000-0000-000000000001', 'working-with-cells', 2, 'published', NOW())
ON CONFLICT (course_id, slug) DO NOTHING;

INSERT INTO module_translations (module_id, language_code, title, description, status) VALUES
  ('b0b00000-0000-0000-0000-000000000005', 'en', 'Working with Cells', 'Enter, format and navigate cells effectively.', 'published'),
  ('b0b00000-0000-0000-0000-000000000005', 'hi', 'सेल के साथ कार्य', 'सेल दर्ज करना, फ़ॉर्मेट करना और नेविगेट करना।', 'published')
ON CONFLICT (module_id, language_code) DO NOTHING;

INSERT INTO lessons (id, module_id, slug, sort_order, lesson_type, status, duration_minutes, published_at)
VALUES ('1e580000-0000-0000-0000-000000000005', 'b0b00000-0000-0000-0000-000000000005', 'entering-and-formatting-data', 1, 'article', 'published', 15, NOW())
ON CONFLICT (module_id, slug) DO NOTHING;

INSERT INTO lesson_translations (id, lesson_id, language_code, title, summary, status) VALUES
  ('1d000000-0000-0000-0000-000000000009', '1e580000-0000-0000-0000-000000000005', 'en', 'Entering and Formatting Data', 'Learn to enter text, numbers and dates, then format them.', 'published'),
  ('1d000000-0000-0000-0000-00000000000a', '1e580000-0000-0000-0000-000000000005', 'hi', 'डेटा दर्ज करना और फ़ॉर्मेट करना', 'टेक्स्ट, नंबर और डेट दर्ज करना और फ़ॉर्मेट करना सीखें।', 'published')
ON CONFLICT (lesson_id, language_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- END OF EXTRA SEED
-- ═══════════════════════════════════════════════════════════
