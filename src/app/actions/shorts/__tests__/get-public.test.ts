import { describe, it, expect, vi, beforeEach } from "vitest"
import { getPublicShort } from "../get-public"
import { prisma } from "@/lib/prisma"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/lib/prisma", () => ({
  prisma: {
    short: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    shortStats: {
      update: vi.fn(),
    },
  },
}))

const mockPrisma = vi.mocked(prisma)

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockShortFromDb = {
  id: "short-123",
  title: "Test Video Title",
  description: "A description of the video",
  thumbnailUrl: "https://cdn.example.com/thumb.jpg",
  hlsPlaylistUrl: "https://cdn.example.com/video.m3u8",
  duration: 30,
  publishedAt: new Date("2025-12-01T10:00:00Z"),
  ctaLink: "https://example.com/offer",
  latitude: 52.2297,
  longitude: 21.0122,
  stats: {
    views: 1500,
    likes: 120,
    ctaClicks: 45,
  },
  company: {
    id: "company-123",
    companyName: "Test Company",
    slug: "test-company",
    logo: "https://cdn.example.com/logo.jpg",
    viesVerified: true,
    city: "Warsaw",
    description: "A test company",
  },
  category: {
    id: "category-123",
    name: "Technology",
    slug: "technology",
  },
  tags: [
    { tag: { name: "Tech", slug: "tech" } },
    { tag: { name: "Innovation", slug: "innovation" } },
  ],
}

const mockRelatedShorts = [
  {
    id: "related-1",
    title: "Related Video 1",
    thumbnailUrl: "https://cdn.example.com/related1-thumb.jpg",
    hlsPlaylistUrl: "https://cdn.example.com/related1.m3u8",
    duration: 25,
    publishedAt: new Date("2025-11-28T10:00:00Z"),
    ctaLink: null,
    stats: {
      views: 500,
      likes: 30,
      ctaClicks: 10,
    },
    company: {
      id: "company-456",
      companyName: "Other Company",
      slug: "other-company",
      logo: null,
      viesVerified: false,
      city: "Krakow",
    },
    category: {
      id: "category-123",
      name: "Technology",
      slug: "technology",
    },
  },
  {
    id: "related-2",
    title: "Related Video 2",
    thumbnailUrl: null,
    hlsPlaylistUrl: "https://cdn.example.com/related2.m3u8",
    duration: 45,
    publishedAt: new Date("2025-11-29T10:00:00Z"),
    ctaLink: "https://example.com/related-offer",
    stats: null,
    company: {
      id: "company-789",
      companyName: "Third Company",
      slug: "third-company",
      logo: "https://cdn.example.com/third-logo.jpg",
      viesVerified: true,
      city: null,
    },
    category: {
      id: "category-123",
      name: "Technology",
      slug: "technology",
    },
  },
]

