import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { feedQuerySchema } from '@/lib/validation/feed'
import {
  buildFeedWhereClause,
  buildFeedOrderBy,
  buildFeedSelect,
} from '@/lib/api/feed-query-builder'
import { calculateScore, applyDiversityFilter } from '@/lib/utils/feed-scoring'
import { haversineDistance } from '@/lib/utils/haversine'
import type { FeedShort, FeedResponse } from '@/lib/types/feed'

interface DbShort {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: Date | null
  latitude: number | null
  longitude: number | null
  ctaLink: string | null
  stats: {
    views: number
    likes: number
    comments: number
    ctaClicks: number
  } | null
  company: {
    id: string
    companyName: string
    slug: string
    logo: string | null
    viesVerified: boolean
    city: string | null
  } | null
  category: {
    id: string
    name: string
    slug: string
  } | null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())
    const params = feedQuerySchema.parse(rawParams)

    // For 'following' sort, require authentication and filter by followed companies
    let followCompanyIds: string[] | null = null
    if (params.sort === 'following') {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required for following feed' },
          { status: 401 }
        )
      }

      const follows = await prisma.follow.findMany({
        where: { userId: session.user.id },
        select: { companyId: true },
      })

      followCompanyIds = follows.map((f) => f.companyId)

      if (followCompanyIds.length === 0) {
        return NextResponse.json({
          shorts: [],
          nextPage: null,
          totalCount: 0,
          hasMore: false,
        } satisfies FeedResponse)
      }
    }

    // Build query
    const where = {
      ...buildFeedWhereClause(params),
      ...(followCompanyIds ? { companyId: { in: followCompanyIds } } : {}),
    }
    const orderBy = buildFeedOrderBy(params.sort)
    const select = buildFeedSelect()

    // Fetch with overfetch for algorithmic sorting
    const overfetchMultiplier = params.sort === 'algorithmic' ? 3 : 1
    const fetchLimit = params.limit * overfetchMultiplier

    const [total, shorts] = await Promise.all([
      prisma.short.count({ where }),
      prisma.short.findMany({
        where,
        select,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: fetchLimit,
      }),
    ])

    // Transform to FeedShort format
    let feedShorts: FeedShort[] = (shorts as DbShort[]).map(short => {
      const userLocation = params.lat !== undefined && params.lng !== undefined
        ? { lat: params.lat, lng: params.lng }
        : undefined

      const distance = userLocation && short.latitude && short.longitude
        ? haversineDistance(userLocation, { lat: short.latitude, lng: short.longitude })
        : null

      return {
        id: short.id,
        title: short.title,
        thumbnailUrl: short.thumbnailUrl,
        hlsPlaylistUrl: short.hlsPlaylistUrl,
        duration: short.duration,
        publishedAt: short.publishedAt?.toISOString() ?? new Date().toISOString(),
        views: short.stats?.views ?? 0,
        likes: short.stats?.likes ?? 0,
        comments: short.stats?.comments ?? 0,
        ctaClicks: short.stats?.ctaClicks ?? 0,
        location: short.company?.city ?? null,
        distance: distance !== null ? Math.round(distance * 10) / 10 : null,
        company: {
          id: short.company?.id ?? '',
          name: short.company?.companyName ?? '',
          slug: short.company?.slug ?? '',
          logo: short.company?.logo ?? null,
          verified: short.company?.viesVerified ?? false,
        },
        category: {
          id: short.category?.id ?? '',
          name: short.category?.name ?? '',
          slug: short.category?.slug ?? '',
        },
        ctaLink: short.ctaLink,
      }
    })

    // Apply distance filter for geolocation (accurate post-fetch filtering)
    if (params.lat !== undefined && params.lng !== undefined && params.radius) {
      feedShorts = feedShorts.filter(short =>
        short.distance !== null && short.distance <= params.radius!
      )
    }

    // Apply sorting
    if (params.sort === 'algorithmic') {
      const userLocation = params.lat !== undefined && params.lng !== undefined
        ? { lat: params.lat, lng: params.lng }
        : undefined

      // Calculate scores and sort
      const scoredShorts = feedShorts.map(short => ({
        ...short,
        _score: calculateScore({
          publishedAt: new Date(short.publishedAt),
          stats: {
            views: short.views,
            likes: short.likes,
            ctaClicks: short.ctaClicks,
          },
          latitude: short.distance !== null ? params.lat : null,
          longitude: short.distance !== null ? params.lng : null,
        }, { userLocation }),
      }))

      scoredShorts.sort((a, b) => b._score - a._score)

      // Apply diversity filter
      feedShorts = applyDiversityFilter(scoredShorts, 2, 20).slice(0, params.limit)
    } else if (params.sort === 'popular') {
      // Sort by engagement score
      feedShorts.sort((a, b) => {
        const scoreA = a.views + a.likes * 2
        const scoreB = b.views + b.likes * 2
        return scoreB - scoreA
      })
      feedShorts = feedShorts.slice(0, params.limit)
    } else if (params.sort === 'trending') {
      // Sort by engagement rate (recent content weighted higher)
      feedShorts.sort((a, b) => {
        const now = Date.now()
        const ageA = (now - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60)
        const ageB = (now - new Date(b.publishedAt).getTime()) / (1000 * 60 * 60)

        const recencyBoostA = Math.exp(-ageA / 24)
        const recencyBoostB = Math.exp(-ageB / 24)

        const rateA = (a.views > 0 ? (a.likes + a.ctaClicks) / a.views : 0) * recencyBoostA
        const rateB = (b.views > 0 ? (b.likes + b.ctaClicks) / b.views : 0) * recencyBoostB

        return rateB - rateA
      })
      feedShorts = feedShorts.slice(0, params.limit)
    } else {
      feedShorts = feedShorts.slice(0, params.limit)
    }

    // Calculate pagination
    const hasMore = params.page * params.limit < total
    const nextPage = hasMore ? params.page + 1 : null

    return NextResponse.json({
      shorts: feedShorts,
      nextPage,
      totalCount: total,
      hasMore,
    } satisfies FeedResponse)

  } catch (error) {
    console.error('Feed API error:', error)

    if (error instanceof Error && error.name === 'ZodError') {
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
