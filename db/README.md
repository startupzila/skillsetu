# SkillSetu — Database Migrations & Seeds

The database schema is defined in `prisma/schema.prisma` (source of truth) and applied
to Supabase PostgreSQL via the SQL files in this directory.

## How to Apply (Supabase Dashboard SQL Editor)

> The dev sandbox blocks raw TCP Postgres (port 5432), so `prisma db push`
> cannot run from here. Apply the SQL via the Supabase Dashboard instead.

1. Open your Supabase project: **https://supabase.com/dashboard/project/nuzxwzacqiwjkrmyttic**
2. Go to **SQL Editor** → **New query**
3. Copy-paste each file **in order** and click **Run**:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `migrations/001_tables.sql` | S2 tables (Identity, Taxonomy, Content, Blocks/Media) |
| 2 | `migrations/002_triggers.sql` | updated_at triggers, auth.users FK, profile auto-create, enable RLS on S2 tables |
| 3 | `migrations/003_rls.sql` | RLS policies for S2 tables |
| 4 | `seeds/001_seed.sql` | Demo data: roles, permissions, sample course (Excel Fundamentals) |
| 5 | `migrations/004_tables_s3.sql` | S3 tables (Assessment, Learner, Editorial, Commerce, SEO/Ops) |
| 6 | `migrations/005_rls_s3.sql` | RLS policies + enable RLS on S3 tables |
| 7 | `migrations/006_triggers_s3.sql` | updated_at triggers on S3 tables (idempotent) |
| 8 | `seeds/002_seed_s3.sql` | Demo data: sample question, quiz, book product, coupon |

## Alternative: Run from your local machine

If you have Node/Bun and Postgres port 5432 access locally:

```bash
bun install
cp .env.example .env   # fill in DATABASE_URL
bun run db:push        # pushes prisma/schema.prisma to Supabase
```

Then run `002_triggers.sql`, `003_rls.sql`, and `seeds/001_seed.sql` via the
Dashboard SQL Editor (Prisma db:push creates tables but not triggers/RLS/seeds).

## What S2 Creates

**Identity:** profiles, roles, permissions, user_roles, role_permissions
**Taxonomy:** categories, category_translations, skills, tags, course_tags, lesson_tags
**Content:** courses, course_translations, course_categories, course_authors,
modules, module_translations, lessons, lesson_translations
**Blocks & Media:** lesson_blocks, media_assets, media_usages

## What S3 Creates

**Assessment:** questions, question_translations, question_options, quizzes, quiz_translations,
quiz_questions, mock_tests, test_translations, test_questions, attempts, attempt_answers
**Learner:** enrollments, lesson_progress, bookmarks, notes
**Editorial:** assignments, reviews, revisions, editorial_comments, translation_tasks, audit_logs
**Commerce:** products, product_variants, orders, order_items, payments, coupons, entitlements,
course_products, course_books, lesson_books
**SEO/Ops:** seo_metadata, redirects, ad_slots, affiliate_links, custom_code, notifications, system_settings

## Updated_at Triggers

Prisma's `@updatedAt` only works with Prisma Client. Since we use the Supabase JS
client at runtime, a DB-level trigger (`skillsetu_set_updated_at`) auto-updates
`updated_at` on every `UPDATE` for all tables that have the column.

## auth.users Linkage

`profiles.id` is a foreign key to `auth.users(id) ON DELETE CASCADE`. A trigger
(`on_auth_user_created`) automatically creates a profile row when a user signs up
via Supabase Auth.
