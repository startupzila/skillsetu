# SkillSetu — Build Plan & Session Roadmap

This is the **single source of truth** for how SkillSetu is built, session by session.
It is derived from the Production Platform Specification and consolidates the spec's
granular micro-sessions into realistic, executable development sessions for an AI agent.

> **Rule:** Never attempt to build the entire platform in one session.
> Each session is committed and verified before the next begins.

---

## 0. How to Read This Plan

- A **session** = one focused chat/work session with the AI agent.
- Each session has: **Scope**, **Deliverables**, **Acceptance**, and a **Phase** tag.
- Phases follow the spec (Phase 0 → Phase 19).
- Sessions are sequential. Some spec micro-sessions are merged because they belong
  together (e.g. all database schema in Phase 2 is done across 2 sessions, not 9).

---

## 1. Current Status

| Item | Status |
|---|---|
| Specification analyzed | ✅ Done |
| GitHub repository created | ✅ `startupzila/skillsetu` |
| README + docs committed | ✅ S0 |
| Supabase project provisioned | ✅ (credentials provided) |
| Infrastructure & Supabase wiring | ✅ S1 |
| Database schema — Identity, Taxonomy, Content | ✅ S2 |
| Database schema — Assessment, Learner, Editorial, Commerce, SEO/Ops | ✅ S3 |
| Authentication & RBAC | ✅ S4 |
| Database migrations applied to Supabase (automated) | ✅ DB-SETUP |
| Design system & global layout | ✅ S5 |
| Public website — homepage, categories, course pages | ✅ S6 |
| Development continued | ⏳ Awaiting user confirmation for S7 |

---

## 2. Session Estimate — Summary

| # | Session | Phase | Focus |
|---|---|---|---|
| S0 | Planning & repo setup | 0 + 1.1 | ✅ This session — docs, README, GitHub |
| S1 | Infrastructure & Supabase wiring | 1.2–1.3 | Prisma→Postgres, Supabase client, env, migrations setup |
| S2 | Database schema — Identity, Taxonomy, Content | 2.1–2.4 | profiles, roles, categories, courses, modules, lessons, blocks, media |
| S3 | Database schema — Assessment, Learner, Editorial, Commerce, SEO/Ops | 2.5–2.9 | questions, quizzes, tests, progress, bookmarks, notes, commerce, seo, audit |
| S4 | Authentication & RBAC | 3.1–3.3 | learner auth, console protection, server authorization helpers, audit |
| S5 | Design system & global layout | 4.1–4.3 | typography, tokens, header, footer, nav, responsive, a11y basics |
| S6 | Public website — Homepage, categories, course pages | 5.1–5.3 | hero, search UI, category pages, course detail |
| S7 | Lesson renderer & search | 5.4–5.5 | structured content-block renderer, lesson page, prev/next, search |
| S8 | Learning system — Progress, bookmarks, notes, quizzes | 6.1–6.4 | progress, continue learning, bookmarks, notes, chapter quizzes, mock tests |
| S9 | Console — Layout, course/module/lesson CRUD | 7.1–7.3 | console shell, course CRUD, lesson editor with blocks, reorder |
| S10 | Console — Questions, editorial workflow, translations | 7.4–7.7 | content-block editor, question bank, editorial workflow, translation workflow |
| S11 | Media library & video foundation | 8.1–8.3 | media upload/browse/alt/usage, video metadata, feature-flagged video block |
| S12 | SEO system | 9.1–9.4 | metadata, sitemap, robots, JSON-LD, redirect manager |
| S13 | Static/SEO pages & custom code manager | 10.1–10.2 | about/contact/privacy/terms CMS, custom head/body code with audit |
| S14 | Books, store & commerce foundation | 11.1–11.5 | book CMS, store, orders, entitlements, coupons |
| S15 | Affiliate, ads, learner dashboard, analytics | 12–14 | affiliate/ad managers, dashboard, learning library, account, event tracking + admin analytics |
| S16 | Content quality, testing, security review | 15–17 | templates, QA checklist, review scheduling, unit/integration/E2E, security review |
| S17 | Production prep & launch readiness | 18–19 | prod env, domain, launch checklist, final verification |

**Total: ~17 development sessions (S1–S17) + this planning session (S0).**

