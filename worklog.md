# SkillSetu — Worklog

This file tracks the work performed by each development session/agent.
New sections are appended (never overwrite).

---
Task ID: S0
Agent: Z.ai Code (main)
Task: Planning & repository setup — analyze spec, create README + docs, set up GitHub repo

Work Log:
- Read the full 4050-line SkillSetu Production Platform Specification.
- Confirmed product rules, tech stack (Next.js 16, TypeScript, Tailwind 4, Supabase, Prisma, Vercel).
- Created README.md (vision, stack, structure, getting started).
- Created docs/plan.md — session-by-session build roadmap (S0–S17).
- Created docs/product-decisions.md (Phase 0.1).
- Created docs/tech-stack.md (Phase 0.2).
- Created docs/architecture.md (Phase 0.3).
- Created .env.example with Supabase placeholders (no real secrets).
- Updated .gitignore: keep .env.example tracked; ignore local DB, sandbox infra, uploads, tool-results, examples, mini-services, runtime scripts.
- Untracked .env and download/ sandbox artifacts from the initial commit.
- Renamed package to "skillsetu".
- Pushed to github.com/startupzila/skillsetu (public, main branch).
- Verified no secrets leaked (scanned tracked files for tokens/keys).
- Removed token from remote URL after push (clean .git/config).

Stage Summary:
- Repo live at https://github.com/startupzila/skillsetu (public, 74 files).
- Phase 0 deliverables complete. User given session estimate: ~17 dev sessions (S1–S17).

---
Task ID: S1
Agent: Z.ai Code (main)
Task: Infrastructure & Supabase wiring — connect Prisma to Supabase Postgres, create Supabase clients, /api/health route, deployment docs

Work Log:
- Installed @supabase/supabase-js@2.117.3 and @supabase/ssr@0.12.7.
- Updated .env with real Supabase credentials (URL, anon key, service-role key, DATABASE_URL).
- Switched prisma/schema.prisma datasource from sqlite → postgresql.
- Discovered sandbox network constraint: raw TCP Postgres (port 5432) is blocked; HTTPS (port 443) works.
- Made architectural decision: runtime data access via Supabase JS client (HTTPS); Prisma is schema source-of-truth only (db:push runs from outside the sandbox).
- Created src/lib/supabase/browser.ts — browser client (anon key, RLS on).
- Created src/lib/supabase/server.ts — server client (anon key, RLS on, cookie-bound).
- Created src/lib/supabase/admin.ts — admin client (service-role key, RLS off, server-only).
- Created src/lib/supabase/env.ts — centralised env validation.
- Created src/lib/supabase/index.ts — barrel export.
- Created src/app/api/health/route.ts — verifies env + Supabase reachability over HTTPS via auth.admin.listUsers().
- Updated src/app/api/route.ts — SkillSetu API root info.
- Updated src/app/layout.tsx — metadata changed from Z.ai scaffold to SkillSetu.
- Replaced src/app/page.tsx — clean SkillSetu setup-in-progress page (Card, Badge, Button from shadcn/ui; link to /api/health).
- Created docs/deployment.md — Vercel + Supabase setup, data-access architecture, migration methods (db:push from local, Dashboard SQL Editor, Prisma Migrate).
- Updated docs/architecture.md — added "Data Access" section documenting the two-layer approach.
- Updated docs/plan.md — S1 marked complete; status table updated; data-access decision recorded.
- Ran bun run lint — passed clean, zero errors.
- Verified dev server: GET / → 200, GET /api → 200, GET /api/health → 200 with status:"ok", supabase.status:"ok".
- Browser verification (agent-browser): page renders correctly, h1 "SkillSetu" present, health link navigates to /api/health, no console errors.

Stage Summary:
- Supabase connection verified over HTTPS (auth.admin.listUsers succeeds with service-role key).
- Three Supabase clients ready: browser (RLS on), server (RLS on), admin (RLS off, server-only).
- /api/health endpoint returns {status:"ok", supabase:{status:"ok"}}.
- Homepage shows SkillSetu branding with phase status and health-check link.
- Data-access approach documented in docs/architecture.md §"Data Access" and docs/deployment.md.
- Schema tables not yet provisioned (S2/S3) — reported as "pending" by /api/health.
- Ready for S2 (database schema: identity, taxonomy, content).

