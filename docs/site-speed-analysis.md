# Site Speed Analysis & Mobile Polish Report

## Executive Summary

The MioDemy platform is currently **functional but slow** on initial page loads
(2–5 seconds on warm cache, 5–10s on cold compile). The main bottlenecks are:

1. **N+1 database queries** in the course detail page (1 + N_modules + N_modules×N_lessons queries)
2. **Middleware makes 2 Supabase API calls on EVERY request** (redirect manager + getUser)
3. **Search service fetches ALL rows and filters in JavaScript** instead of using DB-level ILIKE
4. **No caching** — every page is a fresh server-rendered fetch with no `revalidate`
5. **Heavy client bundle** — TipTap WYSIWYG editor (11MB) loaded on lesson pages even when not editing
6. **No image optimization** — raw `<img>` tags, no `next/image`

This document breaks down each issue with its severity, root cause, and recommended fix.

---

## 1. Database N+1 Queries (SEVERITY: HIGH)

### Problem
`getPublishedCourseBySlug` in `src/lib/content/course-service.ts` fetches a course's
curriculum using nested loops — one query per module, then one query per lesson:

```
1 query  → course + translations
1 query  → all modules
N queries → module_translations + lessons (one per module)
M queries → lesson_translations (one per lesson)
```

For a course with 3 modules × 6 lessons = **22 round-trips** to Supabase (each ~50-100ms).
Total: **1-2 seconds** just on DB latency.

### Fix
Replace the loop with a single nested Supabase query using the `!inner` join hint:

```ts
const { data: course } = await supabase
  .from('courses')
  .select(`
    *,
    translations:course_translations(...),
    modules:modules(
      id, slug, sort_order, status,
      translations:module_translations(...),
      lessons:lessons(
        id, slug, sort_order, duration_minutes, status,
        translations:lesson_translations(...)
      )
    )
  `)
  .eq('slug', slug)
  .eq('status', 'published')
  .single()
```

This collapses 22 queries into **1 query** — a 20× improvement.

### Same pattern in `adminListModules`
The admin service also loops over modules to fetch translations + lessons. Same fix applies.

---

## 2. Middleware Double Supabase Call (SEVERITY: HIGH)

### Problem
`src/middleware.ts` runs on EVERY request (including static assets, API calls, etc.).
It makes TWO Supabase API calls per request:

1. **Redirect manager**: `supabase.from('redirects').select(...).eq('from_path', pathname).single()`
2. **Session refresh**: `supabase.auth.getUser()`

Each Supabase API call adds ~50-150ms. Two calls = **100-300ms overhead on every page load**,
including static pages, images, and API routes.

### Fix
1. **Skip redirect manager for API routes** — redirects are for pages only, not `/api/*`.
2. **Skip both calls for static assets** — the matcher already excludes `_next/static`, but
   `_next/data` and other paths still hit the middleware. Tighten the matcher.
3. **Cache redirect lookups** — redirect rules rarely change; cache in a module-level Map
   with a 60s TTL instead of querying every request.
4. **Lazy session refresh** — only call `getUser()` on routes that need it (console, dashboard,
   pages that show auth state). Public pages don't need a fresh session on every request.

```ts
// Only run Supabase logic for page routes (not /api/*, not _next/*)
if (internalPath.startsWith('/api/') || internalPath.startsWith('/_next/')) {
  return withNoindex(response)
}
```

---

## 3. Search Service Fetches All Rows (SEVERITY: MEDIUM)

### Problem
`src/lib/content/search-service.ts` fetches ALL published courses, lessons, categories,
centres, and resources — then filters in JavaScript with `.includes()`. For a site with
100 courses × 2 languages = 200 rows loaded into memory just to search for "excel".

### Fix
Push the ILIKE filter to the database level. Supabase supports `.or()` with embedded
`.ilike()`:

```ts
const { data: courses } = await supabase
  .from('courses')
  .select(`..., translations:course_translations(...)`)
  .eq('status', 'published')
  // Push filter to DB instead of fetching all and filtering in JS
```

Note: Supabase doesn't support filtering on nested relation columns directly in the query.
The workaround is to query `course_translations` directly (not embedded):

```ts
const { data } = await supabase
  .from('course_translations')
  .select(`language_code, title, short_description, course:courses(id, slug, difficulty, estimated_duration, status)`)
  .eq('language_code', language)
  .eq('status', 'published')
  .or(`title.ilike.%${q}%,short_description.ilike.%${q}%`)
  .limit(10)
```

This filters at the DB level and only returns matching rows.

---

## 4. No Caching Strategy (SEVERITY: MEDIUM)

### Problem
No page uses `export const revalidate` or `fetch()` cache options. Every page load is a
fresh server render with fresh Supabase queries. Public content (courses, lessons) changes
rarely — there's no reason to re-fetch on every request.

### Fix
Add ISR (Incremental Static Regeneration) to public pages:

