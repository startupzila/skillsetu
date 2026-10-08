# SkillSetu — Launch Checklist

**Status:** ✅ MVP Ready for Launch
**Date:** 2026-10-08

---

## Pre-Launch Verification (All Passed)

### Public Website
- [x] Homepage renders (hero, categories, featured courses, methodology)
- [x] /courses — all courses listing with category filters
- [x] /courses/[slug] — course detail with curriculum
- [x] /courses/[slug]/[module]/[lesson] — lesson page (w3schools-style: left sidebar, prev/next top+bottom)
- [x] /skills — all categories listing
- [x] /skills/[slug] — category detail with courses
- [x] /search?q= — search results with type badges
- [x] /quiz/[slug] — interactive quiz with scoring + review
- [x] /store — product grid
- [x] /store/[slug] — product detail with Buy now / Download
- [x] /books — book listing
- [x] /[slug] — CMS static pages (about, privacy, terms, contact, refund, affiliate-disclosure)
- [x] /login, /register, /forgot-password, /reset-password — auth pages
- [x] Sitemap (18 URLs)
- [x] Robots.txt (allows /, disallows /console, /api, /dashboard)
- [x] 301 redirect (/excel → /courses/excel-fundamentals)
- [x] 404 page for non-existent routes

### Learner Dashboard
- [x] /dashboard — stats, continue learning, saved, notes, orders, downloads
- [x] Requires authentication (redirects to /login)

### Console (Admin)
- [x] /console — dashboard with roles + permissions
- [x] /console/courses — list + create + edit + publish + archive
- [x] /console/courses/[id] — course editor with curriculum
- [x] /console/courses/[id]/lessons/[lessonId] — lesson editor with block editor
- [x] /console/questions — question bank list + create + detail
- [x] /console/media — media library (upload, browse, edit, delete)
- [x] /console/pages — static pages CRUD
- [x] /console/templates — 4 course templates
- [x] /console/qa — content QA checklist
- [x] /console/products — products CRUD + publish
- [x] /console/orders — orders list + mark paid
- [x] /console/coupons — coupon manager
- [x] /console/affiliates — affiliate link manager
- [x] /console/ads — ad slot manager
- [x] /console/redirects — redirect manager
- [x] /console/custom-code — custom code manager
- [x] /console/analytics — 12 metrics + recent activity
- [x] Console protected (redirects to /login if not authenticated)

### API
- [x] /api/health — returns status:ok, schema:applied
- [x] /api/courses — published courses
- [x] /api/categories — published categories
- [x] /api/quiz — published quiz (no is_correct)
- [x] /api/quiz/grade — grades answer (reveals correctness)
- [x] /api/quiz/attempts — start + submit (server-side scoring)
- [x] /api/progress/lesson — start/complete lesson (requires auth)
- [x] /api/bookmarks — toggle + list (requires auth)
- [x] /api/notes — CRUD (requires auth)
- [x] /api/commerce/orders — create order (requires auth)
- [x] /api/commerce/download — signed download URL (requires auth)
- [x] /api/analytics/track — event tracking
- [x] /api/auth/register, login, logout, forgot-password, reset-password, callback
- [x] /api/admin/* — all admin CRUD routes (permission-checked)
- [x] /api/admin/analytics — metrics + recent events

### Database
- [x] 62 tables (60 from schema + 2 static pages)
- [x] 18 enums
- [x] 66+ RLS policies
- [x] Triggers (updated_at, auth.users FK, profile auto-create)
- [x] Seed data: 11 roles, 19 permissions, 4 courses, 2 categories, 5 modules, 5 lessons, 1 question, 1 quiz, 1 product, 1 coupon, 6 static pages, 1 affiliate link, 1 ad slot

### Security
- [x] RLS enabled on all tables
- [x] is_correct stripped before client delivery
- [x] Learner data self-only
- [x] Editorial tables service-role only
- [x] Service-role key server-only (never in client bundles)
- [x] No secrets in Git
- [x] File upload validated (type + 10MB max)
- [x] Downloads use signed URLs (1hr expiry)
- [x] Password validation (min 8 chars)
- [x] Redirect validation (301/302 only)
- [x] HTML sanitization

### SEO
- [x] Dynamic XML sitemap (18 URLs, published content only)
- [x] Robots.txt (allows /, disallows console/api)
- [x] JSON-LD: WebSite (SearchAction), Course, BreadcrumbList
- [x] Per-page metadata (generateMetadata)
- [x] Breadcrumbs on category + course + lesson pages
- [x] Canonical URLs support
- [x] Redirect manager (301/302)

### Design
- [x] Light/dark theme (default: light)
- [x] Teal brand color (not indigo/blue)
- [x] Responsive (mobile, tablet, desktop)
- [x] w3schools-style lesson layout (fixed sidebar, prev/next top+bottom)
- [x] Single Close (X) button on all Sheets
- [x] Sticky footer
- [x] Accessible (focus-visible, reduced-motion, ARIA roles)

### Testing
- [x] 74 unit tests (Vitest) — all passing
- [x] Tests: slugify, formatPrice, progress, discount, block types, transitions, auth, security

### Multilingual
- [x] Translation entities (never title_en/title_hi)
- [x] EN + HI translations on all seed content
- [x] Language switcher (cookie-based)
- [x] Fallback when translation unavailable

### Commerce
- [x] Product model with variants
- [x] Store + product detail pages
- [x] Order creation with coupon validation
- [x] Admin: mark order paid → creates entitlements
- [x] Protected downloads (signed URLs)
- [x] Coupon manager (fixed/percentage, usage limits, expiry)
- [x] Payment abstracted (manual for MVP; Razorpay/Stripe ready)

---

## Production Deployment

### Vercel
1. Import GitHub repository into Vercel
2. Framework: Next.js
3. Environment variables (see `.env.example`):
   - `NEXT_PUBLIC_SITE_URL` — production URL
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — service-role key (server-only)
   - `DATABASE_URL` — Supabase Postgres connection string
4. Deploy

### Supabase
- Database: 62 tables applied (via `bun run db:apply`)
- Auth: Email/password enabled
- Storage: `media` (public) + `downloads` (private) buckets
- RLS: Enabled on all tables

### Post-Deploy
1. Verify `/api/health` returns `status:ok`
2. Test registration → login → lesson → quiz flow
3. Test console access (assign staff role)
4. Verify sitemap + robots.txt
5. Submit sitemap to Google Search Console

---

## First Production Milestone (North Star)

> A real learner can visit the deployment, browse a real course, register, start a real
> lesson, read structured content, answer a chapter quiz, see progress, switch between
> English and Hindi, and resume learning later.
>
> At the same time, an authorized editorial user can log into `/console/`, create/edit/
> review/publish the same course content without touching code.

✅ **Achieved.**
