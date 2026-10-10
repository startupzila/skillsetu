import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { listMyEnrollments, listMyBookmarks, listMyNotes } from '@/lib/learning'
import { listMyOrders, listMyEntitlements } from '@/lib/commerce/commerce-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/shared'
import { BookOpen, Bookmark, NotebookPen, ShoppingBag, Download, Clock, Trophy, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
  // Private learner dashboard — never indexed by search engines.
  robots: { index: false, follow: false },
}

export default async function DashboardPage() {
  const session = await getSession().catch(() => null)
  if (!session) redirect('/login?redirect=/dashboard')

  // Fetch all dashboard data in parallel
  const supabase = await createServerSupabaseClient()

  const [{ data: enrollments }, { data: bookmarks }, { data: notes }, { data: orders }, { data: entitlements }] = await Promise.all([
    listMyEnrollments(),
    listMyBookmarks(),
    listMyNotes(),
    listMyOrders(),
    listMyEntitlements(),
  ])

  // Fetch quiz attempt count
  const { count: quizAttempts } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('status', 'completed')

  // Fetch enrolled course details (titles)
  const enrolledCourses = await Promise.all(
    (enrollments ?? []).slice(0, 5).map(async (en: { course_id: string; progress_percent: number; status: string }) => {
      const { data: course } = await supabase
        .from('courses')
        .select('slug, translations:course_translations(title)')
        .eq('id', en.course_id)
        .single()
      const title = (course?.translations as { title: string }[])?.[0]?.title ?? 'Unknown'
      return { ...en, course_slug: course?.slug, course_title: title }
    }),
  )

  // Fetch bookmarked lesson titles
  const bookmarkedLessons = await Promise.all(
    (bookmarks ?? []).filter((b: { entity_type: string }) => b.entity_type === 'lesson').slice(0, 5).map(async (bm: { entity_id: string }) => {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('slug, module:modules(slug, course:courses(slug)), translations:lesson_translations(title)')
        .eq('id', bm.entity_id)
        .single()
      const title = (lesson?.translations as { title: string }[])?.[0]?.title ?? 'Unknown'
      const courseSlug = (lesson?.module as { course: { slug: string } | null })?.course?.slug
      const moduleSlug = (lesson?.module as { slug: string })?.slug
      return { lesson_slug: lesson?.slug, title, course_slug: courseSlug, module_slug: moduleSlug }
    }),
  )

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.profile?.display_name || session.user.email}
          </h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey.</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{enrolledCourses.length}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{quizAttempts ?? 0}</p>
              <p className="text-xs text-muted-foreground">Quiz attempts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Bookmark className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{bookmarks?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Bookmarks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <NotebookPen className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{notes?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Notes</p>
            </CardContent>
          </Card>
        </div>

        {/* Continue learning */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Continue Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">You haven&apos;t started any courses yet.</p>
                <Button asChild size="sm"><Link href="/courses">Browse courses</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.map((ec) => (
                  <div key={ec.course_id} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/courses/${ec.course_slug}`} className="font-medium hover:text-primary">
                        {ec.course_title}
                      </Link>
                      <div className="mt-1"><ProgressBar value={ec.progress_percent} size="sm" /></div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{ec.progress_percent}%</Badge>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/courses/${ec.course_slug}`}>Continue <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two-column: Saved + Notes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Saved lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bookmark className="h-4 w-4" /> Saved Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookmarkedLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved lessons yet.</p>
              ) : (
                <ul className="space-y-2">
                  {bookmarkedLessons.map((bm, i) => (
                    <li key={i}>
                      <Link
                        href={bm.course_slug && bm.module_slug ? `/courses/${bm.course_slug}/${bm.module_slug}/${bm.lesson_slug}` : '#'}
                        className="text-sm hover:text-primary"
                      >
                        {bm.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <NotebookPen className="h-4 w-4" /> Recent Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!notes || notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {notes.slice(0, 5).map((note: { id: string; content: string; updated_at: string }) => (
                    <li key={note.id} className="text-sm">
                      <p className="line-clamp-2 text-muted-foreground">{note.content}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{new Date(note.updated_at).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two-column: Orders + Downloads */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!orders || orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="space-y-2">
                  {orders.slice(0, 5).map((order: { id: string; status: string; total_cents: number; currency: string; created_at: string }) => (
                    <li key={order.id} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{order.id.slice(0, 8)}…</span>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="text-xs">{order.status}</Badge>
                      <span className="font-medium">{(order.total_cents / 100).toLocaleString('en-IN', { style: 'currency', currency: order.currency })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" /> Purchased Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!entitlements || entitlements.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No purchased resources.</p>
                  <Button asChild size="sm" variant="outline"><Link href="/store">Browse store</Link></Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {entitlements.slice(0, 5).map((ent: { id: string; product: { id: string; slug: string; variants: Array<{ name: string }> } }) => (
                    <li key={ent.id} className="flex items-center justify-between text-sm">
                      <span>{ent.product?.variants?.[0]?.name ?? ent.product?.slug}</span>
                      <form action={`/api/commerce/download?entitlementId=${ent.id}`} method="post">
                        <Button type="submit" size="sm" variant="ghost" className="h-7">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
