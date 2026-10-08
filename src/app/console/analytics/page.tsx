import type { Metadata } from 'next'
import { getAdminMetrics, getRecentEvents } from '@/lib/analytics/analytics-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, GraduationCap, ShoppingBag, IndianRupee, FileQuestion, Bookmark, NotebookPen, Trophy, Image as ImageIcon } from 'lucide-react'

export const metadata: Metadata = { title: 'Analytics — Console' }

function formatRevenue(cents: number): string {
  return (cents / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
}

export default async function AnalyticsPage() {
  let metrics
  let recentEvents
  let error

  try {
    const [m, e] = await Promise.all([getAdminMetrics(), getRecentEvents(20)])
    metrics = m
    recentEvents = e
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  if (error) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-6 text-center text-sm text-destructive">
          {error.includes('Authentication') ? 'Please sign in.' : error.includes('FORBIDDEN') ? 'Insufficient permissions.' : `Error: ${error}`}
        </CardContent></Card>
      </div>
    )
  }

  const cards = [
    { label: 'Learners', value: metrics!.learners, icon: Users },
    { label: 'Courses', value: `${metrics!.publishedCourses}/${metrics!.courses}`, icon: BookOpen },
    { label: 'Lessons', value: `${metrics!.publishedLessons}/${metrics!.lessons}`, icon: GraduationCap },
    { label: 'Questions', value: metrics!.questions, icon: FileQuestion },
    { label: 'Enrollments', value: metrics!.enrollments, icon: GraduationCap },
    { label: 'Quiz Attempts', value: metrics!.quizAttempts, icon: Trophy },
    { label: 'Bookmarks', value: metrics!.bookmarks, icon: Bookmark },
    { label: 'Notes', value: metrics!.notes, icon: NotebookPen },
    { label: 'Orders', value: metrics!.orders, icon: ShoppingBag },
    { label: 'Paid Orders', value: metrics!.paidOrders, icon: ShoppingBag },
    { label: 'Revenue', value: formatRevenue(metrics!.revenue), icon: IndianRupee },
    { label: 'Media Assets', value: metrics!.mediaAssets, icon: ImageIcon },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform metrics and recent activity.</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent events */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ul className="space-y-2">
              {recentEvents.map((event: { action: string; entity_type: string | null; created_at: string }, i: number) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary" className="text-xs font-mono">{event.action}</Badge>
                  {event.entity_type && <span className="text-muted-foreground text-xs">{event.entity_type}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(event.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
