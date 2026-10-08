import { describe, it, expect } from 'vitest'

/**
 * Unit tests for utility functions.
 * These test pure functions that don't require DB or auth.
 */

// ── Slug generation ────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Excel: Formulas & Functions!')).toBe('excel-formulas-functions')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('A   B   C')).toBe('a-b-c')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('trims leading/trailing whitespace', () => {
    expect(slugify('  hello  ')).toBe('-hello-')
  })

  it('lowercase all letters', () => {
    expect(slugify('ExcelFUNDAMENTALS')).toBe('excelfundamentals')
  })

  it('handles numbers', () => {
    expect(slugify('Excel 2024 Guide')).toBe('excel-2024-guide')
  })
})

// ── Price formatting ───────────────────────────────────────

function formatPrice(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('en-IN', { style: 'currency', currency })
}

describe('formatPrice', () => {
  it('formats INR correctly', () => {
    expect(formatPrice(19900, 'INR')).toBe('₹199.00')
  })

  it('formats USD correctly', () => {
    expect(formatPrice(1999, 'USD')).toBe('$19.99')
  })

  it('handles zero', () => {
    expect(formatPrice(0, 'INR')).toBe('₹0.00')
  })

  it('handles large amounts', () => {
    expect(formatPrice(10000000, 'INR')).toBe('₹1,00,000.00')
  })
})

// ── Progress calculation ──────────────────────────────────

function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)))
}

describe('calculateProgress', () => {
  it('calculates percentage', () => {
    expect(calculateProgress(5, 10)).toBe(50)
  })

  it('handles zero total', () => {
    expect(calculateProgress(0, 0)).toBe(0)
  })

  it('caps at 100', () => {
    expect(calculateProgress(11, 10)).toBe(100)
  })

  it('handles negative', () => {
    expect(calculateProgress(-1, 10)).toBe(0)
  })

  it('rounds to integer', () => {
    expect(calculateProgress(1, 3)).toBe(33)
    expect(calculateProgress(2, 3)).toBe(67)
  })
})

// ── Coupon discount calculation ──────────────────────────

function computeDiscount(
  totalCents: number,
  discountType: 'fixed' | 'percentage',
  discountValue: number,
  maxDiscountCents?: number,
): number {
  let discount = 0
  if (discountType === 'fixed') {
    discount = discountValue
  } else {
    discount = Math.round((totalCents * discountValue) / 100)
    if (maxDiscountCents) discount = Math.min(discount, maxDiscountCents)
  }
  return Math.min(discount, totalCents)
}

describe('computeDiscount', () => {
  it('computes fixed discount', () => {
    expect(computeDiscount(1000, 'fixed', 200)).toBe(200)
  })

  it('computes percentage discount', () => {
    expect(computeDiscount(1000, 'percentage', 10)).toBe(100)
  })

  it('caps at max discount', () => {
    expect(computeDiscount(10000, 'percentage', 50, 2000)).toBe(2000)
  })

  it('does not exceed total', () => {
    expect(computeDiscount(500, 'fixed', 1000)).toBe(500)
  })

  it('handles zero total', () => {
    expect(computeDiscount(0, 'percentage', 10)).toBe(0)
  })
})

// ── Block type validation ────────────────────────────────

const VALID_BLOCK_TYPES = [
  'heading', 'paragraph', 'image', 'callout', 'code',
  'table', 'quote', 'checklist', 'example', 'related_content',
  'quiz', 'video',
]

function isValidBlockType(type: string): boolean {
  return VALID_BLOCK_TYPES.includes(type)
}

describe('isValidBlockType', () => {
  it('accepts valid types', () => {
    expect(isValidBlockType('heading')).toBe(true)
    expect(isValidBlockType('paragraph')).toBe(true)
    expect(isValidBlockType('callout')).toBe(true)
  })

  it('rejects invalid types', () => {
    expect(isValidBlockType('invalid')).toBe(false)
    expect(isValidBlockType('')).toBe(false)
  })

  it('rejects case variations', () => {
    expect(isValidBlockType('Heading')).toBe(false)
  })
})

// ── Content status transitions ──────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['in_review', 'scheduled', 'published', 'archived'],
  in_review: ['draft', 'published', 'archived'],
  scheduled: ['published', 'draft'],
  published: ['archived', 'draft'],
  archived: ['draft'],
}

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

describe('canTransition', () => {
  it('allows draft → published', () => {
    expect(canTransition('draft', 'published')).toBe(true)
  })

  it('allows published → archived', () => {
    expect(canTransition('published', 'archived')).toBe(true)
  })

  it('allows archived → draft', () => {
    expect(canTransition('archived', 'draft')).toBe(true)
  })

  it('disallows archived → published', () => {
    expect(canTransition('archived', 'published')).toBe(false)
  })

  it('disallows unknown status', () => {
    expect(canTransition('unknown', 'published')).toBe(false)
  })
})