> This is a realistic estimate. The spec lists ~74 micro-sessions; they are consolidated
> here into 17 executable sessions because related work (e.g. a coherent DB schema) is
> far higher quality when done together rather than fragmented across many chats.
> Scope may shift ±1–2 sessions depending on decisions made during build.

---

## 3. Detailed Session Breakdown

### S0 — Planning & Repository Setup ✅ (this session)
**Phase:** 0 (Product Foundation) + 1.1 (Create Repository)

**Scope:**
- Analyze the full SkillSetu specification.
- Confirm product rules, tech stack and architecture.
- Create `README.md`, `docs/plan.md`, `docs/product-decisions.md`, `docs/tech-stack.md`,
  `docs/architecture.md`, `.env.example`.
- Initialize Git, push to `github.com/startupzila/skillsetu` (public, `main` branch).
- Provide session estimate for the whole build.

**Deliverables:**
- `README.md`
- `docs/plan.md`
- `docs/product-decisions.md`
- `docs/tech-stack.md`
- `docs/architecture.md`
- `.env.example`
- `.gitignore` (updated to exclude sandbox infra + secrets)
- First real commit pushed to GitHub.

**Acceptance:**
- Repo is public on GitHub with README + docs visible.
- No secrets committed.
- User has received the session estimate and can confirm to start S1.

---

### S1 — Infrastructure & Supabase Wiring ✅
**Phase:** 1.2 (Vercel) + 1.3 (Supabase)

**Scope:**
- Switch Prisma datasource from SQLite → Supabase PostgreSQL.
- Add `@supabase/supabase-js` and `@supabase/ssr` packages.
- Create `lib/supabase/` clients: browser (anon, RLS on), server (anon, RLS on),
  admin (service-role, RLS off, server-only).
