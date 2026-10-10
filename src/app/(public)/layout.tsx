import { Header } from '@/components/public/header'
import Footer from '@/components/public/footer'
import { getSession } from '@/lib/auth'
import { getLocale } from '@/lib/i18n/locale'

/**
 * Public layout — wraps all public-facing pages with the shared
 * Header + Footer (sticky). Uses min-h-screen flex flex-col so the
 * footer sticks to the bottom when content is short.
 *
 * The locale is detected from the URL via the middleware-set `x-locale`
 * header: `/hi/*` → 'hi', everything else → 'en'.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession().catch(() => null)
  const lang = await getLocale()

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} lang={lang} />
      <div className="flex-1">{children}</div>
      <Footer lang={lang} />
    </div>
  )
}
