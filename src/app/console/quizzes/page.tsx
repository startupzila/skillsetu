import type { Metadata } from 'next'
import { adminListCourseQuizzes } from '@/lib/admin/question-service'
import { CourseQuizManager } from '@/components/console/course-quiz-manager'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Course Quizzes — Console',
  robots: { index: false, follow: false },
}

/**
 * /console/quizzes — manage COURSE-LEVEL quizzes (lesson_id IS NULL).
 *
 * Lesson-attached quizzes are managed inline in the lesson editor at
 * /console/courses/[id]/lessons/[lessonId]. This page is the dedicated
 * manager for course-level (standalone) quizzes that aren't tied to a
 * specific lesson.
 */
export default async function ConsoleQuizzesPage() {
  const { data: quizzes, error } = await adminListCourseQuizzes()

  return (
    <div className="p-6 space-y-6">
      {error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication')
              ? 'Please sign in.'
              : error.includes('FORBIDDEN') || error.includes('Insufficient')
                ? 'You do not have permission.'
                : `Error: ${error}`}
          </CardContent>
        </Card>
      ) : (
        <CourseQuizManager initialQuizzes={(quizzes ?? []) as never} />
      )}
    </div>
  )
}