- Wire Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`).
- `/api/health` route verifying env + Supabase reachability over HTTPS.
- `docs/deployment.md` documenting Vercel + Supabase + migration workflow.

**Data-access decision (recorded):** Runtime data access uses the Supabase JS
client over HTTPS (port 443) — works in the dev sandbox, preview and production
identically. Prisma is the schema source-of-truth only; `db:push` runs from a
machine where Postgres port 5432 is reachable (the sandbox blocks raw TCP).
See `docs/architecture.md` §"Data Access" and `docs/deployment.md`.

**Deliverables:**
- Working Supabase connection (browser + server + admin clients).
- `prisma/schema.prisma` on PostgreSQL (models added in S2).
- `/api/health` returns `status: "ok"` when Supabase is reachable.
- `docs/deployment.md`.

**Acceptance:**
- `/api/health` returns HTTP 200 with `supabase.status: "ok"`.
- Homepage loads at `/`.
- No secrets committed; only `.env.example` ships with placeholders.

---

### S2 — Database Schema (Part 1): Identity, Taxonomy, Content ✅
**Phase:** 2.1–2.4

**Scope:**
- **Identity:** `profiles`, `roles`, `permissions`, `user_roles`, `role_permissions`.
- **Taxonomy:** `categories` (hierarchical), `category_translations`, `skills`, `tags`, `course_tags`, `lesson_tags`.
- **Content:** `courses`, `course_translations`, `course_categories`, `course_authors`, `modules`, `module_translations`, `lessons`, `lesson_translations`.
- **Blocks & Media:** `lesson_blocks`, `media_assets`, `media_usages`.
- Slugs (scoped uniqueness), status enums, `published_at`, timestamps.
- Seed: 11 roles, 19 permissions, sample category/course/module/lesson with EN+HI translations + blocks.
- RLS policies: public read of published content; drafts invisible.

**Deliverables:**
- `prisma/schema.prisma` — 22 models, 5 enums (source of truth).
- `db/migrations/001_tables.sql` — DDL (generated via `prisma migrate diff`).
- `db/migrations/002_triggers.sql` — updated_at triggers, auth.users FK, profile auto-create, RLS enable.
- `db/migrations/003_rls.sql` — RLS policies.
- `db/seeds/001_seed.sql` — demo data.
- `db/README.md` — application instructions.
- `src/lib/content/{types,category-service,course-service,lesson-service,index}.ts` — service modules.
- `/api/categories`, `/api/courses` routes.
- Updated homepage (server component) showing published courses or setup notice.
- `docs/database.md`.

**Note on schema application:** Since the sandbox blocks raw TCP Postgres,
the SQL files must be applied via the Supabase Dashboard SQL Editor (or from
a local machine with port 5432 access). The `/api/health` endpoint reports
`schema.status: "applied" | "pending"` and `schema.courses` count.

**Acceptance:**
- SQL files run cleanly in Supabase Dashboard (in order 001→002→003→seed).
- `/api/health` returns `schema.status: "applied"`.
- `/api/courses?lang=en` returns the seed course.
- Homepage shows the Excel Fundamentals course card.
- Drafts are invisible to public (RLS verified).

---

### S3 — Database Schema (Part 2): Assessment, Learner, Editorial, Commerce, SEO/Ops ✅
**Phase:** 2.5–2.9

**Scope:**
- **Assessment:** `questions`, `question_translations`, `question_options`, `quizzes`, `quiz_translations`, `quiz_questions`, `mock_tests`, `test_translations`, `test_questions`, `attempts`, `attempt_answers`.
- **Learner:** `enrollments`, `lesson_progress`, `bookmarks`, `notes`.
- **Editorial:** `assignments`, `reviews`, `revisions`, `editorial_comments`, `translation_tasks`, `audit_logs`.
- **Commerce:** `products`, `product_variants`, `orders`, `order_items`, `payments`, `coupons`, `entitlements`, `course_products`, `course_books`, `lesson_books`.
- **SEO/Ops:** `seo_metadata`, `redirects`, `ad_slots`, `affiliate_links`, `custom_code`, `notifications`, `system_settings`.
- 13 new enums (QuestionType, AttemptStatus, EntityType, OrderStatus, PaymentProvider, DiscountType, CouponStatus, BookFormat, AdSlot, AssignmentStatus, EditorialAction, DifficultyRank, PaymentStatus).
- RLS: published assessment public read (is_correct stripped); learner data self-only; editorial service-role only; commerce products public, orders self-only; SEO/ops public read active.
- Seed: sample question (4 options, EN+HI), quiz linked to lesson, book product, coupon (WELCOME10).

**Deliverables:**
- `prisma/schema.prisma` extended (now 60 models, 18 enums total).
- `db/migrations/004_tables_s3.sql` — 38 new tables, 13 enums, 21 indexes.
- `db/migrations/005_rls_s3.sql` — RLS policies for S3 tables.
- `db/migrations/006_triggers_s3.sql` — idempotent updated_at triggers on S3 tables.
- `db/seeds/002_seed_s3.sql` — sample question, quiz, book, coupon.
- `src/lib/learning/assessment-types.ts` + `learner-types.ts` — TypeScript types.
- `src/lib/learning/assessment-service.ts` — getPublishedQuizBySlug, gradeAnswer (strips is_correct).
- `src/lib/learning/progress-service.ts` — enrollments, progress, bookmarks, notes (self-scoped).
- `/api/quiz`, `/api/quiz/grade`, `/api/progress/lesson` routes.
- Updated `docs/database.md`, `db/README.md`.

**Acceptance:**
- SQL files run cleanly after S2 files (order 004→005→006→seed002).
- `/api/quiz?slug=excel-intro-quiz` returns quiz with questions (no is_correct).
- `/api/quiz/grade` reveals correct answers only after submission.
- `/api/progress/lesson` requires authentication (401 if not signed in).
- Learner data is self-only (RLS enforced).

---

### S4 — Authentication & RBAC ✅
**Phase:** 3.1–3.3

**Scope:**
- Learner auth: register, login, logout, email verification, password reset, profile.
- Supabase Auth integration with server-side session cookies (`@supabase/ssr`).
- `/console` protection middleware + role verification.
- Server authorization helpers: `requireUser`, `requireRole`, `requirePermission`,
  `hasPermission`, `hasRole`, `isStaff`.
- Unauthorized + forbidden pages.
- Audit logging helper (`recordAudit`).
- MFA readiness (documented; not enforced in MVP).

**Deliverables:**
- `src/lib/auth/session.ts` — `getSession`, `requireUser`, `requireRole`, `requirePermission`, `hasPermission`, `hasRole`, `isStaff`, `AuthError`.
- `src/lib/auth/permissions.ts` — permission + role constants.
- `src/lib/auth/audit.ts` — `recordAudit` (service-role, immutable).
- `src/middleware.ts` — session refresh + `/console` protection.
- API routes: `/api/auth/{register,login,logout,forgot-password,reset-password,callback}`.
- Auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`.
- `/console` layout + dashboard (shows roles, permissions, module access).
- `/unauthorized` (403) page.
- Homepage updated to show auth-aware header (Sign in/up vs Dashboard/Console/Sign out).
- `docs/security.md`.

