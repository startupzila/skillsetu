# SkillSetu — Technology Stack

**Status:** Frozen (Phase 0.2)
**Source:** SkillSetu Production Platform Specification

This is the frozen technology stack. New dependencies are added only when justified and
when no native/library alternative in this stack suffices.

---

## Core

| Layer | Technology | Notes |
|---|---|---|
| Web framework | **Next.js 16** (App Router) | SSR + SSG + dynamic routes + API handlers |
| Language | **TypeScript 5** (strict) | No `any` unless unavoidable + documented |
| Runtime / package manager | **Bun** (dev) | `bun install`, `bun run dev` |
| Rendering | Next.js App Router, RSC where possible | Public content server-rendered |

## Styling & UI

| Layer | Technology |
|---|---|
| Styling | **Tailwind CSS 4** + design tokens (CSS variables) |
| Component primitives | **shadcn/ui** (New York) + Radix UI |
| Icons | **lucide-react** |
| Theme | **next-themes** (light/dark) |
| Animation | **framer-motion** (subtle, reduced-motion aware) |

## Database & ORM

| Layer | Technology |
|---|---|
| Database | **Supabase PostgreSQL** |
| ORM | **Prisma** (typed client + migrations committed to Git) |
| Row-level security | **Supabase RLS** |
| Migrations | `prisma/migrations/` (versioned, never dashboard-only changes) |

## Auth & Storage

| Layer | Technology |
|---|---|
| Authentication | **Supabase Auth** (email/password, verification, reset; OAuth later) |
| Server session | **@supabase/ssr** (cookie-based server sessions) |
| File storage | **Supabase Storage** (images, PDFs, downloads; not for video CDN) |
| Legacy fallback | NextAuth.js v4 (available, not primary) |

## State & Data

| Layer | Technology |
|---|---|
| Server state | **TanStack Query** |
| Client state | **Zustand** |
| Forms | **react-hook-form** + **@hookform/resolvers** |
| Validation | **Zod** (forms, API payloads, query params, admin actions, uploads, commerce) |
| Tables | **@tanstack/react-table** |
| Drag & reorder | **@dnd-kit/core** + **@dnd-kit/sortable** |

## i18n

| Layer | Technology |
|---|---|
| Internationalization | **next-intl** (English + Hindi; extensible) |

## Content editing

| Layer | Technology |
|---|---|
| Rich/structured editor | **@mdxeditor/editor** (lesson content blocks where useful) |
| Markdown rendering | **react-markdown** |
| Syntax highlighting | **react-syntax-highlighter** |

## Charts & media

| Layer | Technology |
|---|---|
| Charts (console analytics) | **recharts** |
| Image optimization | **sharp** + Next.js Image |

## Validation & quality

| Layer | Technology |
|---|---|
| Lint | **ESLint** + `eslint-config-next` |
| Types | TypeScript strict |
| Unit tests | **Vitest** |
| E2E tests | **Playwright** |
| UI behavior | Testing Library |

## Deployment & infra

| Layer | Technology |
|---|---|
| Hosting | **Vercel** (preview + production) |
| Repository | **GitHub** (`startupzila/skillsetu`, `main` + feature branches) |
| Email | Transactional provider behind a service abstraction (added when needed) |
| Analytics | Privacy-conscious + optional Google Analytics (IDs configured in console) |
| Payments | Provider-neutral abstraction (concrete provider chosen at launch) |

## AI capabilities (z-ai-web-dev-sdk)

Used **server-side only** for any AI features (future AI tutor). Never imported client-side.

## Environment variables (template)

See `.env.example`. Required keys:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only
DATABASE_URL=                        # Supabase Postgres connection string
```

Payment / email / analytics keys are added only when those integrations are implemented.
**Service-role keys run server-side only. Never exposed to the browser.**

## Forbidden

- No `title_en` / `title_hi` columns (use translation entities).
- No hard-coded course lists / role-permission checks in components.
- No direct production data edits by the AI agent.
- No secrets in Git.
- No bypass of auth / RLS.
- No dependency introduced when native functionality suffices.
