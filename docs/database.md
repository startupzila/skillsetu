# SkillSetu — Database Design

**Status:** S2 + S3 complete (full schema: 60 tables)
**Source of truth:** `prisma/schema.prisma`
**Applied via:** `db/migrations/*.sql` (Supabase Dashboard SQL Editor)

---

## Entity Overview

### Identity (Phase 2.1)

| Table | Purpose |
|---|---|
| `profiles` | Learner/staff profile; `id` mirrors `auth.users(id)` |
| `roles` | RBAC roles (super_admin, admin, editorial_manager, …) |
| `permissions` | Granular permissions (course.publish, lesson.update, …) |
| `user_roles` | User ↔ Role (many-to-many) |
| `role_permissions` | Role ↔ Permission (many-to-many) |

A trigger (`on_auth_user_created`) auto-creates a `profiles` row when a user signs
up via Supabase Auth. The FK `profiles.id → auth.users(id)` cascades on delete.

### Taxonomy (Phase 2.2)

| Table | Purpose |
|---|---|
| `categories` | Hierarchical (self-ref `parent_id`); slug, status, sort_order |
| `category_translations` | Per-language name/description (EN + HI) |
| `skills` | Future skill roadmaps (minimal for now) |
| `tags` | Free-form tags |
| `course_tags` | Course ↔ Tag junction |
| `lesson_tags` | Lesson ↔ Tag junction |

### Content — Courses (Phase 2.3)

| Table | Purpose |
|---|---|
| `courses` | Core course entity; slug, status, difficulty, duration, thumbnail |
| `course_translations` | Per-language title, description, outcomes, prerequisites |
| `course_categories` | Course ↔ Category (many-to-many) |
| `course_authors` | Course ↔ Profile (primary/contributor) |
| `modules` | Chapters within a course; slug unique per course |
| `module_translations` | Per-language module title/description |
| `lessons` | Lessons within a module; slug unique per module |
| `lesson_translations` | Per-language lesson title/summary |

### Content — Blocks & Media (Phase 2.4)

| Table | Purpose |
|---|---|
| `lesson_blocks` | Structured content blocks belonging to a `lesson_translation` |
| `media_assets` | Uploaded files (images, PDFs) with alt text, license, etc. |
| `media_usages` | Tracks where a media asset is used (polymorphic) |

---

## Key Design Decisions

### 1. Translation entities (never `title_en` / `title_hi`)

Every translatable entity has a separate `*_translations` table keyed by
`language_code`. This allows adding languages without schema changes, and
supports the translation workflow (draft → in_translation → in_review →
published → needs_update).

### 2. Lesson blocks belong to `lesson_translations`

Blocks are linked to `lesson_translation_id`, not `lesson_id`. This means
each language version of a lesson has its own set of blocks. An image block
in English and Hindi can reference the same `media_asset` but have different
`alt_text` in the block `data` JSON.

### 3. `block_type` is a String, not an enum

Block types are extensible. The known set (heading, paragraph, image, gallery,
video, callout, example, table, quote, code, download, checklist, quiz, mcq,
qa, practice, project, related_content) is validated by Zod schemas in the
service layer, but the DB column is `TEXT` to allow future additions without
migrations.

### 4. `block.data` is JSONB

Each block type has its own data shape, stored as JSONB and validated by Zod.
Examples:
- `heading`: `{ level: 2, text: "What is Excel?" }`
- `paragraph`: `{ text: "Microsoft Excel is..." }`
- `callout`: `{ variant: "info", title: "Did you know?", text: "..." }`
- `checklist`: `{ items: ["Open Excel...", "Identify..."] }`

### 5. UUIDs with DB-level defaults

All primary keys use `UUID DEFAULT gen_random_uuid()`. Since the app uses
the Supabase JS client (not Prisma Client) for inserts, UUIDs must be
generated at the DB level. Prisma's `@default(dbgenerated("gen_random_uuid()"))`
achieves this.

### 6. `updated_at` via DB trigger

Prisma's `@updatedAt` only works with Prisma Client. Since we use the
Supabase JS client, a trigger (`skillsetu_set_updated_at`) auto-updates
`updated_at` on every `UPDATE` for all tables that have the column.

### 7. Slugs: scoped uniqueness

- `courses.slug` — globally unique
- `modules.slug` — unique per course (`@@unique([courseId, slug])`)
- `lessons.slug` — unique per module (`@@unique([moduleId, slug])`)

This allows "introduction" to exist in multiple courses/modules.

### 8. Array fields use JSONB

Per project convention, Prisma scalar lists are not used. Fields like
`learning_outcomes`, `prerequisites`, `target_audience` are `JSONB` (stored
as `string[]`).

---

## RLS Policy Model

| Table | Public read | Authenticated read | Write |
|---|---|---|---|
| `profiles` | — | self only | self only |
| `roles`, `permissions` | — | — | service-role only |
| `user_roles`, `role_permissions` | — | self (user_roles) | service-role |
| `categories` + translations | published only | published only | service-role |
| `courses` + translations | published only | published only | service-role |
| `modules` + translations | published only | published only | service-role |
| `lessons` + translations | published only | published only | service-role |
| `lesson_blocks` | if parent translation published | same | service-role |
| `tags`, `course_tags`, `lesson_tags` | all | all | service-role |
| `media_assets`, `media_usages` | all | all | service-role |

