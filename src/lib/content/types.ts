/**
 * MioDemy — Content domain types
 *
 * These TypeScript types mirror the Prisma schema / Supabase tables.
 * They are used by the service modules and API routes for type safety
 * until Supabase type generation (`supabase gen types`) is wired in.
 *
 * @see prisma/schema.prisma
 * @see docs/database.md
 */

// ── Enums ──────────────────────────────────────────────────

export type ContentStatus =
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'
  | 'archived'

export type TranslationStatus =
  | 'draft'
  | 'in_translation'
  | 'in_review'
  | 'published'
  | 'needs_update'

export type DifficultyLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'all_levels'

export type LessonType = 'article' | 'video' | 'mixed'

export type LanguageCode = 'en' | 'hi'

// ── Identity ───────────────────────────────────────────────

export interface Profile {
  id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  preferred_language: string
  created_at: string
  updated_at: string
}

// ── Taxonomy ───────────────────────────────────────────────

export interface Category {
  id: string
  slug: string
  parent_id: string | null
  sort_order: number
  status: ContentStatus
  icon: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CategoryTranslation {
  id: string
  category_id: string
  language_code: string
  name: string
  description: string | null
  status: TranslationStatus
  translator_id: string | null
  reviewer_id: string | null
  created_at: string
  updated_at: string
}

export interface CategoryWithTranslation extends Category {
  translations: CategoryTranslation[]
}

export interface Tag {
  id: string
  slug: string
  name: string
  created_at: string
}

// ── Courses ───────────────────────────────────────────────

export interface Course {
  id: string
  slug: string
  status: ContentStatus
  difficulty: DifficultyLevel
  estimated_duration: number | null
  thumbnail_media_id: string | null
  default_language: string
  published_at: string | null
  published_by: string | null
  last_reviewed_at: string | null
  next_review_at: string | null
  created_at: string
  updated_at: string
}

export interface CourseTranslation {
  id: string
  course_id: string
  language_code: string
  title: string
  short_description: string | null
  description: string | null
  learning_outcomes: string[] | null
  prerequisites: string[] | null
  target_audience: string[] | null
  status: TranslationStatus
  translator_id: string | null
  reviewer_id: string | null
  created_at: string
  updated_at: string
}

export interface CourseWithTranslation extends Course {
  translations: CourseTranslation[]
}

// ── Modules ───────────────────────────────────────────────

export interface Module {
  id: string
  course_id: string
  slug: string
  sort_order: number
  status: ContentStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ModuleTranslation {
  id: string
  module_id: string
  language_code: string
  title: string
  description: string | null
  status: TranslationStatus
  created_at: string
  updated_at: string
}

// ── Lessons ───────────────────────────────────────────────

export interface Lesson {
  id: string
  module_id: string
  slug: string
  sort_order: number
  lesson_type: LessonType
  status: ContentStatus
  duration_minutes: number | null
  published_at: string | null
  last_reviewed_at: string | null
  next_review_at: string | null
  created_at: string
  updated_at: string
}

export interface LessonTranslation {
  id: string
  lesson_id: string
  language_code: string
  title: string
  summary: string | null
  status: TranslationStatus
  translator_id: string | null
  reviewer_id: string | null
  created_at: string
  updated_at: string
}

// ── Lesson Blocks ─────────────────────────────────────────

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'gallery'
  | 'video'
  | 'callout'
  | 'example'
  | 'table'
  | 'quote'
  | 'code'
  | 'download'
  | 'checklist'
  | 'quiz'
  | 'mcq'
  | 'qa'
  | 'practice'
  | 'project'
  | 'related_content'

export interface LessonBlock {
  id: string
  lesson_translation_id: string
  block_type: string
  sort_order: number
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

// ── Curriculum (composite view) ──────────────────────────

export interface CurriculumLesson {
  id: string
  slug: string
  sort_order: number
  lesson_type: LessonType
  duration_minutes: number | null
  translations: Pick<LessonTranslation, 'language_code' | 'title' | 'summary'>[]
}

export interface CurriculumModule {
  id: string
  slug: string
  sort_order: number
  translations: Pick<ModuleTranslation, 'language_code' | 'title' | 'description'>[]
  lessons: CurriculumLesson[]
}

export interface CourseWithCurriculum extends Course {
  translations: CourseTranslation[]
  modules: CurriculumModule[]
}

// ── Lesson page (composite view) ─────────────────────────

export interface LessonPageData {
  lesson: Lesson
  translation: LessonTranslation
  blocks: LessonBlock[]
  course: {
    id: string
    slug: string
  }
  module: {
    id: string
    slug: string
  }
  prevLesson: { slug: string } | null
  nextLesson: { slug: string } | null
}

// ── Media ────────────────────────────────────────────────

export interface MediaAsset {
  id: string
  storage_path: string
  bucket: string
  file_name: string
  file_type: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  alt_text: string | null
  caption: string | null
  source: string | null
  license: string | null
  uploaded_by_id: string | null
  created_at: string
  updated_at: string
}
