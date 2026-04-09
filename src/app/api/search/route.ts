import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { searchQuerySchema } from '@/lib/validation/search'
import { haversineDistance } from '@/lib/utils/haversine'
import type {
  SearchResponse,
  SearchResult,
  FeedShort,
  CompanyResult,
} from '@/lib/types/feed'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())

    const params = searchQuerySchema.parse(rawParams)
    const { q, type, page, limit, categoryIds, lat, lng, radius } = params

    const results: SearchResult[] = []
    let totalCount = 0

    // Search shorts
    if (type === 'all' || type === 'shorts') {
      const shortsResults = await searchShorts(q, {
        categoryIds,
        lat,
        lng,
        radius,
        limit: type === 'shorts' ? limit : Math.floor(limit / 2),
        offset: type === 'shorts' ? (page - 1) * limit : 0,
      })

      results.push(
        ...shortsResults.items.map((short, index) => ({
          type: 'short' as const,
          data: short,
          rank: shortsResults.ranks[index] ?? 0,
        }))
      )

      if (type === 'shorts') {
        totalCount = shortsResults.total
      }
    }

    // Search companies
    if (type === 'all' || type === 'companies') {
      const companiesResults = await searchCompanies(q, {
        limit: type === 'companies' ? limit : Math.floor(limit / 2),
        offset: type === 'companies' ? (page - 1) * limit : 0,
      })

      results.push(
        ...companiesResults.items.map((company, index) => ({
          type: 'company' as const,
          data: company,
          rank: companiesResults.ranks[index] ?? 0,
        }))
      )

      if (type === 'companies') {
        totalCount = companiesResults.total
      }
    }

    // For "all" type, estimate total
    if (type === 'all') {
      totalCount = results.length
    }

    // Sort by rank (descending)
    results.sort((a, b) => b.rank - a.rank)

    // Calculate pagination
    const hasMore = page * limit < totalCount
    const nextPage = hasMore ? page + 1 : null

    return NextResponse.json({
      results,
      totalCount,
      nextPage,
      query: q,
    } satisfies SearchResponse)

  } catch (error) {
    console.error('Search API error:', error)

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

interface SearchOptions {
  categoryIds?: string[]
  lat?: number
  lng?: number
  radius?: number
  limit: number
  offset: number
}

interface RawShortRow {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: Date
  latitude: number | null
  longitude: number | null
  ctaLink: string | null
  views: number | null
  likes: number | null
  ctaClicks: number | null
  companyId: string
  companyName: string
  companySlug: string
  companyLogo: string | null
  companyVerified: boolean
  city: string | null
  categoryId: string
  categoryName: string
  categorySlug: string
  rank: number
}

interface RawCompanyRow {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: bigint
  rank: number
}

async function searchShorts(
  query: string,
  options: SearchOptions
): Promise<{ items: FeedShort[]; ranks: number[]; total: number }> {
  const { categoryIds, lat, lng, radius, limit, offset } = options

  // Build WHERE conditions
  const conditions: string[] = [`s.status = 'PUBLISHED'`]
  const params: (string | number | string[])[] = []
  let paramIndex = 1

  // Full-text search condition
  conditions.push(`(
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
    @@ plainto_tsquery('polish', $${paramIndex})
    OR s.title % $${paramIndex}
  )`)
  params.push(query)
  paramIndex++

  // Category filter
  if (categoryIds?.length) {
    conditions.push(`s."categoryId" = ANY($${paramIndex}::text[])`)
    params.push(categoryIds)
    paramIndex++
  }

  // Location filter (bounding box)
  if (lat !== undefined && lng !== undefined && radius) {
    const latDelta = radius / 111
    const lngDelta = radius / (111 * Math.cos(lat * Math.PI / 180))

    conditions.push(`s.latitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
    params.push(lat - latDelta, lat + latDelta)
    paramIndex += 2

    conditions.push(`s.longitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`)
    params.push(lng - lngDelta, lng + lngDelta)
    paramIndex += 2
  }

  const whereClause = conditions.join(' AND ')

  // Count query
  const countQuery = `SELECT COUNT(*) as count FROM "Short" s WHERE ${whereClause}`
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    countQuery,
    ...params
  )
  const total = Number(countResult[0]?.count ?? 0)

  // Search query with ranking
  const searchQuery = `
    SELECT
      s.id,
      s.title,
      s."thumbnailUrl",
      s."hlsPlaylistUrl",
      s.duration,
      s."publishedAt",
      s.latitude,
      s.longitude,
      s."ctaLink",
      ss.views,
      ss.likes,
      ss."ctaClicks",
      c.id as "companyId",
      c."companyName",
      c.slug as "companySlug",
      c.logo as "companyLogo",
      c."viesVerified" as "companyVerified",
      c.city,
      cat.id as "categoryId",
      cat.name as "categoryName",
      cat.slug as "categorySlug",
      ts_rank(
        to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
        plainto_tsquery('polish', $1)
      ) + similarity(s.title, $1) as rank
    FROM "Short" s
    LEFT JOIN "ShortStats" ss ON ss."shortId" = s.id
    LEFT JOIN "CompanyProfile" c ON c.id = s."companyId"
    LEFT JOIN "Category" cat ON cat.id = s."categoryId"
    WHERE ${whereClause}
    ORDER BY rank DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `

  params.push(limit, offset)

  const rows = await prisma.$queryRawUnsafe<RawShortRow[]>(searchQuery, ...params)

  const items: FeedShort[] = rows.map((row) => {
    const distance = lat !== undefined && lng !== undefined && row.latitude && row.longitude
      ? haversineDistance({ lat, lng }, { lat: row.latitude, lng: row.longitude })
      : null

    return {
      id: row.id,
      title: row.title,
      thumbnailUrl: row.thumbnailUrl,
      hlsPlaylistUrl: row.hlsPlaylistUrl,
      duration: row.duration,
      publishedAt: row.publishedAt.toISOString(),
      views: row.views ?? 0,
      likes: row.likes ?? 0,
      ctaClicks: row.ctaClicks ?? 0,
      location: row.city,
      distance: distance !== null ? Math.round(distance * 10) / 10 : null,
      company: {
        id: row.companyId,
        name: row.companyName,
        slug: row.companySlug,
        logo: row.companyLogo,
        verified: row.companyVerified,
      },
      category: {
        id: row.categoryId,
        name: row.categoryName,
        slug: row.categorySlug,
      },
      ctaLink: row.ctaLink,
    }
  })

  const ranks = rows.map((row) => row.rank)

  return { items, ranks, total }
}

async function searchCompanies(
  query: string,
  options: { limit: number; offset: number }
): Promise<{ items: CompanyResult[]; ranks: number[]; total: number }> {
  const { limit, offset } = options

  // Count query
  const countQuery = `
    SELECT COUNT(*) as count
    FROM "CompanyProfile" c
    WHERE c."companyName" % $1
  `
  const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    countQuery,
    query
  )
  const total = Number(countResult[0]?.count ?? 0)

  // Search query
  const searchQuery = `
    SELECT
      c.id,
      c."companyName" as name,
      c.slug,
      c.logo,
      c."viesVerified" as verified,
      cat.name as category,
      (SELECT COUNT(*) FROM "Short" s WHERE s."companyId" = c.id AND s.status = 'PUBLISHED') as "shortsCount",
      similarity(c."companyName", $1) as rank
    FROM "CompanyProfile" c
    LEFT JOIN "Category" cat ON cat.id = c."categoryId"
    WHERE c."companyName" % $1
    ORDER BY rank DESC
    LIMIT $2 OFFSET $3
  `

  const rows = await prisma.$queryRawUnsafe<RawCompanyRow[]>(
    searchQuery,
    query,
    limit,
    offset
  )

  const items: CompanyResult[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    verified: row.verified,
    category: row.category,
    shortsCount: Number(row.shortsCount),
  }))

  const ranks = rows.map((row) => row.rank)

  return { items, ranks, total }
}