> **Drafts are invisible to the public.** Only `status = 'published'` content
> is readable via the anon key. All writes go through the service-role admin
> client (server-side, behind permission checks in S4).

---

## Seed Data

`db/seeds/001_seed.sql` inserts:
- 11 roles (super_admin → media_manager)
- 19 permissions (course.read → audit.read)
- super_admin ↔ all permissions; admin ↔ operational permissions
- 1 sample category (Office Skills) with EN + HI translations
- 1 sample course (Excel Fundamentals) with EN + HI translations
- 1 module, 1 lesson, 7 content blocks in each language

---

## S3 will add

Assessment (questions, quizzes, tests, attempts), Learner (enrollments,
progress, bookmarks, notes), Editorial (assignments, reviews, revisions),
Commerce (products, orders, payments, coupons, entitlements), SEO/Ops
(seo_metadata, redirects, ad_slots, audit_logs, system_settings).

---

## S3 Entities (Phase 2.5–2.9)

### Assessment (Phase 2.5)

| Table | Purpose |
|---|---|
| `questions` | Core question entity; slug, type, difficulty, status |
| `question_translations` | Per-language question text + explanation |
| `question_options` | Options per question; `text` is JSONB `{en, hi}`, `is_correct` server-only |
| `quizzes` | Chapter quizzes; linked to module/lesson |
| `quiz_translations` | Per-language quiz title/instructions |
| `quiz_questions` | Quiz ↔ Question junction |
| `mock_tests` | Timed tests with question pool, randomization, pass/fail |
| `test_translations` | Per-language test title/instructions |
| `test_questions` | Test ↔ Question junction |
| `attempts` | A learner's attempt at a quiz/test; score, status |
| `attempt_answers` | Individual answers within an attempt |

**Security:** `is_correct` on `question_options` is NEVER sent to the client
before submission. The `assessmentService.preparePublicQuestion()` function
strips it; only `gradeAnswer()` reveals correctness after submission.

### Learner (Phase 2.6)

| Table | Purpose |
|---|---|
| `enrollments` | User ↔ Course; progress %, started/completed |
| `lesson_progress` | Per-lesson status (not_started/in_progress/completed), time spent, last position |
| `bookmarks` | User bookmarks (course/lesson/book); deduped via unique constraint |
| `notes` | Private notes on lessons/courses |

**Server-authoritative:** Progress is never computed from client state alone.
The service layer extracts `auth.uid()` from the session — client-provided
`user_id` is never trusted.

### Editorial (Phase 2.7)

| Table | Purpose |
|---|---|
| `assignments` | Assign content to writers/translators |
| `reviews` | Review requests + status (pending/approved/rejected/changes_requested) |
| `revisions` | Full content snapshots for version history + rollback |
| `editorial_comments` | Comments on content entities (resolvable) |
| `translation_tasks` | Translation assignments with status tracking |
| `audit_logs` | Immutable audit trail for admin actions |

**RLS:** All editorial tables are service-role only (no public policies).
Only the admin client (server-side, behind permission checks) can read/write.

### Commerce (Phase 2.8)

| Table | Purpose |
|---|---|
| `products` | Books, course access, resources, bundles |
| `product_variants` | SKU, price, format (pdf/ebook/print), storage path |
| `orders` | User orders; status, total, coupon, discount |
| `order_items` | Line items in an order |
| `payments` | Payment records; provider, status (provider-neutral abstraction) |
| `coupons` | Fixed/percentage discounts, usage limits, expiry |
| `entitlements` | User ↔ Product access grants (source: purchase/gift/grant) |
| `course_products` | Course ↔ Product junction |
| `course_books` | Course ↔ Book junction (recommended resources) |
| `lesson_books` | Lesson ↔ Book junction |

**Payment provider abstraction:** `PaymentProvider` enum supports `manual`,
`razorpay`, `stripe`. The commerce service uses a provider-neutral interface;
concrete provider is chosen at launch.

### SEO / Marketing / Ops (Phase 2.9)

| Table | Purpose |
|---|---|
| `seo_metadata` | Per-entity SEO (title, description, canonical, OG, noindex) |
| `redirects` | 301 redirect manager (from_path → to_url) |
| `ad_slots` | Ad slot configuration (header/content_top/.../footer) |
| `affiliate_links` | Managed affiliate links with disclosure |
| `custom_code` | Controlled head/body scripts (role-restricted, audited) |
| `notifications` | In-app notifications (self-only access) |
| `system_settings` | Key-value settings (public read if `is_public = true`) |

---

## RLS Policy Summary (S3)

| Group | Public read | Self-only | Service-role only |
|---|---|---|---|
| Assessment (published) | ✅ questions, quizzes, tests, translations, options | attempts, attempt_answers | — |
| Learner | — | enrollments, progress, bookmarks, notes | — |
| Editorial | — | — | assignments, reviews, revisions, comments, translation_tasks, audit_logs |
| Commerce | products, variants, junctions | orders, payments, entitlements | coupons |
| SEO/Ops | seo_metadata, redirects (active), ad_slots (active), affiliate_links (active), custom_code (active), system_settings (public) | notifications | — |