---
Task ID: S2
Agent: Z.ai Code (main)
Task: Database schema (Part 1) — Identity, Taxonomy, Content, Blocks/Media; services + API routes + docs

Work Log:
- Wrote full Prisma schema (prisma/schema.prisma): 22 models, 5 enums.
  Identity: profiles, roles, permissions, user_roles, role_permissions.
  Taxonomy: categories, category_translations, skills, tags, course_tags, lesson_tags.
  Content: courses, course_translations, course_categories, course_authors, modules, module_translations, lessons, lesson_translations.
  Blocks/Media: lesson_blocks, media_assets, media_usages.
- Key design decisions:
  • Translation entities (never title_en/title_hi).
  • lesson_blocks belong to lesson_translations (each language has own blocks).
  • block_type is String (extensible), validated by Zod in service layer.
  • UUIDs with DB-level gen_random_uuid() defaults.
  • Scoped slug uniqueness (modules per course, lessons per module).
  • Arrays use Json (no Prisma scalar lists per project rule).
- Generated SQL DDL via `prisma migrate diff --from-empty --to-schema-datamodel` (no DB connection needed).
  Saved to db/migrations/001_tables.sql (433 lines, 22 tables, 18 indexes).
- Created db/migrations/002_triggers.sql: updated_at trigger function + triggers on all tables,
  profiles.id FK to auth.users(id) ON DELETE CASCADE, profile auto-create trigger on auth signup, enable RLS.
- Created db/migrations/003_rls.sql: RLS policies — public read of published content,
  drafts invisible, profiles self-read/update, roles/permissions service-role only.
- Created db/seeds/001_seed.sql: 11 roles, 19 permissions, super_admin↔all permissions,
  admin↔operational permissions, sample category (Office Skills) with EN+HI,
  sample course (Excel Fundamentals) with EN+HI, 1 module, 1 lesson, 7 blocks in each language.
- Created db/README.md with step-by-step Supabase Dashboard SQL Editor instructions.
- Created src/lib/content/types.ts: TypeScript types matching all schema entities.
- Created src/lib/content/category-service.ts: listPublishedCategories, getPublishedCategoryBySlug.
- Created src/lib/content/course-service.ts: listPublishedCourses, getPublishedCourseBySlug (with curriculum/modules/lessons).
- Created src/lib/content/lesson-service.ts: getPublishedLessonBySlug (with blocks, prev/next navigation).
- Created src/lib/content/index.ts: barrel export.
- Created /api/categories route with schema_pending graceful fallback.
- Created /api/courses route with schema_pending graceful fallback.
- Updated /api/health to check if courses table exists (reports schema.status: applied|pending + course count).
- Updated homepage to server component: shows published courses as cards, or setup notice if schema pending.
- Created docs/database.md: entity overview, design decisions, RLS model.
- Updated docs/plan.md: S2 marked complete with deliverables + acceptance criteria.
- Ran bun run lint — passed clean, zero errors.
- Verified dev server: GET / → 200, /api/health → {schema:{status:"pending",courses:0}},
  /api/courses → {status:"schema_pending"}, /api/categories → {status:"schema_pending"}.
- Browser verification (agent-browser): page renders with hero + setup notice card listing 4 SQL files,
  footer at bottom, no console errors. Mobile (375px) layout verified.
- Committed and pushed to GitHub (commit 82aa6a4).

