import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type Lang, t } from '@/lib/i18n/dictionary'
import { localePath } from '@/lib/i18n/locale-path'

interface PrevNextNavProps {
  courseSlug: string
  prevLesson: { slug: string; title: string; moduleSlug: string } | null
  nextLesson: { slug: string; title: string; moduleSlug: string } | null
  position: 'top' | 'bottom'
  lang?: Lang
  className?: string
}

/**
 * PrevNextNav — clean, minimal Previous/Next navigation.
 *
 * Shows only "Previous" and "Next" labels (no lesson names) with arrows.
 * At the bottom, a center "Course" link appears between them.
 */
export function PrevNextNav({
  courseSlug,
  prevLesson,
  nextLesson,
  position,
  lang = 'en',
  className,
}: PrevNextNavProps) {
  const lp = (path: string) => localePath(lang, path)

  return (
    <nav
      className={cn(
        'flex items-center justify-between gap-2',
        position === 'top' ? 'mb-6' : 'mt-10',
        className,
      )}
      aria-label="Lesson navigation"
    >
      {/* Previous */}
      {prevLesson ? (
        <Button asChild variant="outline" className="gap-1.5">
          <Link href={lp(`/courses/${courseSlug}/${prevLesson.moduleSlug}/${prevLesson.slug}`)}>
            <ChevronLeft className="h-4 w-4 shrink-0" />
            {lang === 'hi' ? 'पिछला' : 'Previous'}
          </Link>
        </Button>
      ) : (
        <div />
      )}

      {/* Center: course link (bottom position only) */}
      {position === 'bottom' && (
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href={lp(`/courses/${courseSlug}`)}>
            <BookOpen className="h-4 w-4" />
            {lang === 'hi' ? 'कोर्स' : 'Course'}
          </Link>
        </Button>
      )}

      {/* Next */}
      {nextLesson ? (
        <Button asChild variant="outline" className="gap-1.5">
          <Link href={lp(`/courses/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.slug}`)}>
            {lang === 'hi' ? 'अगला' : 'Next'}
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      ) : (
        <Button asChild className="gap-1.5">
          <Link href={lp(`/courses/${courseSlug}`)}>
            {lang === 'hi' ? 'कोर्स पूरा हुआ' : 'Finished'}
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Link>
        </Button>
      )}
    </nav>
  )
}
