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
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OptionRow {
  text: string
  is_correct: boolean
}

export default function NewQuestionPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [slug, setSlug] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [questionType, setQuestionType] = useState('single_choice')
  const [difficulty, setDifficulty] = useState('easy')
  const [topic, setTopic] = useState('')
  const [options, setOptions] = useState<OptionRow[]>([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ])

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  }

  function updateOption(idx: number, field: keyof OptionRow, value: string | boolean) {
    setOptions((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)),
    )
  }

  // For single_choice, only one correct
  function setCorrect(idx: number, checked: boolean) {
    if (questionType === 'single_choice' && checked) {
      setOptions((prev) => prev.map((o, i) => ({ ...o, is_correct: i === idx })))
    } else {
      updateOption(idx, 'is_correct', checked)
    }
  }

  function addOption() {
    setOptions((prev) => [...prev, { text: '', is_correct: false }])
  }

  function removeOption(idx: number) {
    setOptions((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validOptions = options.filter((o) => o.text.trim())
    if (validOptions.length < 2) {
      toast({ title: 'Error', description: 'Need at least 2 options with text.', variant: 'destructive' })
      return
    }
    if (!validOptions.some((o) => o.is_correct)) {
      toast({ title: 'Error', description: 'Mark at least one option as correct.', variant: 'destructive' })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: slugify(slug) || slugify(questionText.slice(0, 40)),
            question_type: questionType,
            difficulty,
            topic: topic || null,
            question_text: questionText,
            explanation: explanation || undefined,
            options: validOptions.map((o) => ({
              text: { en: o.text.trim() },
              is_correct: o.is_correct,
            })),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Question created' })
        router.push('/console/questions')
      } catch {
        toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link href="/console/questions">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to questions
        </Link>
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">New Question</h1>
      <p className="text-muted-foreground text-sm mt-1 mb-6">
        Create an MCQ with options, correct answer, and explanation.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionText">Question text</Label>
              <Textarea
                id="questionText"
                value={questionText}
                onChange={(e) => {
                  setQuestionText(e.target.value)
                  if (!slug) setSlug(slugify(e.target.value.slice(0, 40)))
                }}
                placeholder="What is Microsoft Excel primarily used for?"
                required
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="what-is-excel-used-for"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Single choice</SelectItem>
                    <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                    <SelectItem value="true_false">True / False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic (optional)</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="excel-basics"
              />
            </div>

            {/* Options */}
            <div className="space-y-2 pt-2">
              <Label>Options</Label>
              <p className="text-xs text-muted-foreground">
                {questionType === 'single_choice'
                  ? 'Mark one correct option.'
                  : 'Mark all correct options.'}
              </p>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Checkbox
                      checked={opt.is_correct}
                      onCheckedChange={(checked) => setCorrect(idx, checked === true)}
                    />
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(idx, 'text', e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeOption(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add option
              </Button>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="explanation">Explanation (shown after answering)</Label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why the correct answer is correct…"
                className="min-h-[60px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending || !questionText}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                <Save className="h-4 w-4 mr-1.5" />
                Create question
              </Button>
              <Button asChild variant="outline">
                <Link href="/console/questions">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
