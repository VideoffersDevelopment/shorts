"use server"

import { prisma } from '@/lib/prisma'
import type { FeedShort } from '@/lib/types/feed'
import type { LikeType } from '@prisma/client'

export interface UserInteractionState {
  reaction: {
    liked: boolean
    type: LikeType | null
    counts: Partial<Record<string, number>>
    totalLikes: number
  }
  following: boolean
  followersCount: number
}

export interface PublicShortDetail extends FeedShort {
  description: string | null
  comments: number
  tags: Array<{ name: string; slug: string }>
  relatedShorts: FeedShort[]
  userInteraction: UserInteractionState | null
}

export async function getPublicShort(
  id: string,
  userId?: string | null
): Promise<PublicShortDetail | null> {
  try {
    const short = await prisma.short.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        hlsPlaylistUrl: true,
        duration: true,
        publishedAt: true,
        ctaLink: true,
        latitude: true,
        longitude: true,
        stats: {
          select: {
            views: true,
            likes: true,
            comments: true,
            ctaClicks: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            logo: true,
            viesVerified: true,
            city: true,
            description: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!short) return null

    // Increment view count (fire and forget)
    incrementViewCount(id).catch(console.error)

    // Fetch related shorts (same category, excluding current)
    const relatedShorts = await prisma.short.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: short.category?.id,
        id: { not: id },
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        hlsPlaylistUrl: true,
        duration: true,
        publishedAt: true,
        ctaLink: true,
        stats: {
          select: {
            views: true,
            likes: true,
            ctaClicks: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            logo: true,
            viesVerified: true,
            city: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    })

    // Fetch user interaction state (reaction + follow)
    let userInteraction: UserInteractionState | null = null
    if (userId) {
      const [userLike, groupedCounts, followRecord, followersCount] = await Promise.all([
        prisma.like.findUnique({
          where: { userId_shortId: { userId, shortId: id } },
          select: { type: true },
        }),
        prisma.like.groupBy({
          by: ['type'],
          where: { shortId: id },
          _count: true,
        }),
        prisma.follow.findUnique({
          where: { userId_companyId: { userId, companyId: short.company!.id } },
          select: { id: true },
        }),
        prisma.follow.count({
          where: { companyId: short.company!.id },
        }),
      ])

      const counts: Partial<Record<string, number>> = {}
      let totalLikes = 0
      for (const group of groupedCounts) {
        if (group.type === 'DISLIKE') continue
        counts[group.type] = group._count
        if (group.type === 'LIKE') totalLikes = group._count
      }

      userInteraction = {
        reaction: {
          liked: userLike !== null,
          type: userLike?.type ?? null,
          counts,
          totalLikes,
        },
        following: followRecord !== null,
        followersCount,
      }
    }

    return {
      id: short.id,
      title: short.title,
      description: short.description,
      thumbnailUrl: short.thumbnailUrl,
      hlsPlaylistUrl: short.hlsPlaylistUrl,
      duration: short.duration,
      publishedAt: short.publishedAt?.toISOString() ?? new Date().toISOString(),
      views: short.stats?.views ?? 0,
      likes: short.stats?.likes ?? 0,
      comments: short.stats?.comments ?? 0,
      ctaClicks: short.stats?.ctaClicks ?? 0,
      location: short.company?.city ?? null,
      distance: null,
      company: {
        id: short.company!.id,
        name: short.company!.companyName,
        slug: short.company!.slug,
        logo: short.company!.logo,
        verified: short.company!.viesVerified,
      },
      category: {
        id: short.category!.id,
        name: short.category!.name,
        slug: short.category!.slug,
      },
      ctaLink: short.ctaLink,
      tags: short.tags.map((t) => ({
        name: t.tag.name,
        slug: t.tag.slug,
      })),
      userInteraction,
      relatedShorts: relatedShorts.map((rs) => ({
        id: rs.id,
        title: rs.title,
        thumbnailUrl: rs.thumbnailUrl,
        hlsPlaylistUrl: rs.hlsPlaylistUrl,
        duration: rs.duration,
        publishedAt: rs.publishedAt?.toISOString() ?? new Date().toISOString(),
        views: rs.stats?.views ?? 0,
        likes: rs.stats?.likes ?? 0,
        ctaClicks: rs.stats?.ctaClicks ?? 0,
        location: rs.company?.city ?? null,
        distance: null,
        company: {
          id: rs.company!.id,
          name: rs.company!.companyName,
          slug: rs.company!.slug,
          logo: rs.company!.logo,
          verified: rs.company!.viesVerified,
        },
        category: {
          id: rs.category!.id,
          name: rs.category!.name,
          slug: rs.category!.slug,
        },
        ctaLink: rs.ctaLink,
      })),
    }
  } catch (error) {
    console.error('Error fetching public short:', error)
    return null
  }
}

async function incrementViewCount(shortId: string): Promise<void> {
  await prisma.shortStats.update({
    where: { shortId },
    data: {
      views: { increment: 1 },
    },
  })
}
