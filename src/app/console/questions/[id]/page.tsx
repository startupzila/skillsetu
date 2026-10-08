import Link from 'next/link'
import type { Metadata } from 'next'
import { adminGetQuestion } from '@/lib/admin/question-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, XCircle, Send, Trash2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: 'Question — Console' }
}

export default async function QuestionDetailPage({ params }: PageProps) {
  const { id } = await params
  const { data: question, error } = await adminGetQuestion(id)

  if (error || !question) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Question not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/console/questions">Back to questions</Link>
        </Button>
      </div>
    )
  }

  const q = question as Record<string, unknown>
  const translation = q.translation as { id: string; question_text: string; explanation: string | null; status: string } | null
  const options = q.options as Array<{ id: string; sort_order: number; text: Record<string, string>; is_correct: boolean }>

  return (
    <div className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/console/questions">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to questions
          </Link>
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">Question</h1>
          <StatusBadge status={q.status as string} />
          <Badge variant="outline" className="capitalize">{(q.question_type as string)?.replace('_', ' ')}</Badge>
          <Badge variant="secondary" className="capitalize">{q.difficulty as string}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">/{q.slug}</p>
      </div>

      {/* Question text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question text (EN)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base">{translation?.question_text}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Options ({options.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {options.map((opt, i) => (
              <li
                key={opt.id}
                className={`flex items-center gap-3 rounded-md border px-4 py-2.5 ${
                  opt.is_correct ? 'border-success bg-success/5' : ''
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                {opt.is_correct ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/40" />
                )}
                <span className="text-sm">{opt.text.en}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Explanation */}
      {translation?.explanation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{translation.explanation}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {q.status !== 'published' && (
          <form action={`/api/admin/questions/${q.id}?action=publish`} method="post">
            <Button type="submit" size="sm">
              <Send className="h-4 w-4 mr-1.5" />
              Publish
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
