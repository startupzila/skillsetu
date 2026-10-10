import Link from 'next/link'
import type { Metadata } from 'next'
import { listPublishedQuizzes } from '@/lib/content/quiz-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { ServiceUnavailable } from '@/components/public/service-unavailable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Clock, ArrowRight, BookOpen } from 'lucide-react'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t as tt } from '@/lib/i18n/dictionary'
import { safeFetch } from '@/lib/safe-fetch'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const title = lang === 'hi' ? 'सभी क्विज़ — मुफ्त ऑनलाइन क्विज़ | MioDemy' : 'All Quizzes — Free Online Quizzes | MioDemy'
  const desc = lang === 'hi'
    ? 'अपने ज्ञान का परीक्षण करें — Excel, PowerPoint, Word, Digital Marketing और बहुत कुछ पर मुफ्त ऑनलाइन क्विज़। कोर्स और पाठ दोनों के क्विज़।'
    : 'Test your knowledge — free online quizzes on Excel, PowerPoint, Word, Digital Marketing and more. Quizzes from courses and lessons.'

  return {
    title,
    description: desc,
    keywords: lang === 'hi'
      ? ['क्विज़', 'मुफ्त क्विज़', 'ऑनलाइन क्विज़', 'प्रैक्टिस क्विज़', 'परीक्षा', 'कोर्स क्विज़']
      : ['quizzes', 'free quizzes', 'online quiz', 'practice quiz', 'test', 'course quizzes'],
    alternates: {
      canonical: `${siteUrl}${localePath(lang, '/quizzes')}`,
      languages: { en: `${siteUrl}/quizzes`, hi: `${siteUrl}/hi/quizzes` },
    },
    openGraph: { title, description: desc, type: 'website', locale: lang === 'hi' ? 'hi_IN' : 'en_US' },
  }
}

export default async function QuizzesPage() {
  const lang = await getLocale()
  const quizzes = await safeFetch(() => listPublishedQuizzes(lang))

  if (quizzes === null) return <ServiceUnavailable />

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: tt(lang, 'breadcrumb.home'), href: localePath(lang, '/') },
          { label: lang === 'hi' ? 'क्विज़' : 'Quizzes' },
        ]}
      />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {lang === 'hi' ? 'सभी क्विज़' : 'All Quizzes'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {lang === 'hi'
            ? 'अपने ज्ञान का परीक्षण करें — कोर्स और पाठ दोनों के क्विज़।'
            : 'Test your knowledge — quizzes from courses and lessons.'}
        </p>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
            {lang === 'hi' ? 'अभी कोई क्विज़ उपलब्ध नहीं है।' : 'No quizzes available yet.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={localePath(lang, `/quiz/${quiz.slug}`)}
              className="group rounded-lg border p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <FileQuestion className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {quiz.question_count} {lang === 'hi' ? 'प्रश्न' : 'Qs'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {quiz.passing_score}% {lang === 'hi' ? 'पास' : 'pass'}
                  </Badge>
                </div>
              </div>
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                {quiz.translation?.title ?? quiz.slug}
              </h3>
              {quiz.translation?.instructions && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {quiz.translation.instructions}
                </p>
              )}
              {quiz.course_title && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  {quiz.course_title}
                  {quiz.lesson_slug && (
                    <>
                      <span>·</span>
                      <Clock className="h-3.5 w-3.5" />
                      {quiz.lesson_slug}
                    </>
                  )}
                </div>
              )}
              <span className="text-sm text-primary font-medium mt-3 inline-flex items-center gap-1">
                {lang === 'hi' ? 'क्विज़ खेलें' : 'Play quiz'}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
