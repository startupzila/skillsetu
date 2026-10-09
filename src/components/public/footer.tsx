import Link from 'next/link'
import { listFooterPages } from '@/lib/content/pages-service'

interface FooterProps {
  lang?: 'en' | 'hi'
}

/**
 * Footer — public site footer (sticky to bottom).
 *
 * Fetches CMS-managed pages (about, privacy, terms, etc.) from the
 * `static_pages` table for the "Company" and "Legal" sections.
 */
export default async function Footer({ lang = 'en' }: FooterProps) {
  const year = new Date().getFullYear()
  const footerPages = await listFooterPages(lang)

  // Split pages into company/legal based on slug
  const companyPages = footerPages.filter((p) =>
    ['about', 'contact'].includes(p.slug),
  )
  const legalPages = footerPages.filter((p) =>
    !['about', 'contact'].includes(p.slug),
  )

  const sections = [
    {
      title: lang === 'hi' ? 'सीखें' : 'Learn',
      links: [
        { href: '/skills', label: lang === 'hi' ? 'सभी स्किल्स' : 'All Skills' },
        { href: '/courses', label: lang === 'hi' ? 'कोर्स' : 'Courses' },
        { href: '/pdf-store', label: lang === 'hi' ? 'PDF स्टोर' : 'PDF Store' },
        { href: '/centres', label: lang === 'hi' ? 'सेंटर' : 'Centres' },
        { href: '/books', label: lang === 'hi' ? 'किताबें' : 'Books' },
      ],
    },
    {
      title: lang === 'hi' ? 'कंपनी' : 'Company',
      links: companyPages.map((p) => ({ href: `/${p.slug}`, label: p.title })),
    },
    {
      title: lang === 'hi' ? 'कानूनी' : 'Legal',
      links: legalPages.map((p) => ({ href: `/${p.slug}`, label: p.title })),
    },
  ]

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="text-xl font-bold">
              Mio<span className="text-primary">Demy</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {lang === 'hi'
                ? 'अपनी भाषा में व्यावहारिक स्किल्स सीखें।'
                : 'Learn practical skills in your language.'}
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
            © {year} MioDemy. {lang === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === 'hi' ? 'सीखें → अभ्यास → परीक्षण → प्रगति' : 'Discover → Learn → Practice → Test → Track'}
          </p>
        </div>
      </div>
    </footer>
  )
}
