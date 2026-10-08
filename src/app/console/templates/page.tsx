import Link from 'next/link'
import type { Metadata } from 'next'
import { COURSE_TEMPLATES } from '@/lib/templates/course-templates'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, BookOpen, GraduationCap, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Course Templates — Console' }

export default function TemplatesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Course Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pre-configured templates to speed up course creation. Each template provides a suggested
          structure with modules, lessons and block outlines.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {COURSE_TEMPLATES.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="capitalize text-xs">{template.difficulty}</Badge>
                <Badge variant="outline" className="text-xs">{template.category}</Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {template.modules.length} modules
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {template.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.floor(template.estimatedDuration / 60)}h {template.estimatedDuration % 60}m
                </span>
              </div>

              {/* Modules preview */}
              <div className="space-y-1">
                {template.modules.map((mod, i) => (
                  <div key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium">{i + 1}. {mod.title}</span>
                    <span className="ml-1">({mod.lessons.length} lessons)</span>
                  </div>
                ))}
              </div>

              {/* Outcomes */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Learning outcomes:</p>
                <ul className="text-xs space-y-0.5">
                  {template.learningOutcomes.slice(0, 3).map((o, i) => (
                    <li key={i} className="text-muted-foreground">• {o}</li>
                  ))}
                </ul>
              </div>

              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href={`/console/courses/new?template=${template.id}`}>
                  Use this template <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
