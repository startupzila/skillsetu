# SkillSetu — Architecture & Conventions

**Status:** Confirmed (Phase 0.3)
**Source:** SkillSetu Production Platform Specification

---

## 1. High-Level Architecture

```text
User Browser
     │
     ▼
Next.js (Vercel) — App Router
     │
     ├── (public)      public learning experience
     ├── (auth)         learner authentication
     ├── dashboard      learner account
     ├── console        company / admin / editorial
     └── api            route handlers (REST-ish)
     │
     ▼
Application Services (lib/)
     ├── auth/          session, RBAC, permission helpers
     ├── content/       courseService, lessonService, mediaService
     ├── learning/      progressService, assessmentService
     ├── commerce/      commerceService (provider-neutral payment abstraction)
     ├── seo/           seoService, redirects
     ├── analytics/     event tracking
     ├── security/      audit, rate limiting
     ├── supabase/      browser + server + admin clients
     └── validation/    zod schemas
     │
     ▼
Supabase
     ├── PostgreSQL   (schema defined in prisma/schema.prisma)
     ├── Auth         (email/password, verification, reset)
     ├── Storage      (images, PDFs, downloads)
     └── RLS          (row-level security, server-enforced authz)
```

### Data Access (important)

SkillSetu uses **two complementary layers**:

1. **Runtime data access — Supabase JS client (HTTPS / port 443).**
   All application reads and writes go through `@supabase/supabase-js`
   over HTTPS. This works identically in the dev sandbox, in preview and
   in production. Three clients live in `src/lib/supabase/`:
   - `createBrowserSupabaseClient()` — browser, anon key, RLS on.
   - `createServerSupabaseClient()` — server, anon key, RLS on.
   - `createAdminClient()` — server-only, service-role key, RLS off.

2. **Schema source-of-truth — Prisma.**
   `prisma/schema.prisma` defines every table, column, relation and index.
   It is pushed to Supabase Postgres with `bun run db:push` (run from a
   machine where port 5432 is reachable, or via Supabase Dashboard SQL
   Editor). Prisma does not participate in runtime queries.

> **Why split?** The dev sandbox blocks raw TCP Postgres (port 5432) but
> allows HTTPS. The Supabase JS client uses HTTPS, so the app runs
> everywhere. Prisma is the schema definition tool only.

Future (mobile, B2B, AI tutor) consumes the **same core data** via the application/API layer.

---

## 2. Repository Structure

```text
skillsetu/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── console/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── public/               # header, footer, course card, ...
│   │   ├── learning/             # content renderer, lesson nav, quiz
│   │   ├── assessment/           # MCQ, quiz, mock test
│   │   ├── dashboard/
│   │   ├── console/              # admin tables, forms, editor
│   │   ├── commerce/
│   │   └── shared/               # status badge, empty/error states
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── content/
│   │   ├── learning/
│   │   ├── commerce/
│   │   ├── seo/
│   │   ├── analytics/
│   │   ├── security/
│   │   ├── validation/
│   │   └── utils/
│   ├── hooks/
│   └── ...
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
├── public/
├── docs/
├── scripts/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

> Exact folder layout may be adjusted, but **responsibilities must stay separated**.

---

## 3. URL Architecture

Stable from day one. Language-prefixed routes for translatable content.

```text
/                           (default locale redirect)
/en/    /hi/
/en/skills/    /hi/skills/
/en/skills/[category]    /hi/skills/[category]
/en/courses/    /hi/courses/
/en/courses/[course]    /hi/courses/[course]
/en/courses/[course]/chapters/[chapter]
/en/courses/[course]/lessons/[lesson]
/en/books/    /hi/books/
/en/store/    /hi/store/
/en/authors/    /hi/authors/
/dashboard
/console/
```

- Slugs are lowercase, URL-safe, unique within scope, stable after publication.
- If a slug changes → create redirect + update canonical + update internal links + record.
- Permanent redirects for changed URLs (never casual).

---

## 4. Content Architecture

```text
Category
  └── Course
        ├── Module / Chapter
        │     └── Lesson
        │           ├── Content Blocks (typed, ordered)
        │           ├── Questions
        │           ├── Resources
        │           ├── Practice
        │           └── Video Metadata (future)
        ├── Practice Projects
        ├── Mock Tests
        ├── Final Assessment
        └── Related Courses / Books
