import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedQuizBySlug } from '@/lib/learning'
import { QuizRunner } from '@/components/learning'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ListChecks, FileQuestion, Clock, ArrowRight, TrendingUp, Sparkles } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'
import { getRelatedQuizzes, getLatestQuizzes, getTrendingQuizzes, getNextLessonQuiz } from '@/lib/content/quiz-service'

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Generate SEO metadata for the quiz page (resilient + locale-aware). */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const lang = await getLocale()
  const res = await safeFetch(() => getPublishedQuizBySlug(slug, lang))
  const t = res?.data?.translation

  if (!t) return { title: 'Quiz not found' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title = lang === 'hi'
    ? `${t.title} — मुफ्त ऑनलाइन क्विज़ | MioDemy`
    : `${t.title} — Free Online Quiz | MioDemy`
  const desc = t.instructions ?? (lang === 'hi' ? 'अपने ज्ञान का परीक्षण करें।' : 'Test your knowledge.')

  return {
    title,
    description: desc,
    alternates: {
      canonical: `${siteUrl}${localePath(lang, `/quiz/${slug}`)}`,
      languages: { en: `${siteUrl}/quiz/${slug}`, hi: `${siteUrl}/hi/quiz/${slug}` },
    },
    openGraph: { title, description: desc, type: 'article', locale: lang === 'hi' ? 'hi_IN' : 'en_US' },
  }
}

export default async function QuizPage({ params }: PageProps) {
  const { slug } = await params
  const lang = await getLocale()

  let data = null
  let unavailable = false
  try {
    const res = await getPublishedQuizBySlug(slug, lang)
    data = res.data
  } catch {
    unavailable = true
  }

  if (unavailable) return <ServiceUnavailable />
  if (!data) notFound()

  const { quiz, translation, questions } = data

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs
          items={[
            { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
            { label: lang === 'hi' ? 'क्विज़' : 'Quizzes', href: localePath(lang, '/quizzes') },
            { label: translation?.title ?? quiz.slug },
          ]}
        />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
            {lang === 'hi' ? 'इस क्विज़ में अभी कोई प्रश्न नहीं है।' : 'No questions in this quiz yet.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch related/latest/trending quizzes in parallel
  const [related, latest, trending, nextQuiz] = await Promise.all([
    safeFetch(() => getRelatedQuizzes(quiz.id, null, lang)),
    safeFetch(() => getLatestQuizzes(lang)),
    safeFetch(() => getTrendingQuizzes(lang)),
    quiz.lesson_id
      ? safeFetch(() => getNextLessonQuiz(quiz.lesson_id, '', lang))
      : Promise.resolve(null),
  ])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
          { label: lang === 'hi' ? 'क्विज़' : 'Quizzes', href: localePath(lang, '/quizzes') },
          { label: translation?.title ?? quiz.slug },
        ]}
      />

      <div className="mt-6">
        {/* Quiz info card */}
        {quiz.passing_score && (
          <Card className="mb-6 bg-muted/30">
            <CardContent className="py-3 text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
              <span>
                {lang === 'hi' ? 'पास स्कोर' : 'Pass score'}:{' '}
                <span className="font-medium text-foreground">{quiz.passing_score}%</span>
              </span>
              <span>·</span>
              <span>
                {lang === 'hi' ? 'प्रश्न' : 'Questions'}:{' '}
                <span className="font-medium text-foreground">{questions.length}</span>
              </span>
              <span>·</span>
              <span>{lang === 'hi' ? 'अपने प्रयास को सेव करने के लिए साइन इन करें।' : 'Sign in to save your attempt.'}</span>
            </CardContent>
          </Card>
        )}

        {/* Quiz runner */}
        <QuizRunner
          quizId={quiz.id}
          title={translation?.title ?? quiz.slug}
          instructions={translation?.instructions}
          questions={questions}
          passingScore={quiz.passing_score}
        />

        {/* Next lesson quiz (after quiz results) */}
        {nextQuiz && nextQuiz.slug && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-primary font-medium uppercase">
                  {lang === 'hi' ? 'अगला क्विज़' : 'Next quiz'}
                </p>
                <p className="font-semibold truncate">{nextQuiz.translation?.title ?? nextQuiz.slug}</p>
                <p className="text-xs text-muted-foreground">
                  {nextQuiz.question_count} {lang === 'hi' ? 'प्रश्न' : 'questions'}
                </p>
              </div>
              <Link
                href={localePath(lang, `/quiz/${nextQuiz.slug}`)}
                className="text-primary font-medium text-sm flex items-center gap-1 shrink-0"
              >
                {lang === 'hi' ? 'खेलें' : 'Play'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Related quizzes */}
      {related && related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {lang === 'hi' ? 'संबंधित क्विज़' : 'Related Quizzes'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {related.map((q) => (
              <Link key={q.id} href={localePath(lang, `/quiz/${q.slug}`)} className="rounded-lg border p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                <FileQuestion className="h-4 w-4 text-primary mb-2" />
                <h3 className="font-medium text-sm line-clamp-2">{q.translation?.title ?? q.slug}</h3>
                <p className="text-xs text-muted-foreground mt-1">{q.question_count} {lang === 'hi' ? 'प्रश्न' : 'Qs'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest quizzes */}
      {latest && latest.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {lang === 'hi' ? 'नवीनतम क्विज़' : 'Latest Quizzes'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {latest.map((q) => (
              <Link key={q.id} href={localePath(lang, `/quiz/${q.slug}`)} className="rounded-lg border p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                <FileQuestion className="h-4 w-4 text-primary mb-2" />
                <h3 className="font-medium text-sm line-clamp-2">{q.translation?.title ?? q.slug}</h3>
                <p className="text-xs text-muted-foreground mt-1">{q.question_count} {lang === 'hi' ? 'प्रश्न' : 'Qs'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending quizzes */}
      {trending && trending.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {lang === 'hi' ? 'ट्रेंडिंग क्विज़' : 'Trending Quizzes'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {trending.map((q) => (
              <Link key={q.id} href={localePath(lang, `/quiz/${q.slug}`)} className="rounded-lg border p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                <FileQuestion className="h-4 w-4 text-primary mb-2" />
                <h3 className="font-medium text-sm line-clamp-2">{q.translation?.title ?? q.slug}</h3>
                <p className="text-xs text-muted-foreground mt-1">{q.question_count} {lang === 'hi' ? 'प्रश्न' : 'Qs'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* View all quizzes */}
      <div className="mt-10 text-center">
        <Link href={localePath(lang, '/quizzes')} className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
          {lang === 'hi' ? 'सभी क्विज़ देखें' : 'View all quizzes'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
