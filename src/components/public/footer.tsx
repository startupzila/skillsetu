import Link from 'next/link'
import { listFooterPages } from '@/lib/content/pages-service'
import { safeFetchOr } from '@/lib/safe-fetch'
import { t as tt, type Lang } from '@/lib/i18n/dictionary'
import { localePath } from '@/lib/i18n/locale-path'

interface FooterProps {
  lang?: 'en' | 'hi'
}

/**
 * Footer — public site footer (sticky to bottom).
 *
 * Fetches CMS-managed pages (about, privacy, terms, etc.) from the
 * `static_pages` table for the "Company" and "Legal" sections.
 * Degrades gracefully to an empty list if the backing store is
 * unavailable so it never crashes the whole page.
 */
export default async function Footer({ lang = 'en' }: FooterProps) {
  const year = new Date().getFullYear()
  const footerPages = await safeFetchOr(() => listFooterPages(lang), [])

  // Split pages into company/legal based on slug
  const companyPages = footerPages.filter((p) =>
    ['about', 'contact'].includes(p.slug),
  )
  const legalPages = footerPages.filter((p) =>
    !['about', 'contact'].includes(p.slug),
  )

  const sections = [
    {
      title: tt(lang, 'footer.learn'),
      links: [
        { href: localePath(lang, '/courses'), label: tt(lang, 'nav.courses') },
        { href: localePath(lang, '/quizzes'), label: lang === 'hi' ? 'क्विज़' : 'Quizzes' },
        { href: localePath(lang, '/mock-tests'), label: lang === 'hi' ? 'मॉक टेस्ट' : 'Mock Tests' },
        { href: localePath(lang, '/skills'), label: tt(lang, 'footer.allSkills') },
        { href: localePath(lang, '/pdf-store'), label: tt(lang, 'nav.pdfStore') },
        { href: localePath(lang, '/centres'), label: tt(lang, 'nav.centres') },
        { href: localePath(lang, '/centres/directory'), label: lang === 'hi' ? 'सेंटर डायरेक्टरी' : 'Centres Directory' },
        { href: localePath(lang, '/books'), label: tt(lang, 'nav.books') },
      ],
    },
    {
      title: tt(lang, 'footer.company'),
      links: companyPages.map((p) => ({ href: localePath(lang, `/${p.slug}`), label: p.title })),
    },
    {
      title: tt(lang, 'footer.legal'),
      links: legalPages.map((p) => ({ href: localePath(lang, `/${p.slug}`), label: p.title })),
    },
  ]

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href={localePath(lang, '/')} className="text-xl font-bold">
              Mio<span className="text-primary">Demy</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {tt(lang, 'footer.tagline')}
            </p>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {year} MioDemy. {tt(lang, 'footer.rights')}
          </p>
          <p className="text-xs text-muted-foreground">
            {tt(lang, 'footer.flow')}
          </p>
        </div>
      </div>
    </footer>
  )
}