Stage Summary:
- Complete S2 schema: 22 tables, 5 enums, 18 indexes, RLS policies, triggers, seed data.
- All SQL files ready to apply via Supabase Dashboard SQL Editor (db/README.md has instructions).
- Content service modules ready to query published content via Supabase JS client.
- Homepage and API routes gracefully handle the "schema not yet applied" state.
- /api/health now reports schema status + course count.
- User must apply db/migrations/*.sql + db/seeds/001_seed.sql in Supabase Dashboard to see sample course.
- Ready for S3 (Assessment, Learner, Editorial, Commerce, SEO/Ops schema).

---
Task ID: S3
Agent: Z.ai Code (main)
Task: Database schema (Part 2) — Assessment, Learner, Editorial, Commerce, SEO/Ops; services + API routes + docs

Work Log:
- Extended prisma/schema.prisma with 38 new models + 13 new enums (total now: 60 models, 18 enums).
  Assessment: questions, question_translations, question_options, quizzes, quiz_translations,
  quiz_questions, mock_tests, test_translations, test_questions, attempts, attempt_answers.
  Learner: enrollments, lesson_progress, bookmarks, notes.
  Editorial: assignments, reviews, revisions, editorial_comments, translation_tasks, audit_logs.
  Commerce: products, product_variants, orders, order_items, payments, coupons, entitlements,
  course_products, course_books, lesson_books.
  SEO/Ops: seo_metadata, redirects, ad_slots (AdSlotConfig model), affiliate_links, custom_code,
  notifications, system_settings.
- Fixed enum/model naming conflict: AdSlot enum + AdSlotConfig model (table ad_slots).
- Validated schema with prisma format (clean).
- Generated S3-only SQL DDL by diffing S2 schema → full schema (python script extracted S3 statements).
  Saved to db/migrations/004_tables_s3.sql (38 tables, 13 enums, 21 indexes, 799 lines).
- Created db/migrations/005_rls_s3.sql: RLS policies for all S3 tables.
  • Published assessment: public read (questions, quizzes, tests, translations, options).
  • Learner data: self-only (enrollments, progress, bookmarks, notes).
  • Editorial: service-role only (no public policies).
  • Commerce: products public read; orders/payments/entitlements self-only; coupons service-role.
  • SEO/Ops: seo_metadata/redirects/ad_slots/affiliate_links/custom_code public read active; notifications self; system_settings public if is_public.
- Created db/migrations/006_triggers_s3.sql: idempotent updated_at triggers on S3 tables (DROP + CREATE).
- Created db/seeds/002_seed_s3.sql: sample question (4 options, EN+HI), quiz linked to Excel lesson,
  book product (Excel Practice Workbook), coupon WELCOME10 (10% off).
- Created src/lib/learning/assessment-types.ts + learner-types.ts: TypeScript types matching S3 schema.
- Created src/lib/learning/assessment-service.ts: getPublishedQuizBySlug, gradeAnswer.
  CRITICAL: preparePublicQuestion() strips is_correct from options before sending to client.
  Only gradeAnswer() reveals correctness after submission.
- Created src/lib/learning/progress-service.ts: enrolInCourse, listMyEnrollments, getOrCreateLessonProgress,
  completeLesson, toggleBookmark, listMyBookmarks, createNote, listMyNotes, updateNote, deleteNote.
  All operations use requireUserId() which extracts auth.uid() from session — client user_id never trusted.
- Created src/lib/learning/index.ts: barrel export.
- Created /api/quiz route: GET published quiz by slug (questions without is_correct).
- Created /api/quiz/grade route: POST grade answer (reveals correct option IDs + explanation after submission).
- Created /api/progress/lesson route: POST start/complete lesson (requires auth, 401 if not signed in).
- Updated docs/database.md with S3 entities overview, design decisions, RLS policy summary.
- Updated docs/plan.md: S3 marked complete with deliverables + acceptance criteria.
- Updated db/README.md: file order now 8 files (001-006 + 2 seeds).
- Restored .env with Supabase credentials (had been reset to SQLite by previous session).
- Ran bun run lint — passed clean, zero errors.
- Restarted dev server, verified endpoints:
  • GET / → 200 (homepage renders, setup notice shown)
  • GET /api/quiz?slug=excel-intro-quiz → {status:"schema_pending"} (tables not applied yet)
  • POST /api/quiz/grade → {status:"schema_pending"}
  • POST /api/progress/lesson (no auth) → {error:"Authentication required"} (401, correct)
- Browser verification (agent-browser): page renders, no console errors.
- Committed and pushed to GitHub (commit 466a6bc).

Stage Summary:
- Complete S3 schema: 38 tables, 13 enums, 21 indexes, RLS policies, triggers, seed data.
- Full database schema now complete: 60 tables, 18 enums (S2 + S3).
- Assessment service correctly strips correct answers before client delivery.
- Learner service is server-authoritative (auth.uid() from session, never client-provided).
- All API routes handle schema_pending gracefully and enforce auth where needed.
- User must apply db/migrations/004_tables_s3.sql + 005 + 006 + seeds/002_seed_s3.sql in Supabase Dashboard
  (after S2 files) to see sample question/quiz/book.
- Ready for S4 (Authentication & RBAC).
