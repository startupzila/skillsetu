'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CourseDetailsEditorProps {
  courseId: string
  initial: {
    slug: string
    difficulty: string
    estimated_duration: number | null
    default_language: string
    status: string
    translation?: {
      language_code: string
      title: string
      short_description: string | null
      description: string | null
      learning_outcomes: string[] | null
      prerequisites: string[] | null
      target_audience: string[] | null
    } | null
  }
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'all_levels']

/**
 * CourseDetailsEditor — inline editor for a course's core fields + EN translation.
 *
 * Lets the user edit title, slug, difficulty, duration, short + full description,
 * learning outcomes, prerequisites and target audience directly from the course
 * editor page (previously read-only). Saves via PATCH /api/admin/courses/[id].
 */
export function CourseDetailsEditor({ courseId, initial }: CourseDetailsEditorProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [slug, setSlug] = useState(initial.slug)
  const [difficulty, setDifficulty] = useState(initial.difficulty)
  const [duration, setDuration] = useState(initial.estimated_duration?.toString() ?? '')
  const [title, setTitle] = useState(initial.translation?.title ?? '')
  const [shortDesc, setShortDesc] = useState(initial.translation?.short_description ?? '')
  const [description, setDescription] = useState(initial.translation?.description ?? '')
  const [outcomes, setOutcomes] = useState((initial.translation?.learning_outcomes ?? []).join('\n'))
  const [prereqs, setPrereqs] = useState((initial.translation?.prerequisites ?? []).join('\n'))
  const [audience, setAudience] = useState((initial.translation?.target_audience ?? []).join('\n'))

  function save() {
    startTransition(async () => {
      const durationNum = duration.trim() ? parseInt(duration, 10) : null
      const body = {
        slug,
        difficulty,
        estimated_duration: durationNum,
        translation: {
          lang: 'en',
          title,
          short_description: shortDesc || null,
          description: description || null,
          learning_outcomes: outcomes.split('\n').map((s) => s.trim()).filter(Boolean),
          prerequisites: prereqs.split('\n').map((s) => s.trim()).filter(Boolean),
          target_audience: audience.split('\n').map((s) => s.trim()).filter(Boolean),
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
        toast({ title: 'Saved', description: 'Course details updated.' })
        setOpen(false)
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Course Details</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {open ? 'Collapse' : 'Edit details'}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="course-slug" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>Language</Label>
              <Input value={initial.default_language} disabled className="bg-muted/50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDesc">Short description</Label>
            <Input id="shortDesc" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="One-line summary" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed course description" className="min-h-[100px]" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outcomes">Learning outcomes (one per line)</Label>
              <Textarea id="outcomes" value={outcomes} onChange={(e) => setOutcomes(e.target.value)} className="min-h-[120px] text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prereqs">Prerequisites (one per line)</Label>
              <Textarea id="prereqs" value={prereqs} onChange={(e) => setPrereqs(e.target.value)} className="min-h-[120px] text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target audience (one per line)</Label>
              <Textarea id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="min-h-[120px] text-sm" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={isPending || !title}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save details
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
