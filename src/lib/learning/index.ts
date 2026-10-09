/**
 * Learning services for MioDemy (S3).
 *
 * - assessmentService: published quizzes + question grading
 *   (CRITICAL: is_correct is never sent to the client before submission).
 * - progressService: enrollments, lesson progress, bookmarks, notes.
 *
 * All operations use the server Supabase client (RLS on for user-scoped
 * data; RLS allows public read of published content).
 *
 * @see prisma/schema.prisma (Assessment, Learner sections)
 * @see docs/database.md
 */
export {
  getPublishedQuizBySlug,
  gradeAnswer,
} from './assessment-service'
export type {
  Question,
  QuestionTranslation,
  QuestionOptionDB,
  PublicQuestion,
  PublicQuestionOption,
  Quiz,
  QuizTranslation,
  MockTest,
  Attempt,
  AttemptAnswer,
  AnswerResult,
  QuestionType,
  DifficultyRank,
  AttemptStatus,
} from './assessment-types'

export {
  enrolInCourse,
  listMyEnrollments,
  getOrCreateLessonProgress,
  completeLesson,
  toggleBookmark,
  listMyBookmarks,
  createNote,
  listMyNotes,
  updateNote,
  deleteNote,
} from './progress-service'
export type {
  Enrollment,
  LessonProgress,
  Bookmark,
  Note,
  EntityType,
} from './learner-types'
