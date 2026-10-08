import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ContentStatus, TranslationStatus } from '@/lib/content/types'

/**
 * StatusBadge — renders a content/translation status as a colored badge.
 *
 * Maps status → variant:
 *   draft         → secondary (gray)
 *   in_review     → warning (amber)
 *   scheduled     → outline
 *   published     → success (green)
 *   archived      → muted
 *   needs_update  → destructive
 */
interface StatusBadgeProps {
  status: ContentStatus | TranslationStatus | string
  className?: string
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  draft: 'secondary',
  in_review: 'warning',
  in_translation: 'warning',
  scheduled: 'outline',
  published: 'success',
  archived: 'secondary',
  needs_update: 'destructive',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  in_translation: 'Translating',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
  needs_update: 'Needs Update',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANT[status] ?? 'secondary'
  const label = STATUS_LABEL[status] ?? status

  // Map 'success' and 'warning' to valid Badge variants
  const badgeVariant =
    variant === 'success' || variant === 'warning'
      ? 'default'
      : variant

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        'text-xs capitalize',
        variant === 'success' && 'bg-success text-success-foreground hover:bg-success/80',
        variant === 'warning' && 'bg-warning text-warning-foreground hover:bg-warning/80',
        className,
      )}
    >
      {label}
    </Badge>
  )
}
