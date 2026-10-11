import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, Bell, Moon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings',
  robots: { index: false, follow: false },
}

export default async function SettingsPage() {
  const session = await getSession().catch(() => null)
  if (!session) redirect('/login?redirect=/settings')

  const preferredLang = session.profile?.preferred_language ?? 'en'

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language Preference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="lang">Preferred language for content</Label>
          <Select defaultValue={preferredLang}>
            <SelectTrigger id="lang" className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Content will be shown in this language when available.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Course updates</Label>
              <p className="text-xs text-muted-foreground">Get notified when new lessons are added</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Quiz results</Label>
              <p className="text-xs text-muted-foreground">Save your quiz attempts and scores</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Theme</Label>
          <p className="text-xs text-muted-foreground">
            Use the theme toggle in the header to switch between light and dark mode.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
