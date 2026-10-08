'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Send, Eye, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/shared'

interface LessonEditorProps {
  courseId: string
  lessonId: string
}

/**
 * Lesson editor — edit lesson title, summary, publish.
 * Full content-block editor comes in S10.
 */
export function LessonEditor({ courseId, lessonId }: LessonEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState('draft')
  const [translationId, setTranslationId] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLesson() {
      // Fetch lesson via the admin API (using server client through a fetch)
      try {
        // We need to fetch the lesson translation — use a direct API call
        const res = await fetch(`/api/admin/lessons?id=${lessonId}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            setTitle(data.data.title ?? '')
            setSummary(data.data.summary ?? '')
            setStatus(data.data.status ?? 'draft')
            setTranslationId(data.data.translationId ?? '')
            setSlug(data.data.slug ?? '')
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [lessonId])

  function save() {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/lessons?action=update-translation&id=${translationId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, summary }),
          },
        )
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Saved', description: 'Lesson updated.' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  function publish() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/lessons?action=publish&id=${lessonId}`, {
          method: 'POST',
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        setStatus('published')
        toast({ title: 'Published!', description: 'Lesson is now live.' })
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href={`/console/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to course
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Edit Lesson</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">/{slug}</p>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief summary shown above the lesson content."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={isPending || !title}>
              {isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save changes
            </Button>
            {status !== 'published' && (
              <Button onClick={publish} variant="default" disabled={isPending}>
                <Send className="h-4 w-4 mr-1.5" />
                Publish
              </Button>
            )}
            {status === 'published' && (
              <Button asChild variant="outline">
                <Link href={`#`}>
                  <Eye className="h-4 w-4 mr-1.5" />
                  View live
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content blocks placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content blocks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The visual content-block editor is coming in S10. For now, lesson
            content is managed via the database seed files.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
