'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Plus, Trash2, BookOpen, Pencil, Send, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/shared'

interface ModuleData {
  id: string
  slug: string
  sort_order: number
  status: string
  translations: { language_code: string; title: string }[]
  lessons: Array<{
    id: string
    slug: string
    sort_order: number
    status: string
    duration_minutes: number | null
    translations: { language_code: string; title: string }[]
  }>
}

interface CurriculumManagerProps {
  courseId: string
  modules: ModuleData[]
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

/**
 * CurriculumManager — manages modules + lessons for a course.
 *
 * - Add / rename / delete modules
 * - Add / delete lessons (lesson content is edited on the lesson editor page)
 * - Publish individual lessons
 */
export function CurriculumManager({ courseId, modules: initialModules }: CurriculumManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [modules, setModules] = useState(initialModules)

  const [addModuleOpen, setAddModuleOpen] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  const [addLessonFor, setAddLessonFor] = useState<string | null>(null)
  const [newLessonTitle, setNewLessonTitle] = useState('')

  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editModuleTitle, setEditModuleTitle] = useState('')

  function addModule() {
    if (!newModuleTitle.trim()) return
    startTransition(async () => {
      const slug = slugify(newModuleTitle)
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, slug, title: newModuleTitle, sort_order: modules.length }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Module added', description: newModuleTitle })
      setNewModuleTitle('')
      setAddModuleOpen(false)
      router.refresh()
    })
  }

  function saveModuleTitle(moduleId: string) {
    if (!editModuleTitle.trim()) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translation: { lang: 'en', title: editModuleTitle } }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Saved', description: 'Module title updated.' })
      setEditingModule(null)
      router.refresh()
    })
  }

  function deleteModule(moduleId: string, title: string) {
    if (!confirm(`Delete module "${title}"? This removes all its lessons and content.`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/modules/${moduleId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Deleted', description: 'Module removed.' })
      router.refresh()
    })
  }

  function addLesson(moduleId: string) {
    if (!newLessonTitle.trim()) return
    startTransition(async () => {
      const slug = slugify(newLessonTitle)
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          slug,
          title: newLessonTitle,
          sort_order: modules.find((m) => m.id === moduleId)?.lessons.length ?? 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Lesson added', description: newLessonTitle })
      setNewLessonTitle('')
      setAddLessonFor(null)
      router.refresh()
    })
  }

  function deleteLesson(lessonId: string, title: string) {
    if (!confirm(`Delete lesson "${title}"? This removes its content, MCQs and QNAs.`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Deleted', description: 'Lesson removed.' })
      router.refresh()
    })
  }

  function publishLesson(lessonId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/lessons/${lessonId}?action=publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Published!', description: 'Lesson is now live.' })
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Curriculum</CardTitle>
        <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add module</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="moduleTitle">Module title</Label>
                <Input
                  id="moduleTitle"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="e.g. Getting Started"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={addModule} disabled={isPending || !newModuleTitle.trim()}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Add module
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No modules yet. Add a module to start building the curriculum.
          </p>
        ) : (
          <div className="space-y-4">
            {modules.map((mod, mIdx) => {
              const modEn = mod.translations.find((t) => t.language_code === 'en')
              return (
                <div key={mod.id} className="rounded-lg border">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                        {mIdx + 1}
                      </span>
                      {editingModule === mod.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editModuleTitle}
                            onChange={(e) => setEditModuleTitle(e.target.value)}
                            className="h-7 w-56"
                            autoFocus
                          />
                          <Button size="sm" className="h-7" onClick={() => saveModuleTitle(mod.id)} disabled={isPending}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingModule(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="font-medium text-sm hover:text-primary"
                          onClick={() => {
                            setEditingModule(mod.id)
                            setEditModuleTitle(modEn?.title ?? mod.slug)
                          }}
                        >
                          {modEn?.title ?? mod.slug}
                        </button>
                      )}
                      <StatusBadge status={mod.status} />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          setAddLessonFor(addLessonFor === mod.id ? null : mod.id)
                          setNewLessonTitle('')
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Lesson
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={() => deleteModule(mod.id, modEn?.title ?? mod.slug)}
                        title="Delete module"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {addLessonFor === mod.id && (
                    <div className="px-4 py-3 bg-accent/30 border-b flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`lesson-${mod.id}`} className="text-xs">New lesson title</Label>
                        <Input
                          id={`lesson-${mod.id}`}
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          placeholder="e.g. Introduction to PowerPoint"
                          autoFocus
                        />
                      </div>
                      <Button size="sm" onClick={() => addLesson(mod.id)} disabled={isPending || !newLessonTitle.trim()}>
                        {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddLessonFor(null)}>Cancel</Button>
                    </div>
                  )}

                  {mod.lessons.length > 0 ? (
                    <ul className="divide-y">
                      {mod.lessons.map((lesson) => {
                        const lesEn = lesson.translations.find((t) => t.language_code === 'en')
                        return (
                          <li key={lesson.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/30">
                            <div className="flex items-center gap-2 min-w-0">
                              <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate">{lesEn?.title ?? lesson.slug}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={lesson.status} />
                              {lesson.duration_minutes && (
                                <span className="text-xs text-muted-foreground">{lesson.duration_minutes}m</span>
                              )}
                              {lesson.status !== 'published' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => publishLesson(lesson.id)}
                                  title="Publish lesson"
                                  disabled={isPending}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit lesson">
                                <Link href={`/console/courses/${courseId}/lessons/${lesson.id}`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive"
                                onClick={() => deleteLesson(lesson.id, lesEn?.title ?? lesson.slug)}
                                title="Delete lesson"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No lessons in this module.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
