import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  trackShortView,
  trackCtaClick,
  trackLike,
  trackShare,
  getShortStats,
  trackEvent
} from "../stats"
import { prisma } from "@/lib/prisma"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shortStats: {
      upsert: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

const mockPrisma = vi.mocked(prisma)

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockShortId = "short-123"

const mockStats = {
  id: "stats-1",
  shortId: mockShortId,
  views: 100,
  likes: 25,
  ctaClicks: 10,
  uniqueViews: 5, // Used as shares placeholder
  createdAt: new Date(),
  updatedAt: new Date()
}

describe("Stats Tracking Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for expected errors
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  // ===========================================================================
  // trackShortView
  // ===========================================================================

  describe("trackShortView", () => {
    it("increments view count for existing stats", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackShortView(mockShortId)

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith({
        where: { shortId: mockShortId },
        update: {
          views: { increment: 1 }
        },
        create: {
          shortId: mockShortId,
          views: 1
        }
      })
    })

    it("creates stats with views=1 for new short", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue({ ...mockStats, views: 1 })

      // Act
      await trackShortView(mockShortId)

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            shortId: mockShortId,
            views: 1
          }
        })
      )
    })

    it("does not throw on database error", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockRejectedValue(new Error("Database error"))

      // Act & Assert - Should not throw
      await expect(trackShortView(mockShortId)).resolves.toBeUndefined()
      expect(console.error).toHaveBeenCalled()
    })

    it("logs error message on failure", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockRejectedValue(new Error("Connection failed"))

      // Act
      await trackShortView(mockShortId)

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        `[stats] Failed to track view for ${mockShortId}:`,
        expect.any(Error)
      )
    })
  })

  // ===========================================================================
  // trackCtaClick
  // ===========================================================================

  describe("trackCtaClick", () => {
    it("increments ctaClicks count for existing stats", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackCtaClick(mockShortId)

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith({
        where: { shortId: mockShortId },
        update: {
          ctaClicks: { increment: 1 }
        },
        create: {
          shortId: mockShortId,
          ctaClicks: 1
        }
      })
    })

    it("creates stats with ctaClicks=1 for new short", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue({ ...mockStats, ctaClicks: 1 })

      // Act
      await trackCtaClick(mockShortId)

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            shortId: mockShortId,
            ctaClicks: 1
          }
        })
      )
    })

    it("does not throw on database error", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockRejectedValue(new Error("Database error"))

      // Act & Assert
      await expect(trackCtaClick(mockShortId)).resolves.toBeUndefined()
    })
  })

  // ===========================================================================
  // trackLike
  // ===========================================================================

  describe("trackLike", () => {
    it("increments likes count for existing stats", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackLike(mockShortId)

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith({
        where: { shortId: mockShortId },
        update: {
          likes: { increment: 1 }
        },
        create: {
          shortId: mockShortId,
          likes: 1
        }
      })
    })

    it("creates stats with likes=1 for new short", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue({ ...mockStats, likes: 1 })

      // Act
      await trackLike(mockShortId)

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            shortId: mockShortId,
            likes: 1
          }
        })
      )
    })

    it("does not throw on database error", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockRejectedValue(new Error("Database error"))

      // Act & Assert
      await expect(trackLike(mockShortId)).resolves.toBeUndefined()
    })
  })

  // ===========================================================================
  // trackShare
  // ===========================================================================

  describe("trackShare", () => {
    it("increments uniqueViews (placeholder for shares) count", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackShare(mockShortId)

      // Assert - Uses uniqueViews as placeholder for shares
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith({
        where: { shortId: mockShortId },
        update: {
          uniqueViews: { increment: 1 }
        },
        create: {
          shortId: mockShortId,
          uniqueViews: 1
        }
      })
    })

    it("creates stats with uniqueViews=1 for new short", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue({ ...mockStats, uniqueViews: 1 })

      // Act
      await trackShare(mockShortId)

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            shortId: mockShortId,
            uniqueViews: 1
          }
        })
      )
    })

    it("does not throw on database error", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockRejectedValue(new Error("Database error"))

      // Act & Assert
      await expect(trackShare(mockShortId)).resolves.toBeUndefined()
    })
  })

  // ===========================================================================
  // getShortStats
  // ===========================================================================

  describe("getShortStats", () => {
    it("returns stats for existing short", async () => {
      // Arrange
      mockPrisma.shortStats.findUnique.mockResolvedValue(mockStats)

      // Act
      const result = await getShortStats(mockShortId)

      // Assert
      expect(result).toEqual({
        views: 100,
        likes: 25,
        ctaClicks: 10,
        shares: 5 // From uniqueViews
      })
    })

    it("returns null for non-existent short", async () => {
      // Arrange
      mockPrisma.shortStats.findUnique.mockResolvedValue(null)

      // Act
      const result = await getShortStats(mockShortId)

      // Assert
      expect(result).toBeNull()
    })

    it("returns null on database error", async () => {
      // Arrange
      mockPrisma.shortStats.findUnique.mockRejectedValue(new Error("Database error"))

      // Act
      const result = await getShortStats(mockShortId)

      // Assert
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })

    it("maps uniqueViews to shares in response", async () => {
      // Arrange
      mockPrisma.shortStats.findUnique.mockResolvedValue({
        ...mockStats,
        uniqueViews: 42
      })

      // Act
      const result = await getShortStats(mockShortId)

      // Assert
      expect(result?.shares).toBe(42)
    })
  })

  // ===========================================================================
  // trackEvent (convenience function)
  // ===========================================================================

  describe("trackEvent", () => {
    it("calls trackShortView for 'view' event", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackEvent(mockShortId, "view")

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { views: { increment: 1 } }
        })
      )
    })

    it("calls trackCtaClick for 'cta_click' event", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackEvent(mockShortId, "cta_click")

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { ctaClicks: { increment: 1 } }
        })
      )
    })

    it("calls trackLike for 'like' event", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackEvent(mockShortId, "like")

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { likes: { increment: 1 } }
        })
      )
    })

    it("calls trackShare for 'share' event", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackEvent(mockShortId, "share")

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { uniqueViews: { increment: 1 } }
        })
      )
    })

    it("logs warning for unknown event type", async () => {
      // Arrange
      vi.spyOn(console, "warn").mockImplementation(() => {})

      // Act - TypeScript will complain, but testing runtime behavior
      await trackEvent(mockShortId, "unknown" as "view")

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        "[stats] Unknown event type: unknown"
      )
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles empty shortId", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act
      await trackShortView("")

      // Assert - Should still try to upsert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shortId: "" }
        })
      )
    })

    it("handles concurrent tracking calls", async () => {
      // Arrange
      mockPrisma.shortStats.upsert.mockResolvedValue(mockStats)

      // Act - Fire multiple tracking calls concurrently
      await Promise.all([
        trackShortView(mockShortId),
        trackCtaClick(mockShortId),
        trackLike(mockShortId),
        trackShare(mockShortId)
      ])

      // Assert
      expect(mockPrisma.shortStats.upsert).toHaveBeenCalledTimes(4)
    })

    it("returns null from getShortStats without throwing", async () => {
      // Arrange
      mockPrisma.shortStats.findUnique.mockResolvedValue(null)

      // Act
      const result = await getShortStats("nonexistent-short")

      // Assert
      expect(result).toBeNull()
    })

    it("handles stats with zero values", async () => {
      // Arrange
      mockPrisma.shortStats.findUnique.mockResolvedValue({
        ...mockStats,
        views: 0,
        likes: 0,
        ctaClicks: 0,
        uniqueViews: 0
      })

      // Act
      const result = await getShortStats(mockShortId)

      // Assert
      expect(result).toEqual({
        views: 0,
        likes: 0,
        ctaClicks: 0,
        shares: 0
      })
    })
  })
})