```ts
// At the top of public page files:
export const revalidate = 300 // re-generate at most every 5 minutes

// Or per-fetch:
const { data } = await supabase
  .from('courses')
  .select(...)
  .eq('status', 'published')
// Add: { next: { revalidate: 300 } } — but Supabase client doesn't support this directly.
// Use Next.js fetch cache wrapper or a custom caching layer.
```

For middleware redirect lookups, use an in-memory cache:

```ts
let redirectCache: { path: string; target: string; status: number }[] | null = null
let redirectCacheAt = 0
const REDIRECT_TTL = 60_000 // 60 seconds

async function getCachedRedirects() {
  if (redirectCache && Date.now() - redirectCacheAt < REDIRECT_TTL) return redirectCache
  // fetch all active redirects...
  redirectCache = result
  redirectCacheAt = Date.now()
  return redirectCache
}
```

---

## 5. Heavy Client Bundle — TipTap (SEVERITY: MEDIUM)

### Problem
The TipTap WYSIWYG editor (`@tiptap/react`, `@tiptap/starter-kit`, + 8 extensions) is
~11MB of node_modules. It's loaded on every lesson page because `LessonPractice`
(client component) is rendered there, and the lesson editor imports `RichTextEditor`.

However, the **public lesson page** doesn't need the editor — only the **console lesson
editor** does. The `RichTextEditor` is only imported in the lesson editor (console), not
on public pages — so this is actually OK for public page performance.

The real issue: the lesson editor's `RichTextEditor` is statically imported (not lazy-loaded).
On the console lesson editor page, the entire TipTap bundle loads even before the user
opens the content editor.

### Fix
The lesson editor already uses `dynamic()` for the `BlockEditor`. Apply the same to
`RichTextEditor` if it's not already lazy-loaded:

```ts
const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor').then(m => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse bg-muted rounded" />,
})
```

---

## 6. No Image Optimization (SEVERITY: LOW)

### Problem
The codebase uses raw `<img>` tags (or TipTap's Image extension which renders `<img>`).
No `next/image` usage means:
- No automatic WebP/AVIF conversion
- No lazy loading
- No responsive `srcset`
- No blur placeholder

### Fix
For user-uploaded content images in WYSIWYG HTML, this is hard to fix (the HTML is
stored as a string). For static images (hero, icons, etc.), use `next/image`.

For the WYSIWYG content, consider a post-processing step that rewrites `<img src>`
to `<img loading="lazy">` at minimum.

---

## 7. Mobile Responsive Audit (SEVERITY: LOW)

### Status: Mostly good, minor fixes needed

- ✅ Header: hamburger sheet on mobile, full nav on desktop
- ✅ Course page: responsive grid (1/2/3 columns)
- ✅ Lesson page: sticky sidebar on desktop, hamburger on mobile
- ✅ Console: sidebar hidden on mobile, main content full-width
- ⚠️ Tables (in WYSIWYG content): can overflow on small screens — add `overflow-x-auto`
  wrapper around the prose container
- ⚠️ Search results: look fine but the search input could be larger on mobile
- ⚠️ Footer: 4-column grid collapses to 2 on `sm` but should collapse to 1 on very small screens

### Fix
```tsx
// Wrap WYSIWYG content in an overflow container:
<div className="prose max-w-none overflow-x-auto">
  <article dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
</div>
```

---

## 8. Final Polish Checklist

| Area | Status | Notes |
|------|--------|-------|
| Login redirect → home | ✅ Done | Fixed in this session |
| Logout → home + toast | ✅ Done | Fixed in this session |
| Language switcher smooth | ✅ Done | Hard navigation |
| Course editor EN/HI tabs | ✅ Done | Open by default |
| Module editor EN/HI tabs | ✅ Done | Subagent |
| Lesson editor EN/HI tabs | ✅ Done | Subagent |
| Search: courses+skills+centres+PDFs | ✅ Done | Extended search service |
| SEO: per-language keywords+FAQs | ✅ Done | Previous session |
| Console noindex | ✅ Done | Previous session |
| WYSIWYG visual editor | ✅ Done | Previous session |
| Lesson video embed | ✅ Done | Previous session |
| MCQ + QNA under lessons | ✅ Done | Previous session |
| N+1 query fix | ❌ TODO | High priority |
| Middleware skip for /api/* | ❌ TODO | High priority |
| Search DB-level filter | ❌ TODO | Medium priority |
| ISR caching on public pages | ❌ TODO | Medium priority |
| WYSIWYG table overflow fix | ❌ TODO | Low priority |

---

## Recommended Priority Order

1. **Fix N+1 queries** in `getPublishedCourseBySlug` (biggest impact: 1-2s → 200ms)
2. **Skip middleware Supabase calls for /api/* and _next/*** (100-300ms saved per asset)
3. **Push search ILIKE to database** (reduce memory + network for search)
4. **Add `export const revalidate = 300`** to public pages (ISR caching)
5. **Add `overflow-x-auto`** to WYSIWYG content containers (mobile table fix)
6. **Lazy-load RichTextEditor** in the console lesson editor (faster console load)

---

*Generated during session FIXES-AND-SPEED-ANALYSIS*
