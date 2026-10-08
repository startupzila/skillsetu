import Link from 'next/link'
import type { Metadata } from 'next'
import { adminListQuestions } from '@/lib/admin/question-service'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FileQuestion } from 'lucide-react'

export const metadata: Metadata = { title: 'Questions — Console' }

/**
 * /console/questions — list all questions.
 */
export default async function ConsoleQuestionsPage() {
  const { data: questions, error } = await adminListQuestions()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the question bank — create, edit, publish MCQs.
          </p>
        </div>
        <Button asChild>
          <Link href="/console/questions/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Question
          </Link>
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error.includes('Authentication')
              ? 'Please sign in.'
              : error.includes('FORBIDDEN') || error.includes('Insufficient')
                ? 'You do not have permission.'
                : `Error: ${error}`}
          </CardContent>
        </Card>
      )}

      {questions && questions.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Question</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Difficulty</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Options</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questions.map((q: Record<string, unknown>) => {
                const trans = q.translations as { language_code: string; question_text: string }[]
                const enT = trans?.find((t) => t.language_code === 'en')
                const options = q.options as unknown[]
                return (
                  <tr key={q.id as string} className="hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/console/questions/${q.id}`}
                        className="font-medium hover:text-primary line-clamp-2"
                      >
                        {enT?.question_text ?? q.slug}
                      </Link>
                      <p className="text-xs text-muted-foreground">/{q.slug}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {(q.question_type as string)?.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell capitalize text-muted-foreground">
                      {q.difficulty as string}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status as string} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {options?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Link href={`/console/questions/${q.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No questions yet. Click &ldquo;New Question&rdquo; to create one.
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
