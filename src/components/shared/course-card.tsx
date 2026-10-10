import Link from 'next/link'
import { Clock, BookOpen, ChevronRight, FileText } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CourseWithTranslation } from '@/lib/content'

/**
 * CourseCard — displays a course in a grid/list.
 *
 * Server component (no event handlers). Shows: difficulty, duration, title,
 * short description, learning outcomes preview. The header + body link to the
 * course page; the footer has separate "Start learning" and "PDF" links.
 *
 * NOTE: the outer card body and the footer links are SEPARATE <Link>s (not
 * nested) — nesting <a> inside <a> is invalid HTML and passing onClick from a
 * server component is not allowed. This structure is valid and accessible.
 */
interface CourseCardProps {
  course: CourseWithTranslation
}

export function CourseCard({ course }: CourseCardProps) {
  const translation = course.translations[0]
  const outcomes = translation?.learning_outcomes?.slice(0, 3) ?? []

  return (
    <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 flex flex-col overflow-hidden">
      {/* Header + body: clickable link to the course page */}
      <Link
        href={`/courses/${course.slug}`}
        className="group block flex-1"
        prefetch={false}
      >
        <CardHeader>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {course.difficulty && (
              <Badge variant="outline" className="text-xs capitalize">
                {course.difficulty.replace('_', ' ')}
              </Badge>
            )}
            {course.estimated_duration && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(course.estimated_duration / 60)}h {course.estimated_duration % 60}m
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
            {translation?.title ?? course.slug}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          {translation?.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {translation.short_description}
            </p>
          )}
          {outcomes.length > 0 && (
            <ul className="space-y-1 text-sm">
              {outcomes.map((o, i) => (
                <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                  <span className="line-clamp-1">{o}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Link>

      <CardFooter className="border-t pt-4 flex items-center justify-between">
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          <BookOpen className="h-4 w-4" />
          Start learning
        </Link>
        <Link
          href={`/courses/${course.slug}/pdf`}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          PDF
        </Link>
      </CardFooter>
    </Card>
  )
}
