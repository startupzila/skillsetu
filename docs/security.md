# SkillSetu — Security

**Status:** S4 complete (Authentication & RBAC)
**Source:** SkillSetu Production Platform Specification §47, §65, §67, §27

---

## 1. Authentication

### Provider
**Supabase Auth** with `@supabase/ssr` for cookie-based server sessions.

### Supported methods (MVP)
- Email + password registration
- Email verification (sent on signup)
- Login with email + password
- Password reset (forgot-password → reset-password flow)
- Logout

### Future (not in MVP)
- Google OAuth and other social providers (configurable in Supabase Dashboard).
- MFA (documented below; not enforced).

### Session handling
- Sessions are stored in secure HTTP-only cookies managed by `@supabase/ssr`.
- The middleware (`src/middleware.ts`) refreshes the session on every request
  so Server Components see the latest auth state.
- The server Supabase client (`createServerSupabaseClient()`) reads the session
  from cookies; RLS enforces user-scoped access.

### Profile creation
A database trigger (`on_auth_user_created` in `002_triggers.sql`) auto-creates
a `profiles` row when a new user signs up. The `profiles.id` is a foreign key
to `auth.users(id) ON DELETE CASCADE`, so deleting a user in Supabase Auth
also deletes their profile.

---

## 2. Authorization (RBAC)

### Roles
Defined in `db/seeds/001_seed.sql`:

| Role | Scope |
|---|---|
| `super_admin` | Full access (implicitly has all permissions) |
| `admin` | Operational access (all except roles.manage, audit.read) |
| `editorial_manager` | Manages content workflow and writers |
| `content_writer` | Creates/edits assigned content |
| `reviewer` | Reviews content |
| `translator` | Translates assigned content |
| `quiz_editor` | Creates/reviews questions |
| `commerce_manager` | Books, products, orders |
| `marketing_manager` | SEO, analytics, ads, affiliate |
| `analyst` | Read-only analytics |
| `media_manager` | Media management |

### Permissions
Granular, named permissions (e.g. `course.publish`, `lesson.update`,
`translation.publish`, `users.manage`). See `src/lib/auth/permissions.ts`
for the full list. Roles ↔ permissions are stored in `role_permissions`
(seed assigns all permissions to `super_admin`).

### Enforcement layers (defense in depth)
1. **Server-side helpers** (`src/lib/auth/session.ts`):
   - `requireUser()` — throws `AuthError(UNAUTHENTICATED)`
   - `requireRole(...roles)` — throws `AuthError(FORBIDDEN)`
   - `requirePermission(perm)` — throws `AuthError(FORBIDDEN)`
   - `hasPermission(session, perm)` / `hasRole(session, ...roles)` — boolean checks
   - `isStaff(session)` — is the user a console-capable role?
2. **Supabase RLS** — enforces row-level access at the database level
   (see `db/migrations/003_rls.sql` + `005_rls_s3.sql`). Even if a server
   helper is bypassed, RLS blocks unauthorized reads/writes.
3. **Console middleware** — `src/middleware.ts` redirects unauthenticated
   users from `/console/*` to `/login`.

### Critical rule
> **Frontend hiding is never the only control.** UI elements may be hidden
> based on permissions, but every API route and server action MUST enforce
> authorization independently.

### super_admin shortcut
If a user has the `super_admin` role, their `permissions` array contains `'*'`,
which `hasPermission()` treats as "all permissions". This avoids needing to
sync every permission to the super_admin role manually.

---

## 3. /console Protection

- `/console/*` routes require an authenticated session (middleware redirects to `/login`).
- The console layout (`src/app/console/layout.tsx`) additionally checks `isStaff()`.
  If a user is authenticated but has no staff role, they see a "no access" page
  (not a redirect loop).
- Individual console modules use `requirePermission()` in their server components
  / API routes for fine-grained access.

---

## 4. Audit Logging

The `audit_logs` table records administrative actions. The `recordAudit()`
helper (`src/lib/auth/audit.ts`) writes entries via the service-role admin
client (bypasses RLS, server-only).

### What gets audited
- Login / security events (future: wired in S4+ where relevant)
- Role changes
- Content publication / unpublication
- Content deletion / archive
- Permission changes
- Price / product changes
- Custom code changes
- SEO / redirect changes
- User management
- Refunds

### Immutability
Audit logs are immutable from the normal admin UI — no RLS policy allows
`UPDATE` or `DELETE` by any role. Only direct DB access (break-glass) can
modify them.

---

## 5. MFA Readiness

MFA is **not enforced** in the MVP, but the architecture supports it:
- Supabase Auth supports TOTP MFA (enrollable via the Auth API).
- The `requireUser()` helper can be extended to check MFA factors.
- A future `requireMFA()` helper can gate sensitive console actions.

### Recommended (post-MVP)
- Require MFA for `super_admin` and `admin` roles.
- Enforce MFA before destructive actions (delete, role change).

---

## 6. Secret Management

- `.env` is gitignored; `.env.example` ships with placeholders only.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — never imported in Client Components.
- `createAdminClient()` throws if the service-role key is missing.
- In production, secrets are managed in Vercel Environment Variables.
- Tokens are never logged.

---

## 7. Input Validation

All API routes validate input with explicit checks (and Zod schemas will be
added in S9+ for complex payloads). Never trust browser-provided:
- `user_id` (always extracted from the session via `auth.uid()`)
- `role` or `price` values
- Entity ownership claims

---

## 8. Rate Limiting (roadmap)

Sensitive endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`)
should be rate-limited. This is planned for S16 (security review). For MVP,
Supabase Auth has built-in email rate limits.

---

## 9. File Upload Security (roadmap)

- File type validation (images: jpg/png/webp; documents: pdf)
- File size limits
- Storage bucket policies (public read for images; private for paid downloads)
- Entitlement-checked downloads (S14)

---

## 10. Security Checklist (S17 verification)

- [ ] RLS enabled on every table
- [ ] No service-role key in client bundles
- [ ] All API routes enforce authorization
- [ ] No secrets in Git
- [ ] No secrets in logs
- [ ] Error responses don't leak stack traces
- [ ] Admin actions audited
- [ ] HTTPS enforced (Vercel)
- [ ] Secure cookies (Supabase default)
