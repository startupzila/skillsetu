import { PageEditor } from '@/components/console/page-editor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PageEditPage({ params }: PageProps) {
  const { id } = await params
  return <PageEditor pageId={id} />
}
