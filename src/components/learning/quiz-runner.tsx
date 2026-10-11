'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Loader2, RotateCcw, Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { PublicQuestion } from '@/lib/learning/assessment-types'

interface QuizRunnerProps {
  quizId: string
  title: string
  instructions?: string | null
  questions: PublicQuestion[]
  passingScore: number
  /** Optional: callback when quiz is completed (for inline lesson quizzes) */
  onComplete?: (result: Result) => void
  /** Optional: locale for labels */
  lang?: 'en' | 'hi'
}

type Phase = 'answering' | 'submitting' | 'results'

interface Result {
  score: number
  correctCount: number
  total: number
  passed: boolean
  answers: Array<{
    questionId: string
    isCorrect: boolean
    correctOptionIds: string[]
    selected: string[]
  }>
}

/**
 * QuizRunner — interactive quiz with question navigation, scoring, and explanations.
 *
 * Flow: answering (one question at a time with Prev/Next) → submitting → results.
 * Results reveal correct answers + explanations inline.
 *
 * Can be used standalone (on /quiz/[slug]) or inline (on lesson pages).
 */
export function QuizRunner({ quizId, title, instructions, questions, passingScore, onComplete, lang = 'en' }: QuizRunnerProps) {
  const [phase, setPhase] = useState<Phase>('answering')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const hi = lang === 'hi'

  function toggleOption(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      const question = questions.find((q) => q.id === questionId)
      if (question?.question_type === 'single_choice' || question?.question_type === 'true_false') {
        return { ...prev, [questionId]: [optionId] }
      }
      const has = current.includes(optionId)
      return {
        ...prev,
        [questionId]: has ? current.filter((id) => id !== optionId) : [...current, optionId],
      }
    })
  }

  function submit() {
    const unanswered = questions.filter((q) => !answers[q.id] || answers[q.id].length === 0)
    if (unanswered.length > 0) {
      toast({
        title: hi ? 'सभी प्रश्नों का उत्तर दें' : 'Answer all questions',
        description: hi ? `${unanswered.length} प्रश्न अनुत्तरित हैं।` : `${unanswered.length} question(s) unanswered.`,
        variant: 'destructive',
      })
      return
    }

    setPhase('submitting')
    startTransition(async () => {
      try {
        const startRes = await fetch('/api/quiz/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId }),
        })
        const startData = await startRes.json()
        if (!startRes.ok) {
          if (startRes.status === 401) {
            toast({ title: hi ? 'साइन इन आवश्यक' : 'Sign in required', description: hi ? 'क्विज़ देने के लिए साइन इन करें।' : 'Please sign in to take quizzes.', variant: 'destructive' })
            setPhase('answering')
            return
          }
          toast({ title: hi ? 'त्रुटि' : 'Error', description: startData.error, variant: 'destructive' })
          setPhase('answering')
          return
        }

        const submitRes = await fetch('/api/quiz/attempts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId: startData.data.id,
            answers: questions.map((q) => ({
              questionId: q.id,
              selectedOptionIds: answers[q.id] ?? [],
            })),
          }),
        })
        const submitData = await submitRes.json()
        if (!submitRes.ok) {
          toast({ title: hi ? 'त्रुटि' : 'Error', description: submitData.error, variant: 'destructive' })
          setPhase('answering')
          return
        }

        const d = submitData.data
        const res: Result = {
          score: d.score ?? 0,
          correctCount: d.correct_count ?? 0,
          total: d.total_questions ?? 0,
          passed: d.passed ?? false,
          answers: (d.results ?? []).map((r: {
            questionId: string
            isCorrect: boolean
            correctOptionIds: string[]
            selected: string[]
          }) => ({
            questionId: r.questionId,
            isCorrect: r.isCorrect,
            correctOptionIds: r.correctOptionIds,
            selected: r.selected,
          })),
        }
        setResult(res)
        setPhase('results')
        onComplete?.(res)
      } catch {
        toast({ title: hi ? 'त्रुटि' : 'Error', description: hi ? 'कुछ गलत हुआ।' : 'Something went wrong.', variant: 'destructive' })
        setPhase('answering')
      }
    })
  }

  function retry() {
    setAnswers({})
    setResult(null)
    setCurrentIdx(0)
    setPhase('answering')
  }

  // ── Results screen ──────────────────────────────────────
  if (phase === 'results' && result) {
    return (
      <div className="space-y-6">
        <Card className={cn('border-2', result.passed ? 'border-green-500' : 'border-amber-500')}>
          <CardHeader className="text-center">
            <div className={cn('inline-flex rounded-full p-4 mx-auto mb-2', result.passed ? 'bg-green-100 dark:bg-green-950/30' : 'bg-amber-100 dark:bg-amber-950/30')}>
              <Trophy className={cn('h-10 w-10', result.passed ? 'text-green-600' : 'text-amber-600')} />
            </div>
            <CardTitle className="text-2xl">
              {result.passed ? (hi ? 'बधाई हो!' : 'Congratulations!') : (hi ? 'और अभ्यास करें!' : 'Keep practicing!')}
            </CardTitle>
            <p className="text-muted-foreground">
              {hi ? `आपका स्कोर ${result.score}% (${result.correctCount}/${result.total} सही)` : `You scored ${result.score}% (${result.correctCount}/${result.total} correct)`}
            </p>
            <p className="text-sm text-muted-foreground">
              {hi ? `पास स्कोर: ${passingScore}%` : `Passing score: ${passingScore}%`}
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={retry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              {hi ? 'फिर से' : 'Try again'}
            </Button>
          </CardContent>
        </Card>

        {/* Per-question review */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">{hi ? 'उत्तर समीक्षा' : 'Review answers'}</h3>
          {questions.map((q, idx) => {
            const ans = result.answers.find((a) => a.questionId === q.id)
            const isCorrect = ans?.isCorrect ?? false
            return (
              <Card key={q.id} className={cn('border-l-4', isCorrect ? 'border-l-green-500' : 'border-l-red-500')}>
                <CardHeader>
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{hi ? 'प्रश्न' : 'Question'} {idx + 1}</p>
                      <p className="font-medium">{q.translation.question_text}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const selected = ans?.selected.includes(opt.id)
                      const correct = ans?.correctOptionIds.includes(opt.id)
                      return (
                        <div
                          key={opt.id}
                          className={cn(
                            'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                            correct && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                            selected && !correct && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                            !selected && !correct && 'border-muted',
                          )}
                        >
                          {correct ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : selected ? (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 shrink-0" />
                          )}
                          <span>{opt.text}</span>
                        </div>
                      )
                    })}
                  </div>
                  {q.translation.explanation && (
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <span className="font-medium">{hi ? 'व्याख्या: ' : 'Explanation: '}</span>
                      {q.translation.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Answering screen (one question at a time with Prev/Next) ───
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0
  const currentQ = questions[currentIdx]
  const isLast = currentIdx === questions.length - 1
  const isFirst = currentIdx === 0

  return (
    <div className="space-y-4">
      {/* Quiz header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {instructions && <p className="text-sm text-muted-foreground">{instructions}</p>}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{answeredCount} / {questions.length} {hi ? 'उत्तरित' : 'answered'}</span>
          <span>{hi ? 'पास' : 'Pass'}: {passingScore}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question navigation pills */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id]?.length > 0
          const isCurrent = idx === currentIdx
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-md text-xs font-medium border transition-colors',
                isCurrent && 'border-primary bg-primary text-primary-foreground',
                !isCurrent && isAnswered && 'border-green-500 text-green-600',
                !isCurrent && !isAnswered && 'border-muted-foreground/30 text-muted-foreground',
              )}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {/* Current question */}
      <Card>
        <CardHeader>
          <p className="text-xs text-muted-foreground">{hi ? 'प्रश्न' : 'Question'} {currentIdx + 1} / {questions.length}</p>
          <CardTitle className="text-base font-medium leading-relaxed">
            {currentQ.translation.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentQ.options.map((opt) => {
              const selected = answers[currentQ.id]?.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(currentQ.id, opt.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent',
                    selected && 'border-primary bg-primary/5',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      selected && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {selected && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <span>{opt.text}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          {hi ? 'पिछला' : 'Previous'}
        </Button>

        {isLast ? (
          <Button
            onClick={submit}
            disabled={phase === 'submitting' || isPending}
            className="gap-1.5"
          >
            {phase === 'submitting' || isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {hi ? 'क्विज़ जमा करें' : 'Submit quiz'}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            className="gap-1.5"
          >
            {hi ? 'अगला' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
