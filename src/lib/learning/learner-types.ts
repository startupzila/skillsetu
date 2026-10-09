/**
 * MioDemy — Learner domain types (S3)
 *
 * Mirrors the learner tables: enrollments, lesson_progress, bookmarks, notes.
 * @see prisma/schema.prisma (Learner section)
 */

export type EntityType =
  | 'course'
  | 'lesson'
  | 'question'
  | 'book'
  | 'product'

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: 'active' | 'completed' | 'archived'
  progress_percent: number
  started_at: string
  completed_at: string | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  enrollment_id: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percent: number
  time_spent_seconds: number
  last_position: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  entity_type: EntityType
  entity_id: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  lesson_id: string | null
  course_id: string | null
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
}
