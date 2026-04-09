import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { SearchBar } from '@/components/search/search-bar'
import { SearchTabs } from '@/components/search/search-tabs'
import { SearchResults } from '@/components/search/search-results'
import { FeedGridSkeleton } from '@/components/feed/feed-skeleton'
import type { SearchResponse } from '@/lib/types/feed'

interface SearchPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    type?: 'all' | 'shorts' | 'companies'
    page?: string
  }>
}

async function fetchSearchResults(
  query: string,
  type: string = 'all',
  page: number = 1
): Promise<SearchResponse | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      type,
      page: page.toString(),
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(
      `${baseUrl}/api/search?${params.toString()}`,
      { cache: 'no-store' }
    )

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const t = await getTranslations('search')

  return {
    title: q ? t('results.title', { query: q }) : t('bar.placeholder'),
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type = 'all', page = '1' } = await searchParams
  const t = await getTranslations('search')

  // If no query, show search prompt
  if (!q || q.length < 2) {
    return (
      <div className="container py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('bar.placeholder')}</h1>
          <SearchBar />
        </div>
      </div>
    )
  }

  // Fetch results
  const searchData = await fetchSearchResults(q, type, parseInt(page))

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {t('results.title', { query: q })}
        </h1>
        {searchData && (
          <p className="text-muted-foreground">
            {t('results.count', { count: searchData.totalCount })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Suspense fallback={null}>
          <SearchTabs activeTab={type as 'all' | 'shorts' | 'companies'} />
        </Suspense>
      </div>

      {/* Results */}
      <Suspense fallback={<FeedGridSkeleton />}>
        {searchData ? (
          <SearchResults results={searchData.results} query={q} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('results.noResults.title', { query: q })}
            </p>
          </div>
        )}
      </Suspense>
    </div>
  )
}
