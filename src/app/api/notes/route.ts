import { NextResponse } from 'next/server'
import { createNote, listMyNotes } from '@/lib/learning'

/**
 * GET /api/notes?lessonId=<uuid>
 *   Lists the current user's notes (optionally filtered by lesson).
 *
 * POST /api/notes
 *   Body: { content: string, lessonId?: string, courseId?: string }
 *   Creates a private note.
 *
 * Requires authentication.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lessonId') ?? undefined

  try {
    const { data, error } = await listMyNotes(lessonId)
    if (error) {
      if (error.includes('Authentication') || error.includes('JWT')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: { content?: string; lessonId?: string; courseId?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { content, lessonId, courseId } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
  }

  try {
    const { data, error } = await createNote(content.trim(), {
      lessonId: lessonId ?? undefined,
      courseId: courseId ?? undefined,
    })
    if (error) {
      if (error.includes('Authentication') || error.includes('JWT')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      return NextResponse.json({ error }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Authentication required')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
