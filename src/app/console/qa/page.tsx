import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared'
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = { title: 'Content QA — Console' }

const QA_CHECKLIST = [
  'Course has a clear title and description',
  'All modules have at least one lesson',
  'Lessons have content blocks (not empty)',
  'Course has learning outcomes defined',
  'Course has prerequisites listed',
  'Course has target audience defined',
  'At least one quiz or assessment exists',
  'EN translation is published',
  'Course thumbnail set (if applicable)',
  'Content reviewed for factual accuracy',
]

export default async function QAPage() {
  await requirePermission('course.read')
  const admin = createAdminClient()

  // Fetch all courses with their data for QA checking
  const { data: courses } = await admin
    .from('courses')
    .select(`
      id, slug, status, difficulty, estimated_duration, last_reviewed_at, next_review_at,
      translations:course_translations(title, short_description, learning_outcomes, prerequisites, target_audience, status),
      modules:modules(id, status,
        lessons:lessons(id, status,
          blocks:lesson_blocks(id),
          translations:lesson_translations(status)
        )
      )
    `)
    .order('created_at', { ascending: false })

  const now = new Date()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content QA Checklist</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review courses against quality standards. Identify incomplete content and overdue reviews.
        </p>
      </div>

      {/* QA checklist legend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Quality Standards</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid sm:grid-cols-2 gap-2">
            {QA_CHECKLIST.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Course QA status */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Course Status</h2>
        {(courses ?? []).map((course: Record<string, unknown>) => {
          const translations = course.translations as Array<Record<string, unknown>>
          const enT = translations?.find((t) => t.language_code === 'en')
          const modules = course.modules as Array<Record<string, unknown>>
          const lessons = modules?.flatMap((m) => m.lessons as Array<Record<string, unknown>>) ?? []
          const allBlocks = lessons?.flatMap((l) => l.blocks as Array<Record<string, unknown>>) ?? []

          // QA checks
          const hasTitle = !!enT?.title
          const hasDescription = !!enT?.short_description
          const hasOutcomes = Array.isArray(enT?.learning_outcomes) && enT!.learning_outcomes.length > 0
          const hasPrerequisites = Array.isArray(enT?.prerequisites) && enT!.prerequisites.length > 0
          const hasAudience = Array.isArray(enT?.target_audience) && enT!.target_audience.length > 0
          const hasModules = modules && modules.length > 0
          const hasLessons = lessons.length > 0
          const hasBlocks = allBlocks.length > 0
          const enPublished = enT?.status === 'published'

          const checks = [
            hasTitle, hasDescription, hasOutcomes, hasPrerequisites, hasAudience,
            hasModules, hasLessons, hasBlocks, enPublished,
          ]
          const passedCount = checks.filter(Boolean).length
          const totalCount = checks.length
          const isComplete = passedCount === totalCount

          // Review status
          const lastReviewed = course.last_reviewed_at as string | null
          const nextReview = course.next_review_at as string | null
          const isOverdue = nextReview && new Date(nextReview) < now

          return (
            <Card key={course.id as string}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/console/courses/${course.id}`} className="font-medium hover:text-primary">
                        {enT?.title ?? course.slug}
                      </Link>
                      <StatusBadge status={course.status as string} />
                    </div>

                    {/* QA checks */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[
                        { label: 'Title', ok: hasTitle },
                        { label: 'Desc', ok: hasDescription },
                        { label: 'Outcomes', ok: hasOutcomes },
                        { label: 'Prereq', ok: hasPrerequisites },
                        { label: 'Audience', ok: hasAudience },
                        { label: 'Modules', ok: hasModules },
                        { label: 'Lessons', ok: hasLessons },
                        { label: 'Blocks', ok: hasBlocks },
                        { label: 'EN Published', ok: enPublished },
                      ].map((check, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                            check.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {check.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {check.label}
                        </span>
                      ))}
                    </div>

                    {/* Review status */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {lastReviewed && (
                        <span>Last reviewed: {new Date(lastReviewed).toLocaleDateString()}</span>
                      )}
                      {nextReview && (
                        <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                          {isOverdue ? <AlertTriangle className="h-3 w-3 inline mr-1" /> : <Clock className="h-3 w-3 inline mr-1" />}
                          Next review: {new Date(nextReview).toLocaleDateString()}
                        </span>
                      )}
                      {!lastReviewed && !nextReview && (
                        <span className="text-muted-foreground">No review scheduled</span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center shrink-0">
                    <p className={`text-2xl font-bold ${isComplete ? 'text-success' : 'text-warning'}`}>
                      {passedCount}/{totalCount}
                    </p>
                    <p className="text-xs text-muted-foreground">checks passed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
