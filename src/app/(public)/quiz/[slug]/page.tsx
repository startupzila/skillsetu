import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedQuizBySlug } from '@/lib/learning'
import { QuizRunner } from '@/components/learning'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { EmptyState } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { ListChecks } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Generate SEO metadata for the quiz page (resilient to data errors). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const res = await safeFetch(() => getPublishedQuizBySlug(slug, 'en'))
  const t = res?.data?.translation

  if (!t) return { title: 'Quiz not found' }

  return {
    title: t.title,
    description: t.instructions ?? 'Test your knowledge.',
  }
}

/**
 * /quiz/[slug] — interactive quiz page.
 *
 * Server component fetches the quiz + questions (is_correct stripped),
 * then renders the QuizRunner client component for interactivity.
 */
export default async function QuizPage({ params }: PageProps) {
  const { slug } = await params

  // Fetch resiliently: a throw (Supabase env vars missing) renders a
  // friendly fallback instead of a 500. A genuine not-found returns 404.
  let data = null
  let error: string | null = null
  let unavailable = false
  try {
    const res = await getPublishedQuizBySlug(slug, 'en')
    data = res.data
    error = res.error
  } catch {
    unavailable = true
  }

  if (unavailable) return <ServiceUnavailable />

  if (error || !data) {
    if (error?.includes('schema') || error?.includes('does not exist')) {
      return (
        <div className="container mx-auto px-4 py-12">
          <EmptyState
            icon={ListChecks}
            title="Quizzes not available"
            description="The quiz system is being set up. Please check back soon."
          />
        </div>
      )
    }
    notFound()
  }

  const { quiz, translation, questions } = data

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Quizzes' },
            { label: translation?.title ?? quiz.slug },
          ]}
        />
        <EmptyState
          icon={QuizCircle}
          title="No questions yet"
          description="This quiz doesn't have any questions yet."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Quizzes' },
          { label: translation?.title ?? quiz.slug },
        ]}
      />

      <div className="mt-6">
        {quiz.passing_score && (
          <Card className="mb-6 bg-muted/30">
            <CardContent className="py-3 text-sm text-muted-foreground">
              Pass score: <span className="font-medium text-foreground">{quiz.passing_score}%</span> ·
              Questions: <span className="font-medium text-foreground">{questions.length}</span>
              · Sign in to save your attempt.
            </CardContent>
          </Card>
        )}

        <QuizRunner
          quizId={quiz.id}
          title={translation?.title ?? quiz.slug}
          instructions={translation?.instructions}
          questions={questions}
          passingScore={quiz.passing_score}
        />
      </div>
    </div>
  )
}
