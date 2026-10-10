/**
 * LessonVideo — renders a YouTube embed from a video_url.
 *
 * Accepts standard YouTube watch URLs, youtu.be short URLs, and embed URLs.
 * Renders a responsive 16:9 iframe. Returns null if the URL is empty or
 * doesn't look like a YouTube link.
 */
export function LessonVideo({ url }: { url: string | null | undefined }) {
  if (!url) return null
  const embedUrl = toEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <div className="relative w-full mb-6" style={{ aspectRatio: '16 / 9' }}>
      <iframe
        src={embedUrl}
        title="Lesson video"
        className="absolute inset-0 h-full w-full rounded-lg border"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}

/** Convert any YouTube URL shape to a /embed/<id> URL. Returns null if not YouTube. */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // youtu.be/<id>
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // youtube.com/watch?v=<id>
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v')
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      // youtube.com/embed/<id>
      if (u.pathname.startsWith('/embed/')) {
        return url
      }
      // youtube.com/shorts/<id>
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2]
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
    }
    return null
  } catch {
    return null
  }
}
