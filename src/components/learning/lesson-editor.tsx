'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  Youtube as YoutubeIcon,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/shared'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { sanitizeHtml } from '@/lib/sanitize-html'

// ─── Types ─────────────────────────────────────────────────────────────

type Lang = 'en' | 'hi'

interface LessonTranslation {
  id: string
  language_code: string
  title: string
  summary: string | null
  content_html: string | null
  status: string
}

interface LessonData {
  id: string
  slug: string
  sort_order: number
  lesson_type: string
  status: string
  duration_minutes: number | null
  video_url: string | null
  module_id: string
  translations: LessonTranslation[]
}

interface QuestionOptionText {
  en?: string
  hi?: string
  [lang: string]: string | undefined
}

interface QuestionOption {
  id: string
  sort_order: number
  text: QuestionOptionText | string
  is_correct: boolean
}

interface QuestionTranslation {
  id: string
  language_code: string
  question_text: string
  explanation: string | null
  model_answer: string | null
  status: string
}

interface QuestionData {
  id: string
  slug: string
  question_type: string
  difficulty: string
  status: string
  topic: string | null
  published_at: string | null
  created_at: string
  translations: QuestionTranslation[]
  options: QuestionOption[]
}

interface LessonEditorProps {
  courseId: string
  lessonId: string
}

// ─── Constants ─────────────────────────────────────────────────────────

const MCQ_TYPES = ['single_choice', 'multiple_choice', 'true_false'] as const
type McqType = (typeof MCQ_TYPES)[number]

const TYPE_LABEL: Record<string, string> = {
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  descriptive: 'Descriptive',
}

// ─── Helpers ───────────────────────────────────────────────────────────

function pickTranslation(
  q: QuestionData,
  lang: Lang,
): QuestionTranslation | null {
  if (!q.translations || q.translations.length === 0) return null
  return (
    q.translations.find((t) => t.language_code === lang) ??
    q.translations[0] ??
    null
  )
}

function optionText(
  text: QuestionOption['text'],
  lang: Lang,
): string {
  if (!text) return ''
  if (typeof text === 'string') {
    try {
      const parsed = JSON.parse(text) as QuestionOptionText
      return parsed[lang] ?? ''
    } catch {
      return text
    }
  }
  return text[lang] ?? ''
}

function genSlug(prefix: 'mcq' | 'qna'): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function questionExcerpt(q: QuestionData, lang: Lang = 'en'): string {
  const t = pickTranslation(q, lang)
  if (!t || !t.question_text) return 'Untitled question'
  const text = t.question_text.replace(/<[^>]*>/g, '').trim()
  return text.length > 0 ? text : 'Untitled question'
}

// ─── Main Component ────────────────────────────────────────────────────

