/**
 * MioDemy — Permission constants (S4 RBAC)
 *
 * All permission names defined in the seed (db/seeds/001_seed.sql).
 * Use these constants instead of raw strings to avoid typos.
 *
 * @see docs/security.md
 */
export const PERMISSIONS = {
  COURSE_READ: 'course.read',
  COURSE_CREATE: 'course.create',
  COURSE_UPDATE: 'course.update',
  COURSE_PUBLISH: 'course.publish',
  LESSON_CREATE: 'lesson.create',
  LESSON_UPDATE: 'lesson.update',
  LESSON_PUBLISH: 'lesson.publish',
  QUESTION_CREATE: 'question.create',
  QUESTION_REVIEW: 'question.review',
  TRANSLATION_EDIT: 'translation.edit',
  TRANSLATION_PUBLISH: 'translation.publish',
  BOOK_MANAGE: 'book.manage',
  ORDER_READ: 'order.read',
  SEO_MANAGE: 'seo.manage',
  ANALYTICS_READ: 'analytics.read',
  SETTINGS_MANAGE: 'settings.manage',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  AUDIT_READ: 'audit.read',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Role names defined in the seed. */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITORIAL_MANAGER: 'editorial_manager',
  CONTENT_WRITER: 'content_writer',
  REVIEWER: 'reviewer',
  TRANSLATOR: 'translator',
  QUIZ_EDITOR: 'quiz_editor',
  COMMERCE_MANAGER: 'commerce_manager',
  MARKETING_MANAGER: 'marketing_manager',
  ANALYST: 'analyst',
  MEDIA_MANAGER: 'media_manager',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]

/** Permissions that the super_admin implicitly holds (all of them). */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS)
