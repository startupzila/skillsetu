import { Header } from '@/components/public/header'
import Footer from '@/components/public/footer'
import { getSessionFast } from '@/lib/auth/session-fast'
import { getLocale } from '@/lib/i18n/locale'

/**
 * Public layout — wraps all public-facing pages with the shared
 * Header + Footer (sticky). Uses min-h-screen flex flex-col so the
 * footer sticks to the bottom when content is short.
 *
 * Uses getSessionFast() (2 parallel DB calls instead of 5 sequential)
 * for better page load speed on public pages.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionFast().catch(() => null)
  const lang = await getLocale()

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} lang={lang} />
      <div className="flex-1">{children}</div>
      <Footer lang={lang} />
    </div>
  )
}
