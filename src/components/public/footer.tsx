import Link from 'next/link'

interface FooterProps {
  lang?: 'en' | 'hi'
}

/**
 * Footer — public site footer (sticky to bottom).
 *
 * Placed at the end of the page inside a min-h-screen flex-col layout
 * so it sticks to the bottom when content is short, and pushes down
 * naturally when content is long.
 */
export function Footer({ lang = 'en' }: FooterProps) {
  const year = new Date().getFullYear()

  const sections = [
    {
      title: lang === 'hi' ? 'सीखें' : 'Learn',
      links: [
        { href: '/skills', label: lang === 'hi' ? 'सभी स्किल्स' : 'All Skills' },
        { href: '/courses', label: lang === 'hi' ? 'कोर्स' : 'Courses' },
        { href: '/books', label: lang === 'hi' ? 'किताबें' : 'Books' },
      ],
    },
    {
      title: lang === 'hi' ? 'कंपनी' : 'Company',
      links: [
        { href: '/about', label: lang === 'hi' ? 'हमारे बारे में' : 'About' },
        { href: '/contact', label: lang === 'hi' ? 'संपर्क' : 'Contact' },
      ],
    },
    {
      title: lang === 'hi' ? 'कानूनी' : 'Legal',
      links: [
        { href: '/privacy', label: lang === 'hi' ? 'गोपनीयता' : 'Privacy' },
        { href: '/terms', label: lang === 'hi' ? 'शर्तें' : 'Terms' },
      ],
    },
  ]

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="text-xl font-bold">
              Skill<span className="text-primary">Setu</span>
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
            © {year} SkillSetu. {lang === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === 'hi' ? 'सीखें → अभ्यास → परीक्षण → प्रगति' : 'Discover → Learn → Practice → Test → Track'}
          </p>
        </div>
      </div>
    </footer>
  )
}
