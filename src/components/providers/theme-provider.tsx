'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

/**
 * ThemeProvider — enables light/dark mode via next-themes.
 * Wraps the app in layout.tsx. Stores preference in a cookie
 * so SSR renders with the correct theme (no flash).
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