```

- A **lesson is structured content blocks** — never a hard-coded page template.
- Each block has a type + validated JSON data.
- Block types: heading, paragraph, image, gallery, video, callout, example, table, quote,
  code, download, checklist, quiz, MCQ, Q&A, practice, project, related content.

---

## 5. Multilingual Architecture

Translation-entity model (never `title_en`/`title_hi`):

```text
Course ──< CourseTranslation (lang, title, description, …, status, translator, reviewer)
Lesson ──< LessonTranslation
Question ──< QuestionTranslation
Book ──< BookTranslation
Category ──< CategoryTranslation
```

Translation status: `draft | in_translation | in_review | published | needs_update`.
Source change → related translations marked `needs_update`.

User language preference stored in profile. Language switching preserves the logical page,
redirects to translated equivalent when available, falls back gracefully otherwise.

---

## 6. Publishing Model

Status: `draft | in_review | scheduled | published | archived`.

Published record has `published_at` + `published_by`. Unpublishing is audited.
Published educational content is never deleted casually — archive instead.

---

## 7. Authorization (RBAC)

- **Server-side enforcement is mandatory.** Frontend hiding is never the only control.
- Reinforced with **Supabase RLS** at the database level.
- Permission names: `course.read|create|update|publish`, `lesson.create|update|publish`,
  `question.create|review`, `translation.edit|publish`, `book.manage`, `order.read`,
  `seo.manage`, `analytics.read`, `settings.manage`, `users.manage`, `roles.manage`, `audit.read`, …
- Helper: `requirePermission(user, 'course.publish')` throws/redirects on failure.

---

## 8. Service Layer

Business logic lives in `lib/` service modules — **not** scattered in page components.

```text
courseService      create/edit/publish/archive/schedule
lessonService      blocks, reorder, preview, autosave
progressService    completion, course %, resume
assessmentService  quiz/test attempt, scoring, history
commerceService    orders, entitlements, coupons, payment abstraction
mediaService       upload, browse, alt, usage
seoService         metadata, sitemap, redirects
```

Pages call services. Services enforce business rules. DB access stays centralized (Prisma).

---

## 9. Validation

Zod schemas validate: forms, API payloads, query params, admin actions, upload metadata,
commerce data. **Never trust browser-provided role or price data.**

---

## 10. Database Conventions

- lowercase `snake_case` table/column names (mapped via Prisma `@@map` / `@map`).
- UUID or CUID primary keys.
- `created_at`, `updated_at` (timestamptz) on major tables.
- Explicit foreign keys, unique constraints, indexes based on query patterns.
- Migrations committed (`prisma/migrations/`); never dashboard-only schema truth.

---

## 11. Security

- HTTPS via Vercel.
- Secure cookies, CSRF protection where applicable, XSS prevention, parameterized queries.
- Input validation (Zod) on every API boundary.
- Server-side authorization + RLS.
- Rate limiting on sensitive endpoints.
- File upload validation (type + size limits).
- Secure download authorization (entitlement-checked).
- Admin MFA readiness.
- No secrets in Git; service-role key server-side only.
- Audit logs for admin actions (immutable from normal admin UI).

---

## 12. SEO

- Per-entity SEO metadata (title, description, canonical, index/noindex, OG, social image, slug).
- Dynamic XML sitemap (published + indexable only) + robots.txt.
- JSON-LD: Website, Breadcrumbs, Course/Article where appropriate. No fake schema.
- Redirect manager with audit. 404 + 410 handling.

---

## 13. Observability

- Error monitoring, server logs, performance monitoring, DB monitoring, uptime awareness.
- Structured logs. **Never log** passwords, access tokens, payment secrets, unnecessary PII.
- No stack traces exposed to users in production.

---

## 14. Git Workflow

```text
main (production)
  ↑ pull request
  ↑ feature/*
```

Every PR passes: TypeScript + Lint + Tests + Build.
Every meaningful feature is committed independently with a clear message.
No experimental code committed directly to production.

---

## 15. Environments

```text
Local  →  Vercel Preview (per PR)  →  Vercel Production
```

Local dev uses Supabase (or local Postgres mirror) — **not** a divergent SQLite schema in
production. Production publishes only from approved code.

---

## 16. Testing Strategy

- **Unit (Vitest):** utilities, validation, progress calc, scoring, permission checks,
  slug generation, content transforms.
- **Integration:** auth, DB ops, publishing, progress, quizzes, commerce entitlement.
- **E2E (Playwright):** visitor→course→register→login→start→complete→progress→quiz→
  admin create→review→publish→language switch→protected route reject→entitled download.
- **Accessibility:** automated + manual (keyboard, focus, headings, contrast, reduced motion).
- **Performance:** homepage, course, lesson, search, console.

---

## 17. Feature Flags

Used for unfinished/future capabilities (`video_lessons`, `certificates`, `projects`,
`ai_tutor`, `advanced_search`, `affiliate`, `store`). Unfinished features stay **off** publicly.

---

## 18. Documentation Requirements

Repository must include:

```text
README.md
docs/
  plan.md
  product-decisions.md
  tech-stack.md
  architecture.md
  database.md
  content-model.md
  editorial-workflow.md
  security.md
  deployment.md
  testing.md
  contributing.md
```

Every major subsystem has concise documentation.

---

## 19. AI Coding Agent Rules (binding)

1. Read this specification before modifying code.
2. Do not invent product requirements.
3. Do not bypass authentication or RLS.
4. Do not expose secrets.
5. Do not directly modify production data.
6. Do not duplicate entities when an existing one can be reused.
7. Do not hard-code EN/HI fields into core entities.
8. Do not hard-code course lists or role permissions into components.
9. Use DB migrations for schema changes.
10. Add tests for meaningful business logic.
11. Keep public pages SEO-friendly; keep mobile in mind.
12. Preserve backward compatibility for published URLs.
13. Prefer reusable services/components.
14. Explain architectural changes in the commit/PR.
15. Never mark unfinished features as complete.
16. Never replace real requirements with mocks without explicit labeling.
17. Never introduce a dependency when native functionality suffices.

---

## 20. Closing Rule (conflict resolution)

When in conflict:
- visual complexity vs usability → **usability**
- speed of dev vs security → **security**
- short-term convenience vs scalable architecture → **scalable architecture** (when justified)
- more content vs better content → **better content**
- more features vs clearer learning → **clearer learning**

SkillSetu is built as a **real long-term education product**, not a temporary demo.
The initial implementation may be small; the architecture must not be careless.
