import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Books',
  description: 'Browse books, eBooks, workbooks and practice packs on MioDemy.',
}

export default function BooksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Books' }]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Books & Resources</h1>
        <p className="text-muted-foreground mt-2">
          Practice workbooks, cheat sheets and study materials to complement your courses.
        </p>
      </div>

      <Card className="max-w-lg mx-auto">
        <CardContent className="py-16 text-center space-y-4">
          <div className="inline-flex rounded-full bg-primary/10 p-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Coming Soon</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            We&apos;re curating a collection of premium books, workbooks, and study materials.
            Stay tuned — our bookstore will launch soon!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
