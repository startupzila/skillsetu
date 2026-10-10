import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

/**
 * ServiceUnavailable — graceful fallback rendered by public pages when the
 * backing data store (Supabase) is unreachable or not yet configured.
 *
 * Instead of Next.js's scary "server-side exception" page, visitors see a
 * friendly, branded message. This is NOT a 404 (the route exists); it means
 * content couldn't be loaded right now.
 *
 * Used by: home, course detail, courses list, lesson, search, skills, store,
 * books, centres, dashboard, sitemap — anywhere a Supabase fetch may throw.
 */
export function ServiceUnavailable({
  title = 'Content is temporarily unavailable',
  message = "We couldn't load this content right now. This is usually a brief configuration issue — please try again in a moment.",
  showHomeLink = true,
}: {
  title?: string
  message?: string
  showHomeLink?: boolean
}) {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-md mx-auto text-center space-y-5">
        <div className="inline-flex rounded-full bg-amber-100 dark:bg-amber-950/40 p-4">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">{message}</p>
        {showHomeLink && (
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
