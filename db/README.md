# SkillSetu — Database Migrations & Seeds

The database schema is defined in `prisma/schema.prisma` (source of truth) and applied
to Supabase PostgreSQL via the SQL files in this directory.

## Automated Application (Recommended)

The agent applies migrations automatically via the Supabase connection pooler (IPv4,
port 6543). No manual Dashboard work is needed.

```bash
# Check connection + list files to apply
bun run db:check

# Apply all migrations + seeds (idempotent for "already exists" errors)
bun run db:apply

# Hard reset: drop all public schema objects, then re-apply
bun run db:reset:hard && bun run db:apply
```

The scripts use the `pg` library to connect to the Supabase pooler
(`aws-0-ap-south-1.pooler.supabase.com:6543`), which is reachable from the dev
sandbox (unlike the direct Postgres host on port 5432 which is IPv6-only and blocked).

## Migration Files (applied in order)

| Order | File | Purpose |
|-------|------|---------|
| 1 | `migrations/001_schema.sql` | ALL 60 tables, 18 enums, 39 indexes (full schema) |
| 2 | `migrations/002_triggers.sql` | updated_at triggers (all tables), auth.users FK, profile auto-create, enable RLS (all tables) |
| 3 | `migrations/003_rls.sql` | ALL 66 RLS policies (public read published, self-only learner, service-role editorial) |
| 4 | `seeds/001_seed.sql` | Roles, permissions, sample course (Excel Fundamentals) with EN+HI |
| 5 | `seeds/002_seed_s3.sql` | Sample question, quiz, book product, coupon |

## What's in the Schema (60 tables total)

**Identity:** profiles, roles, permissions, user_roles, role_permissions
**Taxonomy:** categories, category_translations, skills, tags, course_tags, lesson_tags
**Content:** courses, course_translations, course_categories, course_authors,
modules, module_translations, lessons, lesson_translations
**Blocks & Media:** lesson_blocks, media_assets, media_usages
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
`updated_at` on every `UPDATE` for all tables that have the column. The trigger is
attached dynamically via a `DO $$ ... $$` loop in `002_triggers.sql`.

## auth.users Linkage

`profiles.id` is a foreign key to `auth.users(id) ON DELETE CASCADE`. A trigger
(`on_auth_user_created`) automatically creates a profile row when a user signs up
via Supabase Auth.

## RLS Policy Model

- **Published content:** public read (anon + authenticated)
- **Drafts:** invisible (no public policy)
- **profiles:** self read/update/insert
- **roles, permissions, role_permissions:** public read (system metadata, needed for RBAC lookups); writes service-role only
- **user_roles:** self read
- **Learner data (enrollments, progress, bookmarks, notes):** self only
- **Editorial (assignments, reviews, revisions, etc.):** service-role only
- **Commerce:** products public read; orders/payments/entitlements self-only; coupons service-role
- **SEO/Ops:** seo_metadata/redirects/ad_slots/affiliate_links/custom_code public read active; notifications self; system_settings public if is_public

## Manual Application (Alternative)

If you need to apply SQL manually (e.g. via the Supabase Dashboard SQL Editor):

1. Open https://supabase.com/dashboard/project/nuzxwzacqiwjkrmyttic/sql/new
2. Copy-paste each file in order (001 → 002 → 003 → seed 001 → seed 002) and click Run.

But this is rarely needed — `bun run db:apply` handles everything automatically.

## Regenerating SQL from Prisma

If you change `prisma/schema.prisma`, regenerate `001_schema.sql`:

```bash
bunx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > db/migrations/001_schema.sql
```

Then run `bun run db:reset:hard && bun run db:apply` to re-apply.
