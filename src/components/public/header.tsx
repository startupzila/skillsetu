'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { SearchBox } from './search-box'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'
import type { AuthSession } from '@/lib/auth'

interface HeaderProps {
  session: AuthSession | null
  lang?: 'en' | 'hi'
}

/**
 * Header — public site header.
 *
 * Responsive: full nav on desktop, hamburger sheet on mobile.
 * Shows: logo, nav links, search, language switcher, theme toggle,
 * auth buttons (Sign in/up) or user actions (Dashboard, Console, Sign out).
 */
export function Header({ session, lang = 'en' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/skills', label: lang === 'hi' ? 'स्किल्स' : 'Skills' },
    { href: '/courses', label: lang === 'hi' ? 'कोर्स' : 'Courses' },
    { href: '/centres', label: lang === 'hi' ? 'सेंटर' : 'Centres' },
    { href: '/books', label: lang === 'hi' ? 'किताबें' : 'Books' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold tracking-tight text-primary">
              Mio<span className="text-foreground">Demy</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: search + actions */}
          <div className="hidden md:flex items-center gap-2">
            <SearchBox className="hidden lg:block" />
            <LanguageSwitcher current={lang} />
            <ThemeToggle />
            {session ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/console">Console</Link>
                </Button>
                <form action="/api/auth/logout" method="post">
                  <Button type="submit" size="sm">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <LanguageSwitcher current={lang} />
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-center justify-between pr-8">
                    <span className="font-bold text-lg">
                      Mio<span className="text-primary">Demy</span>
                    </span>
                  </div>

                  {/* Mobile search */}
                  <SearchBox className="w-full" />

                  {/* Mobile nav links */}
                  <nav className="flex flex-col gap-1">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className="px-3 py-2.5 text-sm font-medium hover:bg-accent rounded-md"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>

                  {/* Mobile auth */}
                  <div className="border-t pt-4 flex flex-col gap-2">
                    {session ? (
                      <>
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard">Dashboard</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/console">Console</Link>
                          </Button>
                        </SheetClose>
                        <form action="/api/auth/logout" method="post">
                          <Button type="submit" className="w-full">
                            Sign out
                          </Button>
                        </form>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/login">Sign in</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild className="w-full">
                            <Link href="/register">Sign up</Link>
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
