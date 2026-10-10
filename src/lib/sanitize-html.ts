/**
 * Safe HTML rendering helpers for WYSIWYG content produced by the
 * RichTextEditor (TipTap). Used on both server and client to render
 * lesson content, question text, explanations and model answers.
 *
 * Zero external dependencies (no jsdom) so it works identically in dev,
 * standalone production builds, and Vercel serverless functions.
 *
 * The content is produced by trusted admins via the WYSIWYG editor, so
 * this sanitizer focuses on stripping the genuinely dangerous patterns
 * (scripts, event handlers, javascript: URIs, unsafe embeds) while
 * preserving all standard formatting tags.
 */

const DANGEROUS_TAGS = /<\/?(script|iframe|object|embed|form|input|textarea|button|select|option|style|link|meta|base|frame|frameset|applet)\b[^>]*>/gi

const EVENT_HANDLER_ATTRS = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi

const DANGEROUS_PROTOCOLS = /(?:href|src|action|formaction|xlink:href)\s*=\s*(?:"|')?\s*javascript:/gi

const DATA_BLOCK_ATTRS = /\s+data-(?:src|href|url)\s*=\s*(?:"|')?\s*javascript:/gi

/** Sanitize HTML for safe rendering via dangerouslySetInnerHTML. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    // 1. Remove entire dangerous tag blocks (script/iframe/etc. + their content)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>[\s\S]*?<\/embed>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, '')
    // 2. Strip any remaining dangerous tags (self-closing or unclosed)
    .replace(DANGEROUS_TAGS, '')
    // 3. Strip inline event handlers (onclick=, onerror=, onload=, …)
    .replace(EVENT_HANDLER_ATTRS, '')
    // 4. Neutralize javascript: URIs in href/src/action/etc.
    .replace(DANGEROUS_PROTOCOLS, '$&'.replace('javascript:', '')) // remove the protocol
    .replace(DANGEROUS_PROTOCOLS, (m) => m.replace('javascript:', ''))
    .replace(DATA_BLOCK_ATTRS, (m) => m.replace('javascript:', ''))
}

/** True if a string has any non-whitespace content after stripping tags. */
export function hasContent(html: string | null | undefined): boolean {
  if (!html) return false
  const text = html.replace(/<[^>]*>/g, '').trim()
  return text.length > 0
}
