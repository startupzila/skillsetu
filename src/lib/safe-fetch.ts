/**
 * safe-fetch — defensive wrapper for server-side data calls.
 *
 * Public pages should NEVER hard-crash (HTTP 500) when a backing
 * service is temporarily unavailable or misconfigured. This helper
 * catches any thrown error (e.g. Supabase env vars not set yet,
 * transient network failure) and returns `null` so the page can
 * render a graceful fallback instead of Next.js's "server-side
 * exception" page.
 *
 * Usage:
 *   const courses = await safeFetch(() => listPublishedCourses('en'))
 *   // courses may be null → render fallback UI
 */
export async function safeFetch<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    // Swallow — the caller decides how to render the empty state.
    return null
  }
}

/**
 * safeFetchOr — like safeFetch but returns a fallback value on failure.
 *
 * Useful for lists where the caller always wants an array.
 */
export async function safeFetchOr<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}
