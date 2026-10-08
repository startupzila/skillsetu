'use client'

import { useState, useTransition, useEffect } from 'react'
import { NotebookPen, Trash2, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface Note {
  id: string
  content: string
  created_at: string
  updated_at: string
}

interface NoteEditorProps {
  lessonId: string
}

/**
 * NoteEditor — create, view, edit, delete private notes for a lesson.
 *
 * Client component: calls /api/notes for CRUD.
 * Notes are private (is_private = true by default, enforced by RLS).
 */
export function NoteEditor({ lessonId }: NoteEditorProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Fetch notes on mount
  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(`/api/notes?lessonId=${lessonId}`)
        if (res.ok) {
          const data = await res.json()
          setNotes(data.data ?? [])
        }
      } catch {
        // silently fail (user may not be authenticated)
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [lessonId])

  function createNote() {
    if (!newNote.trim()) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newNote.trim(), lessonId }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 401) {
            toast({ title: 'Sign in required', description: 'Please sign in to add notes.', variant: 'destructive' })
            return
          }
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setNotes((prev) => [data.data, ...prev])
        setNewNote('')
        toast({ title: 'Note added' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function saveEdit(noteId: string) {
    if (!editContent.trim()) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent.trim() }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, content: editContent.trim() } : n)),
        )
        setEditingId(null)
        toast({ title: 'Note updated' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function deleteNote(noteId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json()
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
        toast({ title: 'Note deleted' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Create new note */}
      <div className="space-y-2">
        <Textarea
          placeholder="Write a private note for this lesson…"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px] resize-y"
          aria-label="New note"
        />
        <Button onClick={createNote} size="sm" disabled={isPending || !newNote.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
          Add note
        </Button>
      </div>

      {/* Existing notes */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet. Add your first note above.</p>
      ) : (
        <ScrollArea className="max-h-72">
          <ul className="space-y-2 pr-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-md border p-3 space-y-2">
                {editingId === note.id ? (
                  <>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(note.id)} disabled={isPending}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            setEditingId(note.id)
                            setEditContent(note.content)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive"
                          onClick={() => deleteNote(note.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  )
}