export function LessonEditor({ courseId, lessonId }: LessonEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [loading, setLoading] = useState(true)
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [questions, setQuestions] = useState<QuestionData[]>([])

  // Active language for the editor — drives which translation's title /
  // summary / content_html / question text the forms bind to.
  const [lang, setLang] = useState<Lang>('en')

  // Per-language translation state (title, summary, content_html) keyed by lang.
  // We keep EN + HI both in memory so switching tabs doesn't lose edits.
  interface TransFormState {
    id: string | null // null = translation row doesn't exist yet (will be created on save)
    title: string
    summary: string
    contentHtml: string
    status: string
  }
  const [transStates, setTransStates] = useState<Record<Lang, TransFormState>>({
    en: { id: null, title: '', summary: '', contentHtml: '', status: 'draft' },
    hi: { id: null, title: '', summary: '', contentHtml: '', status: 'draft' },
  })
  // Track which languages have a translation row already (for "Add Hindi" CTA).
  const [langExists, setLangExists] = useState<Record<Lang, boolean>>({ en: false, hi: false })

  // Shared (language-agnostic) lesson core fields.
  const [videoUrl, setVideoUrl] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')

  // Section 3 + 4 — Dialog open states
  const [mcqDialogOpen, setMcqDialogOpen] = useState(false)
  const [mcqEditing, setMcqEditing] = useState<QuestionData | null>(null)
  const [qnaDialogOpen, setQnaDialogOpen] = useState(false)
  const [qnaEditing, setQnaEditing] = useState<QuestionData | null>(null)

  const mcqs = useMemo(
    () =>
      questions.filter(
        (q) => (MCQ_TYPES as readonly string[]).includes(q.question_type),
      ),
    [questions],
  )
  const qnas = useMemo(
    () => questions.filter((q) => q.question_type === 'descriptive'),
    [questions],
  )

  // The translation currently bound to the form fields (read-only view).
  const activeTrans = transStates[lang]

  function patchTransState(l: Lang, patch: Partial<TransFormState>) {
    setTransStates((prev) => ({ ...prev, [l]: { ...prev[l], ...patch } }))
  }

  const loadLesson = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const json = (await res.json()) as { data?: LessonData }
        const data = json.data ?? null
        setLesson(data)
        if (data) {
          setVideoUrl(data.video_url ?? '')
          setDurationMinutes(data.duration_minutes ?? '')

          const enT = data.translations.find((t) => t.language_code === 'en')
          const hiT = data.translations.find((t) => t.language_code === 'hi')
          setTransStates({
            en: {
              id: enT?.id ?? null,
              title: enT?.title ?? '',
              summary: enT?.summary ?? '',
              contentHtml: enT?.content_html ?? '',
              status: enT?.status ?? 'draft',
            },
            hi: {
              id: hiT?.id ?? null,
              title: hiT?.title ?? '',
              summary: hiT?.summary ?? '',
              contentHtml: hiT?.content_html ?? '',
              status: hiT?.status ?? 'draft',
            },
          })
          setLangExists({
            en: Boolean(enT),
            hi: Boolean(hiT),
          })
        }
      } else if (res.status === 401 || res.status === 403) {
        toast({
          title: 'Access denied',
          description: 'You may need to sign in again.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Failed to load lesson',
          description: `Server responded ${res.status}.`,
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Could not reach the server.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [lessonId, toast])

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/questions`)
      if (res.ok) {
        const json = (await res.json()) as { data?: QuestionData[] }
        setQuestions(json.data ?? [])
      }
    } catch {
      // silent — questions are secondary; lesson detail still works
    }
  }, [lessonId])

  useEffect(() => {
    loadLesson()
    loadQuestions()
  }, [loadLesson, loadQuestions])

  function saveLessonDetails() {
    startTransition(async () => {
      if (!lesson) {
        toast({
          title: 'Cannot save',
          description: 'Lesson not loaded yet.',
          variant: 'destructive',
        })
        return
      }
      const state = transStates[lang]
      if (!state.title.trim()) {
        toast({
          title: 'Missing title',
          description: 'Please provide a lesson title.',
          variant: 'destructive',
        })
        return
      }
      try {
        const translationBody: Record<string, unknown> = state.id
          ? {
              id: state.id,
              title: state.title,
              summary: state.summary || null,
            }
          : {
              language_code: lang,
              lesson_id: lessonId,
              title: state.title,
              summary: state.summary || null,
            }
        const res = await fetch(`/api/admin/lessons/${lessonId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lesson: {
              video_url: videoUrl.trim() ? videoUrl.trim() : null,
              duration_minutes:
                durationMinutes === '' ? null : Number(durationMinutes),
            },
            translation: translationBody,
          }),
        })
        const data = (await res.json()) as {
          error?: string
          data?: { translation?: { id?: string } }
        }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to save.',
            variant: 'destructive',
          })
          return
        }
        // Capture the new translation id (needed for subsequent updates).
        const newId = data.data?.translation?.id
        if (newId) {
          patchTransState(lang, { id: newId })
        }
        setLangExists((prev) => ({ ...prev, [lang]: true }))
        toast({
          title: 'Saved',
          description:
            lang === 'hi'
              ? 'Hindi lesson details saved.'
              : 'English lesson details saved.',
        })
        router.refresh()
      } catch {
        toast({
          title: 'Error',
          description: 'Something went wrong.',
          variant: 'destructive',
        })
      }
    })
  }

  function saveContent() {
    startTransition(async () => {
      const state = transStates[lang]
      if (!lesson) {
        toast({
          title: 'Cannot save',
          description: 'Lesson not loaded yet.',
          variant: 'destructive',
        })
        return
      }
      try {
        const translationBody: Record<string, unknown> = state.id
          ? { id: state.id, content_html: state.contentHtml }
          : {
              language_code: lang,
              lesson_id: lessonId,
              content_html: state.contentHtml,
              title: state.title || 'Untitled',
            }
        const res = await fetch(`/api/admin/lessons/${lessonId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ translation: translationBody }),
        })
        const data = (await res.json()) as {
          error?: string
          data?: { translation?: { id?: string } }
        }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to save.',
            variant: 'destructive',
          })
          return
        }
        const newId = data.data?.translation?.id
        if (newId) {
          patchTransState(lang, { id: newId })
        }
        setLangExists((prev) => ({ ...prev, [lang]: true }))
        toast({
          title: 'Saved',
          description:
            lang === 'hi' ? 'Hindi content saved.' : 'English content saved.',
        })
        router.refresh()
      } catch {
        toast({
          title: 'Error',
          description: 'Something went wrong.',
          variant: 'destructive',
        })
      }
    })
  }

  function publishLesson() {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/lessons/${lessonId}?action=publish`,
          { method: 'POST' },
        )
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to publish.',
            variant: 'destructive',
          })
          return
        }
        setLesson((prev) =>
          prev ? { ...prev, status: 'published' } : prev,
        )
        toast({ title: 'Published!', description: 'Lesson is now live.' })
        router.refresh()
      } catch {
        toast({
          title: 'Error',
          description: 'Something went wrong.',
          variant: 'destructive',
        })
      }
    })
  }

  function deleteQuestion(questionId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/questions/${questionId}`, {
          method: 'DELETE',
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data.error ?? 'Failed to delete.',
            variant: 'destructive',
          })
          return
        }
        toast({ title: 'Deleted', description: 'Question removed.' })
        await loadQuestions()
        router.refresh()
      } catch {
        toast({
          title: 'Error',
          description: 'Something went wrong.',
          variant: 'destructive',
        })
      }
    })
  }

  async function onQuestionDialogSaved() {
    await loadQuestions()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-6 space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/console/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to course
          </Link>
        </Button>
        <p className="text-muted-foreground">
          This lesson could not be loaded.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href={`/console/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to course
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Edit Lesson</h1>
          <StatusBadge status={lesson.status} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">/{lesson.slug}</p>
      </div>

      {/* Language selector — applies to all sections below */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">Language</span>
        <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
          <TabsList className="h-8">
            <TabsTrigger value="en" className="text-xs h-6 px-3">
              English
            </TabsTrigger>
            <TabsTrigger value="hi" className="text-xs h-6 px-3">
              हिन्दी (Hindi)
              {langExists.hi ? (
                <span className="ml-1 text-green-600">✓</span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-xs text-muted-foreground">
          {lang === 'en'
            ? 'Editing English translation'
            : langExists.hi
              ? 'Editing Hindi translation'
              : 'No Hindi translation yet — fill in the fields and save to create it.'}
        </span>
      </div>

      {/* Section 1 — Lesson details */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            Lesson details
            <span className="ml-2 text-xs font-normal text-muted-foreground uppercase">
              {lang}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lang === 'hi' && !langExists.hi ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No Hindi translation yet. Add one to make this lesson available in Hindi.
              </p>
              <Button
                size="sm"
                onClick={() => setLangExists((p) => ({ ...p, hi: true }))}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Hindi translation
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={activeTrans.title}
                  onChange={(e) => patchTransState(lang, { title: e.target.value })}
                  placeholder={lang === 'hi' ? 'पाठ का शीर्षक' : 'Lesson title'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={activeTrans.summary}
                  onChange={(e) => patchTransState(lang, { summary: e.target.value })}
                  placeholder="A brief summary shown above the lesson content."
                  className="min-h-[80px]"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="video_url" className="flex items-center gap-1.5">
                <YoutubeIcon className="h-3.5 w-3.5" />
                YouTube video URL
              </Label>
              <Input
                id="video_url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min={0}
                step={1}
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                placeholder="7"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={saveLessonDetails}
              disabled={isPending || !activeTrans.title.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save {lang === 'hi' ? 'Hindi' : 'English'} details
            </Button>
            {lesson.status !== 'published' && (
              <Button
                onClick={publishLesson}
                variant="default"
                disabled={isPending}
              >
                <Send className="h-4 w-4 mr-1.5" />
                Publish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Lesson content (WYSIWYG) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              Lesson content
              <span className="ml-2 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Write the rich-text body of the lesson (HTML).
            </p>
          </div>
          <Button
            onClick={saveContent}
            disabled={isPending || (lang === 'hi' && !langExists.hi)}
            size="sm"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save content
          </Button>
        </CardHeader>
        <CardContent>
          {lang === 'hi' && !langExists.hi ? (
            <p className="text-sm text-muted-foreground">
              Add a Hindi translation in the Lesson details section above first;
              then you can write Hindi content here.
            </p>
          ) : activeTrans.id || lang === 'en' ? (
            <RichTextEditor
              value={activeTrans.contentHtml}
              onChange={(html) => patchTransState(lang, { contentHtml: html })}
              placeholder="Write the lesson content…"
              minHeight={360}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Save the lesson details first to create a translation, then
              return to write content.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 3 — MCQ Manager */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              Multiple-choice questions
              <span className="ml-2 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {mcqs.length} attached MCQ{mcqs.length === 1 ? '' : 's'}.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setMcqEditing(null)
              setMcqDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add MCQ
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mcqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No multiple-choice questions yet. Click “Add MCQ” to create one.
            </p>
          ) : (
            mcqs.map((q) => (
              <QuestionRow
                key={q.id}
                question={q}
                kind="mcq"
                lang={lang}
                disabled={isPending}
                onEdit={() => {
                  setMcqEditing(q)
                  setMcqDialogOpen(true)
                }}
                onDelete={() => deleteQuestion(q.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Section 4 — QNA Manager */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              Descriptive questions (Q&amp;A)
              <span className="ml-2 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {qnas.length} attached QNA{qnas.length === 1 ? '' : 's'}.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setQnaEditing(null)
              setQnaDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add QNA
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {qnas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No descriptive questions yet. Click “Add QNA” to create one.
            </p>
          ) : (
            qnas.map((q) => (
              <QuestionRow
                key={q.id}
                question={q}
                kind="qna"
                lang={lang}
                disabled={isPending}
                onEdit={() => {
                  setQnaEditing(q)
                  setQnaDialogOpen(true)
                }}
                onDelete={() => deleteQuestion(q.id)}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* MCQ Dialog (create + edit) */}
      <McqDialog
        open={mcqDialogOpen}
        onOpenChange={(o) => {
          setMcqDialogOpen(o)
          if (!o) setMcqEditing(null)
        }}
        lessonId={lessonId}
        editing={mcqEditing}
        lang={lang}
        onSaved={onQuestionDialogSaved}
      />

      {/* QNA Dialog (create + edit) */}
      <QnaDialog
        open={qnaDialogOpen}
        onOpenChange={(o) => {
          setQnaDialogOpen(o)
          if (!o) setQnaEditing(null)
        }}
        lessonId={lessonId}
        editing={qnaEditing}
        lang={lang}
        onSaved={onQuestionDialogSaved}
      />
    </div>
  )
}

// ─── Question Row (shared by MCQ + QNA lists) ───────────────────────────

interface QuestionRowProps {
  question: QuestionData
  kind: 'mcq' | 'qna'
  lang: Lang
  disabled: boolean
  onEdit: () => void
  onDelete: () => void
}

function QuestionRow({
  question,
  kind,
  lang,
  disabled,
  onEdit,
  onDelete,
}: QuestionRowProps) {
  const [openAnswer, setOpenAnswer] = useState(false)
  const t = pickTranslation(question, lang)
  const questionHtml = sanitizeHtml(t?.question_text ?? '')
  const modelAnswerHtml = sanitizeHtml(t?.model_answer ?? '')
  const options = (question.options ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {TYPE_LABEL[question.question_type] ?? question.question_type}
            </Badge>
            <StatusBadge status={question.status} />
            <span className="text-[11px] text-muted-foreground">
              /{question.slug}
            </span>
            {t && t.language_code !== lang && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                fallback: {t.language_code}
              </Badge>
            )}
          </div>
          {questionHtml ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: questionHtml }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              (no {lang} translation yet — click Edit to add one)
            </p>
          )}
          {kind === 'mcq' && options.length > 0 && (
            <ul className="text-sm space-y-1 pl-4">
              {options.map((o) => (
                <li
                  key={o.id}
                  className={
                    o.is_correct
                      ? 'flex items-start gap-1.5 text-foreground'
                      : 'flex items-start gap-1.5 text-muted-foreground'
                  }
                >
                  <span className="mt-0.5">
                    {o.is_correct ? '✓' : '•'}
                  </span>
                  <span>{optionText(o.text, lang) || '(empty)'}</span>
                </li>
              ))}
            </ul>
          )}
          {kind === 'qna' && modelAnswerHtml && (
            <Collapsible open={openAnswer} onOpenChange={setOpenAnswer}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 mr-1 transition-transform ${
                      openAnswer ? 'rotate-180' : ''
                    }`}
                  />
                  {openAnswer ? 'Hide model answer' : 'Show model answer'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/30 p-3 text-foreground"
                  dangerouslySetInnerHTML={{ __html: modelAnswerHtml }}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
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
      </div>
    </div>
  )
}

// ─── MCQ Dialog ─────────────────────────────────────────────────────────

interface OptionForm {
  id?: string // existing option id; undefined for new
  textEn: string
  textHi: string
  isCorrect: boolean
}

interface McqDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  editing: QuestionData | null
  lang: Lang
  onSaved: () => Promise<void> | void
}

function McqDialog({
  open,
  onOpenChange,
  lessonId,
  editing,
  lang,
  onSaved,
}: McqDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [questionType, setQuestionType] = useState<McqType>('single_choice')
  const [questionText, setQuestionText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [options, setOptions] = useState<OptionForm[]>([])
  // Tracks the translation id for the active language (null while loading or
  // if the translation doesn't exist yet — in which case we upsert on save).
  const [translationId, setTranslationId] = useState<string | null>(null)
  const [translationExists, setTranslationExists] = useState(true)

  // Reset / hydrate state whenever the dialog opens, the target question
  // changes, or the active language changes.
  useEffect(() => {
    if (!open) return
    if (editing) {
      const t = pickTranslation(editing, lang)
      setQuestionType(
        (MCQ_TYPES as readonly string[]).includes(editing.question_type)
          ? (editing.question_type as McqType)
          : 'single_choice',
      )
      setQuestionText(t?.question_text ?? '')
      setExplanation(t?.explanation ?? '')
      setOptions(
        (editing.options ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((o) => ({
            id: o.id,
            textEn: optionText(o.text, 'en'),
            textHi: optionText(o.text, 'hi'),
            isCorrect: o.is_correct,
          })),
      )
      // Find the matching translation id directly from the list payload —
      // avoids an extra fetch to /api/admin/questions/[id].
      const matchT = editing.translations.find((x) => x.language_code === lang)
      setTranslationId(matchT?.id ?? null)
      setTranslationExists(Boolean(matchT))
    } else {
      setQuestionType('single_choice')
      setQuestionText('')
      setExplanation('')
      setOptions([
        { textEn: '', textHi: '', isCorrect: false },
        { textEn: '', textHi: '', isCorrect: true },
      ])
      setTranslationId(null)
      setTranslationExists(true)
    }
  }, [open, editing, lang])

  function updateOption(idx: number, patch: Partial<OptionForm>) {
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)),
    )
  }
  function addOption() {
    setOptions((prev) => [...prev, { textEn: '', textHi: '', isCorrect: false }])
  }
  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx))
  }

  function save() {
    startTransition(async () => {
      if (!questionText.trim()) {
        toast({
          title: 'Missing question text',
          description: 'Please write the question prompt.',
          variant: 'destructive',
        })
        return
      }
      const cleanOptions = options
        .map((o) => ({
          ...o,
          textEn: o.textEn.trim(),
          textHi: o.textHi.trim(),
        }))
        // Keep options that have EITHER an EN or HI label (so HI-only options
        // aren't dropped when the dialog was opened from the HI tab).
        .filter((o) => o.textEn.length > 0 || o.textHi.length > 0)

      try {
        if (editing) {
          // Build the translation PATCH body.
          // - If translation already exists in this lang → update by id.
          // - If it doesn't exist yet (HI tab on a question with no HI row)
          //   → send question_id + language_code so the server upserts.
          let translationBody: Record<string, unknown>
          if (translationId) {
            translationBody = {
              id: translationId,
              question_text: questionText,
              explanation: explanation || null,
            }
          } else {
            translationBody = {
              id: 'new', // route requires a string id; the service detects upsert path
              question_id: editing.id,
              language_code: lang,
              question_text: questionText,
              explanation: explanation || null,
            }
          }
          // 1) PATCH the translation (question_text + explanation).
          const patchRes = await fetch(
            `/api/admin/questions/${editing.id}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                question_type: questionType,
                translation: translationBody,
              }),
            },
          )
          const patchJson = (await patchRes.json()) as { error?: string }
          if (!patchRes.ok) {
            toast({
              title: 'Error',
              description: patchJson.error ?? 'Failed to update question.',
              variant: 'destructive',
            })
            return
          }

          // 2) Sync options: PATCH existing, POST new, DELETE removed.
          //    Always send the FULL text { en, hi } so the language we're
          //    not editing right now is preserved server-side.
          const keptIds = new Set(
            cleanOptions.filter((o) => o.id).map((o) => o.id as string),
          )
          for (const oldOpt of editing.options ?? []) {
            if (!keptIds.has(oldOpt.id)) {
              await fetch(`/api/admin/questions/${editing.id}/options`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ option_id: oldOpt.id }),
              })
            }
          }
          for (const opt of cleanOptions) {
            if (opt.id) {
              await fetch(`/api/admin/questions/${editing.id}/options`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  option_id: opt.id,
                  text: { en: opt.textEn, hi: opt.textHi || undefined },
                  is_correct: opt.isCorrect,
                }),
              })
            } else {
              await fetch(`/api/admin/questions/${editing.id}/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: { en: opt.textEn, hi: opt.textHi || undefined },
                  is_correct: opt.isCorrect,
                }),
              })
            }
          }

          toast({
            title: 'Saved',
            description:
              lang === 'hi' ? 'MCQ Hindi translation saved.' : 'MCQ updated.',
          })
        } else {
          // CREATE flow — always creates the EN translation (server-side
          // behaviour). If the editor is currently on the HI tab, we still
          // create with EN, and the user can use Edit + HI tab afterwards
          // to add the Hindi version.
          const createRes = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug: genSlug('mcq'),
              question_type: questionType,
              lesson_id: lessonId,
              question_text: questionText,
              explanation: explanation || '',
              options: cleanOptions.map((o) => ({
                text: { en: o.textEn, hi: o.textHi || undefined },
                is_correct: o.isCorrect,
              })),
            }),
          })
          const createJson = (await createRes.json()) as { error?: string }
          if (!createRes.ok) {
            toast({
              title: 'Error',
              description: createJson.error ?? 'Failed to create MCQ.',
              variant: 'destructive',
            })
            return
          }
          toast({ title: 'Created', description: 'MCQ added to lesson.' })
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

  const canSave =
    !isPending &&
    questionText.trim().length > 0 &&
    (editing ? true : true)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit MCQ' : 'Add multiple-choice question'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Update the question text, options, and answer explanation (${lang.toUpperCase()} translation).`
              : 'Create a new multiple-choice question attached to this lesson.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language banner — shows which translation is being edited */}
          {editing && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
              {translationExists ? (
                <span>
                  Editing <strong>{lang.toUpperCase()}</strong> translation.
                  Switch language via the lesson editor's tabs at the top.
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  No <strong>{lang.toUpperCase()}</strong> translation yet —
                  saving will create it.
                </span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Question type</Label>
            <Select
              value={questionType}
              onValueChange={(v) => setQuestionType(v as McqType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_choice">Single Choice</SelectItem>
                <SelectItem value="multiple_choice">
                  Multiple Choice
                </SelectItem>
                <SelectItem value="true_false">True / False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Question text
              <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </Label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Write the question prompt…"
              className="min-h-[80px] resize-y"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Options
                <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
                  {lang}
                </span>
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addOption}
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add option
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tick the “correct” box for each right answer. Empty options are
              discarded on save.
            </p>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div
                  key={opt.id ?? `new-${idx}`}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={`opt-correct-${idx}`}
                    checked={opt.isCorrect}
                    onCheckedChange={(v) =>
                      updateOption(idx, {
                        isCorrect: v === true,
                      })
                    }
                  />
                  <Label
                    htmlFor={`opt-correct-${idx}`}
                    className="text-xs text-muted-foreground w-16 shrink-0 cursor-pointer"
                  >
                    Correct
                  </Label>
                  <Input
                    value={lang === 'hi' ? opt.textHi : opt.textEn}
                    onChange={(e) =>
                      updateOption(
                        idx,
                        lang === 'hi'
                          ? { textHi: e.target.value }
                          : { textEn: e.target.value },
                      )
                    }
                    placeholder={`Option ${idx + 1} (${lang})`}
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(idx)}
                    disabled={isPending || options.length <= 2}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove option</span>
                  </Button>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No options yet. Add at least two.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Answer explanation (optional)
              <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Shown after the learner answers — explain why the correct option
              is right (supports formatting).
            </p>
            <RichTextEditor
              value={explanation}
              onChange={setExplanation}
              placeholder="Explain the correct answer…"
              minHeight={100}
            />
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
            {editing ? 'Save changes' : 'Create MCQ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── QNA Dialog ─────────────────────────────────────────────────────────

interface QnaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  editing: QuestionData | null
  lang: Lang
  onSaved: () => Promise<void> | void
}

function QnaDialog({
  open,
  onOpenChange,
  lessonId,
  editing,
  lang,
  onSaved,
}: QnaDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [questionText, setQuestionText] = useState('')
  const [modelAnswer, setModelAnswer] = useState('')
  const [translationId, setTranslationId] = useState<string | null>(null)
  const [translationExists, setTranslationExists] = useState(true)

  useEffect(() => {
    if (!open) return
    if (editing) {
      const t = pickTranslation(editing, lang)
      setQuestionText(t?.question_text ?? '')
      setModelAnswer(t?.model_answer ?? '')
      const matchT = editing.translations.find((x) => x.language_code === lang)
      setTranslationId(matchT?.id ?? null)
      setTranslationExists(Boolean(matchT))
    } else {
      setQuestionText('')
      setModelAnswer('')
      setTranslationId(null)
      setTranslationExists(true)
    }
  }, [open, editing, lang])

  function save() {
    startTransition(async () => {
      if (!questionText.trim()) {
        toast({
          title: 'Missing question text',
          description: 'Please write the question prompt.',
          variant: 'destructive',
        })
        return
      }
      try {
        if (editing) {
          let translationBody: Record<string, unknown>
          if (translationId) {
            translationBody = {
              id: translationId,
              question_text: questionText,
              model_answer: modelAnswer || null,
            }
          } else {
            translationBody = {
              id: 'new',
              question_id: editing.id,
              language_code: lang,
              question_text: questionText,
              model_answer: modelAnswer || null,
            }
          }
          const res = await fetch(`/api/admin/questions/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ translation: translationBody }),
          })
          const json = (await res.json()) as { error?: string }
          if (!res.ok) {
            toast({
              title: 'Error',
              description: json.error ?? 'Failed to update QNA.',
              variant: 'destructive',
            })
            return
          }
          toast({
            title: 'Saved',
            description:
              lang === 'hi' ? 'QNA Hindi translation saved.' : 'QNA updated.',
          })
        } else {
          const res = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug: genSlug('qna'),
              question_type: 'descriptive',
              lesson_id: lessonId,
              question_text: questionText,
              model_answer: modelAnswer || '',
              explanation: '',
              options: [],
            }),
          })
          const json = (await res.json()) as { error?: string }
          if (!res.ok) {
            toast({
              title: 'Error',
              description: json.error ?? 'Failed to create QNA.',
              variant: 'destructive',
            })
            return
          }
          toast({ title: 'Created', description: 'QNA added to lesson.' })
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

  const canSave = !isPending && questionText.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Q&amp;A question' : 'Add descriptive question'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Update the question text and model answer (${lang.toUpperCase()} translation).`
              : 'Create a new descriptive (Q&amp;A) question attached to this lesson.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {editing && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
              {translationExists ? (
                <span>
                  Editing <strong>{lang.toUpperCase()}</strong> translation.
                  Switch language via the lesson editor's tabs at the top.
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400">
                  No <strong>{lang.toUpperCase()}</strong> translation yet —
                  saving will create it.
                </span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Question text
              <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </Label>
            <RichTextEditor
              value={questionText}
              onChange={setQuestionText}
              placeholder="Write the question prompt…"
              minHeight={140}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Model answer
              <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
                {lang}
              </span>
            </Label>
            <RichTextEditor
              value={modelAnswer}
              onChange={setModelAnswer}
              placeholder="Reference answer used for review / self-assessment…"
              minHeight={160}
            />
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
            {editing ? 'Save changes' : 'Create QNA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
