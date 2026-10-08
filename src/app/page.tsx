import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/public/header'
import { Footer } from '@/components/public/footer'
import { CourseCard } from '@/components/shared'
import { listPublishedCourses } from '@/lib/content'
import { getSession } from '@/lib/auth'
import { BookOpen, GraduationCap, Languages, Sparkles } from 'lucide-react'

/**
 * SkillSetu — homepage (S5+).
 *
 * Server component: uses the new public Header + Footer layout,
 * design tokens (teal brand), CourseCard component, and shows
 * real published courses from Supabase.
 *
 * The full homepage (search, categories, methodology sections)
 * is polished further in S6.
 */
export default async function Home() {
  const [{ data: courses, error }, session] = await Promise.all([
    listPublishedCourses('en'),
    getSession().catch(() => null),
  ])
  const schemaApplied = !error && courses !== null

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} lang="en" />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-brand-muted/40 to-background">
        <div className="container mx-auto px-4 py-20 text-center space-y-6">
          <Badge variant="secondary" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Learn in English & Hindi
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
            Learn practical skills
            <br />
            <span className="text-primary">in your language</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Structured tutorials, examples, practice, quizzes and resources —
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
          <p className="text-sm text-muted-foreground pt-4">
            Discover → Learn → Practice → Test → Apply → Track Progress
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1">
        {!schemaApplied ? (
          <section className="container mx-auto px-4 py-16">
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="text-base">Database schema not yet applied</CardTitle>
                <CardDescription>
                  Run <code className="text-xs bg-muted px-1.5 py-0.5 rounded">bun run db:apply</code> to create tables and seed data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href="/api/health">Check system health</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        ) : courses!.length === 0 ? (
          <section className="container mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground">No published courses yet.</p>
          </section>
        ) : (
          <>
            {/* Featured courses */}
            <section className="container mx-auto px-4 py-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
                  <p className="text-muted-foreground mt-1">
                    Start learning with our curated skill courses
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/courses">View all</Link>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses!.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>

            {/* Methodology */}
            <section className="border-t bg-muted/30">
              <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold tracking-tight">Why SkillSetu?</h2>
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
        )}
      </main>

      <Footer lang="en" />
    </div>
  )
}
