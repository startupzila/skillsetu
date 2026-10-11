import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserCircle, Mail, Calendar, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
}

export default async function ProfilePage() {
  const session = await getSession().catch(() => null)
  if (!session) redirect('/login?redirect=/profile')

  const profile = session.profile
  const displayName = profile?.display_name || session.user.email?.split('@')[0] || 'User'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Profile</h1>

      {/* Profile header card */}
      <Card className="mb-6">
        <CardContent className="py-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCircle className="h-4 w-4" />
              Display Name
            </div>
            <span className="text-sm font-medium">{displayName}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <span className="text-sm font-medium">{session.user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Roles
            </div>
            <div className="flex gap-1">
              {session.roles.length > 0 ? (
                session.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs capitalize">{role.replace('_', ' ')}</Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs">Learner</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
