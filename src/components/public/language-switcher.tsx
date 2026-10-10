'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * LanguageSwitcher — switches between EN and HI by navigating to the
 * localized URL.
 *
 * English is the default (no prefix): `/courses/foo`
 * Hindi gets a `/hi` prefix: `/hi/courses/foo`
 *
 * Also sets the `miodemy-lang` cookie for preference persistence.
 */
export function LanguageSwitcher({ current = 'en' }: { current?: 'en' | 'hi' }) {
  const router = useRouter()
  const pathname = usePathname()

  function switchLang(lang: 'en' | 'hi') {
    // Set cookie for preference persistence
    document.cookie = `miodemy-lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`

    // Compute the new path: strip existing /hi prefix, then add if switching to hi
    let newPath = pathname
    if (newPath === '/hi' || newPath.startsWith('/hi/')) {
      newPath = newPath.slice(3) || '/'
    }
    if (lang === 'hi') {
      newPath = `/hi${newPath}`
    }

    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Globe className="h-4 w-4" />
          <span className="uppercase text-xs font-medium">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLang('en')}>
          <span className="flex items-center gap-2">
            <span className="text-base">🇬🇧</span> English
            {current === 'en' && <span className="ml-auto text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLang('hi')}>
          <span className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span> हिन्दी
            {current === 'hi' && <span className="ml-auto text-primary">✓</span>}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
