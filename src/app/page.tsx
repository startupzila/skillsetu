import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listPublishedCourses } from '@/lib/content'

/**
 * SkillSetu — homepage (S2+).
 *
 * Server component: fetches published courses directly from Supabase
 * (RLS allows public read of published content). If the schema has
 * not been applied yet, a friendly setup notice is shown instead.
 *
 * The full homepage (hero, search, categories, methodology, etc.)
 * is built in session S6.
 */
export default async function Home() {
  const { data: courses, error } = await listPublishedCourses('en')
  const schemaApplied = !error && courses !== null

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">SkillSetu</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/api/health">System Health</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <Badge variant="secondary" className="text-xs">
            Phase 2 · Database & Content
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto">
            Learn practical skills in your language
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Structured tutorials, examples, practice, quizzes and resources —
            in English and Hindi.
          </p>
          <p className="text-sm text-muted-foreground">
            Discover → Learn → Practice → Test → Apply → Track Progress
          </p>
        </div>
      </section>

      {/* Courses or setup notice */}
      <section className="flex-1 container mx-auto px-4 py-12">
        {!schemaApplied ? (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-base">Database schema not yet applied</CardTitle>
              <CardDescription>
                The tables and seed data need to be created in Supabase before
                courses appear here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Open the Supabase Dashboard → SQL Editor and run these files in
                order (from the <code className="text-xs bg-muted px-1 py-0.5 rounded">db/</code> directory):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li><code className="text-xs">migrations/001_tables.sql</code></li>
                <li><code className="text-xs">migrations/002_triggers.sql</code></li>
                <li><code className="text-xs">migrations/003_rls.sql</code></li>
                <li><code className="text-xs">seeds/001_seed.sql</code></li>
              </ol>
              <p className="text-muted-foreground pt-2">
                Then refresh this page to see the sample course.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/api/health">Check system health</Link>
              </Button>
            </CardContent>
          </Card>
        ) : courses!.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-muted-foreground">No published courses yet.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/courses?lang=en">View courses API</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Featured Courses</h3>
              <Button asChild variant="ghost" size="sm">
                <Link href="/api/courses?lang=en">API</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses!.map((course) => {
                const t = course.translations[0]
                return (
                  <Card key={course.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {course.difficulty}
                        </Badge>
                        {course.estimated_duration && (
                          <Badge variant="secondary" className="text-xs">
                            {course.estimated_duration} min
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{t?.title ?? course.slug}</CardTitle>
                      <CardDescription>
                        {t?.short_description ?? '—'}
                      </CardDescription>
                    </CardHeader>
                    {t?.learning_outcomes && t.learning_outcomes.length > 0 && (
                      <CardContent>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          What you&apos;ll learn:
                        </p>
                        <ul className="text-sm space-y-1">
                          {t.learning_outcomes.slice(0, 3).map((o, i) => (
                            <li key={i} className="text-muted-foreground">
                              • {o}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          SkillSetu — A structured, multilingual, practical skills learning platform.
        </div>
      </footer>
    </main>
  )
}
