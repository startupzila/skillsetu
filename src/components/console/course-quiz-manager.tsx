'use client'

import { useCallback, useEffect, useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/shared'
import { sanitizeHtml } from '@/lib/sanitize-html'

type Lang = 'en' | 'hi'

interface CourseQuizTranslation {
  id: string
  language_code: string
  title: string
  instructions: string | null
  status: string
}

interface CourseQuiz {
  id: string
  slug: string
  status: string
  passing_score: number
  published_at: string | null
  created_at: string
  course_id: string | null
  translations: CourseQuizTranslation[]
  course: {
    id: string
    slug: string
    translations: { language_code: string; title: string; status: string }[]
  } | null
  quiz_questions: { question_id: string }[]
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

interface CourseQuizManagerProps {
  initialQuizzes: CourseQuiz[]
}

const MCQ_TYPES = ['single_choice', 'multiple_choice', 'true_false']
const TYPE_LABEL: Record<string, string> = {
  single_choice: 'Single choice',
  multiple_choice: 'Multiple',
  true_false: 'True/False',
}

interface CourseOption {
  id: string
  slug: string
  translations: { language_code: string; title: string; status: string }[]
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

interface QuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: CourseQuiz | null
  eligibleQuestions: EligibleQuestion[]
  onSaved: () => Promise<void> | void
}

function QuizDialog({
  open,
  onOpenChange,
  editing,
  eligibleQuestions,
  onSaved,
}: QuizDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [lang, setLang] = useState<Lang>('en')

  const [titleEn, setTitleEn] = useState('')
  const [titleHi, setTitleHi] = useState('')
  const [instructionsEn, setInstructionsEn] = useState('')
  const [instructionsHi, setInstructionsHi] = useState('')
  const [passingScore, setPassingScore] = useState<number>(60)
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
      setPassingScore(editing.passing_score ?? 60)
      setSlug(editing.slug)
      setLinkedIds(
        new Set((editing.quiz_questions ?? []).map((qq) => qq.question_id)),
      )
      // Hydrate the course selection from the editing quiz's course row.
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
      setPassingScore(60)
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

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Auto-generate slug from EN title when creating a new quiz.
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
          description: 'Please link this quiz to a course.',
          variant: 'destructive',
        })
        return
      }
      try {
        if (editing) {
          const updateBody: Record<string, unknown> = {
            passing_score: passingScore,
            course_id: course.id,
            title_en: titleEn,
            instructions_en: instructionsEn || null,
          }
          if (hiExists || titleHi.trim() || instructionsHi.trim()) {
            updateBody.title_hi = titleHi || titleEn
            updateBody.instructions_hi = instructionsHi || null
          }
          const updateRes = await fetch(`/api/admin/quizzes/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
          })
          const updateJson = (await updateRes.json()) as { error?: string }
          if (!updateRes.ok) {
            toast({
              title: 'Error',
              description: updateJson.error ?? 'Failed to update quiz.',
              variant: 'destructive',
            })
            return
          }

          // Sync linked questions
          const existingIds = new Set(
            (editing.quiz_questions ?? []).map((qq) => qq.question_id),
          )
          for (const qid of linkedIds) {
            if (!existingIds.has(qid)) {
              await fetch(`/api/admin/quizzes/${editing.id}?action=add-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question_id: qid }),
              })
            }
          }
          for (const qid of existingIds) {
            if (!linkedIds.has(qid)) {
              await fetch(
                `/api/admin/quizzes/${editing.id}?action=remove-question`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ question_id: qid }),
                },
              )
            }
          }
          toast({ title: 'Saved', description: 'Course quiz updated.' })
        } else {
          // Create flow
          const finalSlug = slug.trim() || `course-quiz-${Date.now().toString(36)}`
          const createRes = await fetch('/api/admin/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              course_id: course.id,
              slug: finalSlug,
              passing_score: passingScore,
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
              description: createJson.error ?? 'Failed to create quiz.',
              variant: 'destructive',
            })
            return
          }
          const newQuizId = createJson.data?.id
          if (newQuizId) {
            for (const qid of linkedIds) {
              await fetch(`/api/admin/quizzes/${newQuizId}?action=add-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question_id: qid }),
              })
            }
          }
          toast({ title: 'Created', description: 'Course quiz added.' })
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
            {editing ? 'Edit course quiz' : 'New course quiz'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update quiz title, instructions, passing score, linked course, and questions.'
              : 'Create a course-level quiz (not attached to a specific lesson).'}
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
              Search published courses by title and link this quiz to one.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>
              Quiz title
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
              placeholder={lang === 'hi' ? 'क्विज़ का शीर्षक' : 'Quiz title'}
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
                  ? 'शिक्षार्थियों के लिए निर्देश…'
                  : 'Instructions shown to learners before they start…'
              }
              className="min-h-[80px]"
              disabled={isPending}
            />
          </div>

          {/* Passing score + slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-title"
                disabled={isPending || !!editing}
              />
              {!editing && (
                <p className="text-xs text-muted-foreground">
                  Auto-generated from the English title. Edit if you want a custom slug.
                </p>
              )}
            </div>
          </div>

          {/* Linked questions */}
          <div className="space-y-2">
            <Label>Linked questions</Label>
            <p className="text-xs text-muted-foreground">
              Pick published MCQ questions to include in this quiz.
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
            {editing ? 'Save changes' : 'Create quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuizRow({
  quiz,
  onEdit,
  onDelete,
  onPublish,
  disabled,
}: {
  quiz: CourseQuiz
  onEdit: () => void
  onDelete: () => void
  onPublish: () => void
  disabled: boolean
}) {
  const t =
    quiz.translations?.find((x) => x.language_code === 'en') ??
    quiz.translations?.[0] ??
    null
  const courseTitle =
    quiz.course?.translations?.find((x) => x.language_code === 'en')?.title ??
    quiz.course?.translations?.[0]?.title ??
    null
  const questionCount = quiz.quiz_questions?.length ?? 0

  return (
    <tr className="hover:bg-accent/30">
      <td className="px-4 py-3">
        <p className="font-medium line-clamp-2">{t?.title ?? quiz.slug}</p>
        <p className="text-xs text-muted-foreground">/{quiz.slug}</p>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {courseTitle ? (
          <span className="text-sm">{courseTitle}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">No course</span>
        )}
        {quiz.course && (
          <p className="text-xs text-muted-foreground">/{quiz.course.slug}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={quiz.status} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <Badge variant="secondary" className="text-xs">
          {questionCount} Q{questionCount === 1 ? '' : 's'}
        </Badge>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <Badge variant="outline" className="text-xs">
          {quiz.passing_score}% pass
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
          {quiz.status !== 'published' && (
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

/** CourseQuizManager — full client-side manager for course quizzes. */
export function CourseQuizManager({ initialQuizzes }: CourseQuizManagerProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>(initialQuizzes)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseQuiz | null>(null)
  const [eligibleQuestions, setEligibleQuestions] = useState<EligibleQuestion[]>([])

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/quizzes?course_only=1')
      const json = (await res.json()) as { data?: CourseQuiz[] }
      if (json.data) setQuizzes(json.data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    // Load eligible questions on mount.
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
  function openEdit(q: CourseQuiz) {
    setEditing(q)
    setDialogOpen(true)
  }
  function publishQuiz(quizId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/quizzes/${quizId}?action=publish`, {
          method: 'POST',
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to publish quiz.',
            variant: 'destructive',
          })
          return
        }
        toast({ title: 'Published', description: 'Quiz is now live.' })
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
  function deleteQuiz(quizId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/quizzes/${quizId}`, {
          method: 'DELETE',
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to delete quiz.',
            variant: 'destructive',
          })
          return
        }
        toast({ title: 'Deleted', description: 'Quiz removed.' })
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
          <h1 className="text-2xl font-bold tracking-tight">Course Quizzes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage course-level quizzes (not attached to a specific lesson).
          </p>
        </div>
        <Button onClick={openCreate} disabled={isPending}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No course-level quizzes yet. Click &ldquo;New Quiz&rdquo; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Quiz</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Questions</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Pass</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quizzes.map((quiz) => (
                <QuizRow
                  key={quiz.id}
                  quiz={quiz}
                  disabled={isPending}
                  onEdit={() => openEdit(quiz)}
                  onDelete={() => deleteQuiz(quiz.id)}
                  onPublish={() => publishQuiz(quiz.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QuizDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        editing={editing}
        eligibleQuestions={eligibleQuestions}
        onSaved={reload}
      />

      {/* Helper status row */}
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        <span>
          {quizzes.length} course quiz{quizzes.length === 1 ? '' : 'zes'} total.
          Lesson-attached quizzes are managed inside the lesson editor.
        </span>
      </div>
    </>
  )
}
