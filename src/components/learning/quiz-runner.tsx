'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Loader2, RotateCcw, Trophy } from 'lucide-react'
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
 * QuizRunner — interactive quiz with scoring + explanations.
 *
 * Flow: answering → submitting → results.
 * On submit, calls POST /api/quiz/attempts to start, then PUT to grade.
 * Results reveal correct answers + explanations.
 */
export function QuizRunner({ quizId, title, instructions, questions, passingScore }: QuizRunnerProps) {
  const [phase, setPhase] = useState<Phase>('answering')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function toggleOption(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      // For single_choice, replace; for multiple, toggle
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
        title: 'Answer all questions',
        description: `${unanswered.length} question(s) unanswered.`,
        variant: 'destructive',
      })
      return
    }

    setPhase('submitting')
    startTransition(async () => {
      try {
        // 1. Start attempt
        const startRes = await fetch('/api/quiz/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId }),
        })
        const startData = await startRes.json()
        if (!startRes.ok) {
          if (startRes.status === 401) {
            toast({ title: 'Sign in required', description: 'Please sign in to take quizzes.', variant: 'destructive' })
            setPhase('answering')
            return
          }
          toast({ title: 'Error', description: startData.error, variant: 'destructive' })
          setPhase('answering')
          return
        }

        // 2. Submit answers
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
          toast({ title: 'Error', description: submitData.error, variant: 'destructive' })
          setPhase('answering')
          return
        }

        // Map API response to Result shape
        const d = submitData.data
        setResult({
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
        })
        setPhase('results')
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
        setPhase('answering')
      }
    })
  }

  function retry() {
    setAnswers({})
    setResult(null)
    setPhase('answering')
  }

  // ── Results screen ──────────────────────────────────────
  if (phase === 'results' && result) {
    return (
      <div className="space-y-6">
        <Card className={cn('border-2', result.passed ? 'border-success' : 'border-warning')}>
          <CardHeader className="text-center">
            <div className="inline-flex rounded-full bg-success/10 p-4 mx-auto mb-2">
              <Trophy className={cn('h-10 w-10', result.passed ? 'text-success' : 'text-warning')} />
            </div>
            <CardTitle className="text-2xl">
              {result.passed ? 'Congratulations!' : 'Keep practicing!'}
            </CardTitle>
            <p className="text-muted-foreground">
              You scored {result.score}% ({result.correctCount}/{result.total} correct)
            </p>
            <p className="text-sm text-muted-foreground">
              Passing score: {passingScore}%
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={retry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>

        {/* Per-question review */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Review answers</h3>
          {questions.map((q, idx) => {
            const ans = result.answers.find((a) => a.questionId === q.id)
            const isCorrect = ans?.isCorrect ?? false
            return (
              <Card key={q.id} className={cn('border-l-4', isCorrect ? 'border-l-success' : 'border-l-destructive')}>
                <CardHeader>
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Question {idx + 1}</p>
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
                            correct && 'border-success bg-success/5',
                            selected && !correct && 'border-destructive bg-destructive/5',
                            !selected && !correct && 'border-muted',
                          )}
                        >
                          {correct ? (
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                          ) : selected ? (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
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
                      <span className="font-medium">Explanation: </span>
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

  // ── Answering screen ────────────────────────────────────
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Quiz header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {instructions && <p className="text-muted-foreground">{instructions}</p>}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{answeredCount} of {questions.length} answered</span>
          <span>Pass: {passingScore}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <p className="text-xs text-muted-foreground">Question {idx + 1}</p>
              <CardTitle className="text-base font-medium leading-relaxed">
                {q.translation.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id]?.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(q.id, opt.id)}
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
        ))}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={submit}
          size="lg"
          disabled={phase === 'submitting' || isPending}
        >
          {phase === 'submitting' || isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Submit quiz
        </Button>
      </div>
    </div>
  )
}
