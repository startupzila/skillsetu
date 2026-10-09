import Link from 'next/link'
import { Clock, BookOpen, ChevronRight, FileText } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CourseWithTranslation } from '@/lib/content'

/**
 * CourseCard — displays a course in a grid/list.
 *
 * Shows: difficulty, duration, title, short description,
 * learning outcomes preview. Links to the course page.
 */
interface CourseCardProps {
  course: CourseWithTranslation
}

export function CourseCard({ course }: CourseCardProps) {
  const translation = course.translations[0]
  const outcomes = translation?.learning_outcomes?.slice(0, 3) ?? []

  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 flex flex-col">
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
        <CardFooter className="border-t pt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-primary group-hover:underline flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Start learning
          </span>
          <a
            href={`/courses/${course.slug}/pdf`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </a>
        </CardFooter>
      </Card>
    </Link>
  )
}
