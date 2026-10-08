import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Info,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  NotebookPen,
  PlayCircle,
} from 'lucide-react'

// ── Shared block data types ─────────────────────────────────
type BlockData = Record<string, unknown>

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

// ═══════════════════════════════════════════════════════════
// HEADING
// ═══════════════════════════════════════════════════════════
export function HeadingBlock({ data }: { data: BlockData }) {
  const level = Number(data.level ?? 2)
  const text = asString(data.text)
  const Tag = (`h${Math.min(Math.max(level, 1), 6)}`) as keyof JSX.IntrinsicElements
  const sizes: Record<number, string> = {
    1: 'text-3xl font-bold mt-8',
    2: 'text-2xl font-semibold mt-8',
    3: 'text-xl font-semibold mt-6',
    4: 'text-lg font-semibold mt-4',
    5: 'text-base font-semibold mt-4',
    6: 'text-sm font-semibold mt-4',
  }
  return <Tag className={cn(sizes[level] ?? sizes[2], 'scroll-mt-20')}>{text}</Tag>
}

// ═══════════════════════════════════════════════════════════
// PARAGRAPH
// ═══════════════════════════════════════════════════════════
export function ParagraphBlock({ data }: { data: BlockData }) {
  const text = asString(data.text)
  return <p className="text-base leading-relaxed text-foreground/90">{text}</p>
}

// ═══════════════════════════════════════════════════════════
// IMAGE
// ═══════════════════════════════════════════════════════════
export function ImageBlock({ data }: { data: BlockData }) {
  const src = asString(data.src || data.url)
  const alt = asString(data.alt)
  const caption = asString(data.caption)
  if (!src) return null
  return (
    <figure className="space-y-2">
      <img
        src={src}
        alt={alt}
        className="rounded-lg border w-full"
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

// ═══════════════════════════════════════════════════════════
// CALLOUT
// ═══════════════════════════════════════════════════════════
const CALLOUT_STYLES = {
  info: { icon: Info, className: 'border-primary/30 bg-primary/5' },
  tip: { icon: Lightbulb, className: 'border-success/30 bg-success/5' },
  warning: { icon: AlertTriangle, className: 'border-warning/30 bg-warning/5' },
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success/5' },
  summary: { icon: NotebookPen, className: 'border-primary/30 bg-primary/5' },
} as const

export function CalloutBlock({ data }: { data: BlockData }) {
  const variant = (asString(data.variant) || 'info') as keyof typeof CALLOUT_STYLES
  const style = CALLOUT_STYLES[variant] ?? CALLOUT_STYLES.info
  const Icon = style.icon
  const title = asString(data.title)
  const text = asString(data.text)

  return (
    <div className={cn('rounded-lg border p-4 flex gap-3', style.className)}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5 text-foreground/70" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {text && <p className="text-sm text-foreground/80">{text}</p>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CODE
// ═══════════════════════════════════════════════════════════
export function CodeBlock({ data }: { data: BlockData }) {
  const code = asString(data.code)
  const language = asString(data.language)
  return (
    <div className="rounded-lg border bg-muted/50 overflow-hidden">
      {language && (
        <div className="px-4 py-1.5 border-b bg-muted text-xs font-mono text-muted-foreground uppercase">
          {language}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════
export function TableBlock({ data }: { data: BlockData }) {
  const headers = asStringArray(data.headers)
  const rowsRaw = Array.isArray(data.rows) ? data.rows : []
  const rows = rowsRaw.map((row) =>
    Array.isArray(row) ? row.filter((c): c is string => typeof c === 'string') : [],
  )

  if (headers.length === 0) return null

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold border-b">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// QUOTE
// ═══════════════════════════════════════════════════════════
export function QuoteBlock({ data }: { data: BlockData }) {
  const text = asString(data.text)
  const author = asString(data.author)
  return (
    <blockquote className="border-l-4 border-primary pl-4 py-1">
      <p className="text-base italic text-foreground/90">&ldquo;{text}&rdquo;</p>
      {author && (
        <footer className="text-sm text-muted-foreground mt-1">— {author}</footer>
      )}
    </blockquote>
  )
}

// ═══════════════════════════════════════════════════════════
// CHECKLIST
// ═══════════════════════════════════════════════════════════
export function ChecklistBlock({ data }: { data: BlockData }) {
  const items = asStringArray(data.items)
  if (items.length === 0) return null
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-muted-foreground/30">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
          </span>
          <span className="text-sm text-foreground/90">{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE
// ═══════════════════════════════════════════════════════════
export function ExampleBlock({ data }: { data: BlockData }) {
  const title = asString(data.title) || 'Example'
  const text = asString(data.text)
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
        {title}
      </p>
      <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// RELATED CONTENT
// ═══════════════════════════════════════════════════════════
export function RelatedContentBlock({ data }: { data: BlockData }) {
  const title = asString(data.title) || 'Related'
  const itemsRaw = Array.isArray(data.items) ? data.items : []
  const items = itemsRaw.map((it) => {
    if (typeof it === 'object' && it !== null) {
      const obj = it as Record<string, unknown>
      return { title: asString(obj.title), url: asString(obj.url) }
    }
    return null
  }).filter(Boolean) as { title: string; url: string }[]

  if (items.length === 0) return null
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i}>
            <Link
              href={item.url}
              className="text-sm text-primary hover:underline flex items-center gap-1.5"
            >
              → {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// QUIZ (placeholder — full quiz UI in S8)
// ═══════════════════════════════════════════════════════════
export function QuizBlock({ data }: { data: BlockData }) {
  const quizSlug = asString(data.quiz_slug || data.quizSlug)
  const title = asString(data.title) || 'Quick Check'
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
      <p className="text-sm font-semibold flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        {title}
      </p>
      <p className="text-sm text-muted-foreground">
        Test your understanding with a quick quiz.
      </p>
      {quizSlug && (
        <Link
          href={`/quiz/${quizSlug}`}
          className="text-sm text-primary hover:underline font-medium"
        >
          Start quiz →
        </Link>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// VIDEO (feature-flagged placeholder — full video in S11)
// ═══════════════════════════════════════════════════════════
export function VideoBlock({ data }: { data: BlockData }) {
  const title = asString(data.title) || 'Video Lesson'
  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center space-y-2">
      <div className="inline-flex rounded-full bg-muted p-3">
        <PlayCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">
        Video lessons coming soon.
      </p>
    </div>
  )
}
