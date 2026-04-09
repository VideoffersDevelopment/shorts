import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ShortDetailView } from '@/components/shorts/short-detail-view'
import { getPublicShort } from '@/app/actions/shorts/get-public'

interface ShortDetailPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export async function generateMetadata({
  params,
}: ShortDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const short = await getPublicShort(id)

  if (!short) {
    return {
      title: 'Short not found',
    }
  }

  return {
    title: short.title,
    description: short.description ?? `Watch ${short.title} by ${short.company.name}`,
    openGraph: {
      title: short.title,
      description: short.description ?? undefined,
      images: short.thumbnailUrl ? [short.thumbnailUrl] : undefined,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: short.title,
      description: short.description ?? undefined,
      images: short.thumbnailUrl ? [short.thumbnailUrl] : undefined,
    },
  }
}

export default async function ShortDetailPage({ params }: ShortDetailPageProps) {
  const { id } = await params
  const session = await auth()
  const short = await getPublicShort(id, session?.user?.id)

  if (!short) {
    notFound()
  }

  return <ShortDetailView short={short} />
}
