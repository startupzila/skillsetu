import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CourseCard } from '@/components/shared'
import { JsonLdWebsite } from '@/components/seo/json-ld'
import { TypingHeading } from '@/components/public/typing-heading'
import { listPublishedCourses, listPublishedCategories } from '@/lib/content'
import { safeFetch } from '@/lib/safe-fetch'
import { getLocale, localePath } from '@/lib/i18n/locale'
import { t } from '@/lib/i18n/dictionary'
import { BookOpen, GraduationCap, Languages, ArrowRight, Building2, Plus } from 'lucide-react'

/**
 * MioDemy — homepage.
 *
 * Server component: fetches published courses + categories from Supabase,
 * filtered by the current locale (detected from the URL via middleware).
 * `/` → English, `/hi` → Hindi.
 */
export default async function Home() {
  const lang = await getLocale()
  const coursesRes = await safeFetch(() => listPublishedCourses(lang))
  const categoriesRes = await safeFetch(() => listPublishedCategories(lang))
  const courses = coursesRes?.data ?? []
  const categories = categoriesRes?.data ?? []

  return (
    <>
      <JsonLdWebsite />
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-brand-muted/40 to-background">
        <div className="container mx-auto px-4 py-16 text-center space-y-5">
          <TypingHeading />
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            {t(lang, 'hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg">
              <Link href={localePath(lang, '/courses')}>
                <BookOpen className="h-4 w-4 mr-2" />
                {t(lang, 'hero.browseCourses')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">
                <GraduationCap className="h-4 w-4 mr-2" />
                {t(lang, 'hero.createAccount')}
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-3">
            {t(lang, 'hero.flow')}
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t(lang, 'home.exploreByCategory')}</h2>
              <p className="text-muted-foreground mt-1">
                {t(lang, 'home.exploreByCategorySub')}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={localePath(lang, '/skills')}>
                {t(lang, 'home.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const ct = cat.translations[0]
              return (
                <Link
                  key={cat.id}
                  href={localePath(lang, `/skills/${cat.slug}`)}
                  className="group rounded-lg border p-6 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {ct?.name ?? cat.slug}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ct?.description ?? ''}
                  </p>
                  <span className="text-sm text-primary font-medium mt-3 inline-flex items-center gap-1">
                    {lang === 'hi' ? 'देखें' : 'Explore'} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Featured courses */}
      {courses && courses.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t(lang, 'home.featuredCourses')}</h2>
              <p className="text-muted-foreground mt-1">
                {t(lang, 'home.featuredCoursesSub')}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={localePath(lang, '/courses')}>
                {t(lang, 'home.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* Training Centres */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{t(lang, 'home.findCentres')}</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            {t(lang, 'home.findCentresSub')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href={localePath(lang, '/centres')}>
              <Building2 className="h-4 w-4 mr-2" />
              {t(lang, 'home.browseCentres')}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/centres/register">
              <Plus className="h-4 w-4 mr-2" />
              {t(lang, 'home.registerCentre')}
            </Link>
          </Button>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">{t(lang, 'home.whyMioDemy')}</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              {t(lang, 'home.whyMioDemySub')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: t(lang, 'home.structuredLearning'),
                desc: t(lang, 'home.structuredLearningDesc'),
              },
              {
                icon: Languages,
                title: t(lang, 'home.bilingual'),
                desc: t(lang, 'home.bilingualDesc'),
              },
              {
                icon: GraduationCap,
                title: t(lang, 'home.practiceTest'),
                desc: t(lang, 'home.practiceTestDesc'),
              },
            ].map((feat) => (
              <div key={feat.title} className="text-center space-y-3">
                <div className="inline-flex rounded-full bg-primary/10 p-3">
                  <feat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg">{feat.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
