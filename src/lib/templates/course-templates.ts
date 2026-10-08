/**
 * Course templates — configurable templates for common course types.
 *
 * Templates provide a starting structure (modules, lesson outlines)
 * that editors can use when creating a new course. They are NOT
 * hard-coded courses — they're scaffolding to speed up content creation.
 *
 * @see docs/plan.md §15.1 (Course Templates)
 */

export interface CourseTemplate {
  id: string
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all_levels'
  estimatedDuration: number // minutes
  category: string
  modules: Array<{
    title: string
    description: string
    lessons: Array<{
      title: string
      summary: string
      durationMinutes: number
      blockOutline: string[] // block types to include
    }>
  }>
  learningOutcomes: string[]
  prerequisites: string[]
  targetAudience: string[]
}

export const COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: 'office-skills-fundamentals',
    name: 'Office Skills — Fundamentals',
    description: 'Template for beginner office software courses (Excel, Word, PowerPoint).',
    difficulty: 'beginner',
    estimatedDuration: 300,
    category: 'office-skills',
    modules: [
      {
        title: 'Getting Started',
        description: 'Introduction to the software and its interface.',
        lessons: [
          { title: 'What is [Software]?', summary: 'Understand the purpose and use cases.', durationMinutes: 10, blockOutline: ['heading', 'paragraph', 'callout', 'checklist'] },
          { title: 'Navigating the Interface', summary: 'Learn the ribbon, menus and workspace.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'image', 'callout'] },
        ],
      },
      {
        title: 'Core Skills',
        description: 'Essential operations and formatting.',
        lessons: [
          { title: 'Creating Your First Document', summary: 'Step-by-step guide to creating and saving.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'example', 'checklist'] },
          { title: 'Formatting Basics', summary: 'Apply styles, fonts and layouts.', durationMinutes: 20, blockOutline: ['heading', 'paragraph', 'table', 'callout'] },
        ],
      },
      {
        title: 'Practice & Assessment',
        description: 'Hands-on exercises and quiz.',
        lessons: [
          { title: 'Practice Exercise', summary: 'Apply what you learned.', durationMinutes: 20, blockOutline: ['heading', 'paragraph', 'example', 'checklist', 'quiz'] },
        ],
      },
    ],
    learningOutcomes: [
      'Navigate the software confidently',
      'Create and format documents',
      'Use essential features',
      'Apply skills to real-world tasks',
    ],
    prerequisites: ['Basic computer skills', 'A computer with the software installed'],
    targetAudience: ['Students', 'Office workers', 'Job seekers', 'Anyone new to the software'],
  },
  {
    id: 'digital-marketing-basics',
    name: 'Digital Marketing — Basics',
    description: 'Template for digital marketing fundamentals courses.',
    difficulty: 'intermediate',
    estimatedDuration: 240,
    category: 'digital-skills',
    modules: [
      {
        title: 'Introduction to Digital Marketing',
        description: 'Understand the digital marketing landscape.',
        lessons: [
          { title: 'What is Digital Marketing?', summary: 'Overview of channels and strategies.', durationMinutes: 12, blockOutline: ['heading', 'paragraph', 'callout', 'related_content'] },
          { title: 'Key Channels', summary: 'SEO, social media, email, content, paid ads.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'table', 'callout'] },
        ],
      },
      {
        title: 'SEO Fundamentals',
        description: 'Search engine optimization basics.',
        lessons: [
          { title: 'How Search Engines Work', summary: 'Crawling, indexing and ranking.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'image', 'example'] },
          { title: 'On-Page SEO', summary: 'Keywords, meta tags and content optimization.', durationMinutes: 20, blockOutline: ['heading', 'paragraph', 'code', 'checklist'] },
        ],
      },
      {
        title: 'Social Media Strategy',
        description: 'Building a social media presence.',
        lessons: [
          { title: 'Choosing Platforms', summary: 'Which platforms suit your audience.', durationMinutes: 10, blockOutline: ['heading', 'paragraph', 'table'] },
          { title: 'Content Planning', summary: 'Create a content calendar.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'example', 'checklist', 'quiz'] },
        ],
      },
    ],
    learningOutcomes: [
      'Understand the digital marketing landscape',
      'Learn SEO fundamentals',
      'Create a social media strategy',
      'Measure and optimize campaigns',
    ],
    prerequisites: ['Basic internet skills', 'A laptop or smartphone'],
    targetAudience: ['Small business owners', 'Aspiring marketers', 'Freelancers', 'Content creators'],
  },
  {
    id: 'software-tutorial',
    name: 'Software Tutorial — General',
    description: 'Template for software/tool tutorial courses (Canva, Photoshop, etc.).',
    difficulty: 'beginner',
    estimatedDuration: 180,
    category: 'digital-skills',
    modules: [
      {
        title: 'Getting Started',
        description: 'Setup and interface overview.',
        lessons: [
          { title: 'Installing [Software]', summary: 'Download and install the software.', durationMinutes: 8, blockOutline: ['heading', 'paragraph', 'checklist'] },
          { title: 'Interface Tour', summary: 'Explore the main workspace.', durationMinutes: 12, blockOutline: ['heading', 'paragraph', 'image', 'callout'] },
        ],
      },
      {
        title: 'Essential Tools',
        description: 'Core tools and their uses.',
        lessons: [
          { title: 'Tool 1: Basics', summary: 'Learn the first essential tool.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'image', 'example', 'checklist'] },
          { title: 'Tool 2: Advanced', summary: 'Go deeper with the second tool.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'code', 'example'] },
        ],
      },
      {
        title: 'Project Practice',
        description: 'Apply skills with a real project.',
        lessons: [
          { title: 'Mini Project', summary: 'Build a small project end-to-end.', durationMinutes: 25, blockOutline: ['heading', 'paragraph', 'example', 'checklist', 'quiz'] },
        ],
      },
    ],
    learningOutcomes: [
      'Install and navigate the software',
      'Use essential tools',
      'Complete a practical project',
      'Apply skills to your own work',
    ],
    prerequisites: ['Basic computer skills'],
    targetAudience: ['Beginners', 'Designers', 'Content creators', 'Students'],
  },
  {
    id: 'business-skills',
    name: 'Business Skills — General',
    description: 'Template for business skill courses (Accounting, GST, Export/Import).',
    difficulty: 'intermediate',
    estimatedDuration: 360,
    category: 'office-skills',
    modules: [
      {
        title: 'Fundamentals',
        description: 'Core concepts and terminology.',
        lessons: [
          { title: 'Introduction to [Topic]', summary: 'Understand the basics.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'callout'] },
          { title: 'Key Terms & Concepts', summary: 'Essential vocabulary.', durationMinutes: 12, blockOutline: ['heading', 'paragraph', 'table'] },
        ],
      },
      {
        title: 'Practical Application',
        description: 'Real-world scenarios and examples.',
        lessons: [
          { title: 'Step-by-Step Process', summary: 'Follow a complete workflow.', durationMinutes: 20, blockOutline: ['heading', 'paragraph', 'example', 'table', 'checklist'] },
          { title: 'Common Mistakes to Avoid', summary: 'Pitfalls and how to avoid them.', durationMinutes: 10, blockOutline: ['heading', 'paragraph', 'callout', 'quote'] },
        ],
      },
      {
        title: 'Assessment',
        description: 'Test your knowledge.',
        lessons: [
          { title: 'Practice Quiz', summary: 'Quick check on key concepts.', durationMinutes: 15, blockOutline: ['heading', 'paragraph', 'quiz'] },
        ],
      },
    ],
    learningOutcomes: [
      'Understand core concepts',
      'Apply knowledge to real scenarios',
      'Avoid common mistakes',
      'Build confidence in the topic',
    ],
    prerequisites: ['Basic understanding of the domain'],
    targetAudience: ['Business owners', 'Professionals', 'Students', 'Job seekers'],
  },
]

/** Get a template by ID. */
export function getTemplateById(id: string): CourseTemplate | undefined {
  return COURSE_TEMPLATES.find((t) => t.id === id)
}

/** List all templates. */
export function listTemplates(): CourseTemplate[] {
  return COURSE_TEMPLATES
}
