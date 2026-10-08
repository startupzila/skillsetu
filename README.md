# SkillSetu

**A structured, multilingual, practical skills learning platform.**

SkillSetu helps people learn real-world skills (Excel, Word, PowerPoint, Tally, Accounting,
GST, Photoshop, Canva, AI tools, Digital Marketing, SEO, YouTube, Freelancing and more)
through structured tutorials, examples, practice, questions, assessments and resources —
in their preferred language.

> **Core learning loop:** Discover → Learn → Practice → Test → Apply → Track Progress

SkillSetu is **not** a simple blog, LMS template, course marketplace or video-course website.
It is a structured, content-first, multilingual education product built for the long term.

---

## Supported Languages

- English (`en`)
- Hindi (`hi`)

Additional languages can be added later without a database rewrite (translation-entity model).

---

## Tech Stack

| Area | Decision |
|---|---|
| Web framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Supabase PostgreSQL |
| ORM | Prisma (migrations + typed client) |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Row-level security | Supabase RLS |
| Validation | Zod |
| Server state | TanStack Query |
| Client state | Zustand |
| i18n | next-intl |
| Auth (legacy fallback) | NextAuth.js v4 |
| Hosting | Vercel |
| Repository | GitHub |
| Unit testing | Vitest |
| E2E testing | Playwright |

---

## Project Structure

```text
skillsetu/
├── src/
│   ├── app/                  # Next.js App Router (public, dashboard, console, api)
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── dashboard/
│   │   ├── console/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── public/
│   │   ├── learning/
│   │   ├── assessment/
│   │   ├── dashboard/
│   │   ├── console/
│   │   ├── commerce/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/        # supabase clients + server helpers
│   │   ├── auth/            # session, permission helpers
│   │   ├── content/         # courseService, lessonService ...
│   │   ├── learning/        # progressService, assessmentService
│   │   ├── commerce/        # commerceService
│   │   ├── seo/
│   │   ├── analytics/
│   │   ├── security/
│   │   ├── validation/      # zod schemas
│   │   └── utils/
│   ├── hooks/
│   └── ...
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
├── public/
├── docs/                    # product, architecture, plan, etc.
├── scripts/
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (or [Bun](https://bun.sh))
- A Supabase project (URL + anon key + service role key)

### Install

```bash
bun install
```

### Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### Run the database

The Prisma schema targets Supabase PostgreSQL. Apply the schema:

```bash
bun run db:push      # push schema to database
bun run db:generate  # regenerate Prisma client
```

### Run the dev server

```bash
bun run dev
```

The app runs on `http://localhost:3000`.

### Lint

```bash
bun run lint
```

---

## Key Architectural Decisions

1. **Content is structured, not hard-coded.** A lesson is composed of typed content
   blocks (heading, paragraph, image, video, callout, code, table, quiz, MCQ, Q&A,
   practice, project, etc.) stored in the database — never a hard-coded page.
2. **Multilingual via translation entities.** Translatable content uses separate
   `*_translations` rows keyed by language code. We never use `title_en` / `title_hi`
   columns on core entities.
3. **Authorization is server-enforced.** Frontend hiding is never the only control.
   Permissions are checked server-side and reinforced with Supabase Row Level Security.
4. **Commerce is separated from learning content.** A course can be free or paid without
   being structurally identical to a store product.
5. **Video is future-ready, not built now.** The lesson content model supports video
   blocks and video metadata so video can be enabled later without a rewrite.
6. **SEO is first-class.** Public content is server-rendered, crawlable, has slugs,
   canonicals, sitemaps, structured data and redirect management.
7. **No heavy gamification.** Lightweight progression (progress %, completion, optional
   badges, assessment score). No coins, lives, energy or aggressive leaderboards.

---

## Roles (RBAC)

- Super Admin
- Admin
- Editorial Manager
- Content Writer
- Reviewer
- Translator
- Quiz Editor
- Commerce Manager
- Marketing Manager
- Analyst
- Media Manager

Permissions are granular and enforced server-side (`course.create`, `lesson.publish`,
`translation.publish`, `seo.manage`, `users.manage`, `audit.read`, …).

---

## Documentation

Full documentation lives in [`docs/`](./docs):

- [`docs/plan.md`](./docs/plan.md) — Session-by-session build roadmap
- [`docs/product-decisions.md`](./docs/product-decisions.md) — Confirmed product rules
- [`docs/tech-stack.md`](./docs/tech-stack.md) — Frozen technology stack
- [`docs/architecture.md`](./docs/architecture.md) — Architecture, naming and conventions

---

## Development Status

SkillSetu is in the **planning / Phase 0** stage.

The repository, README, environment template and planning documents are in place.
Development begins in the next session after confirmation.

See [`docs/plan.md`](./docs/plan.md) for the full build roadmap and session estimate.

---

## License & Trust

SkillSetu avoids misleading income claims, fake credentials, fabricated statistics and
unsupported claims. Affiliate links are clearly disclosed. Educational content is
distinguished from opinion and regulatory information.

---

## Contributing

Feature work follows the phased plan in [`docs/plan.md`](./docs/plan.md). Every meaningful
change is committed independently with a clear message. Production secrets are never
committed — only `.env.example` ships with placeholders.
