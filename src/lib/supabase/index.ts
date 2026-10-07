/**
 * Supabase clients for SkillSetu.
 *
 * Three clients, each with a distinct purpose:
 *
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │ createBrowserSupabaseClient()  — browser, anon key, RLS on   │
 *  │ createServerSupabaseClient()   — server,  anon key, RLS on   │
 *  │ createAdminClient()            — server,  service role, RLS OFF │
 *  └──────────────────────────────────────────────────────────────┘
 *
 * Runtime data access uses these clients over HTTPS (port 443).
 * Prisma (src/lib/db.ts) is the schema source-of-truth only; it is
 * pushed to Supabase with `bun run db:push` from outside the sandbox
 * (raw TCP 5432 is blocked here). See docs/architecture.md.
 */
export { createBrowserSupabaseClient } from './browser'
export { createServerSupabaseClient } from './server'
export { createAdminClient } from './admin'
export { getSupabaseEnvStatus, type SupabaseEnvStatus } from './env'
