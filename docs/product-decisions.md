# SkillSetu — Product Decisions

**Status:** Confirmed (Phase 0.1)
**Source:** SkillSetu Production Platform Specification

This file records the confirmed product decisions that govern all subsequent development.
Any change to these decisions must be discussed and recorded here.

---

## 1. Identity

- **Project name:** SkillSetu (working/final name).
- **Product type:** Structured, multilingual, practical skills learning platform.
- **NOT:** a blog, an LMS template, a course marketplace, or a video-course website.

## 2. Core Learning Loop

> **Discover → Learn → Practice → Test → Apply → Track Progress**

Priorities: clarity, usefulness, trust, performance, learning outcomes — over visual gimmicks.

## 3. Languages at Launch

- English (`en`) — first-class.
- Hindi (`hi`) — first-class.

Architecture must allow additional languages without a database rewrite (translation-entity model).

## 4. User Surfaces

1. **Public platform** — homepage, discovery, category/course/lesson pages, search,
   authors, Q&A, quizzes, books/store, login/register, legal pages, error pages, sitemap, robots.
2. **Learner dashboard** — profile, continue learning, courses, saved lessons, notes,
   quiz/assessment history, certificates (future), orders, downloads, language, settings.
3. **Company Console** at `/console/` — dashboard, content management, editorial, media,
   commerce, SEO, analytics, users/roles/permissions, audit, system.
4. **Editorial workspace** — under `/console/editorial/`, role-scoped.

## 5. Content Model

- **Category → Course → Module/Chapter → Lesson → Content Blocks + Questions + Resources + Practice.**
- A lesson is **structured content blocks**, never a hard-coded page.
- Blocks: text, image, example, code, download, quiz, MCQ, Q&A, practice, project, video (future), checklist, case study, callout, table, embed (approved only).

## 6. Multilingual Architecture

- Translatable entities use **translation rows** (`course_translations`, `lesson_translations`, …).
- **Never** `title_en` / `title_hi` columns on core entities.
- Translation statuses: draft, in_translation, in_review, published, needs_update.

## 7. Editorial Workflow

Lifecycle: Idea → Planned → Assigned → Draft → Self Review → Editorial Review → Fact Check →
SEO Review → Translation → Final Approval → Scheduled → Published → Periodic Review.

Not every content type needs every step, but the workflow must support it.

## 8. Roles (RBAC)

Super Admin, Admin, Editorial Manager, Content Writer, Reviewer, Translator, Quiz Editor,
Commerce Manager, Marketing Manager, Analyst, Media Manager.

Permissions are granular and enforced server-side + RLS.

## 9. Assessment

- MCQ system (single/multiple choice, true/false, match, ordering; future: fill-blank, scenario).
- Q&A system (can be SEO-accessible when valuable — no thin pages).
- Mock tests (time limit, question pool, randomization, pass/fail, review mode).
- Correct answers must **never** be exposed client-side before submission where security matters.

## 10. Learner Features

- Progress tracking (server-authoritative), bookmarks (deduped), private notes,
  quiz history, assessment history, certificates (future-ready).

## 11. Commerce (separated from learning content)

- Books/resources: PDF, eBook, print, workbook, notes, cheat sheet, practice pack, bundle.
- Store: listing, product detail, filters, cart (if needed), checkout, order confirmation,
  purchase history, download access, entitlement verification.
- Paid digital downloads are **never** public static URLs — access controlled.
- Payment provider is **abstracted** behind an interface (provider-neutral).

## 12. Affiliate & Ads

- Affiliate links managed in console, clearly disclosed, never disguised as editorial.
- Ad slots defined (header/content_top/middle/bottom/sidebar/footer); no uncontrolled placement.
- Learning pages prioritize readability.

## 13. SEO (first-class)

- Public content server-rendered, crawlable, indexable, internally linked.
- Per-entity SEO metadata, slugs, canonicals, sitemap, robots, 301 redirects, JSON-LD.
- SEO templates in console; editors can override.

## 14. Video (future-ready, not built in MVP)

- DB + content model support video blocks and metadata (provider, ID, thumbnail, duration,
  transcript, captions, language, status, license).
- No custom video transcoding in MVP. Feature-flagged off by default.

## 15. Non-Goals for Initial MVP

No: full social network, public UGC courses, expert marketplace, heavy gamification,
coins/diamonds, native mobile app, AI tutor, B2B org management, job/freelancer marketplace,
advanced recommendation engine, custom video streaming, live classes, community forums.
(The architecture stays ready for them.)

## 16. Gamification Policy

Lightweight progression only: progress %, completed lessons, milestones, course completion,
optional badges, skill level, assessment score. Streak only if it improves learning.
No virtual currency, lives, energy, random rewards, aggressive leaderboards.

## 17. Trust & Editorial Policy

Avoid: guaranteed income claims, fake job guarantees, fake certifications, fake credentials,
plagiarized content, copyright-infringing images/books, misleading affiliate claims,
manipulative dark patterns. Distinguish educational info vs opinion vs examples vs claims vs regulatory info.

## 18. Legal Pages (CMS-managed)

About, Contact, Privacy, Terms, Cookie/consent, Refund (if selling), Affiliate disclosure,
Copyright policy, Disclaimer. Editable via console — no code edits required.

## 19. Deployment

- **Hosting:** Vercel (free subdomain initially; custom domain later).
- **Repository:** GitHub (`startupzila/skillsetu`, public).
- **Database/Auth/Storage:** Supabase.

## 20. Deletion Policy

Prefer soft-delete/archive for published content, financial records, audit logs.
Permanent deletion only via documented policy when legally/operationally required.

## 21. Definition of Done (per feature)

A feature is complete only when: UI works, DB works, authorization works, validation works,
mobile works, accessibility acceptable, SEO correct (if public), error states exist, tests
exist, audit requirements met, documentation updated.
