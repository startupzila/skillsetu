import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * SkillSetu — homepage (temporary S1 placeholder).
 *
 * The real homepage (hero, search, featured courses, categories, etc.)
 * is built in session S6. This page confirms the project is wired up
 * and provides a link to the health check.
 */
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="secondary" className="text-xs">
            Phase 0 · Foundation
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">SkillSetu</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A structured, multilingual, practical skills learning platform.
            Learn real-world skills in English and Hindi — through tutorials,
            examples, practice, quizzes and resources.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Infrastructure &amp; Supabase wiring is complete. The database
              schema, authentication and public learning experience are built
              in upcoming sessions.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">S0 · Planning ✓</Badge>
              <Badge variant="outline">S1 · Infrastructure ✓</Badge>
              <Badge variant="secondary">S2 · Database schema — next</Badge>
            </div>
            <div className="pt-2">
              <Button asChild size="sm" variant="default">
                <Link href="/api/health">Check system health</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Discover → Learn → Practice → Test → Apply → Track Progress
        </p>
      </div>
    </main>
  )
}
