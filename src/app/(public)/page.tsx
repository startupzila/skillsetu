import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CourseCard } from '@/components/shared'
import { JsonLdWebsite } from '@/components/seo/json-ld'
import { TypingHeading } from '@/components/public/typing-heading'
import { listPublishedCourses, listPublishedCategories } from '@/lib/content'
import { BookOpen, GraduationCap, Languages, ArrowRight, Building2, Plus } from 'lucide-react'

/**
 * MioDemy — homepage.
 *
 * Server component: fetches published courses + categories from Supabase.
 * Rendered inside the (public) layout which provides Header + Footer.
 */
export default async function Home() {
  const [{ data: courses }, { data: categories }] = await Promise.all([
    listPublishedCourses('en'),
    listPublishedCategories('en'),
  ])

  return (
    <>
      <JsonLdWebsite />
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-brand-muted/40 to-background">
        <div className="container mx-auto px-4 py-16 text-center space-y-5">
          <TypingHeading />
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Structured Tutorials, Examples, Practice, Quizzes &amp; Resources —
            for Excel, Tally, Digital Marketing, AI tools and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg">
              <Link href="/courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse courses
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">
                <GraduationCap className="h-4 w-4 mr-2" />
                Create free account
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-3">
            Discover → Learn → Practice → Test → Apply → Track Progress
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Explore by Category</h2>
              <p className="text-muted-foreground mt-1">
                Find courses organised by skill area
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/skills">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const t = cat.translations[0]
              return (
                <Link
                  key={cat.id}
                  href={`/skills/${cat.slug}`}
                  className="group rounded-lg border p-6 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {t?.name ?? cat.slug}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {t?.description ?? ''}
                  </p>
                  <span className="text-sm text-primary font-medium mt-3 inline-flex items-center gap-1">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
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
              <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
              <p className="text-muted-foreground mt-1">
                Start learning with our curated skill courses
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/courses">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Training Centres */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Find Skill & Training Centres Near You</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Browse verified skills and training institutes. Compare courses, fees, reviews, and admission details.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/centres">
              <Building2 className="h-4 w-4 mr-2" />
              Browse Centres
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/centres/register">
              <Plus className="h-4 w-4 mr-2" />
              Register Your Centre
            </Link>
          </Button>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Why MioDemy?</h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              A learning experience designed for real outcomes
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: 'Structured learning',
                desc: 'Every course follows a clear path: concepts → examples → practice → assessment.',
              },
              {
                icon: Languages,
                title: 'Bilingual',
                desc: 'Learn in English or Hindi. Switch languages anytime without losing your place.',
              },
              {
                icon: GraduationCap,
                title: 'Practice & test',
                desc: 'Quizzes, mock tests and projects reinforce what you learn and track progress.',
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
