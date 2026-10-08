'use client'

import { useState, useTransition } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface BookmarkButtonProps {
  lessonId: string
  initialBookmarked?: boolean
  size?: 'sm' | 'default'
}

/**
 * BookmarkButton — toggles a bookmark on a lesson.
 *
 * Client component: calls POST /api/bookmarks to toggle.
 * Shows filled bookmark when bookmarked.
 */
export function BookmarkButton({
  lessonId,
  initialBookmarked = false,
  size = 'sm',
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function toggle() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: 'lesson', entityId: lessonId }),
        })
        const data = await res.json()

        if (!res.ok) {
          if (res.status === 401) {
            toast({
              title: 'Sign in required',
              description: 'Please sign in to save lessons.',
              variant: 'destructive',
            })
            return
          }
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }

        setBookmarked(data.data?.bookmarked ?? false)
        toast({
          title: data.data?.bookmarked ? 'Bookmarked' : 'Removed',
          description: data.data?.bookmarked
            ? 'Lesson saved to your bookmarks.'
            : 'Bookmark removed.',
        })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggle}
      disabled={isPending}
      aria-pressed={bookmarked}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-4 w-4 mr-1.5 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4 mr-1.5" />
      )}
      {bookmarked ? 'Saved' : 'Save'}
    </Button>
  )
}
