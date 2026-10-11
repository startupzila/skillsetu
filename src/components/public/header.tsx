'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, User, LogOut, LayoutDashboard, Settings as SettingsIcon, UserCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchBox } from './search-box'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'
import { t as tt, type Lang } from '@/lib/i18n/dictionary'
import { localePath } from '@/lib/i18n/locale-path'
import type { AuthSession } from '@/lib/auth'

interface HeaderProps {
  session: AuthSession | null
  lang?: 'en' | 'hi'
}

// Staff roles that should see the "Console" link
const STAFF_ROLES = ['super_admin', 'admin', 'editorial_manager', 'content_writer', 'reviewer', 'translator', 'quiz_editor', 'commerce_manager', 'marketing_manager', 'analyst', 'media_manager']

/** Check if the user has a console-accessible role (inline — avoids importing server-only modules). */
function isStaff(session: AuthSession | null): boolean {
  if (!session) return false
  return session.roles.some((r) => STAFF_ROLES.includes(r))
}

/**
 * Header — public site header.
 *
 * Desktop: logo, nav links (Courses, Quiz, Mock Test, Skills, Centres, PDF),
 * search, language switcher, theme toggle, and a user icon dropdown (when logged in)
 * or Sign in/up buttons (when logged out).
 *
 * Mobile: hamburger sheet containing nav links + auth actions (no separate user icon).
 *
 * Staff users (admins, writers) see a "Console" link in the user dropdown;
 * regular learners do not.
 */
export function Header({ session, lang = 'en' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const hi = lang === 'hi'
  const staff = isStaff(session)
  const displayName = session?.profile?.display_name || session?.user?.email?.split('@')[0] || 'User'
  const email = session?.user?.email ?? ''
  const initials = displayName.charAt(0).toUpperCase()

  const navLinks = [
    { href: localePath(lang, '/courses'), label: tt(lang, 'nav.courses') },
    { href: localePath(lang, '/quizzes'), label: hi ? 'क्विज़' : 'Quiz' },
    { href: localePath(lang, '/mock-tests'), label: hi ? 'मॉक टेस्ट' : 'Mock Test' },
    { href: localePath(lang, '/skills'), label: tt(lang, 'nav.skills') },
    { href: localePath(lang, '/centres'), label: tt(lang, 'nav.centres') },
    { href: localePath(lang, '/pdf-store'), label: hi ? 'PDF' : 'PDF' },
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>{hi ? 'डैशबोर्ड' : 'Dashboard'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>{hi ? 'प्रोफ़ाइल' : 'Profile'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>{hi ? 'सेटिंग्स' : 'Settings'}</span>
                    </Link>
                  </DropdownMenuItem>
                  {staff && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/console" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>{hi ? 'कंसोल' : 'Console'}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/api/auth/logout" method="post" className="w-full">
                      <button type="submit" className="flex w-full items-center cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{hi ? 'साइन आउट' : 'Sign out'}</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{tt(lang, 'auth.signIn')}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{tt(lang, 'auth.signUp')}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: hamburger — contains EVERYTHING including auth */}
          <div className="flex md:hidden items-center gap-1">
            <LanguageSwitcher current={lang} />
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
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

                  {/* Mobile auth — all in the hamburger, no separate user icon */}
                  <div className="border-t pt-4 flex flex-col gap-2">
                    {session ? (
                      <>
                        {/* User info header */}
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted/50">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{email}</p>
                          </div>
                        </div>
                        <SheetClose asChild>
                          <Button asChild variant="outline" size="sm" className="w-full justify-start">
                            <Link href="/dashboard">
                              <LayoutDashboard className="h-4 w-4 mr-2" />
                              {hi ? 'डैशबोर्ड' : 'Dashboard'}
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="outline" size="sm" className="w-full justify-start">
                            <Link href="/profile">
                              <UserCircle className="h-4 w-4 mr-2" />
                              {hi ? 'प्रोफ़ाइल' : 'Profile'}
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="outline" size="sm" className="w-full justify-start">
                            <Link href="/settings">
                              <SettingsIcon className="h-4 w-4 mr-2" />
                              {hi ? 'सेटिंग्स' : 'Settings'}
                            </Link>
                          </Button>
                        </SheetClose>
                        {staff && (
                          <SheetClose asChild>
                            <Button asChild variant="outline" size="sm" className="w-full justify-start">
                              <Link href="/console">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                {hi ? 'कंसोल' : 'Console'}
                              </Link>
                            </Button>
                          </SheetClose>
                        )}
                        <form action="/api/auth/logout" method="post">
                          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                            <LogOut className="h-4 w-4 mr-2" />
                            {hi ? 'साइन आउट' : 'Sign out'}
                          </Button>
                        </form>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/login">{tt(lang, 'auth.signIn')}</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild className="w-full">
                            <Link href="/register">{tt(lang, 'auth.signUp')}</Link>
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
