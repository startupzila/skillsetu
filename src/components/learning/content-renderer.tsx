import { cn } from '@/lib/utils'
import type { LessonBlock } from '@/lib/content/types'
import {
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  CalloutBlock,
  CodeBlock as CodeBlockData,
  TableBlock,
  QuoteBlock,
  ChecklistBlock,
  ExampleBlock,
  RelatedContentBlock,
  QuizBlock,
  VideoBlock,
} from './blocks'

/**
 * ContentRenderer — renders structured lesson content blocks.
 *
 * A lesson is composed of ordered blocks, each with a `block_type`
 * and validated `data` JSON. This component maps each block type
 * to its renderer. Unknown block types render a fallback.
 *
 * Block types (MVP): heading, paragraph, image, callout, code,
 * table, quote, checklist, example, related_content, quiz, video.
 *
 * @see prisma/schema.prisma (LessonBlock model)
 */
interface ContentRendererProps {
  blocks: LessonBlock[]
  className?: string
}

export function ContentRenderer({ blocks, className }: ContentRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <p className="text-muted-foreground italic">
        This lesson has no content yet.
      </p>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {blocks.map((block) => {
        const data = block.data as Record<string, unknown>
        switch (block.block_type) {
          case 'heading':
            return <HeadingBlock key={block.id} data={data} />
          case 'paragraph':
            return <ParagraphBlock key={block.id} data={data} />
          case 'image':
            return <ImageBlock key={block.id} data={data} />
          case 'callout':
            return <CalloutBlock key={block.id} data={data} />
          case 'code':
            return <CodeBlockData key={block.id} data={data} />
          case 'table':
            return <TableBlock key={block.id} data={data} />
          case 'quote':
            return <QuoteBlock key={block.id} data={data} />
          case 'checklist':
            return <ChecklistBlock key={block.id} data={data} />
          case 'example':
            return <ExampleBlock key={block.id} data={data} />
          case 'related_content':
            return <RelatedContentBlock key={block.id} data={data} />
          case 'quiz':
            return <QuizBlock key={block.id} data={data} />
          case 'video':
            return <VideoBlock key={block.id} data={data} />
          default:
            return (
              <div
                key={block.id}
                className="rounded-md border border-dashed p-4 text-sm text-muted-foreground"
              >
                Unknown block type: <code>{block.block_type}</code>
              </div>
            )
        }
      })}
    </div>
  )
}
