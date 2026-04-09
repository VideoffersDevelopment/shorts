import { Prisma } from '@prisma/client'
import type { FeedQueryParams } from '@/lib/validation/feed'

export function buildFeedWhereClause(params: FeedQueryParams): Prisma.ShortWhereInput {
  const where: Prisma.ShortWhereInput = {
    status: 'PUBLISHED',
  }

  // Category filter
  if (params.categoryIds?.length) {
    where.categoryId = { in: params.categoryIds }
  }

  // Tags filter
  if (params.tags?.length) {
    where.tags = {
      some: {
        tag: {
          slug: { in: params.tags }
        }
      }
    }
  }

  // Verified companies only
  if (params.verifiedOnly) {
    where.company = {
      viesVerified: true
    }
  }

  // Location filter (basic - full filtering done post-query for accuracy)
  if (params.lat !== undefined && params.lng !== undefined && params.radius) {
    // Bounding box for initial filtering (optimization)
    const latDelta = params.radius / 111 // ~111km per degree latitude
    const lngDelta = params.radius / (111 * Math.cos(params.lat * Math.PI / 180))

    where.latitude = {
      gte: params.lat - latDelta,
      lte: params.lat + latDelta,
    }
    where.longitude = {
      gte: params.lng - lngDelta,
      lte: params.lng + lngDelta,
    }
  }

  return where
}

export function buildFeedOrderBy(
  sort: FeedQueryParams['sort']
): Prisma.ShortOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ publishedAt: 'desc' }]

    case 'popular':
      // Order by engagement (views + likes*2) in last 7 days
      // Note: For complex ordering, we'll sort in application layer
      return [{ publishedAt: 'desc' }] // Fallback, real sorting in app

    case 'trending':
      // Similar to popular, but emphasizes recent engagement
      return [{ publishedAt: 'desc' }]

    case 'following':
      // Requires user context, sorted by publishedAt
      return [{ publishedAt: 'desc' }]

    case 'algorithmic':
    default:
      // Algorithmic sorting done in application layer after fetch
      return [{ publishedAt: 'desc' }]
  }
}

export function buildFeedSelect(): Prisma.ShortSelect {
  return {
    id: true,
    title: true,
    thumbnailUrl: true,
    hlsPlaylistUrl: true,
    duration: true,
    publishedAt: true,
    latitude: true,
    longitude: true,
    ctaLink: true,
    stats: {
      select: {
        views: true,
        likes: true,
        comments: true,
        ctaClicks: true,
      }
    },
    company: {
      select: {
        id: true,
        companyName: true,
        slug: true,
        logo: true,
        viesVerified: true,
        city: true,
      }
    },
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      }
    }
  }
}
