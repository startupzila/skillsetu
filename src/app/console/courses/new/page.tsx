'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function NewCoursePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('beginner')
  const [duration, setDuration] = useState('')
  const [outcomes, setOutcomes] = useState('')

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: slugify(slug) || slugify(title),
            title,
            short_description: shortDescription || undefined,
            description: description || undefined,
            difficulty,
            estimated_duration: duration ? parseInt(duration, 10) : null,
            learning_outcomes: outcomes
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Course created', description: 'Redirecting to editor…' })
        router.push(`/console/courses/${data.data.id}`)
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/console/courses">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to courses
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New Course</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new course. You can add modules and lessons next.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course details</CardTitle>
          <CardDescription>Fill in the basic information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (!slug || slug === slugify(title)) setSlug(slugify(e.target.value))
                }}
                placeholder="Excel Fundamentals"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="excel-fundamentals"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used in the URL: /courses/{slug || 'your-slug'}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="all_levels">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short description</Label>
              <Input
                id="shortDescription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Learn Excel from scratch — cells, formulas, formatting and charts."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A detailed description of the course…"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcomes">Learning outcomes (one per line)</Label>
              <Textarea
                id="outcomes"
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                placeholder={'Navigate the Excel interface confidently\nEnter and format data\nWrite basic formulas'}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending || !title || !slug}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create course
              </Button>
              <Button asChild variant="outline">
                <Link href="/console/courses">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
