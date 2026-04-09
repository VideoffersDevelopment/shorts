import { notFound } from 'next/navigation'
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HomeFeedWrapper } from "@/components/feed/home-feed-wrapper"
import { getCategoryBySlug } from "@/app/actions/categories/get-category-by-slug"
import { CategoryBreadcrumb } from "./category-breadcrumb"
import { CategoryHeader } from "./category-header"
import type { FeedFilters, FeedResponse } from "@/lib/types/feed"

interface CategoryPageProps {
  params: Promise<{ locale: string; slugs: string[] }>
  searchParams: Promise<Record<string, string | undefined>>
}

function parseFilters(
  searchParams: Record<string, string | undefined>,
  categoryId: string,
): FeedFilters {
  return {
    sort: (searchParams.sort as FeedFilters['sort']) ?? 'algorithmic',
    categoryIds: [categoryId],
    tags: searchParams.tags?.split(',').filter(Boolean),
    lat: searchParams.lat ? parseFloat(searchParams.lat) : undefined,
    lng: searchParams.lng ? parseFloat(searchParams.lng) : undefined,
    radius: searchParams.radius ? parseInt(searchParams.radius) : undefined,
    verifiedOnly: searchParams.verifiedOnly === 'true',
  }
}

async function getInitialFeed(filters: FeedFilters): Promise<FeedResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('sort', filters.sort)

    if (filters.categoryIds?.length) {
      params.set('categoryIds', filters.categoryIds.join(','))
    }
    if (filters.tags?.length) {
      params.set('tags', filters.tags.join(','))
    }
    if (filters.lat !== undefined) {
      params.set('lat', filters.lat.toString())
    }
    if (filters.lng !== undefined) {
      params.set('lng', filters.lng.toString())
    }
    if (filters.radius !== undefined) {
      params.set('radius', filters.radius.toString())
    }
    if (filters.verifiedOnly) {
      params.set('verifiedOnly', 'true')
    }

    const response = await fetch(
      `${baseUrl}/api/feed?${params.toString()}`,
      { next: { revalidate: 10 } }
    )

    if (!response.ok) return null
    return response.json() as Promise<FeedResponse>
  } catch {
    return null
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, slugs } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()

  const isLoggedIn = !!session?.user

  // Last slug in the array is the target category
  const targetSlug = slugs[slugs.length - 1]
  const category = await getCategoryBySlug(targetSlug)

  if (!category) {
    notFound()
  }

  // Build breadcrumb data
  const breadcrumb: { name: string; slug: string }[] = []
  if (category.parent) {
    breadcrumb.push({ name: category.parent.name, slug: category.parent.slug })
  }
  breadcrumb.push({ name: category.name, slug: category.slug })

  const filters = parseFilters(resolvedSearchParams, category.id)
  const initialData = await getInitialFeed(filters)

  // Header slot — rendered inside FeedList's sticky header bar
  const categoryHeader = (
    <CategoryHeader
      breadcrumb={breadcrumb}
      locale={locale}
      categoryName={category.name}
      categorySlug={category.slug}
      subcategories={category.children.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
      }))}
    />
  )

  const content = (
    <HomeFeedWrapper
      initialData={initialData}
      filters={filters}
      defaultViewMode="list"
      header={categoryHeader}
    />
  )

  if (isLoggedIn) {
    return content
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1">
        {content}
      </main>
      <Footer locale={locale} />
    </div>
  )
}
