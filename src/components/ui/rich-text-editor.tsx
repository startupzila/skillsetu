'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code,
  Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * RichTextEditor — a WordPress/Medium-style WYSIWYG editor (TipTap).
 *
 * - Outputs clean HTML (the `value` prop is HTML, onChange emits HTML).
 * - Toolbar: H1/H2/H3, bold, italic, underline, strikethrough, ordered/unordered
 *   list, blockquote, code, link, image, table, alignment, undo/redo.
 * - Server stores the HTML; the public frontend renders it sanitized.
 *
 * Controlled component: pass `value` (HTML) + `onChange(htmlString)`.
 */
interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {children}
    </Button>
  )
}

function Divider() {
  return <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  minHeight = 240,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit includes bold, italic, strike, code, codeBlock, blockquote,
        // bulletList, orderedList, listItem, horizontalRule, history (undo/redo).
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-3',
        style: `min-height: ${minHeight}px`,
      },
    },
    immediatelyRender: false,
  })

  // Keep the editor in sync when the external value changes (e.g. form reset / load).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div
        className="rounded-md border bg-muted/30 animate-pulse"
        style={{ minHeight }}
      />
    )
  }

  const setLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('Link URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Image URL (https://…)')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <div className={cn('rounded-md border bg-background overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5 sticky top-0 z-10">
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
          <span className="text-xs font-semibold">¶</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Image" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Table" active={editor.isActive('table')} onClick={addTable}>
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor surface */}
      <EditorContent editor={editor} />

      {/* If a table is active, show row/col controls */}
      {editor.isActive('table') && (
        <div className="flex flex-wrap gap-1 border-t bg-muted/20 p-1.5 text-xs">
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => editor.chain().focus().addRowBefore().run()}>+ Row ↑</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row ↓</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => editor.chain().focus().addColumnBefore().run()}>+ Col ←</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Col →</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => editor.chain().focus().deleteColumn().run()}>Delete col</Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</Button>
        </div>
      )}
    </div>
  )
}
