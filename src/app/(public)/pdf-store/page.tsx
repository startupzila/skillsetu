import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, BookOpen, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free PDF Downloads — Excel, Tally, PowerPoint Notes & Cheat Sheets | MioDemy',
  description: 'Download free PDF tutorials, notes, cheat sheets and workbooks for Excel, Tally, PowerPoint, Word, Digital Marketing and more. Free study materials for all skill courses.',
  keywords: ['free PDF download', 'Excel PDF', 'Tally PDF', 'PowerPoint PDF', 'Excel notes', 'PowerPoint cheat sheet', 'free study materials', 'course PDF download'],
}

const RESOURCE_LABELS: Record<string, string> = {
  pdf: 'PDF', notes: 'Notes', short_notes: 'Short Notes', cheat_sheet: 'Cheat Sheet', workbook: 'Workbook',
}

export default async function PdfStorePage() {
  const supabase = await createServerSupabaseClient()
  const { data: resources } = await supabase
    .from('course_resources')
    .select(`
      id, resource_type, file_url, sort_order,
      course:courses(id, slug, translations:course_translations(title, language_code)),
      translations:course_resource_translations(title, description, language_code)
    `)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  // Filter to EN translations only
  const filtered = (resources ?? []).filter((r: Record<string, unknown>) => {
    const trans = r.translations as Array<Record<string, unknown>>
    return trans?.some((t) => t.language_code === 'en')
  }).map((r: Record<string, unknown>) => ({
    ...r,
    title: (r.translations as Array<Record<string, unknown>>)?.find((t) => t.language_code === 'en')?.title,
    description: (r.translations as Array<Record<string, unknown>>)?.find((t) => t.language_code === 'en')?.description,
    course_title: (r.course as Record<string, unknown>)?.translations?.find?.((t: Record<string, unknown>) => t.language_code === 'en')?.title ?? (r.course as Record<string, unknown>)?.slug,
    course_slug: (r.course as Record<string, unknown>)?.slug,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'PDF Store' }]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Free PDF Downloads</h1>
        <p className="text-muted-foreground mt-2">
          Download free PDF tutorials, notes, cheat sheets and workbooks for all our courses.
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r: Record<string, unknown>) => (
            <Card key={r.id as string} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base line-clamp-2">{r.title as string}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">{RESOURCE_LABELS[r.resource_type as string] ?? r.resource_type}</Badge>
                  </div>
                </div>
                {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description as string}</p>}
                <div className="flex items-center justify-between pt-1">
                  <Link href={`/courses/${r.course_slug}/pdf`} className="text-xs text-muted-foreground hover:text-primary">
                    <BookOpen className="h-3 w-3 inline mr-1" />
                    {r.course_title as string}
                  </Link>
                  <Button asChild size="sm">
                    <a href={r.file_url as string} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-1.5" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No PDFs available yet. Check back soon!
        </CardContent></Card>
      )}

      {/* SEO Content */}
      <div className="mt-12 prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Free Course PDFs, Notes & Cheat Sheets</h2>
        <p>At MioDemy, we believe learning should be accessible to everyone. That&apos;s why we offer free PDF downloads for all our courses — including Excel PDF tutorials, Tally notes, PowerPoint cheat sheets, Word short notes, Digital Marketing workbooks, and more. Whether you&apos;re preparing for an exam, need quick reference material, or want to learn offline, our free PDFs have you covered.</p>
        <h3 className="text-lg font-semibold text-foreground mt-4">Available Downloads</h3>
        <p>Browse our collection of free PDFs by course: Excel PDF and notes, PowerPoint PDF and cheat sheet, Word tutorial PDF, Tally notes, Digital Marketing study materials, and more. Each download is completely free — no signup required for most materials.</p>
      </div>
    </div>
  )
}
