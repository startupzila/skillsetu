# SkillSetu — Database Design

**Status:** S2 complete (Identity, Taxonomy, Content, Blocks/Media)
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
