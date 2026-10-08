'use client'

import { useState, useTransition } from 'react'
import { Bookmark, NotebookPen, CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { BookmarkButton } from './bookmark-button'
import { NoteEditor } from './note-editor'
import { useToast } from '@/hooks/use-toast'

interface LessonActionsProps {
  lessonId: string
  courseSlug: string
  initialBookmarked?: boolean
  initialCompleted?: boolean
}

/**
 * LessonActions — the action bar on a lesson page.
 *
 * - BookmarkButton (toggle save)
 * - Notes button → opens Sheet with NoteEditor
 * - Complete button → marks lesson as completed via /api/progress/lesson
 */
export function LessonActions({
  lessonId,
  courseSlug,
  initialBookmarked = false,
  initialCompleted = false,
}: LessonActionsProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [notesOpen, setNotesOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function markComplete() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/progress/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, completed: true }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 401) {
            toast({
              title: 'Sign in required',
              description: 'Please sign in to track progress.',
              variant: 'destructive',
            })
            return
          }
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setCompleted(true)
        toast({ title: 'Lesson completed!', description: 'Your progress has been saved.' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <BookmarkButton lessonId={lessonId} initialBookmarked={initialBookmarked} />

      <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <NotebookPen className="h-4 w-4 mr-1.5" />
            Notes
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <NotebookPen className="h-5 w-5" />
              My Notes
            </h2>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <NoteEditor lessonId={lessonId} />
        </SheetContent>
      </Sheet>

      {completed ? (
        <Badge variant="default" className="gap-1 bg-success text-success-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed
        </Badge>
      ) : (
        <Button onClick={markComplete} size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
          )}
          Mark as complete
        </Button>
      )}
    </div>
  )
}
