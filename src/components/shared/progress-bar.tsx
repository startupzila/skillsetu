import { cn } from '@/lib/utils'

/**
 * ProgressBar — visual progress indicator (0–100%).
 *
 * Accessible: uses role="progressbar" with aria-valuenow.
 */
interface ProgressBarProps {
  value: number // 0-100
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ProgressBar({
  value,
  className,
  size = 'md',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn('w-full overflow-hidden rounded-full bg-muted', heights[size])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-all duration-500',
            clamped === 100 && 'bg-success',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-muted-foreground text-right">{clamped}%</p>
      )}
    </div>
  )
}
