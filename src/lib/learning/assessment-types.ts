/**
 * SkillSetu — Assessment domain types (S3)
 *
 * Mirrors the assessment tables: questions, quizzes, mock tests, attempts.
 * @see prisma/schema.prisma (Assessment section)
 */

import type { ContentStatus, TranslationStatus } from '@/lib/content/types'

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'match'
  | 'ordering'

export type DifficultyRank = 'easy' | 'medium' | 'hard'

export type AttemptStatus =
  | 'in_progress'
  | 'completed'
  | 'abandoned'
  | 'expired'

export interface Question {
  id: string
  slug: string
  question_type: QuestionType
  difficulty: DifficultyRank
  status: ContentStatus
  topic: string | null
  lesson_id: string | null
  author_id: string | null
  reviewer_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface QuestionTranslation {
  id: string
  question_id: string
  language_code: string
  question_text: string
  explanation: string | null
  status: TranslationStatus
  created_at: string
  updated_at: string
}

/** Option as returned to the PUBLIC — `is_correct` is NEVER included. */
export interface PublicQuestionOption {
  id: string
  sort_order: number
  text: string // resolved for the requested language
}

/** Option as stored in DB (includes is_correct — server-side only). */
export interface QuestionOptionDB {
  id: string
  question_id: string
  sort_order: number
  text: Record<string, string> // { en: "...", hi: "..." }
  is_correct: boolean
  created_at: string
}

export interface Quiz {
  id: string
  slug: string
  module_id: string | null
  lesson_id: string | null
  status: ContentStatus
  passing_score: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface QuizTranslation {
  id: string
  quiz_id: string
  language_code: string
  title: string
  instructions: string | null
  status: TranslationStatus
  created_at: string
  updated_at: string
}

export interface MockTest {
  id: string
  slug: string
  course_id: string | null
  status: ContentStatus
  time_limit_minutes: number | null
  question_count: number
  passing_score: number
  attempts_allowed: number | null
  randomize: boolean
  review_mode: boolean
  difficulty: DifficultyRank
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Attempt {
  id: string
  user_id: string
  assessment_type: 'quiz' | 'mock_test'
  assessment_id: string
  status: AttemptStatus
  score: number | null
  total_questions: number | null
  correct_count: number | null
  started_at: string
  completed_at: string | null
  time_spent_seconds: number | null
  language_code: string
  created_at: string
  updated_at: string
}

export interface AttemptAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_options: string[] | null
  is_correct: boolean | null
  answered_at: string
}

/** A question prepared for the learner — correct answers stripped. */
export interface PublicQuestion {
  id: string
  slug: string
  question_type: QuestionType
  difficulty: DifficultyRank
  translation: {
    language_code: string
    question_text: string
    explanation: string | null
  }
  options: PublicQuestionOption[]
}

/** Result of submitting an attempt answer. */
export interface AnswerResult {
  question_id: string
  is_correct: boolean
  correct_option_ids: string[]
  explanation: string | null
}
