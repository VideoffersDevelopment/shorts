import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { suggestionsQuerySchema } from '@/lib/validation/search'
import type { SuggestionsResponse, ShortSuggestion, CompanySuggestion } from '@/lib/types/feed'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())

    const params = suggestionsQuerySchema.parse(rawParams)
    const { q } = params

    // Fetch suggestions in parallel
    const [shorts, companies, popularTags] = await Promise.all([
      searchShortsSuggestions(q),
      searchCompaniesSuggestions(q),
      getPopularSearchTerms(),
    ])

    return NextResponse.json({
      recent: [], // Recent searches handled client-side (localStorage)
      popular: popularTags,
      shorts,
      companies,
    } satisfies SuggestionsResponse)

  } catch (error) {
    console.error('Suggestions API error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface RawShortSuggestion {
  id: string
  title: string
  thumbnailUrl: string | null
}

interface RawCompanySuggestion {
  id: string
  name: string
  slug: string
  logo: string | null
}

async function searchShortsSuggestions(query: string): Promise<ShortSuggestion[]> {
  const prefixPattern = `${query}%`
  const containsPattern = `%${query}%`

  const results = await prisma.$queryRaw<RawShortSuggestion[]>`
    SELECT
      s.id,
      s.title,
      s."thumbnailUrl"
    FROM "Short" s
    WHERE
      s.status = 'PUBLISHED'
      AND (
        s.title ILIKE ${containsPattern}
        OR s.title % ${query}
      )
    ORDER BY
      CASE WHEN s.title ILIKE ${prefixPattern} THEN 0 ELSE 1 END,
      similarity(s.title, ${query}) DESC
    LIMIT 5
  `

  return results.map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnailUrl,
  }))
}

async function searchCompaniesSuggestions(query: string): Promise<CompanySuggestion[]> {
  const prefixPattern = `${query}%`
  const containsPattern = `%${query}%`

  const results = await prisma.$queryRaw<RawCompanySuggestion[]>`
    SELECT
      c.id,
      c."companyName" as name,
      c.slug,
      c.logo
    FROM "CompanyProfile" c
    WHERE
      c."companyName" ILIKE ${containsPattern}
      OR c."companyName" % ${query}
    ORDER BY
      CASE WHEN c."companyName" ILIKE ${prefixPattern} THEN 0 ELSE 1 END,
      similarity(c."companyName", ${query}) DESC
    LIMIT 5
  `

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
  }))
}

async function getPopularSearchTerms(): Promise<string[]> {
  // Return popular tags as search suggestions
  const tags = await prisma.tag.findMany({
    select: { name: true },
    orderBy: { usageCount: 'desc' },
    take: 5,
  })

  return tags.map((t) => t.name)
}
