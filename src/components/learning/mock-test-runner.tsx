'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { PublicQuestion } from '@/lib/learning/assessment-types'

interface MockTestRunnerProps {
  testId: string
  title: string
  instructions?: string | null
  timeLimitMinutes: number | null
  passingScore: number
  questions: PublicQuestion[]
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
 * MockTestRunner — exam-experience runner with countdown timer, question
 * palette (right sidebar on desktop, below on mobile), one-question-at-a-time
 * navigation, submit confirmation, and results review.
 *
 * Auto-submits when the timer reaches 0.
 */
export function MockTestRunner({
  testId,
  title,
  instructions,
  timeLimitMinutes,
  passingScore,
  questions,
  lang = 'en',
}: MockTestRunnerProps) {
  const hi = lang === 'hi'
  const [phase, setPhase] = useState<Phase>('answering')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Timer: total seconds remaining. Null = no time limit.
  const totalSeconds = timeLimitMinutes ? timeLimitMinutes * 60 : null
  const [secondsLeft, setSecondsLeft] = useState<number | null>(totalSeconds)
  const submittedRef = useRef(false)

  function formatTime(s: number): string {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  function toggleOption(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? []
      const question = questions.find((q) => q.id === questionId)
      if (
        question?.question_type === 'single_choice' ||
        question?.question_type === 'true_false'
      ) {
        return { ...prev, [questionId]: [optionId] }
      }
      const has = current.includes(optionId)
      return {
        ...prev,
        [questionId]: has
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      }
    })
  }

  const submit = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    setPhase('submitting')
    startTransition(async () => {
      try {
        // Start a mock-test attempt.
        const startRes = await fetch('/api/quiz/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessment_type: 'mock_test',
            mockTestId: testId,
          }),
        })
        const startData = await startRes.json()
        if (!startRes.ok) {
          if (startRes.status === 401) {
            toast({
              title: hi ? 'साइन इन आवश्यक' : 'Sign in required',
              description: hi
                ? 'मॉक टेस्ट देने के लिए साइन इन करें।'
                : 'Please sign in to take mock tests.',
              variant: 'destructive',
            })
            submittedRef.current = false
            setPhase('answering')
            return
          }
          toast({
            title: hi ? 'त्रुटि' : 'Error',
            description: startData.error,
            variant: 'destructive',
          })
          submittedRef.current = false
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
          toast({
            title: hi ? 'त्रुटि' : 'Error',
            description: submitData.error,
            variant: 'destructive',
          })
          submittedRef.current = false
          setPhase('answering')
          return
        }

