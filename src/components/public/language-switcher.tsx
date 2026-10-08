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
 * LanguageSwitcher — switches between EN and HI.
 *
 * Uses a cookie (`skillsetu-lang`) so server components can read the
 * preferred language. The current path is preserved (no redirect).
 */
export function LanguageSwitcher({ current = 'en' }: { current?: 'en' | 'hi' }) {
  const router = useRouter()
  const pathname = usePathname()

  function switchLang(lang: 'en' | 'hi') {
    document.cookie = `skillsetu-lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    router.refresh()
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
