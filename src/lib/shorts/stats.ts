import { prisma } from "@/lib/prisma"

/**
 * Stats tracking utilities for shorts
 *
 * These functions update ShortStats model for analytics.
 * All functions are non-blocking and should not throw.
 */

/**
 * Track a view on a short
 * Called from the public short page server component
 */
export async function trackShortView(shortId: string): Promise<void> {
  try {
    await prisma.shortStats.upsert({
      where: { shortId },
      update: {
        views: { increment: 1 }
      },
      create: {
        shortId,
        views: 1
      }
    })
  } catch (error) {
    console.error(`[stats] Failed to track view for ${shortId}:`, error)
  }
}

/**
 * Track a CTA click on a short
 * Called from the public tracking API endpoint
 */
export async function trackCtaClick(shortId: string): Promise<void> {
  try {
    await prisma.shortStats.upsert({
      where: { shortId },
      update: {
        ctaClicks: { increment: 1 }
      },
      create: {
        shortId,
        ctaClicks: 1
      }
    })
  } catch (error) {
    console.error(`[stats] Failed to track CTA click for ${shortId}:`, error)
  }
}

/**
 * Track a like on a short
 * Called from the public tracking API endpoint
 */
export async function trackLike(shortId: string): Promise<void> {
  try {
    await prisma.shortStats.upsert({
      where: { shortId },
      update: {
        likes: { increment: 1 }
      },
      create: {
        shortId,
        likes: 1
      }
    })
  } catch (error) {
    console.error(`[stats] Failed to track like for ${shortId}:`, error)
  }
}

/**
 * Track a share on a short
 * Called from the public tracking API endpoint
 * Note: shares is tracked in uniqueViews field as a placeholder
 * until a proper shares column is added
 */
export async function trackShare(shortId: string): Promise<void> {
  try {
    // Using uniqueViews as a placeholder for shares count
    // This should be updated when a proper shares column is added
    await prisma.shortStats.upsert({
      where: { shortId },
      update: {
        uniqueViews: { increment: 1 }
      },
      create: {
        shortId,
        uniqueViews: 1
      }
    })
  } catch (error) {
    console.error(`[stats] Failed to track share for ${shortId}:`, error)
  }
}

/**
 * Get stats for a short
 */
export async function getShortStats(shortId: string): Promise<{
  views: number
  likes: number
  ctaClicks: number
  shares: number
} | null> {
  try {
    const stats = await prisma.shortStats.findUnique({
      where: { shortId }
    })

    if (!stats) {
      return null
    }

    return {
      views: stats.views,
      likes: stats.likes,
      ctaClicks: stats.ctaClicks,
      shares: stats.uniqueViews // placeholder
    }
  } catch (error) {
    console.error(`[stats] Failed to get stats for ${shortId}:`, error)
    return null
  }
}

export type StatsEventType = "view" | "cta_click" | "like" | "share"

/**
 * Track an event by type
 * Convenience function for the API endpoint
 */
export async function trackEvent(
  shortId: string,
  eventType: StatsEventType
): Promise<void> {
  switch (eventType) {
    case "view":
      await trackShortView(shortId)
      break
    case "cta_click":
      await trackCtaClick(shortId)
      break
    case "like":
      await trackLike(shortId)
      break
    case "share":
      await trackShare(shortId)
      break
    default:
      console.warn(`[stats] Unknown event type: ${eventType}`)
  }
}
