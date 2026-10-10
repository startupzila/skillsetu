'use client'

import { useState } from 'react'
import { Menu, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CourseSidebar, type SidebarModule } from './course-sidebar'

interface MobileCourseNavProps {
  courseSlug: string
  moduleSlug: string
  lessonSlug: string
  courseTitle: string
  modules: SidebarModule[]
}

/**
 * MobileCourseNav — w3schools-style sticky top bar with a hamburger button.
 *
 * Visible only on mobile/tablet (< lg). Sticks to the top of the content
 * area so the chapter menu is always accessible while scrolling — exactly
 * like w3schools. Opens the full course sidebar in a left Sheet panel.
 */
export function MobileCourseNav({
  courseSlug,
  moduleSlug,
  lessonSlug,
  courseTitle,
  modules,
}: MobileCourseNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden sticky top-0 z-20 flex items-center gap-2 w-full bg-background border-b px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Menu className="h-4 w-4 shrink-0" />
          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{courseTitle}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="px-3 py-2.5 border-b pr-8">
          <span className="font-semibold text-sm">Course Contents</span>
        </div>
        <CourseSidebar
          courseSlug={courseSlug}
          moduleSlug={moduleSlug}
          lessonSlug={lessonSlug}
          courseTitle={courseTitle}
          modules={modules}
          className="h-[calc(100vh-3.5rem)]"
        />
      </SheetContent>
    </Sheet>
  )
}
