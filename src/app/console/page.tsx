import Link from 'next/link'
import { getSession, hasPermission } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Console dashboard (S4).
 *
 * Shows the signed-in user's roles + permissions and placeholder cards
 * for the modules that will be built in S9–S15. This confirms the auth
 * + RBAC pipeline works end-to-end.
 */
export default async function ConsoleDashboard() {
  const session = await getSession()

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.profile?.display_name || session?.user.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{session?.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified</span>
              <Badge variant={session?.user.emailConfirmed ? 'default' : 'secondary'}>
                {session?.user.emailConfirmed ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {session?.user.id.slice(0, 8)}…
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {session?.roles && session.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {session.roles.map((role) => (
                  <Badge key={role} variant="default">
                    {role}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No roles assigned. Contact an administrator.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Courses', href: '/console/courses', perm: 'course.read' },
            { label: 'Lessons', href: '/console/lessons', perm: 'lesson.create' },
            { label: 'Questions', href: '/console/questions', perm: 'question.create' },
            { label: 'Users', href: '/console/users', perm: 'users.manage' },
            { label: 'Media', href: '/console/media', perm: 'settings.manage' },
            { label: 'Settings', href: '/console/settings', perm: 'settings.manage' },
          ].map((mod) => {
            const allowed = hasPermission(session, mod.perm)
            return (
              <div
                key={mod.label}
                className={`rounded-lg border p-3 ${
                  allowed ? 'hover:bg-accent' : 'opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{mod.label}</span>
                  {!allowed && (
                    <Badge variant="secondary" className="text-xs">
                      No access
                    </Badge>
                  )}
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 text-xs"
                >
                  <Link href={mod.href}>Open</Link>
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions ({session?.permissions.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {session?.permissions.includes('*') ? (
            <Badge variant="default">All permissions (super_admin)</Badge>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {session?.permissions.map((p) => (
                <code key={p} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {p}
                </code>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
