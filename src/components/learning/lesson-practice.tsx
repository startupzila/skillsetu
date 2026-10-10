'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sanitizeHtml } from '@/lib/sanitize-html'

interface QuestionOption {
  id: string
  sort_order: number
  text: { en: string; hi?: string }
  is_correct: boolean
}

interface LessonQuestionData {
  id: string
  slug: string
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'descriptive'
  difficulty: string
  translations: { language_code: string; question_text: string; explanation: string | null; model_answer: string | null }[]
  options: QuestionOption[]
}

const TYPE_LABELS: Record<string, string> = {
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  true_false: 'True / False',
  descriptive: 'Descriptive',
}

/** Extract the EN translation fields. */
function enTrans(q: LessonQuestionData) {
  const t = q.translations.find((t) => t.language_code === 'en') ?? q.translations[0]
  return t ?? { question_text: '', explanation: null, model_answer: null }
}

/**
 * LessonPractice — renders lesson-attached MCQs + QNAs below the lesson content
 * (w3schools-style practice). Purely client-side, no grading/attempt tracking:
 * the learner picks answers, clicks "Check", sees correct/incorrect + the
 * explanation (which may be rich HTML). For descriptive questions, the learner
 * writes a free-text answer and reveals the model answer.
 */
export function LessonPractice({ questions }: { questions: LessonQuestionData[] }) {
  if (!questions || questions.length === 0) return null

  const mcqs = questions.filter((q) => q.question_type !== 'descriptive')
  const qnas = questions.filter((q) => q.question_type === 'descriptive')

  return (
    <div className="space-y-8 mt-10">
      {mcqs.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Practice Questions
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Test your understanding — pick an answer and check.
          </p>
          <div className="space-y-4">
            {mcqs.map((q, i) => (
              <McqCard key={q.id} question={q} index={i + 1} />
            ))}
          </div>
        </section>
      )}

      {qnas.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Review Questions
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Think about the answer, then reveal the model answer.
          </p>
          <div className="space-y-4">
            {qnas.map((q, i) => (
              <QnaCard key={q.id} question={q} index={i + 1} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/** A single MCQ practice card. */
function McqCard({ question, index }: { question: LessonQuestionData; index: number }) {
  const t = enTrans(question)
  const isMultiple = question.question_type === 'multiple_choice'
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState(false)

  const correctIds = new Set(question.options.filter((o) => o.is_correct).map((o) => o.id))

  function toggle(id: string) {
    if (checked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (isMultiple) {
        if (next.has(id)) next.delete(id)
        else next.add(id)
      } else {
        next.clear()
        next.add(id)
      }
      return next
    })
  }

  const allCorrect =
    checked &&
    selected.size === correctIds.size &&
    [...selected].every((id) => correctIds.has(id))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold leading-snug flex-1">
            <span className="text-muted-foreground mr-2">Q{index}.</span>
            <span
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.question_text) }}
            />
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-xs">{TYPE_LABELS[question.question_type]}</Badge>
            <Badge variant="secondary" className="text-xs capitalize">{question.difficulty}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {question.options.map((opt) => {
            const isSelected = selected.has(opt.id)
            const isCorrect = opt.is_correct
            const showState = checked && (isSelected || isCorrect)
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => toggle(opt.id)}
                  disabled={checked}
                  className={`w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    showState
                      ? isCorrect
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                        : isSelected
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                          : 'border-border'
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                  } ${checked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`flex items-center justify-center h-5 w-5 shrink-0 rounded-full border text-xs ${
                    isMultiple ? 'rounded-md' : ''
                  } ${
                    showState
                      ? isCorrect
                        ? 'border-green-500 bg-green-500 text-white'
                        : isSelected
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-muted-foreground'
                      : isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                  }`}>
                    {showState && isCorrect ? '✓' : showState && isSelected ? '✕' : ''}
                  </span>
                  <span className="flex-1">{opt.text.en}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {!checked ? (
          <Button size="sm" onClick={() => setChecked(true)} disabled={selected.size === 0}>
            Check answer
          </Button>
        ) : (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm font-medium ${allCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {allCorrect ? <><CheckCircle2 className="h-4 w-4" /> Correct!</> : <><XCircle className="h-4 w-4" /> Not quite right</>}
            </div>
            {t.explanation && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-1">Explanation</p>
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.explanation) }} />
              </div>
            )}
            <Button size="sm" variant="ghost" onClick={() => { setChecked(false); setSelected(new Set()) }}>
              Try again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** A single descriptive / QNA practice card. */
function QnaCard({ question, index }: { question: LessonQuestionData; index: number }) {
  const t = enTrans(question)
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold leading-snug flex-1">
            <span className="text-muted-foreground mr-2">Q{index}.</span>
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.question_text) }} />
          </CardTitle>
          <Badge variant="outline" className="text-xs">Descriptive</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here…"
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {!revealed ? (
          <Button size="sm" variant="outline" onClick={() => setRevealed(true)}>
            Reveal model answer
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3 text-sm">
              <p className="font-medium mb-1 text-green-700 dark:text-green-400">Model answer</p>
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.model_answer) }} />
            </div>
            {t.explanation && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-1">Explanation</p>
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.explanation) }} />
              </div>
            )}
            <Button size="sm" variant="ghost" onClick={() => setRevealed(false)}>
              Hide
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
