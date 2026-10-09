import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { CategoriesManager } from '@/components/console/categories-manager'

export const metadata: Metadata = { title: 'Categories — Console' }

export default async function ConsoleCategoriesPage() {
  await requirePermission('settings.manage')
  const admin = createAdminClient()
  const { data: categories, error } = await admin
    .from('categories')
    .select(`id, slug, sort_order, status, created_at,
       translations:category_translations(language_code, name, description, status)`)
    .order('sort_order', { ascending: true })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Skill Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage course categories (taxonomy).</p>
      </div>
      {error && <Card><CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent></Card>}
      <CategoriesManager initialCategories={categories ?? []} />
    </div>
  )
}
