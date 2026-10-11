'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, ExternalLink, AlertCircle } from 'lucide-react'
import { QuizRunner } from '@/components/learning/quiz-runner'
import type { PublicQuestion } from '@/lib/learning/assessment-types'

interface LessonQuizTranslation {
  language_code: string
  title: string
  instructions: string | null
  status: string
}

export interface LessonQuizData {
  id: string
  slug: string
  passing_score: number
  translations: LessonQuizTranslation[]
  quiz_questions: { question_id: string }[]
}

interface InlineQuizProps {
  quiz: LessonQuizData
  lang: 'en' | 'hi'
  /** localePath-style path to /quiz/[slug] (already localized). */
  fullPageHref: string
}

interface QuizPayload {
  quiz: { id: string; slug: string; passing_score: number }
  translation: { title: string; instructions: string | null } | null
  questions: PublicQuestion[]
}

/**
 * InlineQuiz — renders a single published quiz attached to a lesson.
 *
 * Flow:
 *   1. Shows the quiz title, passing-score badge, question count, and a
 *      "Start Quiz" button + "Open in full page →" link.
 *   2. On click, lazily fetches the full quiz payload (questions with correct
 *      answers stripped) from /api/quiz?slug=...&lang=...
 *   3. Renders <QuizRunner> inline. After completion, results show inline.
 */
export function InlineQuiz({ quiz, lang, fullPageHref }: InlineQuizProps) {
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState<QuizPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hi = lang === 'hi'

  // Pick the best translation we have for the requested language.
  const translation =
    quiz.translations.find((t) => t.language_code === lang) ??
    quiz.translations.find((t) => t.language_code === 'en') ??
    quiz.translations[0] ??
    null
  const title = translation?.title ?? quiz.slug
  const instructions = translation?.instructions ?? null
  const questionCount = quiz.quiz_questions?.length ?? 0

  async function start() {
    if (started || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/quiz?slug=${encodeURIComponent(quiz.slug)}&lang=${lang}`,
      )
      const json = (await res.json()) as { data?: QuizPayload; error?: string }
      if (!res.ok || !json.data) {
        setError(json.error ?? `Failed to load quiz (${res.status})`)
        setLoading(false)
        return
      }
      // Guard against quizzes with no questions — QuizRunner would crash on
      // an empty `questions` array (it indexes questions[0] in the header).
      if (!json.data.questions || json.data.questions.length === 0) {
        setError(hi ? 'इस क्विज़ में अभी कोई प्रश्न नहीं है।' : 'No questions in this quiz yet.')
        setLoading(false)
        return
      }
      setPayload(json.data)
      setStarted(true)
      setLoading(false)
    } catch {
      setError(hi ? 'कुछ गलत हुआ।' : 'Something went wrong.')
      setLoading(false)
    }
  }

  if (started && payload) {
    return (
      <QuizRunner
        quizId={payload.quiz.id}
        title={payload.translation?.title ?? title}
        instructions={payload.translation?.instructions ?? instructions}
        questions={payload.questions}
        passingScore={payload.quiz.passing_score}
        lang={lang}
      />
    )
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {instructions && (
              <p className="text-sm text-muted-foreground">{instructions}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className="text-[11px]">
              {questionCount} {hi ? 'प्रश्न' : 'Qs'}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {quiz.passing_score}% {hi ? 'पास' : 'pass'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={start} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1.5" />
            )}
            {hi ? 'क्विज़ शुरू करें' : 'Start Quiz'}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={fullPageHref} className="gap-1.5">
              {hi ? 'पूरा पेज खोलें' : 'Open in full page'}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * LessonQuizSection — renders the inline quizzes attached to a published lesson.
 * Returns null if there are no quizzes.
 */
export function LessonQuizSection({
  quizzes,
  lang,
  fullPageHrefs,
}: {
  quizzes: LessonQuizData[]
  lang: 'en' | 'hi'
  fullPageHrefs: string[]
}) {
  if (!quizzes || quizzes.length === 0) return null
  const hi = lang === 'hi'
  return (
    <section className="space-y-4 mt-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {hi ? 'क्विज़' : 'Quiz'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hi
            ? 'अपनी समझ का परीक्षण करें — क्विज़ पूरा करें और अपना स्कोर देखें।'
            : 'Test your understanding — take the quiz and see your score.'}
        </p>
      </div>
      <div className="space-y-4">
        {quizzes.map((q, i) => (
          <InlineQuiz
            key={q.id}
            quiz={q}
            lang={lang}
            fullPageHref={fullPageHrefs[i] ?? `/quiz/${q.slug}`}
          />
        ))}
      </div>
    </section>
  )
}
