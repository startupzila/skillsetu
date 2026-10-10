import { sanitize } from 'isomorphic-dompurify'

/**
 * Safe HTML rendering helpers for WYSIWYG content produced by the
 * RichTextEditor (TipTap). Used on both server and client to render
 * lesson content, question text, explanations and model answers.
 *
 * The editor produces clean TipTap/ProseMirror HTML; we still sanitize
 * on render to strip any scripts/event-handlers/unsafe markup before
 * it reaches the browser via dangerouslySetInnerHTML.
 */

const ALLOWED_TAGS = [
  'h1','h2','h3','h4','h5','h6','p','br','hr','blockquote','pre','code',
  'ul','ol','li','a','strong','em','u','s','del','span','div','img','figure',
  'table','thead','tbody','tr','th','td','colgroup','col','mark','sub','sup','small','caption',
]

const ALLOWED_ATTR = ['href','target','rel','src','alt','title','width','height','style','class','colspan','rowspan','align','data-*']

/** Sanitize HTML for safe rendering via dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  return sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

/** True if a string has any non-whitespace content after stripping tags. */
export function hasContent(html: string | null | undefined): boolean {
  if (!html) return false
  const text = html.replace(/<[^>]*>/g, '').trim()
  return text.length > 0
}
