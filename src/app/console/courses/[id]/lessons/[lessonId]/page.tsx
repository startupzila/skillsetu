import { LessonEditor } from '@/components/learning/lesson-editor'

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>
}

/**
 * /console/courses/[id]/lessons/[lessonId] — lesson editor.
 */
export default async function LessonEditorPage({ params }: PageProps) {
  const { id, lessonId } = await params
  return <LessonEditor courseId={id} lessonId={lessonId} />
}
