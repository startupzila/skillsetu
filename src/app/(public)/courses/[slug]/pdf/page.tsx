import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublishedCourseBySlug } from '@/lib/content'
import { listCourseResources } from '@/lib/features/feature-service'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, PlayCircle, FileText, FileQuestion, BookOpen } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

const RESOURCE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  notes: BookOpen,
  short_notes: FileText,
  cheat_sheet: FileQuestion,
  workbook: BookOpen,
}

const RESOURCE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  notes: 'Notes',
  short_notes: 'Short Notes',
  cheat_sheet: 'Cheat Sheet',
  workbook: 'Workbook',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: course } = await getPublishedCourseBySlug(slug, 'en')
  if (!course) return { title: 'Resources not found' }
  const t = course.translations[0]
  return {
    title: `${t?.title ?? slug} PDF, Notes & Cheat Sheet — Free Download`,
    description: `Download free ${t?.title ?? slug} PDF, notes, short notes, cheat sheet and workbook. Complete study materials for ${t?.title ?? slug} — free PDF download.`,
    keywords: [`${t?.title} PDF`, `${t?.title} Notes`, `${t?.title} Cheat Sheet`, `${t?.title} Short Notes`, `${t?.title} Workbook`, `${t?.title} PDF Download`],
    openGraph: {
      title: `${t?.title ?? slug} PDF, Notes & Cheat Sheet — Free Download`,
      description: `Free ${t?.title ?? slug} PDF, notes, and cheat sheet downloads.`,
      type: 'article',
    },
  }
}

export default async function CoursePdfPage({ params }: PageProps) {
  const { slug } = await params
  const { data: course } = await getPublishedCourseBySlug(slug, 'en')
  if (!course) notFound()
  const { data: resources } = await listCourseResources(course.id, 'en')
  const t = course.translations[0]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Courses', href: '/courses' },
        { label: t?.title ?? slug, href: `/courses/${slug}` },
        { label: 'Free PDF Downloads' },
      ]} />

      {/* Header */}
      <div className="mt-6 mb-8 space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {t?.title} — Free PDF, Notes & Cheat Sheet Downloads
        </h1>
        <p className="text-lg text-muted-foreground">
          Download free {t?.title} study materials including PDF tutorials, quick notes, cheat sheets, and workbooks.
        </p>
        <Button asChild size="lg">
          <Link href={`/courses/${slug}`}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Learning Online
          </Link>
        </Button>
      </div>

      {/* Free Downloads */}
      {resources && resources.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Free PDF Downloads</h2>
          <div className="grid gap-4">
            {resources.map((r: Record<string, unknown>) => {
              const trans = (r.translations as Array<Record<string, unknown>>)?.[0]
              const Icon = RESOURCE_ICONS[r.resource_type as string] ?? FileText
              return (
                <Card key={r.id as string} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base">{trans?.title as string}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{trans?.description as string}</p>
                        <div className="flex gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-xs">{RESOURCE_LABELS[r.resource_type as string] ?? r.resource_type}</Badge>
                          <Badge variant="outline" className="text-xs text-success">FREE</Badge>
                        </div>
                      </div>
                    </div>
                    <Button asChild size="sm" className="shrink-0">
                      <a href={r.file_url as string} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4 mr-1.5" />
                        Download
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : (
        <Card className="mb-10">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No free downloads available for this course yet. Check back soon!
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      {/* SEO Content */}
      {resources && resources.length > 0 && (
        <section className="mb-10 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {t?.title} Study Materials — Complete Guide
          </h2>
          {resources.map((r: Record<string, unknown>) => {
            const trans = (r.translations as Array<Record<string, unknown>>)?.[0]
            if (!trans?.seo_content) return null
            return (
              <div key={`seo-${r.id as string}`} className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold">{trans.title as string}</h3>
                <p className="text-muted-foreground leading-relaxed">{trans.seo_content as string}</p>
                {Array.isArray(trans.keywords) && (trans.keywords as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {trans.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}

      {/* FAQs */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            { q: `Are these ${t?.title} PDFs really free?`, a: `Yes! All study materials listed on this page — including ${t?.title} PDF, notes, cheat sheets, and workbooks — are completely free to download.` },
            { q: `Can I use these ${t?.title} notes for exam preparation?`, a: `Absolutely! Our ${t?.title} notes and short notes are designed for quick revision and exam preparation. They cover all essential topics in a concise format.` },
            { q: `Do you offer ${t?.title} cheat sheets with shortcuts?`, a: `Yes, we provide a comprehensive ${t?.title} cheat sheet with all keyboard shortcuts and quick actions. Download it for free above.` },
            { q: `Can I learn ${t?.title} online on this platform?`, a: `Yes! Click "Start Learning Online" above to access our free ${t?.title} course with video lessons, practice exercises, and quizzes.` },
            { q: `Are the ${t?.title} materials available in Hindi?`, a: `We are working on Hindi translations for all study materials. Use the language switcher in the header to switch to Hindi.` },
          ].map((faq, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* Start Learning CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to learn {t?.title}?</h2>
          <p className="text-muted-foreground">Access our complete {t?.title} course with structured lessons, practice exercises, and quizzes — all free!</p>
          <Button asChild size="lg">
            <Link href={`/courses/${slug}`}>
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Learning Free
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
