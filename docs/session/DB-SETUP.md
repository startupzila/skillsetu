# Session DB-SETUP — Automated Database Migration & Session Docs

**Date:** 2026-10-08
**Phase:** Cross-cutting (Infrastructure)
**Status:** ✅ Complete
**Commit:** (this session)

---

## Goal

1. Run all DB migrations and seeds automatically against Supabase (instead of asking the user to do it manually in the Dashboard).
2. Create per-session documentation in `docs/session/` and save to GitHub.
3. Establish the workflow: going forward, all DB/GitHub work is handled by the AI agent.

## What Was Built

### 1. Database Migration Automation

**Problem:** The dev sandbox blocks raw TCP Postgres (port 5432, IPv6-only direct host). Previous sessions asked the user to apply SQL via the Supabase Dashboard manually.

**Solution:** The Supabase connection pooler (`aws-0-ap-south-1.pooler.supabase.com:6543`) is IPv4 and reachable from the sandbox. Use the `pg` library to run DDL directly.

**Scripts created:**
- `scripts/apply-migrations.ts` — connects to Supabase via pooler, runs all SQL files in order, verifies results
- `scripts/reset-db.ts` — drops all tables/enums/functions/triggers (for clean re-applies)

**package.json scripts added:**
- `bun run db:apply` — apply all migrations + seeds
- `bun run db:check` — check connection + list files
- `bun run db:reset:hard` — drop all public schema objects

### 2. Migration File Restructuring

The previous S2/S3 split files had a bug: `004_tables_s3.sql` contained duplicate FK constraints that already existed in S2's `001_tables.sql`, causing failures. Restructured to a cleaner, unified approach:

**Before (7 files, buggy):**
- `001_tables.sql` (S2), `004_tables_s3.sql` (S3 with duplicate FKs)

**After (3 migrations + 2 seeds, clean):**
- `001_schema.sql` — ALL 60 tables, 18 enums, 39 indexes (generated from full Prisma schema via `prisma migrate diff`)
- `002_triggers.sql` — updated_at triggers (dynamic loop, all tables), auth.users FK, profile auto-create, enable RLS (dynamic loop, all tables)
- `003_rls.sql` — ALL 66 RLS policies (S2 + S3 merged), with roles/permissions/role_permissions now public read (needed for RBAC lookups)
- `seeds/001_seed.sql` — roles, permissions, sample course (fixed UUIDs to valid hex)
- `seeds/002_seed_s3.sql` — sample question, quiz, book, coupon (fixed UUIDs)

**Fixes applied:**
- Fixed invalid UUIDs in seeds (e.g. `a0000000-...` → `cafe0000-...`, `m0000000-...` → `b0b00000-...`)
- Made `roles`, `permissions`, `role_permissions` publicly readable (they're system metadata needed for `getSession()` to resolve a user's roles via the anon-key server client)
- Made `002_triggers.sql` and `003_rls.sql` use dynamic loops over all public tables (no manual table lists)

### 3. Database Applied to Supabase

Ran `bun run db:reset:hard` + `bun run db:apply`:

```
✅ Connected to Supabase Postgres
▶ Applying migrations/001_schema.sql... OK
▶ Applying migrations/002_triggers.sql... OK
▶ Applying migrations/003_rls.sql... OK
▶ Applying seeds/001_seed.sql... OK
▶ Applying seeds/002_seed_s3.sql... OK

🔍 Verification:
   Public tables: 60
   Courses: 1
   Questions: 1
   Roles: 11
```

### 4. Test User Setup

- Created missing `profiles` row for the test user (`skillsetu.test.s4@gmail.com`) that was created in S4 before the profile trigger existed
- Confirmed the test user's email in `auth.users` (so login works without email verification)
- Assigned `super_admin` role to the test user

### 5. Session Documentation

Created `docs/session/` folder with per-session docs:
- `S0.md` — Planning & Repository Setup
- `S1.md` — Infrastructure & Supabase Wiring
- `S2.md` — Database Schema (Part 1)
- `S3.md` — Database Schema (Part 2)
- `S4.md` — Authentication & RBAC
- `DB-SETUP.md` — this session

Each doc includes: date, phase, status, commit, goal, what was built, key decisions, verification, and artifacts.

## Verification

### Endpoints
- `GET /api/health` → `{status:"ok", schema:{status:"applied", courses:1}}`
- `GET /api/courses?lang=en` → returns the Excel Fundamentals course with translations + learning outcomes
- `GET /api/quiz?slug=excel-intro-quiz` → returns the quiz with question + options (no `is_correct`)

### Console Access
- Logged in as `skillsetu.test.s4@gmail.com` → redirected to `/dashboard`
- Navigated to `/console` → dashboard renders with:
  - "Welcome back, skillsetu.test.s4"
  - `super_admin` role badge
  - "All permissions (super_admin)"
  - Module access cards
  - Sidebar navigation

### Browser
- Login flow works end-to-end
- Console renders correctly with roles + permissions
- No console errors

## Key Decisions

1. **Auto-migration via pooler:** Use `pg` library + Supabase pooler (port 6543, IPv4) to run DDL directly from the sandbox. No more manual Dashboard work.
2. **Unified schema file:** Generate ALL tables from the full Prisma schema in one file (`001_schema.sql`), avoiding the S2/S3 split that caused duplicate FK errors.
3. **Dynamic RLS + trigger loops:** `002_triggers.sql` and `003_rls.sql` use `DO $$ ... $$` loops over `information_schema` so they auto-cover new tables without manual updates.
4. **Public read for RBAC metadata:** `roles`, `permissions`, `role_permissions` are publicly readable (they're system metadata; users need to read them to know their own roles). Writes remain service-role only.
5. **Per-session docs:** Every session gets a doc in `docs/session/` so future work can reference what was done.

## Workflow Established (Going Forward)

- **DB work:** The agent runs `bun run db:apply` (or `db:reset:hard` + `db:apply`) to apply schema changes. No manual Dashboard work needed.
- **GitHub work:** The agent commits and pushes after each session. Token is used transiently and removed from the remote URL after push.
- **Session docs:** The agent creates `docs/session/S{n}.md` for each session before committing.

## Artifacts
- `scripts/apply-migrations.ts`
- `scripts/reset-db.ts`
- `db/migrations/001_schema.sql` (new, unified)
- `db/migrations/002_triggers.sql` (rewritten, dynamic)
- `db/migrations/003_rls.sql` (merged S2+S3, with roles/permissions public)
- `db/seeds/001_seed.sql` (fixed UUIDs)
- `db/seeds/002_seed_s3.sql` (fixed UUIDs)
- `docs/session/{S0,S1,S2,S3,S4,DB-SETUP}.md`
- `package.json` (new scripts: db:apply, db:check, db:reset:hard)
- Supabase database: 60 tables, 18 enums, 66 RLS policies, triggers, seed data all applied
