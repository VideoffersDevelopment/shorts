import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import {
  CategoryFilter,
  sampleCategories,
} from "@/components/home/category-filter"
import { HomeFeedWrapper } from "@/components/feed/home-feed-wrapper"
import type { FeedFilters, FeedResponse } from "@/lib/types/feed"

interface HomePageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

function parseFilters(searchParams: Record<string, string | undefined>): FeedFilters {
  return {
    sort: (searchParams.sort as FeedFilters['sort']) ?? 'algorithmic',
    categoryIds: searchParams.categoryIds?.split(',').filter(Boolean),
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

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()
  const t = await getTranslations("home")

  const isLoggedIn = !!session?.user
  const filters = parseFilters(resolvedSearchParams)
  const initialData = await getInitialFeed(filters)

  // For logged-in users: layout provides Header/Footer/Sidebar
  // For guests: this page provides its own Header/Footer wrapper
  const content = (
    <div className="flex flex-col gap-8">
      {/* Hero Section - Only for logged out users */}
      {!isLoggedIn && (
        <HeroSection
          title={t("hero.title")}
          highlight={t("hero.highlight")}
          subtitle={t("hero.subtitle")}
          ctaPrimary={t("hero.ctaPrimary")}
          ctaSecondary={t("hero.ctaSecondary")}
        />
      )}

      {/* Category Filter & Navigation */}
      <CategoryFilter
        categories={sampleCategories}
        labels={{
          discover: t("filter.discover"),
          nearby: t("filter.nearby"),
          following: t("filter.following"),
          more: t("filter.more"),
        }}
      />

      {/* Dynamic Video Feed Grid */}
      <HomeFeedWrapper
        initialData={initialData}
        filters={filters}
      />
    </div>
  )

  // Logged-in users: layout already has Header/Sidebar/Footer
  if (isLoggedIn) {
    return content
  }

  // Guest users: wrap with Header/Footer
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        {content}
      </main>
      <Footer locale={locale} />
    </div>
  )
}
