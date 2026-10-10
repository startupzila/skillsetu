'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Save, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TranslationData {
  language_code: string
  title: string
  short_description: string | null
  description: string | null
  learning_outcomes: string[] | null
  prerequisites: string[] | null
  target_audience: string[] | null
  status?: string
}

interface CourseDetailsEditorProps {
  courseId: string
  initial: {
    slug: string
    difficulty: string
    estimated_duration: number | null
    default_language: string
    status: string
    translations: TranslationData[]
  }
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'all_levels']

/** State for a single language's translation fields. */
interface TransState {
  title: string
  shortDesc: string
  description: string
  outcomes: string
  prereqs: string
  audience: string
  exists: boolean
  status: string
}

function toTransState(t: TranslationData | undefined): TransState {
  if (!t) return { title: '', shortDesc: '', description: '', outcomes: '', prereqs: '', audience: '', exists: false, status: 'draft' }
  return {
    title: t.title ?? '',
    shortDesc: t.short_description ?? '',
    description: t.description ?? '',
    outcomes: (t.learning_outcomes ?? []).join('\n'),
    prereqs: (t.prerequisites ?? []).join('\n'),
    audience: (t.target_audience ?? []).join('\n'),
    exists: true,
    status: t.status ?? 'draft',
  }
}

/**
 * CourseDetailsEditor — inline editor for a course's core fields + translations.
 *
 * Has EN + HI language tabs. Each tab edits the respective translation row.
 * If the HI translation doesn't exist yet, the tab shows an "Add Hindi translation"
 * button that creates it (with auto-generated SEO).
 */
export function CourseDetailsEditor({ courseId, initial }: CourseDetailsEditorProps) {
  const [open, setOpen] = useState(true) // open by default so the EN/HI tabs are immediately visible
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [slug, setSlug] = useState(initial.slug)
  const [difficulty, setDifficulty] = useState(initial.difficulty)
  const [duration, setDuration] = useState(initial.estimated_duration?.toString() ?? '')

  const enTrans = initial.translations.find((t) => t.language_code === 'en')
  const hiTrans = initial.translations.find((t) => t.language_code === 'hi')

  const [en, setEn] = useState<TransState>(toTransState(enTrans))
  const [hi, setHi] = useState<TransState>(toTransState(hiTrans))

  function saveEn() {
    startTransition(async () => {
      const durationNum = duration.trim() ? parseInt(duration, 10) : null
      const body = {
        slug,
        difficulty,
        estimated_duration: durationNum,
        translation: {
          lang: 'en',
          title: en.title,
          short_description: en.shortDesc || null,
          description: en.description || null,
          learning_outcomes: en.outcomes.split('\n').map((s) => s.trim()).filter(Boolean),
          prerequisites: en.prereqs.split('\n').map((s) => s.trim()).filter(Boolean),
          target_audience: en.audience.split('\n').map((s) => s.trim()).filter(Boolean),
        },
      }
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Saved', description: 'English details updated.' })
        setEn((p) => ({ ...p, exists: true }))
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function saveHi() {
    startTransition(async () => {
      const body = {
        translation: {
          lang: 'hi',
          title: hi.title,
          short_description: hi.shortDesc || null,
          description: hi.description || null,
          learning_outcomes: hi.outcomes.split('\n').map((s) => s.trim()).filter(Boolean),
          prerequisites: hi.prereqs.split('\n').map((s) => s.trim()).filter(Boolean),
          target_audience: hi.audience.split('\n').map((s) => s.trim()).filter(Boolean),
        },
      }
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Saved', description: 'Hindi details updated. SEO auto-generated.' })
        setHi((p) => ({ ...p, exists: true }))
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  /** Render the translation form for a given language state. */
  function renderTransForm(state: TransState, setState: (fn: (p: TransState) => TransState) => void, onSave: () => void, langLabel: string) {
    if (!state.exists) {
      return (
        <div className="space-y-3 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            No {langLabel} translation yet. Add one to make this course available in {langLabel}.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setState((p) => ({ ...p, exists: true, title: p.title || 'नया कोर्स' }))
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add {langLabel} translation
          </Button>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title ({langLabel})</Label>
          <Input value={state.title} onChange={(e) => setState((p) => ({ ...p, title: e.target.value }))} placeholder={`Course title in ${langLabel}`} />
        </div>
        <div className="space-y-2">
          <Label>Short description</Label>
          <Input value={state.shortDesc} onChange={(e) => setState((p) => ({ ...p, shortDesc: e.target.value }))} placeholder="One-line summary" />
        </div>
        <div className="space-y-2">
          <Label>Full description</Label>
          <Textarea value={state.description} onChange={(e) => setState((p) => ({ ...p, description: e.target.value }))} className="min-h-[100px]" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Learning outcomes (one per line)</Label>
            <Textarea value={state.outcomes} onChange={(e) => setState((p) => ({ ...p, outcomes: e.target.value }))} className="min-h-[120px] text-sm" />
          </div>
          <div className="space-y-2">
            <Label>Prerequisites (one per line)</Label>
            <Textarea value={state.prereqs} onChange={(e) => setState((p) => ({ ...p, prereqs: e.target.value }))} className="min-h-[120px] text-sm" />
          </div>
          <div className="space-y-2">
            <Label>Target audience (one per line)</Label>
            <Textarea value={state.audience} onChange={(e) => setState((p) => ({ ...p, audience: e.target.value }))} className="min-h-[120px] text-sm" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={onSave} disabled={isPending || !state.title}>
            {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save {langLabel} details
          </Button>
          {state.status === 'published' && <Badge variant="secondary" className="self-center">Published</Badge>}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Course Details</CardTitle>
        <Button variant="ghost" size="sm" className="h-7" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {open ? 'Collapse' : 'Edit details'}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          {/* Core course fields (language-agnostic) */}
          <div className="rounded-lg bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Course Settings (shared)</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="course-slug" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d} className="capitalize">{d.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="180" />
              </div>
            </div>
          </div>

          {/* Language tabs */}
          <Tabs defaultValue="en">
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="hi">हिन्दी (Hindi)</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-4">
              {renderTransForm(en, setEn, saveEn, 'English')}
            </TabsContent>
            <TabsContent value="hi" className="mt-4">
              {renderTransForm(hi, setHi, saveHi, 'Hindi')}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
