'use client'

import { useCallback, useEffect, useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pencil,
  Send,
  Trash2,
  Plus,
  Loader2,
  Save,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Gauge,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/shared'
import { sanitizeHtml } from '@/lib/sanitize-html'

type Lang = 'en' | 'hi'
type Difficulty = 'easy' | 'medium' | 'hard'

interface TestTranslation {
  id: string
  language_code: string
  title: string
  instructions: string | null
  status: string
}

interface MockTest {
  id: string
  slug: string
  status: string
  course_id: string | null
  time_limit_minutes: number | null
  question_count: number
  passing_score: number
  attempts_allowed: number | null
  randomize: boolean
  review_mode: boolean
  difficulty: Difficulty
  published_at: string | null
  created_at: string
  translations: TestTranslation[]
  course: {
    id: string
    slug: string
    translations: { language_code: string; title: string; status: string }[]
  } | null
  test_questions: { question_id: string }[]
}

interface EligibleQuestion {
  id: string
  slug: string
  question_type: string
  difficulty: string
  status: string
  topic: string | null
  translations: { id: string; language_code: string; question_text: string }[]
}

interface CourseOption {
  id: string
  slug: string
  translations: { language_code: string; title: string; status: string }[]
}

interface MockTestManagerProps {
  initialTests: MockTest[]
}

const TYPE_LABEL: Record<string, string> = {
  single_choice: 'Single choice',
  multiple_choice: 'Multiple',
  true_false: 'True/False',
}

/** CourseSearchInput — debounced AJAX search against /api/courses?q=...
 *  Renders a single line of results the user can click to pick a course. */
function CourseSearchInput({
  selected,
  onSelect,
  onClear,
  disabled,
}: {
  selected: CourseOption | null
  onSelect: (c: CourseOption) => void
  onClear: () => void
  disabled?: boolean
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CourseOption[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (selected) return
    if (!q.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/courses?q=${encodeURIComponent(q.trim())}`)
        const json = (await res.json()) as { data?: CourseOption[] }
        setResults(json.data ?? [])
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [q, selected])

  if (selected) {
    const title =
      selected.translations?.find((t) => t.language_code === 'en')?.title ??
      selected.translations?.[0]?.title ??
      selected.slug
    return (
      <div className="flex items-center justify-between rounded-md border bg-primary/5 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground">/{selected.slug}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={disabled}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a course name…"
          disabled={disabled}
          className="pl-9"
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md max-h-60 overflow-y-auto">
          {results.map((c) => {
            const title =
              c.translations?.find((t) => t.language_code === 'en')?.title ??
              c.translations?.[0]?.title ??
              c.slug
            return (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(c)
                  setShowResults(false)
                  setQ('')
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">{title}</span>
                <span className="text-xs text-muted-foreground">/{c.slug}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface TestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: MockTest | null
  eligibleQuestions: EligibleQuestion[]
  onSaved: () => Promise<void> | void
}

function TestDialog({
  open,
  onOpenChange,
  editing,
  eligibleQuestions,
  onSaved,
}: TestDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [lang, setLang] = useState<Lang>('en')

  const [titleEn, setTitleEn] = useState('')
  const [titleHi, setTitleHi] = useState('')
  const [instructionsEn, setInstructionsEn] = useState('')
  const [instructionsHi, setInstructionsHi] = useState('')
  const [timeLimit, setTimeLimit] = useState<number>(60)
  const [passingScore, setPassingScore] = useState<number>(60)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [questionCount, setQuestionCount] = useState<number>(0)
  const [attemptsAllowed, setAttemptsAllowed] = useState<string>('')
  const [slug, setSlug] = useState('')

  const [course, setCourse] = useState<CourseOption | null>(null)
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set())
  const [hiExists, setHiExists] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      const enT = editing.translations.find((x) => x.language_code === 'en')
      const hiT = editing.translations.find((x) => x.language_code === 'hi')
      setTitleEn(enT?.title ?? '')
      setInstructionsEn(enT?.instructions ?? '')
      setTitleHi(hiT?.title ?? '')
      setInstructionsHi(hiT?.instructions ?? '')
      setHiExists(Boolean(hiT))
      setTimeLimit(editing.time_limit_minutes ?? 60)
      setPassingScore(editing.passing_score ?? 60)
      setDifficulty(editing.difficulty ?? 'medium')
      setQuestionCount(editing.question_count ?? 0)
      setAttemptsAllowed(
        editing.attempts_allowed != null
          ? String(editing.attempts_allowed)
          : '',
      )
      setSlug(editing.slug)
      setLinkedIds(
        new Set((editing.test_questions ?? []).map((qq) => qq.question_id)),
      )
      if (editing.course) {
        setCourse(editing.course as unknown as CourseOption)
      } else {
        setCourse(null)
      }
    } else {
      setTitleEn('')
      setTitleHi('')
      setInstructionsEn('')
      setInstructionsHi('')
      setTimeLimit(60)
      setPassingScore(60)
      setDifficulty('medium')
      setQuestionCount(0)
      setAttemptsAllowed('')
      setSlug('')
      setLinkedIds(new Set())
      setHiExists(false)
      setCourse(null)
    }
    setLang('en')
  }, [open, editing])

  function toggleLinked(questionId: string) {
    setLinkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  // Auto-sync question_count with linked questions count when creating.
  useEffect(() => {
    if (!editing) {
      setQuestionCount(linkedIds.size)
    }
  }, [linkedIds, editing])

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  useEffect(() => {
    if (!editing && titleEn && !slug) {
      setSlug(autoSlug(titleEn))
    }
  }, [editing, titleEn, slug])

  function save() {
    startTransition(async () => {
      if (!titleEn.trim()) {
        toast({
          title: 'Missing English title',
          description: 'The English title is required.',
          variant: 'destructive',
        })
        return
      }
      if (!course) {
        toast({
          title: 'Course required',
          description: 'Please link this mock test to a course.',
          variant: 'destructive',
        })
        return
      }
      const attemptsNum =
        attemptsAllowed.trim() === '' ? null : Number(attemptsAllowed)
      try {
        if (editing) {
          const updateBody: Record<string, unknown> = {
            time_limit_minutes: timeLimit,
            passing_score: passingScore,
            difficulty,
            question_count: questionCount,
            attempts_allowed: attemptsNum,
            course_id: course.id,
            title_en: titleEn,
            instructions_en: instructionsEn || null,
          }
          if (hiExists || titleHi.trim() || instructionsHi.trim()) {
            updateBody.title_hi = titleHi || titleEn
            updateBody.instructions_hi = instructionsHi || null
          }
          const updateRes = await fetch(`/api/admin/mock-tests/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
          })
          const updateJson = (await updateRes.json()) as { error?: string }
          if (!updateRes.ok) {
            toast({
              title: 'Error',
              description: updateJson.error ?? 'Failed to update mock test.',
              variant: 'destructive',
            })
            return
          }

          // Sync linked questions
          const existingIds = new Set(
            (editing.test_questions ?? []).map((qq) => qq.question_id),
          )
          for (const qid of linkedIds) {
            if (!existingIds.has(qid)) {
              await fetch(
                `/api/admin/mock-tests/${editing.id}?action=add-question`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ question_id: qid }),
                },
              )
            }
          }
          for (const qid of existingIds) {
            if (!linkedIds.has(qid)) {
              await fetch(
                `/api/admin/mock-tests/${editing.id}?action=remove-question`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ question_id: qid }),
                },
              )
            }
          }
          toast({ title: 'Saved', description: 'Mock test updated.' })
        } else {
          const finalSlug =
            slug.trim() || `mock-test-${Date.now().toString(36)}`
          const createRes = await fetch('/api/admin/mock-tests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              course_id: course.id,
              slug: finalSlug,
              time_limit_minutes: timeLimit,
              passing_score: passingScore,
              difficulty,
              question_count: questionCount,
              attempts_allowed: attemptsNum,
              title_en: titleEn,
              title_hi: titleHi.trim() ? titleHi : undefined,
              instructions_en: instructionsEn || undefined,
              instructions_hi: instructionsHi || undefined,
            }),
          })
          const createJson = (await createRes.json()) as {
            data?: { id: string }
            error?: string
          }
          if (!createRes.ok) {
            toast({
              title: 'Error',
              description: createJson.error ?? 'Failed to create mock test.',
              variant: 'destructive',
            })
            return
          }
          const newTestId = createJson.data?.id
          if (newTestId) {
            for (const qid of linkedIds) {
              await fetch(
                `/api/admin/mock-tests/${newTestId}?action=add-question`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ question_id: qid }),
                },
              )
            }
          }
          toast({ title: 'Created', description: 'Mock test added.' })
        }
        await onSaved()
        onOpenChange(false)
      } catch {
        toast({
          title: 'Error',
          description: 'Something went wrong.',
          variant: 'destructive',
        })
      }
    })
  }

  const canSave = !isPending && titleEn.trim().length > 0 && !!course

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit mock test' : 'New mock test'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the mock test details, linked course, and questions.'
              : 'Create a timed course-level mock test.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language tabs */}
          <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="hi">हिन्दी</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Linked course */}
          <div className="space-y-2">
            <Label>Linked course</Label>
            <CourseSearchInput
              selected={course}
              onSelect={setCourse}
              onClear={() => setCourse(null)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Search published courses by title and link this mock test to one.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>
              Mock test title
              <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </Label>
            <Input
              value={lang === 'hi' ? titleHi : titleEn}
              onChange={(e) =>
                lang === 'hi'
                  ? setTitleHi(e.target.value)
                  : setTitleEn(e.target.value)
              }
              placeholder={lang === 'hi' ? 'मॉक टेस्ट का शीर्षक' : 'Mock test title'}
              disabled={isPending}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>
              Instructions (optional)
              <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </Label>
            <Textarea
              value={lang === 'hi' ? instructionsHi : instructionsEn}
              onChange={(e) =>
                lang === 'hi'
                  ? setInstructionsHi(e.target.value)
                  : setInstructionsEn(e.target.value)
              }
              placeholder={
                lang === 'hi'
                  ? 'परीक्षार्थियों के लिए निर्देश…'
                  : 'Instructions shown to learners before they start…'
              }
              className="min-h-[80px]"
              disabled={isPending}
            />
          </div>

          {/* Settings grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-limit">Time limit (minutes)</Label>
              <Input
                id="time-limit"
                type="number"
                min={1}
                step={1}
                value={timeLimit}
                onChange={(e) =>
                  setTimeLimit(
                    e.target.value === '' ? 0 : Number(e.target.value),
                  )
                }
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passing-score">Passing score (%)</Label>
              <Input
                id="passing-score"
                type="number"
                min={0}
                max={100}
                step={1}
                value={passingScore}
                onChange={(e) =>
                  setPassingScore(
                    e.target.value === '' ? 0 : Number(e.target.value),
                  )
                }
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
                disabled={isPending}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Pick difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attempts-allowed">Attempts allowed (optional)</Label>
              <Input
                id="attempts-allowed"
                type="number"
                min={0}
                step={1}
                value={attemptsAllowed}
                onChange={(e) => setAttemptsAllowed(e.target.value)}
                placeholder="Leave blank = unlimited"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-count">Question count</Label>
              <Input
                id="question-count"
                type="number"
                min={0}
                step={1}
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(
                    e.target.value === '' ? 0 : Number(e.target.value),
                  )
                }
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Auto-synced with linked questions below.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                disabled={isPending || !!editing}
              />
            </div>
          </div>

          {/* Linked questions */}
          <div className="space-y-2">
            <Label>Linked questions</Label>
            <p className="text-xs text-muted-foreground">
              Pick published MCQ questions to include in this mock test.
            </p>
            {eligibleQuestions.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/20 p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  No published MCQ questions yet. Create some in the
                  Questions section first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto rounded-md border p-2">
                {eligibleQuestions.map((q) => {
                  const qt = q.translations?.find(
                    (t) => t.language_code === lang,
                  ) ?? q.translations?.[0]
                  const isLinked = linkedIds.has(q.id)
                  return (
                    <label
                      key={q.id}
                      className={`flex items-start gap-2.5 rounded-md border p-2 cursor-pointer transition-colors ${
                        isLinked
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent/40'
                      }`}
                    >
                      <Checkbox
                        checked={isLinked}
                        onCheckedChange={() => toggleLinked(q.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABEL[q.question_type] ?? q.question_type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {q.difficulty}
                          </Badge>
                        </div>
                        <p
                          className="text-sm mt-1 line-clamp-2 prose prose-sm dark:prose-invert max-w-none text-foreground"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(qt?.question_text ?? ''),
                          }}
                        />
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {linkedIds.size} question{linkedIds.size === 1 ? '' : 's'} linked.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            {editing ? 'Save changes' : 'Create mock test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TestRow({
  test,
  onEdit,
  onDelete,
  onPublish,
  disabled,
}: {
  test: MockTest
  onEdit: () => void
  onDelete: () => void
  onPublish: () => void
  disabled: boolean
}) {
  const t =
    test.translations?.find((x) => x.language_code === 'en') ??
    test.translations?.[0] ??
    null
  const courseTitle =
    test.course?.translations?.find((x) => x.language_code === 'en')?.title ??
    test.course?.translations?.[0]?.title ??
    null
  const questionCount = test.test_questions?.length ?? test.question_count ?? 0

  return (
    <tr className="hover:bg-accent/30">
      <td className="px-4 py-3">
        <p className="font-medium line-clamp-2">{t?.title ?? test.slug}</p>
        <p className="text-xs text-muted-foreground">/{test.slug}</p>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {courseTitle ? (
          <span className="text-sm">{courseTitle}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">No course</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={test.status} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <Badge variant="secondary" className="text-xs">
          {questionCount} Q{questionCount === 1 ? '' : 's'}
        </Badge>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {test.time_limit_minutes ?? '—'}m
        </span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <Badge variant="outline" className="text-xs capitalize">
          <Gauge className="h-3 w-3 mr-1" />
          {test.difficulty}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex gap-1 justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onEdit}
            disabled={disabled}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          {test.status !== 'published' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onPublish}
              disabled={disabled}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="sr-only">Publish</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onDelete}
            disabled={disabled}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </td>
    </tr>
  )
}

/** MockTestManager — full client-side manager for course mock tests. */
export function MockTestManager({ initialTests }: MockTestManagerProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [tests, setTests] = useState<MockTest[]>(initialTests)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MockTest | null>(null)
  const [eligibleQuestions, setEligibleQuestions] = useState<EligibleQuestion[]>([])

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mock-tests')
      const json = (await res.json()) as { data?: MockTest[] }
      if (json.data) setTests(json.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/questions/eligible')
        const json = (await res.json()) as { data?: EligibleQuestion[] }
        if (json.data) setEligibleQuestions(json.data)
      } catch {
        // silent
      }
    })()
  }, [])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(t: MockTest) {
    setEditing(t)
    setDialogOpen(true)
  }
  function publishTest(testId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/mock-tests/${testId}?action=publish`, {
          method: 'POST',
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to publish mock test.',
            variant: 'destructive',
          })
          return
        }
        toast({ title: 'Published', description: 'Mock test is now live.' })
        await reload()
      } catch {
        toast({
          title: 'Error',
          description: 'Something went wrong.',
          variant: 'destructive',
        })
      }
    })
  }
  function deleteTest(testId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/mock-tests/${testId}`, {
          method: 'DELETE',
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to delete mock test.',
            variant: 'destructive',
          })
          return
        }
        toast({ title: 'Deleted', description: 'Mock test removed.' })
        await reload()
      } catch {
        toast({
          title: 'Error',
          description: 'Something went wrong.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mock Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage timed course-level mock tests for exam practice.
          </p>
        </div>
        <Button onClick={openCreate} disabled={isPending}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Mock Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No mock tests yet. Click &ldquo;New Mock Test&rdquo; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Mock Test</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Questions</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Time</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Difficulty</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tests.map((test) => (
                <TestRow
                  key={test.id}
                  test={test}
                  disabled={isPending}
                  onEdit={() => openEdit(test)}
                  onDelete={() => deleteTest(test.id)}
                  onPublish={() => publishTest(test.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TestDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        editing={editing}
        eligibleQuestions={eligibleQuestions}
        onSaved={reload}
      />

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        <span>
          {tests.length} mock test{tests.length === 1 ? '' : 's'} total.
        </span>
      </div>
    </>
  )
}
