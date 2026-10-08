import Link from 'next/link'
import { ChevronLeft, ChevronRight, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PrevNextNavProps {
  courseSlug: string
  prevLesson: { slug: string; title: string; moduleSlug: string } | null
  nextLesson: { slug: string; title: string; moduleSlug: string } | null
  /** Which lesson is current — shown as "current" label between prev/next */
  currentTitle?: string
  position: 'top' | 'bottom'
  className?: string
}

/**
 * PrevNextNav — w3schools-style Previous/Next navigation.
 *
 * Renders a 3-column layout:
 *   [← Previous Lesson]     [Current Lesson Title]     [Next Lesson →]
 *
 * Used at BOTH the top and bottom of the lesson content.
 * When no prev/next exists, the slot is empty (keeps layout balanced).
 * When no next, a "Back to Course" button replaces Next.
 */
export function PrevNextNav({
  courseSlug,
  prevLesson,
  nextLesson,
  currentTitle,
  position,
  className,
}: PrevNextNavProps) {
  return (
    <nav
      className={cn(
        'flex items-center justify-between gap-3',
        position === 'top' ? 'mb-4' : 'mt-8',
        className,
      )}
      aria-label="Lesson navigation"
    >
      {/* Previous */}
      {prevLesson ? (
        <Button asChild variant="outline" size="sm" className="max-w-[40%]">
          <Link href={`/courses/${courseSlug}/${prevLesson.moduleSlug}/${prevLesson.slug}`}>
            <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate text-left">
              <span className="block text-xs text-muted-foreground">Previous</span>
              <span className="block truncate">{prevLesson.title}</span>
            </span>
          </Link>
        </Button>
      ) : (
        <div className="max-w-[40%]" />
      )}

      {/* Center: current lesson title (top position only) or course link */}
      {position === 'top' ? (
        <div className="text-center hidden sm:block min-w-0">
          {currentTitle && (
            <p className="text-sm font-medium truncate">{currentTitle}</p>
          )}
        </div>
      ) : (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/courses/${courseSlug}`}>
            <ListChecks className="h-4 w-4 mr-1" />
            Course
          </Link>
        </Button>
      )}

      {/* Next */}
      {nextLesson ? (
        <Button asChild variant="outline" size="sm" className="max-w-[40%]">
          <Link href={`/courses/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.slug}`}>
            <span className="truncate text-right">
              <span className="block text-xs text-muted-foreground">Next</span>
              <span className="block truncate">{nextLesson.title}</span>
            </span>
            <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
          </Link>
        </Button>
      ) : (
        <Button asChild size="sm" className="max-w-[40%]">
          <Link href={`/courses/${courseSlug}`}>
            <span className="truncate text-right">
              <span className="block text-xs opacity-80">Finished!</span>
              <span className="block truncate">Back to course</span>
            </span>
            <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
          </Link>
        </Button>
      )}
    </nav>
  )
}