describe("getPublicShort Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error from error handling tests
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("fetches published short with all data correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue(mockRelatedShorts)
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result).not.toBeNull()
      expect(result?.id).toBe("short-123")
      expect(result?.title).toBe("Test Video Title")
      expect(result?.description).toBe("A description of the video")
      expect(result?.views).toBe(1500)
      expect(result?.likes).toBe(120)
      expect(result?.ctaClicks).toBe(45)
      expect(result?.ctaLink).toBe("https://example.com/offer")
      expect(result?.company.name).toBe("Test Company")
      expect(result?.company.verified).toBe(true)
      expect(result?.category.name).toBe("Technology")
      expect(result?.tags).toHaveLength(2)
      expect(result?.tags[0]).toEqual({ name: "Tech", slug: "tech" })
    })

    it("returns related shorts from same category", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue(mockRelatedShorts)
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.relatedShorts).toHaveLength(2)
      expect(result?.relatedShorts[0].id).toBe("related-1")
      expect(result?.relatedShorts[0].company.name).toBe("Other Company")
      expect(result?.relatedShorts[1].id).toBe("related-2")

      // Verify findMany was called with correct parameters
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PUBLISHED",
            categoryId: "category-123",
            id: { not: "short-123" },
          }),
          take: 6,
        })
      )
    })

    it("queries only PUBLISHED shorts", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      await getPublicShort("short-123")

      // Assert
      expect(mockPrisma.short.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "short-123",
            status: "PUBLISHED",
          },
        })
      )
    })

    it("increments view count on successful fetch", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      await getPublicShort("short-123")

      // Wait for the fire-and-forget promise
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Assert - incrementViewCount is called (fire-and-forget)
      expect(mockPrisma.shortStats.update).toHaveBeenCalledWith({
        where: { shortId: "short-123" },
        data: {
          views: { increment: 1 },
        },
      })
    })

    it("transforms company data correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.company).toEqual({
        id: "company-123",
        name: "Test Company",
        slug: "test-company",
        logo: "https://cdn.example.com/logo.jpg",
        verified: true,
      })
    })

    it("transforms category data correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.category).toEqual({
        id: "category-123",
        name: "Technology",
        slug: "technology",
      })
    })
  })

  // ===========================================================================
  // NOT FOUND CASES
  // ===========================================================================

  describe("Not Found Cases", () => {
    it("returns null when short does not exist", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(null)

      // Act
      const result = await getPublicShort("nonexistent-id")

      // Assert
      expect(result).toBeNull()
      expect(mockPrisma.short.findMany).not.toHaveBeenCalled()
      expect(mockPrisma.shortStats.update).not.toHaveBeenCalled()
    })

    it("returns null when short exists but is not PUBLISHED", async () => {
      // Arrange - findFirst returns null because status filter excludes draft/archived
      mockPrisma.short.findFirst.mockResolvedValue(null)

      // Act
      const result = await getPublicShort("draft-short-id")

      // Assert
      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    it("returns null when database error occurs on findFirst", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockRejectedValue(new Error("Database connection failed"))

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching public short:",
        expect.any(Error)
      )
    })

    it("returns null when database error occurs on findMany", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockRejectedValue(new Error("Query timeout"))
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })

    it("does not fail when view count increment fails", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockRejectedValue(new Error("Stats update failed"))

      // Act
      const result = await getPublicShort("short-123")

      // Wait for fire-and-forget promise
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Assert - Main function should succeed
      expect(result).not.toBeNull()
      expect(result?.id).toBe("short-123")
      // View count increment failure is caught and logged
      expect(console.error).toHaveBeenCalled()
    })

    it("handles Prisma unique constraint error gracefully", async () => {
      // Arrange
      const prismaError = Object.assign(new Error("Unique constraint"), {
        code: "P2002",
        meta: { target: ["shortId"] },
      })
      mockPrisma.short.findFirst.mockRejectedValue(prismaError)

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles short with no related shorts", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.relatedShorts).toHaveLength(0)
    })

    it("handles short with no tags", async () => {
      // Arrange
      const shortWithNoTags = {
        ...mockShortFromDb,
        tags: [],
      }
      mockPrisma.short.findFirst.mockResolvedValue(shortWithNoTags)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.tags).toHaveLength(0)
    })

    it("handles short with no description", async () => {
      // Arrange
      const shortWithNoDescription = {
        ...mockShortFromDb,
        description: null,
      }
      mockPrisma.short.findFirst.mockResolvedValue(shortWithNoDescription)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.description).toBeNull()
    })

    it("handles short with no ctaLink", async () => {
      // Arrange
      const shortWithNoCta = {
        ...mockShortFromDb,
        ctaLink: null,
      }
      mockPrisma.short.findFirst.mockResolvedValue(shortWithNoCta)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.ctaLink).toBeNull()
    })

    it("handles short with null stats", async () => {
      // Arrange
      const shortWithNullStats = {
        ...mockShortFromDb,
        stats: null,
      }
      mockPrisma.short.findFirst.mockResolvedValue(shortWithNullStats)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.views).toBe(0)
      expect(result?.likes).toBe(0)
      expect(result?.ctaClicks).toBe(0)
    })

    it("handles short with null publishedAt", async () => {
      // Arrange
      const shortWithNullPublishedAt = {
        ...mockShortFromDb,
        publishedAt: null,
      }
      mockPrisma.short.findFirst.mockResolvedValue(shortWithNullPublishedAt)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.publishedAt).toBeDefined()
      // Should fall back to current date
      expect(new Date(result!.publishedAt).getTime()).toBeGreaterThan(0)
    })

    it("handles related short with null stats", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue(mockRelatedShorts)
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert - related-2 has null stats
      expect(result?.relatedShorts[1].views).toBe(0)
      expect(result?.relatedShorts[1].likes).toBe(0)
      expect(result?.relatedShorts[1].ctaClicks).toBe(0)
    })

    it("handles company with null city", async () => {
      // Arrange
      const shortWithNoCity = {
        ...mockShortFromDb,
        company: {
          ...mockShortFromDb.company,
          city: null,
        },
      }
      mockPrisma.short.findFirst.mockResolvedValue(shortWithNoCity)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.location).toBeNull()
    })

    it("handles empty string id", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(null)

      // Act
      const result = await getPublicShort("")

      // Assert
      expect(result).toBeNull()
      expect(mockPrisma.short.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "",
            status: "PUBLISHED",
          },
        })
      )
    })

    it("handles special characters in id", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(null)

      // Act
      const result = await getPublicShort("short-<script>alert(1)</script>")

      // Assert
      expect(result).toBeNull()
    })

    it("limits related shorts to 6", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      await getPublicShort("short-123")

      // Assert
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 6,
        })
      )
    })

    it("orders related shorts by publishedAt descending", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      await getPublicShort("short-123")

      // Assert
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { publishedAt: "desc" },
        })
      )
    })

    it("sets distance to null in response", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue(mockRelatedShorts)
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.distance).toBeNull()
      expect(result?.relatedShorts[0].distance).toBeNull()
      expect(result?.relatedShorts[1].distance).toBeNull()
    })
  })

  // ===========================================================================
  // DATA TRANSFORMATION
  // ===========================================================================

  describe("Data Transformation", () => {
    it("transforms publishedAt to ISO string", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.publishedAt).toBe("2025-12-01T10:00:00.000Z")
    })

    it("transforms tags array correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.tags).toEqual([
        { name: "Tech", slug: "tech" },
        { name: "Innovation", slug: "innovation" },
      ])
    })

    it("maps companyName to name in company object", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.company.name).toBe("Test Company")
      expect((result?.company as Record<string, unknown>).companyName).toBeUndefined()
    })

    it("maps viesVerified to verified in company object", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.company.verified).toBe(true)
      expect((result?.company as Record<string, unknown>).viesVerified).toBeUndefined()
    })

    it("uses company city as location", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortFromDb)
      mockPrisma.short.findMany.mockResolvedValue([])
      mockPrisma.shortStats.update.mockResolvedValue({ shortId: "short-123", views: 1501 })

      // Act
      const result = await getPublicShort("short-123")

      // Assert
      expect(result?.location).toBe("Warsaw")
    })
  })
})
