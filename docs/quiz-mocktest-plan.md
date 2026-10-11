# Quiz + Mock Test System — Implementation Plan

## Overview
Three major features:
1. **Single Quiz View redesign** — YouTube-style layout (quiz left, related right, latest/trending below)
2. **Lesson Quiz management** — console editor + inline lesson quiz (no separate page for viewing)
3. **Course Quiz + Mock Test managers** — dedicated console pages for course-level quizzes and mock tests

---

## Task 1: Single Quiz View Redesign (`/quiz/[slug]`)

### Layout (YouTube-style)
```
┌─────────────────────────────────────────────────┐
│  Breadcrumbs                                     │
├──────────────────────────────┬──────────────────┤
│  QUIZ PLAY AREA              │  RELATED QUIZZES │
│  ┌────────────────────────┐  │  ┌─────────────┐ │
│  │ Question 1 of 5         │  │  │ Quiz Title  │ │
│  │ ○ Option A              │  │  │ 3 Qs · 60%  │ │
│  │ ○ Option B              │  │  └─────────────┘ │
│  │ ○ Option C              │  │  ┌─────────────┐ │
│  │ ○ Option D              │  │  │ Quiz Title  │ │
│  │ [Prev] [Next] [Submit]  │  │  └─────────────┘ │
│  └────────────────────────┘  │                  │
│                              │                  │
│  RESULT (after submit)      │                  │
│  Score: 80% — Pass!          │                  │
│  [Next Quiz →]               │                  │
├──────────────────────────────┴──────────────────┤
│  Latest Quizzes (4 cards)   Trending (4 cards) │
└─────────────────────────────────────────────────┘
```

### Responsive
- Desktop (lg+): 2-column grid (quiz left ~70%, related right ~30%)
- Tablet (sm-lg): single column, related below quiz
- Mobile: single column, stacked

### QuizRunner changes
- Prev/Next buttons between questions (if quiz has >1 question)
- Submit button → shows result inline (score, pass/fail, correct answers)
- Result section → "Next Quiz" button

---

## Task 2: Lesson Quiz Management

### Console Editor (Lesson Editor)
Add a "Quiz" section below MCQ/QNA in the lesson editor:
- EN/HI language tabs (like MCQ/QNA)
- Create quiz attached to lesson (`lesson_id`)
- Add/remove questions to quiz (reuse existing question create flow)
- Publish quiz

### Frontend Lesson Page
- If lesson has a quiz, show it inline at the bottom (below MCQ/QNA practice)
- Play + result on the SAME page (no redirect to /quiz/[slug])
- The quiz has a URL (`/quiz/[slug]`) for indexing on /quizzes page
- Clicking a quiz from /quizzes → goes to /quiz/[slug] (single quiz view, Task 1 design)

---

## Task 3: Course Quiz + Mock Test Managers

### DB Migration: Mock Tests
```sql
-- mock_tests (like quizzes but for course-level, with timer)
CREATE TABLE mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status ContentStatus DEFAULT 'draft',
  duration_minutes INT NOT NULL DEFAULT 60,
  total_marks INT DEFAULT 100,
  passing_score INT DEFAULT 40,
  published_at TIMESTAMP,
  created_at, updated_at
);

-- mock_test_translations
CREATE TABLE mock_test_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  status TranslationStatus DEFAULT 'draft',
  UNIQUE(mock_test_id, language_code)
);

-- mock_test_questions (join table)
CREATE TABLE mock_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  UNIQUE(mock_test_id, question_id)
);
```

### Console Pages
- `/console/quizzes` — course quiz manager (NOT lesson quizzes)
  - List all course-level quizzes (course_id IS NOT NULL, lesson_id IS NULL)
  - Create new quiz → modal with course AJAX search + link
  - Edit quiz (title, instructions, add questions, publish) in EN/HI
- `/console/mock-tests` — course mock test manager
  - Same pattern as quizzes but for mock_tests table
  - Duration, total_marks, passing_score fields

### Frontend
- `/mock-tests` — index page (like /quizzes)
- `/mock-test/[slug]` — exam-experience page:
  - Timer (countdown)
  - Question palette (right sidebar, question numbers, answered/unanswered)
  - Full-screen exam mode
  - Submit → results with detailed breakdown

---

## Session Plan

### Session A: Task 1 — Single Quiz View Redesign
1. Redesign `/quiz/[slug]` page layout (YouTube-style)
2. Update QuizRunner component (prev/next question buttons, inline result)
3. Mobile responsive

### Session B: Task 2 — Lesson Quiz Management
1. DB: ensure quizzes.lesson_id FK works for lesson-attached quizzes
2. Console lesson editor: add Quiz section (EN/HI tabs)
3. Frontend lesson page: inline quiz play at bottom
4. Quiz has URL for /quizzes indexing

### Session C: Task 3 — Course Quiz + Mock Test Managers
1. DB migration: mock_tests + translations + questions join
2. Console /console/quizzes — course quiz manager
3. Console /console/mock-tests — course mock test manager
4. Frontend /mock-tests index + /mock-test/[slug] exam page
5. Header/footer links + SEO

---

*Created during session QUIZ-MOCKTEST-PLAN*