**Acceptance:**
- A learner can register, receive a verification email, verify, login, logout.
- Unauthenticated users are redirected from `/console` to `/login`.
- Authenticated non-staff users see "no access" in the console (not a redirect loop).
- `requirePermission()` throws `AuthError(FORBIDDEN)` when permission is missing.
- No secrets in client bundles.

---

### S5 — Design System & Global Layout
**Phase:** 4.1–4.3

**Scope:**
- Design tokens: colors, typography, spacing, radius, shadows, breakpoints, motion, z-index.
- Light/dark theme (next-themes).
- Global layout: header, footer (sticky), breadcrumbs, language switcher, search box.
- Responsive: desktop nav + mobile nav (collapsible, touch-friendly 44px targets).
- Base components: CourseCard, LessonNavigation, CourseSidebar, ProgressBar, StatusBadge,
  EmptyState, ErrorState, Pagination.
- Accessibility baseline: semantic HTML, focus visible, keyboard nav, reduced-motion.

**Deliverables:**
- `src/app/globals.css` tokens, `src/components/shared/*`, `src/components/public/*`.
- `docs/` design notes (optional).

**Acceptance:**
- Layout is responsive on mobile + desktop.
- Sticky footer works on short and long pages.
- Keyboard navigation works across nav.

---

### S6 — Public Website: Homepage, Categories, Courses
**Phase:** 5.1–5.3

**Scope:**
- Homepage sections: hero, search, popular skills, explore by goal, featured courses,
  methodology, languages, resources, trust, footer.
- Category pages: `/skills`, `/skills/[category]` (language-aware).
- Course page: title, description, difficulty, language, duration, outcomes, prerequisites,
  instructor, curriculum, progress, start/continue, related resources/courses, assessment info.
- All public pages server-rendered for SEO.

**Deliverables:**
- `src/app/(public)/` homepage + category + course routes.
- Course curriculum component.

**Acceptance:**
- Homepage loads fast, server-rendered.
- Course page shows real DB data (from seed).
- Language switch preserves logical page.

---

### S7 — Lesson Renderer & Search
**Phase:** 5.4–5.5

**Scope:**
- Lesson page: breadcrumb, course/chapter/lesson titles, main content, quick check,
  MCQ/Q&A, previous/next, course sidebar (desktop) / collapsible (mobile).
- **Content-block renderer** for all MVP block types: heading, paragraph, image, gallery,
  video (placeholder), callout, example, table, quote, code, download, checklist, quiz,
  MCQ, Q&A, practice, project, related content.
- Bookmark + note entry points (wired in S8).
- Search: input, results, filters, language awareness, no-result state.
- PostgreSQL full-text search over courses/lessons/questions/books/authors/categories.

**Deliverables:**
- `src/components/learning/ContentRenderer.tsx` + block components.
- `src/app/(public)/.../lessons/[lesson]` route.
- Search route + `searchService`.

**Acceptance:**
- A real lesson renders with mixed block types from DB.
- Search returns relevant published results.

---

### S8 — Learning System: Progress, Bookmarks, Notes, Quizzes, Mock Tests
**Phase:** 6.1–6.4

**Scope:**
- Lesson completion, course progress %, resume / continue learning.
- Bookmark toggle (courses/lessons/books) with dedupe.
- Notes: create/edit/delete, private access.
- Chapter quizzes: UI, scoring, answer explanations, attempt history.
- Mock tests: timed, random questions, score, pass/fail, review mode.
- Server-authoritative progress (never trust client state alone).

**Deliverables:**
- `lib/learning/progressService`, `assessmentService`.
- Quiz + test components.
- Bookmark/notes API routes.

**Acceptance:**
- Completing a lesson updates course progress.
- Quiz attempt is scored and saved.
- Mock test enforces time limit server-side.

---

### S9 — Console: Layout, Course/Module/Lesson CRUD
**Phase:** 7.1–7.3