        const d = submitData.data
        const res: Result = {
          score: d.score ?? 0,
          correctCount: d.correct_count ?? 0,
          total: d.total_questions ?? 0,
          passed: d.passed ?? false,
          answers: (d.results ?? []).map(
            (r: {
              questionId: string
              isCorrect: boolean
              correctOptionIds: string[]
              selected: string[]
            }) => ({
              questionId: r.questionId,
              isCorrect: r.isCorrect,
              correctOptionIds: r.correctOptionIds,
              selected: r.selected,
            }),
          ),
        }
        setResult(res)
        setPhase('results')
      } catch {
        toast({
          title: hi ? 'त्रुटि' : 'Error',
          description: hi ? 'कुछ गलत हुआ।' : 'Something went wrong.',
          variant: 'destructive',
        })
        submittedRef.current = false
        setPhase('answering')
      }
    })
  }, [answers, hi, questions, testId, toast])

  // Countdown timer effect — auto-submit when reaching 0.
  useEffect(() => {
    if (secondsLeft === null) return
    if (phase !== 'answering') return
    if (secondsLeft <= 0) {
      toast({
        title: hi ? 'समय समाप्त' : "Time's up",
        description: hi
          ? 'समय समाप्त हो गया है — आपका उत्तर स्वतः जमा हो रहा है।'
          : 'Your answers are being submitted automatically.',
        variant: 'default',
      })
      submit()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, phase, hi, submit, toast])

  function retry() {
    submittedRef.current = false
    setAnswers({})
    setResult(null)
    setCurrentIdx(0)
    setSecondsLeft(totalSeconds)
    setPhase('answering')
  }

  // ── Results screen ──────────────────────────────────────
  if (phase === 'results' && result) {
    const answeredCount = Object.values(answers).filter((a) => a.length > 0).length
    return (
      <div className="space-y-6">
        <Card
          className={cn(
            'border-2',
            result.passed ? 'border-green-500' : 'border-amber-500',
          )}
        >
          <CardHeader className="text-center">
            <div
              className={cn(
                'inline-flex rounded-full p-4 mx-auto mb-2',
                result.passed
                  ? 'bg-green-100 dark:bg-green-950/30'
                  : 'bg-amber-100 dark:bg-amber-950/30',
              )}
            >
              <Trophy
                className={cn(
                  'h-10 w-10',
                  result.passed ? 'text-green-600' : 'text-amber-600',
                )}
              />
            </div>
            <CardTitle className="text-2xl">
              {result.passed
                ? hi
                  ? 'बधाई हो!'
                  : 'Congratulations!'
                : hi
                  ? 'और अभ्यास करें!'
                  : 'Keep practicing!'}
            </CardTitle>
            <p className="text-muted-foreground">
              {hi
                ? `आपका स्कोर ${result.score}% (${result.correctCount}/${result.total} सही)`
                : `You scored ${result.score}% (${result.correctCount}/${result.total} correct)`}
            </p>
            <p className="text-sm text-muted-foreground">
              {hi
                ? `पास स्कोर: ${passingScore}%`
                : `Passing score: ${passingScore}%`}
              {' · '}
              {hi
                ? `उत्तरित: ${answeredCount}/${questions.length}`
                : `Answered: ${answeredCount}/${questions.length}`}
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
          <h3 className="font-semibold text-lg">
            {hi ? 'उत्तर समीक्षा' : 'Review answers'}
          </h3>
          {questions.map((q, idx) => {
            const ans = result.answers.find((a) => a.questionId === q.id)
            const isCorrect = ans?.isCorrect ?? false
            return (
              <Card
                key={q.id}
                className={cn(
                  'border-l-4',
                  isCorrect ? 'border-l-green-500' : 'border-l-red-500',
                )}
              >
                <CardHeader>
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {hi ? 'प्रश्न' : 'Question'} {idx + 1}
                      </p>
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
                      <span className="font-medium">
                        {hi ? 'व्याख्या: ' : 'Explanation: '}
                      </span>
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

  // ── Answering screen ─────────────────────────────────────
  const answeredCount = Object.values(answers).filter((a) => a.length > 0).length
  const progress =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0
  const currentQ = questions[currentIdx]
  const isLast = currentIdx === questions.length - 1
  const isFirst = currentIdx === 0

  // Status colors for palette buttons (computed inline; the answers map
  // is small and this avoids a use-after-conditional-return violation).
  const paletteStatus = questions.map((q, idx) => {
    if (idx === currentIdx) return 'current' as const
    return answers[q.id]?.length > 0
      ? ('answered' as const)
      : ('unanswered' as const)
  })

  const lowTime = secondsLeft !== null && secondsLeft <= 60
  const timeStr = secondsLeft === null ? null : formatTime(secondsLeft)

  return (
    <div className="space-y-4">
      {/* Header: title + timer + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold">{title}</h2>
          {timeStr && (
            <Badge
              variant={lowTime ? 'destructive' : 'outline'}
              className={cn(
                'text-sm font-mono px-3 py-1',
                lowTime && 'animate-pulse',
              )}
            >
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {timeStr}
            </Badge>
          )}
        </div>
        {instructions && (
          <p className="text-sm text-muted-foreground">{instructions}</p>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {answeredCount} / {questions.length} {hi ? 'उत्तरित' : 'answered'}
            </span>
            <span>
              {hi ? 'पास' : 'Pass'}: {passingScore}%
            </span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {/* Two-column layout on desktop: question + palette */}
      <div className="grid lg:grid-cols-[1fr_240px] gap-4">
        {/* Left: current question */}
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <p className="text-xs text-muted-foreground">
                {hi ? 'प्रश्न' : 'Question'} {currentIdx + 1} /{' '}
                {questions.length}
              </p>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={phase === 'submitting' || isPending}
                    className="gap-1.5"
                  >
                    {phase === 'submitting' || isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {hi ? 'टेस्ट जमा करें' : 'Submit test'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {hi ? 'टेस्ट जमा करें?' : 'Submit test?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {answeredCount < questions.length ? (
                        hi ? (
                          <>
                            आपने केवल {answeredCount}/{questions.length} प्रश्नों
                            के उत्तर दिए हैं। जमा करने के बाद आप अपने उत्तर नहीं
                            बदल सकते।
                          </>
                        ) : (
                          <>
                            You have answered {answeredCount} of{' '}
                            {questions.length} questions. After submitting, you
                            cannot change your answers.
                          </>
                        )
                      ) : hi ? (
                        'क्या आप वाकई जमा करना चाहते हैं? जमा करने के बाद आप अपने उत्तर नहीं बदल सकते।'
                      ) : (
                        'Are you sure you want to submit? You cannot change your answers after submission.'
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {hi ? 'रद्द करें' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={submit}>
                      {hi ? 'जमा करें' : 'Submit'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={() =>
                  setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
                }
                className="gap-1.5"
              >
                {hi ? 'अगला' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right: question palette (sticky on desktop, below on mobile) */}
        <div className="lg:sticky lg:top-4 h-fit">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" />
                {hi ? 'प्रश्न पैलेट' : 'Question palette'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-1.5">
                {questions.map((q, idx) => {
                  const status = paletteStatus[idx]
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={cn(
                        'flex items-center justify-center h-8 w-full rounded-md text-xs font-medium border transition-colors',
                        status === 'current' &&
                          'border-primary bg-primary text-primary-foreground',
                        status === 'answered' &&
                          'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20',
                        status === 'unanswered' &&
                          'border-muted-foreground/30 text-muted-foreground',
                      )}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
              {/* Legend */}
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border border-primary bg-primary" />
                  {hi ? 'वर्तमान' : 'Current'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border border-green-500 bg-green-50" />
                  {hi ? 'उत्तरित' : 'Answered'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm border border-muted-foreground/30" />
                  {hi ? 'अनुत्तरित' : 'Not answered'}
                </div>
              </div>

              {/* Submit (always available in palette) */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full gap-1.5"
                    disabled={phase === 'submitting' || isPending}
                  >
                    {phase === 'submitting' || isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {hi ? 'जमा करें' : 'Submit'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {hi ? 'टेस्ट जमा करें?' : 'Submit test?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {answeredCount < questions.length
                        ? hi
                          ? `आपने केवल ${answeredCount}/${questions.length} प्रश्नों के उत्तर दिए हैं।`
                          : `You have answered ${answeredCount} of ${questions.length} questions.`
                        : hi
                          ? 'क्या आप वाकई जमा करना चाहते हैं?'
                          : 'Are you sure you want to submit?'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {hi ? 'रद्द करें' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={submit}>
                      {hi ? 'जमा करें' : 'Submit'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
