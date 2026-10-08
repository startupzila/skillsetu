'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
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
 * MobileCourseNav — hamburger button that opens the course sidebar
 * in a Sheet (side panel). Visible only on mobile/tablet (< lg).
 *
 * w3schools-style: the chapter menu is accessed via a toggle button.
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
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4 mr-1.5" />
          Chapters
        </Button>
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