**Scope:**
- Console shell: sidebar, header, breadcrumbs, role-aware navigation, dashboard.
- Course CRUD: create, edit, duplicate, archive, publish, schedule, assign authors/reviewers,
  reorder modules, link books/related courses, SEO, thumbnail, difficulty, duration.
- Module/lesson CRUD with drag/reorder, lesson editor (structured blocks), preview, draft state, autosave.
- Duplicate + archive flows.

**Deliverables:**
- `src/app/console/` shell + courses + modules + lessons sections.
- `lib/content/courseService`, `lessonService`.

**Acceptance:**
- Editor can create and publish a course end-to-end without code.
- Reordering modules/lessons persists.

---

### S10 — Console: Content-Block Editor, Questions, Editorial Workflow, Translations
**Phase:** 7.4–7.7

**Scope:**
- Full content-block editor for all MVP blocks (stored structurally).
- Question bank: MCQ editor, options, correct answer (never client-exposed pre-submit),
  explanation, difficulty, topic, language, tags, reviewer.
- Quiz builder.
- Editorial workflow: assignment, review, comments, approval, rejection, revision history.
- Translation workflow: assignment, status (draft/in_translation/in_review/published/needs_update),
  outdated-translation warnings when source changes.

**Deliverables:**
- `src/app/console/questions`, `/quizzes`, `/editorial`, `/translations`.
- Revision history UI + rollback for appropriate content.

**Acceptance:**
- Writer → Reviewer → Publisher flow works with audit trail.
- Hindi translation can be created and published; changing English marks Hindi as needs_update.

---

### S11 — Media Library & Video Foundation
**Phase:** 8.1–8.3

**Scope:**
- Media library: upload (Supabase Storage), browse, search, metadata, alt text, usage tracking,
  type/size limits, validation.
- Video metadata model: provider, external ID, thumbnail, duration, transcript, captions,
  language, status, visibility, copyright/license.
- Feature-flagged video block (`video_lessons` flag off by default).
- Lesson renderer can render `Text → Video → Text → Quiz` without architecture change.

**Deliverables:**
- `src/app/console/media` + `lib/content/mediaService`.
- `video_blocks` support in ContentRenderer (gated).

**Acceptance:**
- Upload enforces type/size limits.
- Media usage references tracked.
- Video block renders placeholder when flag off.

---

### S12 — SEO System
**Phase:** 9.1–9.4

**Scope:**
- Per-entity SEO metadata: title, description, canonical, index/noindex, OG, social image, slug.
- Dynamic XML sitemap + robots.txt.
- JSON-LD: Website, Breadcrumbs, Course/Article where appropriate (no fake schema).
- Redirect manager: create/edit/deactivate 301s with audit.

**Deliverables:**
- `src/app/sitemap.ts`, `src/app/robots.ts`.
- `lib/seo/seoService`, console `/console/seo` + `/console/redirects`.

**Acceptance:**
- Sitemap includes only published, indexable content.
- Redirects resolve before 404.

---

### S13 — Static/SEO Pages & Custom Code Manager
**Phase:** 10.1–10.2

**Scope:**
- Managed static pages via CMS: about, contact, privacy, terms, refund, affiliate-disclosure, disclaimer.
- Custom code manager: controlled head/body-start/body-end scripts, analytics, verification tags,
  approved ad scripts, page-specific code. Role-restricted + audit-logged + sanitized.

**Deliverables:**
- `src/app/(public)/[slug]` page CMS + console editor.
- `src/app/console/custom-code`.

**Acceptance:**
- Legal pages editable without code.
- Custom code only injects for authorized roles; changes are audited.

---

### S14 — Books, Store & Commerce Foundation
**Phase:** 11.1–11.5

**Scope:**
- Book/resource CMS: PDF, eBook, print, workbook, notes, cheat sheet, practice pack, bundle.
  Linked to courses/modules/lessons/categories (many-to-many).
- Store: listing, product page, filters, search.
- Orders: checkout architecture, order creation, payment service abstraction (provider-neutral),
  order status, purchase history.
- Digital entitlements: entitlement records, protected downloads, access checks, download logging.
- Coupons: fixed/percentage, expiration, usage limits, product/course restrictions.

**Deliverables:**
- `src/app/(public)/books`, `/store`, `src/app/console/books|products|orders|coupons`.
- `lib/commerce/commerceService`, payment abstraction interface.

