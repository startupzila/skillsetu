import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  CategoryWithTranslation,
  LanguageCode,
} from './types'

/**
 * categoryService — reads published categories with translations.
 *
 * Uses the server Supabase client (anon key, RLS on). Only rows
 * with status = 'published' are visible to the public via RLS.
 */

/** List all published categories, each with translations for the given language. */
export async function listPublishedCategories(language?: LanguageCode) {
  const supabase = await createServerSupabaseClient()

  const query = supabase
    .from('categories')
    .select(
      `
      id, slug, parent_id, sort_order, status, icon,
      translations:category_translations(
        id, language_code, name, description, status
      )
      `,
    )
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  const { data, error } = await query

  if (error) {
    return { data: null, error: error.message, code: error.code }
  }

  // Filter translations to the requested language (or return all)
  const filtered = language
    ? (data as CategoryWithTranslation[]).map((c) => ({
        ...c,
        translations: c.translations.filter(
          (t) => t.language_code === language,
        ),
      }))
    : (data as CategoryWithTranslation[])

  return { data: filtered, error: null, code: null }
}

/** Get a single published category by slug with its translations. */
export async function getPublishedCategoryBySlug(
  slug: string,
  language?: LanguageCode,
) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('categories')
    .select(
      `
      id, slug, parent_id, sort_order, status, icon,
      translations:category_translations(
        id, language_code, name, description, status
      )
      `,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    return { data: null, error: error.message, code: error.code }
  }

  const category = data as CategoryWithTranslation
  if (language) {
    category.translations = category.translations.filter(
      (t) => t.language_code === language && t.status === 'published',
    )
  }

  return { data: category, error: null, code: null }
}
