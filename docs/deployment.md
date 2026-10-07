# SkillSetu — Deployment Guide

**Status:** Active (S1+)
**Target:** Vercel (hosting) + Supabase (database, auth, storage)

---

## 1. Prerequisites

- A Supabase project (URL, anon key, service-role key, Postgres connection string).
- A GitHub repository (`startupzila/skillsetu`).
- A Vercel account linked to the GitHub repository.

---

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in real values. In Vercel, add the same
keys in **Project → Settings → Environment Variables**.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL (no trailing slash) |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon (publishable) key — RLS applies |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | Service-role key — bypasses RLS. Never expose to browser |
| `DATABASE_URL` | server-only | Supabase Postgres direct connection string (used by Prisma) |

> **Security:** `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` must never be
> imported in Client Components. They are server-only.

---

## 3. Data Access Architecture

SkillSetu uses **two complementary layers**:

### 3.1 Runtime data access — Supabase JS client (HTTPS)

All application code reads and writes data through the Supabase JS client
(`@supabase/supabase-js` + `@supabase/ssr`) over **HTTPS (port 443)**.

Three clients in `src/lib/supabase/`:

| Client | Key | RLS | Use |
|---|---|---|---|
| `createBrowserSupabaseClient()` | anon | on | Client Components |
| `createServerSupabaseClient()` | anon | on | Server Components, Route Handlers, Server Actions |
| `createAdminClient()` | service-role | off | Trusted server-only operations (console, webhooks) |

### 3.2 Schema source-of-truth — Prisma

`prisma/schema.prisma` is the canonical definition of every table, column,
relation and index. It is pushed to Supabase Postgres with `bun run db:push`.

> **Why two layers?** The development sandbox blocks raw TCP (Postgres port
> 5432) but allows HTTPS (port 443). The Supabase JS client works over HTTPS
> everywhere, so the application runs identically in the sandbox, in preview
> and in production. Prisma is used purely for schema management — it does
> not participate in runtime queries.

---

## 4. Applying Database Migrations

The Prisma schema is the schema source-of-truth. Apply it to Supabase using
**one** of the following methods.

### Method A — `db:push` from your local machine (recommended)

On your local development machine (where Postgres port 5432 is reachable):

```bash
# 1. Copy .env.example to .env and fill in DATABASE_URL
# 2. Install dependencies
bun install

# 3. Push the schema to Supabase Postgres
bun run db:push

# 4. Regenerate the Prisma Client (if you use it locally)
bun run db:generate
```

### Method B — Supabase Dashboard SQL Editor

1. Open the Supabase Dashboard → **SQL Editor**.
2. Generate SQL from the Prisma schema (`bun run db:push` does this
   automatically when run locally; or use `prisma migrate diff` to emit SQL).
3. Paste and run the DDL in the SQL Editor.

### Method C — Prisma Migrate (for tracked migration history)

For production schema evolution with versioned migration files:

```bash
bun run db:migrate   # creates + applies a migration
```

Migration files are committed to `prisma/migrations/` and must never be
created via the Supabase Dashboard alone.

---

## 5. Verification

After deploying, verify the setup:

1. Visit `/api/health` — should return `status: "ok"` with Supabase reachable.
2. Visit `/` — should show the SkillSetu landing page.

---

## 6. Vercel Setup

1. Import the GitHub repository into Vercel.
2. Framework preset: **Next.js**.
3. Add all environment variables (see §2).
4. Build command: `next build` (default).
5. Output: Vercel handles Next.js output automatically.
6. Deploy. Preview deployments are created automatically per pull request.

---

## 7. Supabase Project Configuration

### 7.1 Database

- Region: South Asia (Mumbai) — `ap-south-1`.
- Connection: use the direct connection string for `DATABASE_URL`
  (Prisma), and the REST API (HTTPS) for the JS client.

### 7.2 Auth

- Enable Email/Password provider.
- Configure email templates (verification, password reset) as needed.
- Site URL: the Vercel production URL.
- Redirect URLs: production URL + `localhost:3000` for local dev.

### 7.3 Storage

- Create buckets for: `media` (images), `downloads` (PDFs / resources).
- Set bucket policies (public read for images; private for paid downloads).

### 7.4 Row Level Security

Enable RLS on every table that stores user-facing data. Policies are defined
as the schema grows (S2 onwards). The service-role key bypasses RLS — it is
only used server-side in `createAdminClient()`.

---

## 8. Local Development

```bash
bun install
cp .env.example .env   # fill in Supabase credentials
bun run dev            # http://localhost:3000
bun run lint           # ESLint
```

> The dev server runs on port 3000. The application connects to Supabase
> over HTTPS, so it works inside the sandbox and on any local machine
> with internet access — no local Postgres required.

---

## 9. Continuous Deployment

- `main` branch → Vercel production deployment.
- Pull requests → Vercel preview deployments.
- Every meaningful feature is committed independently.
- Production secrets are managed in Vercel, never in Git.
