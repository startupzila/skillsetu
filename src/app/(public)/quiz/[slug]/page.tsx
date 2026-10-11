import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedQuizBySlug } from '@/lib/learning'
import { QuizRunner } from '@/components/learning'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, Clock, ArrowRight, TrendingUp, Sparkles, BookOpen } from 'lucide-react'
import { safeFetch } from '@/lib/safe-fetch'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'
import { getRelatedQuizzes, getLatestQuizzes, getTrendingQuizzes, getNextLessonQuiz, type QuizListItem } from '@/lib/content/quiz-service'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const lang = await getLocale()
  const res = await safeFetch(() => getPublishedQuizBySlug(slug, lang))
  const t = res?.data?.translation
  if (!t) return { title: 'Quiz not found' }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title = lang === 'hi' ? `${t.title} — मुफ्त ऑनलाइन क्विज़ | MioDemy` : `${t.title} — Free Online Quiz | MioDemy`
  const desc = t.instructions ?? (lang === 'hi' ? 'अपने ज्ञान का परीक्षण करें।' : 'Test your knowledge.')
  return {
    title, description: desc,
    alternates: { canonical: `${siteUrl}${localePath(lang, `/quiz/${slug}`)}`, languages: { en: `${siteUrl}/quiz/${slug}`, hi: `${siteUrl}/hi/quiz/${slug}` } },
    openGraph: { title, description: desc, type: 'article', locale: lang === 'hi' ? 'hi_IN' : 'en_US' },
  }
}

function QuizSidebarCard({ quiz, lang }: { quiz: QuizListItem; lang: 'en' | 'hi' }) {
  const hi = lang === 'hi'
  return (
    <Link href={localePath(lang, `/quiz/${quiz.slug}`)} className="flex gap-2.5 rounded-lg p-2 hover:bg-accent/50 transition-colors group">
      <div className="shrink-0 w-24 h-14 rounded-md bg-primary/10 flex items-center justify-center">
        <FileQuestion className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{quiz.translation?.title ?? quiz.slug}</h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px] px-1.5">{quiz.question_count} {hi ? 'प्र' : 'Qs'}</Badge>
          {quiz.course_title && <span className="truncate">{quiz.course_title}</span>}
        </div>
      </div>
    </Link>
  )
}

export default async function QuizPage({ params }: PageProps) {
  const { slug } = await params
  const lang = await getLocale()
  const hi = lang === 'hi'

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
        <Breadcrumbs items={[
          { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
          { label: hi ? 'क्विज़' : 'Quizzes', href: localePath(lang, '/quizzes') },
          { label: translation?.title ?? quiz.slug },
        ]} />
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
          {hi ? 'इस क्विज़ में अभी कोई प्रश्न नहीं है।' : 'No questions in this quiz yet.'}
        </CardContent></Card>
      </div>
    )
  }

  const [related, latest, trending, nextQuiz] = await Promise.all([
    safeFetch(() => getRelatedQuizzes(quiz.id, null, lang)),
    safeFetch(() => getLatestQuizzes(lang)),
    safeFetch(() => getTrendingQuizzes(lang)),
    quiz.lesson_id ? safeFetch(() => getNextLessonQuiz(quiz.lesson_id, '', lang)) : Promise.resolve(null),
  ])

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumbs items={[
        { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
        { label: hi ? 'क्विज़' : 'Quizzes', href: localePath(lang, '/quizzes') },
        { label: translation?.title ?? quiz.slug },
      ]} />

      {/* YouTube-style layout: quiz left, related right */}
      <div className="mt-4 grid lg:grid-cols-3 gap-6">
        {/* Left: Quiz play area (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quiz info bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{translation?.title ?? quiz.slug}</h1>
            <Badge variant="secondary">{questions.length} {hi ? 'प्रश्न' : 'Questions'}</Badge>
            <Badge variant="outline">{quiz.passing_score}% {hi ? 'पास' : 'pass'}</Badge>
          </div>

          {/* Quiz runner */}
          <QuizRunner
            quizId={quiz.id}
            title={translation?.title ?? quiz.slug}
            instructions={translation?.instructions}
            questions={questions}
            passingScore={quiz.passing_score}
            lang={lang}
          />

          {/* Next quiz (after results) */}
          {nextQuiz && nextQuiz.slug && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-primary font-medium uppercase">{hi ? 'अगला क्विज़' : 'Next quiz'}</p>
                  <p className="font-semibold text-sm truncate">{nextQuiz.translation?.title ?? nextQuiz.slug}</p>
                </div>
                <Link href={localePath(lang, `/quiz/${nextQuiz.slug}`)} className="text-primary font-medium text-sm flex items-center gap-1 shrink-0">
                  {hi ? 'खेलें' : 'Play'} <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Related quizzes sidebar (1/3 width on desktop) */}
        <div className="space-y-4">
          {related && related.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                {hi ? 'संबंधित क्विज़' : 'Related quizzes'}
              </h3>
              <div className="space-y-1">
                {related.map((q) => <QuizSidebarCard key={q.id} quiz={q} lang={lang} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Below: Latest + Trending */}
      <div className="mt-10 grid md:grid-cols-2 gap-8">
        {latest && latest.length > 0 && (
          <section>
            <h2 className="text-lg font-bold tracking-tight mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {hi ? 'नवीनतम क्विज़' : 'Latest Quizzes'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {latest.map((q) => (
                <Link key={q.id} href={localePath(lang, `/quiz/${q.slug}`)} className="rounded-lg border p-3 hover:border-primary/30 hover:shadow-sm transition-all">
                  <FileQuestion className="h-4 w-4 text-primary mb-1.5" />
                  <h3 className="font-medium text-sm line-clamp-2">{q.translation?.title ?? q.slug}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{q.question_count} {hi ? 'प्रश्न' : 'Qs'}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {trending && trending.length > 0 && (
          <section>
            <h2 className="text-lg font-bold tracking-tight mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {hi ? 'ट्रेंडिंग क्विज़' : 'Trending Quizzes'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {trending.map((q) => (
                <Link key={q.id} href={localePath(lang, `/quiz/${q.slug}`)} className="rounded-lg border p-3 hover:border-primary/30 hover:shadow-sm transition-all">
                  <FileQuestion className="h-4 w-4 text-primary mb-1.5" />
                  <h3 className="font-medium text-sm line-clamp-2">{q.translation?.title ?? q.slug}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{q.question_count} {hi ? 'प्रश्न' : 'Qs'}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* View all */}
      <div className="mt-8 text-center">
        <Link href={localePath(lang, '/quizzes')} className="inline-flex items-center gap-1 text-primary font-medium hover:underline text-sm">
          {hi ? 'सभी क्विज़ देखें' : 'View all quizzes'} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
