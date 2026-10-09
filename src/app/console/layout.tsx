import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, isStaff, AuthError } from '@/lib/auth'
import { Button } from '@/components/ui/button'

/**
 * Console layout — protects all /console/* routes.
 *
 * Auth check: requires an authenticated session. Role-based checks
 * happen in individual console pages / route handlers via
 * requirePermission() / requireRole().
 *
 * If the user is authenticated but has no staff role, they see a
 * "no access" message instead of being redirected in a loop.
 */
export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session
  try {
    session = await getSession()
  } catch (err) {
    if (err instanceof AuthError && err.code === 'UNAUTHENTICATED') {
      redirect('/login?redirect=/console')
    }
    throw err
  }

  if (!session) {
    redirect('/login?redirect=/console')
  }

  // Show "no access" if the user has no staff role
  if (!isStaff(session)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">No access</h1>
          <p className="text-muted-foreground">
            Your account doesn&apos;t have permission to access the console.
            If you believe this is an error, please contact an administrator.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="ghost">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Console header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/console" className="font-bold tracking-tight">
              MioDemy <span className="text-muted-foreground font-normal">Console</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/console" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                View site
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {session.profile?.display_name || session.user.email}
            </span>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" size="sm" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Console body */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-60 border-r bg-muted/30 p-4">
          <nav className="space-y-1 text-sm">
            <Link
              href="/console"
              className="block px-3 py-2 rounded-md hover:bg-accent text-foreground font-medium"
            >
              Dashboard
            </Link>
            <div className="pt-4 pb-2 px-3 text-xs font-medium text-muted-foreground uppercase">
              Content
            </div>
            <Link
              href="/console/courses"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Courses
            </Link>
            <Link
              href="/console/lessons"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Lessons
            </Link>
            <Link
              href="/console/questions"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Questions
            </Link>
            <Link
              href="/console/media"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Media
            </Link>
            <Link
              href="/console/categories"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Categories
            </Link>
            <Link
              href="/console/templates"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Templates
            </Link>
            <Link
              href="/console/qa"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              QA Checklist
            </Link>
            <Link
              href="/console/pages"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Pages
            </Link>
            <div className="pt-4 pb-2 px-3 text-xs font-medium text-muted-foreground uppercase">
              Commerce
            </div>
            <Link
              href="/console/products"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Products
            </Link>
            <Link
              href="/console/orders"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Orders
            </Link>
            <Link
              href="/console/coupons"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Coupons
            </Link>
            <Link
              href="/console/centres"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Centres
            </Link>
            <Link
              href="/console/jurisdictions"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Jurisdictions
            </Link>
            <div className="pt-4 pb-2 px-3 text-xs font-medium text-muted-foreground uppercase">
              Marketing
            </div>
            <Link
              href="/console/affiliates"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Affiliates
            </Link>
            <Link
              href="/console/ads"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Ads
            </Link>
            <div className="pt-4 pb-2 px-3 text-xs font-medium text-muted-foreground uppercase">
              SEO
            </div>
            <Link
              href="/console/redirects"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Redirects
            </Link>
            <Link
              href="/console/custom-code"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Custom Code
            </Link>
            <div className="pt-4 pb-2 px-3 text-xs font-medium text-muted-foreground uppercase">
              System
            </div>
            <Link
              href="/console/analytics"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Analytics
            </Link>
            <Link
              href="/console/users"
              className="block px-3 py-2 rounded-md hover:bg-accent text-muted-foreground"
            >
              Users
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
