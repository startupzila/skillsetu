'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarModule {
  id: string
  slug: string
  title: string
  lessons: {
    id: string
    slug: string
    title: string
  }[]
}

interface CourseSidebarProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  courseTitle: string
  modules: SidebarModule[]
  className?: string
}

/**
 * CourseSidebar — w3schools-style left sidebar.
 *
 * Shows the full course curriculum: all modules and their lessons.
 * The current module is expanded by default; others can be toggled.
 * The current lesson is highlighted.
 *
 * Client component: manages module expand/collapse state.
 */
export function CourseSidebar({
  courseSlug,
  moduleSlug,
  lessonSlug,
  courseTitle,
  modules,
  className,
}: CourseSidebarProps) {
  // Default: expand the module containing the current lesson
  const currentModule = modules.find((m) => m.slug === moduleSlug)
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(currentModule ? [currentModule.id] : []),
  )

  function toggle(moduleId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  return (
    <nav
      className={cn('flex flex-col text-sm', className)}
      aria-label="Course contents"
    >
      {/* Course title */}
      <Link
        href={`/courses/${courseSlug}`}
        className="flex items-center gap-2 px-3 py-2.5 font-semibold border-b"
      >
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="truncate">{courseTitle}</span>
      </Link>

      {/* Modules + lessons */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((module, mIdx) => {
          const isExpanded = expanded.has(module.id)
          const hasCurrent = module.slug === moduleSlug
          return (
            <div key={module.id}>
              {/* Module header (clickable to expand/collapse) */}
              <button
                type="button"
                onClick={() => toggle(module.id)}
                className={cn(
                  'flex w-full items-center gap-1.5 px-3 py-2 text-left font-medium hover:bg-accent transition-colors',
                  hasCurrent && 'bg-accent/50',
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                  {mIdx + 1}
                </span>
                <span className="truncate text-sm">{module.title}</span>
              </button>

              {/* Lessons (visible when expanded) */}
              {isExpanded && (
                <ul className="border-l-2 border-border ml-3">
                  {module.lessons.map((lesson) => {
                    const isCurrent =
                      module.slug === moduleSlug && lesson.slug === lessonSlug
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/courses/${courseSlug}/${module.slug}/${lesson.slug}`}
                          className={cn(
                            'block pl-7 pr-3 py-1.5 text-sm transition-colors border-l-2 -ml-0.5',
                            isCurrent
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent',
                          )}
                          aria-current={isCurrent ? 'page' : undefined}
                        >
                          {lesson.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
