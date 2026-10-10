import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/public/breadcrumbs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, BookOpen } from 'lucide-react'
import { PdfStoreBrowser } from '@/components/shared/pdf-store-browser'

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

  const filtered = (resources ?? []).filter((r: Record<string, unknown>) => {
    const trans = r.translations as Array<Record<string, unknown>>
    return trans?.some((t) => t.language_code === 'en')
  }).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    resource_type: r.resource_type as string,
    file_url: r.file_url as string,
    title: (r.translations as Array<Record<string, unknown>>)?.find((t) => t.language_code === 'en')?.title as string,
    description: (r.translations as Array<Record<string, unknown>>)?.find((t) => t.language_code === 'en')?.description as string | null,
    course_title: (r.course as Record<string, unknown>)?.translations?.find?.((t: Record<string, unknown>) => t.language_code === 'en')?.title ?? (r.course as Record<string, unknown>)?.slug,
    course_slug: (r.course as Record<string, unknown>)?.slug as string,
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

      <PdfStoreBrowser resources={filtered} />

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
