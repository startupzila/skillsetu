import { headers } from 'next/headers'
import { Header } from '@/components/public/header'
import Footer from '@/components/public/footer'
import { getSession } from '@/lib/auth'

/**
 * Public layout — wraps all public-facing pages with the shared
 * Header + Footer (sticky). Uses min-h-screen flex flex-col so the
 * footer sticks to the bottom when content is short.
 *
 * Reads the language preference from a cookie (set by LanguageSwitcher).
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession().catch(() => null)

  // Read language from cookie
  const headerList = await headers()
  const cookie = headerList.get('cookie') ?? ''
  const langMatch = cookie.match(/skillsetu-lang=(en|hi)/)
  const lang = (langMatch?.[1] as 'en' | 'hi') ?? 'en'

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} lang={lang} />
      <div className="flex-1">{children}</div>
      <Footer lang={lang} />
    </div>
  )
}