**Acceptance:**
- Paid digital resource is downloadable only by entitled user.
- Coupon applies correct discount with limits enforced.

---

### S15 — Affiliate, Ads, Learner Dashboard, Analytics
**Phase:** 12–14

**Scope:**
- Affiliate manager: provider, product, tracking URL, disclosure, placement, active/inactive.
- Ad manager: slots (header/content_top/middle/bottom/sidebar/footer), active periods, placement, role restrictions.
- Learner dashboard: continue learning, my courses, saved lessons, notes, quiz history, assessments, orders, downloads, profile, settings, language.
- Analytics: event tracking (course_view, lesson_complete, quiz_complete, purchase_completed, …), search analytics, admin analytics (learner/course/assessment/content/commerce metrics), content-quality analytics (drop-off, difficult questions, abandoned lessons, no-result searches, stale content).

**Deliverables:**
- `src/app/dashboard/*`, `src/app/console/affiliates|ads|analytics`.
- `lib/analytics/` event layer.

**Acceptance:**
- Dashboard prioritizes next useful action.
- Affiliate links carry disclosure.
- Analytics events fire and aggregate in console.

---

### S16 — Content Quality, Testing, Security Review
**Phase:** 15–17

**Scope:**
- Course templates (Office/Business/Digital/Software) — configurable, not hard-coded.
- Content QA checklist (factual, completeness, language, examples, links, assessments, SEO, mobile, copyright, freshness).
- Review scheduling (last_reviewed, next_review, overdue, assigned reviewer).
- Testing: unit (Vitest) for business logic; integration (auth, db, permissions, content, progress, assessments, commerce); E2E (Playwright) for critical flows; accessibility; performance.
- Security review: RLS, role escalation, admin routes, file/download access, API validation, XSS, CSRF, rate limiting, secrets, logs, error exposure. Tested with unauthorized users.

**Deliverables:**
- `tests/unit`, `tests/integration`, `tests/e2e`.
- `docs/testing.md`, updated `docs/security.md`.

**Acceptance:**
- Critical E2E flows pass.
- No unauthorized access to protected resources.
- No secrets in logs or client bundles.

---

### S17 — Production Prep & Launch Readiness
**Phase:** 18–19

**Scope:**
- Production environment: Supabase prod, Vercel prod, env vars, email, analytics, storage, backups.
- Domain: Vercel subdomain initially; custom domain later (DNS, SSL, email domain).
- Launch checklist verification (homepage, registration, login, courses, lessons, language switch, progress, quizzes, search, console, editorial, SEO, legal pages, analytics, error pages, mobile, security, backups).
- Final end-to-end verification with the browser agent.
- Launch only after production build passes, critical E2E pass, backups verified, admin security verified, public content reviewed, SEO basics verified, legal pages published, analytics works.

**Deliverables:**
- `docs/deployment.md` (final), launch checklist signed off.

**Acceptance:**
- A real learner can browse a real course, register, start a lesson, read structured content, answer a quiz, see progress, switch EN/HI, and resume later.
- An authorized editorial user can create/edit/review/publish the same content without touching code.

---

## 4. Session Sequencing Rules

1. **Sequential by default.** S(n) depends on S(n−1).
2. **Commit per session.** Each session ends with a Git commit (or several) pushed to `main`.
3. **Verify before advancing.** A session is complete only when its Acceptance criteria pass.
4. **No skipping the DB.** S2 + S3 must be done before any feature that reads content.
5. **No feature flags left on for unfinished work.** Unfinished features stay flagged off.
6. **Never replace real requirements with mocks** without explicit labeling.
7. **Secrets never committed.** Only `.env.example` ships with placeholders.

---

## 5. Definition of Done (Whole Platform)

SkillSetu is MVP-complete only when Infrastructure, Public learning, Learner, Console,
Video readiness, Commerce foundation, SEO, Security, and Quality (tests, mobile, a11y,
performance, docs) are all satisfied — per the spec's Section 39.

---

## 6. First Production Milestone (North Star)

> A real learner can visit the deployment, browse a real course, register, start a real
> lesson, read structured content, answer a chapter quiz, see progress, switch between
> English and Hindi, and resume learning later.
>
> At the same time, an authorized editorial user can log into `/console/`, create/edit/
> review/publish the same course content without touching code.

If these two workflows work cleanly, the core architecture is sound.
