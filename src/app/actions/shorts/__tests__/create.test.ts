import { describe, it, expect, vi, beforeEach } from "vitest"
import { createShortAction } from "../create"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Session } from "next-auth"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/lib/auth")
vi.mock("@/lib/prisma", () => ({
  prisma: {
    companyProfile: {
      findUnique: vi.fn()
    },
    short: {
      count: vi.fn(),
      create: vi.fn()
    },
    shortStats: {
      create: vi.fn()
    },
    tag: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    shortTag: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}))

const mockAuth = vi.mocked(auth)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockPrisma = vi.mocked(prisma)

// ===========================================================================
// TEST DATA
// ===========================================================================

const validSession: Session = {
  user: {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    role: "COMPANY"
  },
  expires: new Date(Date.now() + 86400000).toISOString()
}

const mockCompanyProfile = {
  id: "company-123",
  userId: "user-123",
  status: "ACTIVE" as const
}

const validInput = {
  rawVideoKey: "videos/test-video.mp4",
  title: "Test Short Video",
  description: "A test description",
  categoryId: "clxxxxxxxxxxxxxxxxx1", // CUID format
  tags: ["tag1", "tag2"],
  address: "Test Location",
  ctaLink: "https://example.com",
  thumbnailUrl: "https://example.com/thumb.jpg",
  customThumbnail: true,
  duration: 30,
  aspectRatio: "9:16"
}

const mockCreatedShort = {
  id: "short-123",
  companyId: "company-123",
  rawVideoKey: "videos/test-video.mp4",
  title: "Test Short Video",
  status: "DRAFT",
  createdAt: new Date(),
  updatedAt: new Date()
}

describe("createShortAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("creates short with valid input and returns shortId", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(0)
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          short: {
            create: vi.fn().mockResolvedValue(mockCreatedShort)
          },
          shortStats: {
            create: vi.fn().mockResolvedValue({ id: "stats-1", shortId: "short-123" })
          },
          tag: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation((data) => ({
              id: `tag-${data.data.slug}`,
              name: data.data.name,
              slug: data.data.slug,
              usageCount: 0
            })),
            update: vi.fn()
          },
          shortTag: {
            create: vi.fn()
          }
        }
        return fn(tx)
      })

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.shortId).toBe("short-123")
      }

      // CRITICAL: Verify revalidatePath was called
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/panel/shorts", "page")
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("creates short with minimal required fields", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(0)
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          short: {
            create: vi.fn().mockResolvedValue(mockCreatedShort)
          },
          shortStats: {
            create: vi.fn().mockResolvedValue({ id: "stats-1", shortId: "short-123" })
          },
          tag: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
          },
          shortTag: {
            create: vi.fn()
          }
        }
        return fn(tx)
      })

      const minimalInput = {
        rawVideoKey: "videos/minimal.mp4",
        title: "Minimal Short",
        categoryId: "clxxxxxxxxxxxxxxxxx2"
      }

      // Act
      const result = await createShortAction(minimalInput)

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/panel/shorts", "page")
    })

    it("creates and associates tags correctly", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(0)

      const tagCreateMock = vi.fn()
      const shortTagCreateMock = vi.fn()
      const tagUpdateMock = vi.fn()

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          short: {
            create: vi.fn().mockResolvedValue(mockCreatedShort)
          },
          shortStats: {
            create: vi.fn().mockResolvedValue({ id: "stats-1", shortId: "short-123" })
          },
          tag: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: tagCreateMock.mockImplementation((data) => ({
              id: `tag-${data.data.slug}`,
              name: data.data.name,
              slug: data.data.slug,
              usageCount: 0
            })),
            update: tagUpdateMock
          },
          shortTag: {
            create: shortTagCreateMock
          }
        }
        return fn(tx)
      })

      const inputWithTags = {
        rawVideoKey: "videos/test.mp4",
        title: "Test With Tags",
        categoryId: "clxxxxxxxxxxxxxxxxx3",
        tags: ["NewTag", "AnotherTag"]
      }

      // Act
      const result = await createShortAction(inputWithTags)

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe("Auth Failures", () => {
    it("returns error when not authenticated (null session)", async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
        expect(result.error).toBe("errors.unauthorized")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when session has no user", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: undefined,
        expires: new Date(Date.now() + 86400000).toISOString()
      } as Session)

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when session user has no id", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString()
      } as Session)

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe("Authorization Failures", () => {
    it("returns error when user is not COMPANY role", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        ...validSession,
        user: { ...validSession.user, role: "USER" }
      })

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_COMPANY")
        expect(result.error).toBe("errors.unauthorized")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when company profile does not exist", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NO_COMPANY_PROFILE")
        expect(result.error).toBe("errors.unauthorized")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when company profile is not ACTIVE", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        ...mockCompanyProfile,
        status: "PENDING" as const
      })

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("COMPANY_NOT_ACTIVE")
        expect(result.error).toBe("errors.unauthorized")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe("Validation Failures", () => {
    it("returns error for missing rawVideoKey", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)

      const invalidInput = {
        title: "Test",
        categoryId: "clxxxxxxxxxxxxxxxxx4"
        // Missing rawVideoKey
      }

      // Act
      const result = await createShortAction(invalidInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for missing title", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)

      const invalidInput = {
        rawVideoKey: "videos/test.mp4",
        categoryId: "clxxxxxxxxxxxxxxxxx5"
        // Missing title
      }

      // Act
      const result = await createShortAction(invalidInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for title exceeding max length", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)

      const invalidInput = {
        rawVideoKey: "videos/test.mp4",
        title: "A".repeat(101), // Max is 100
        categoryId: "clxxxxxxxxxxxxxxxxx6"
      }

      // Act
      const result = await createShortAction(invalidInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for invalid categoryId format", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)

      const invalidInput = {
        rawVideoKey: "videos/test.mp4",
        title: "Test",
        categoryId: "invalid-not-cuid" // Not a CUID
      }

      // Act
      const result = await createShortAction(invalidInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for invalid ctaLink URL", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)

      const invalidInput = {
        rawVideoKey: "videos/test.mp4",
        title: "Test",
        categoryId: "clxxxxxxxxxxxxxxxxx7",
        ctaLink: "not-a-valid-url"
      }

      // Act
      const result = await createShortAction(invalidInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for too many tags", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)

      const invalidInput = {
        rawVideoKey: "videos/test.mp4",
        title: "Test",
        categoryId: "clxxxxxxxxxxxxxxxxx8",
        tags: Array(11).fill("tag") // Max is 10
      }

      // Act
      const result = await createShortAction(invalidInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for duration exceeding 60 seconds", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)

      const invalidInput = {
        rawVideoKey: "videos/test.mp4",
        title: "Test",
        categoryId: "clxxxxxxxxxxxxxxxxx9",
        duration: 61 // Max is 60
      }

      // Act
      const result = await createShortAction(invalidInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES - DRAFT LIMIT
  // ===========================================================================

  describe("Draft Limit Exceeded", () => {
    it("returns error when max drafts (10) reached", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(10) // Max is 10

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("MAX_DRAFTS_EXCEEDED")
        expect(result.error).toBe("errors.createFailed")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("allows creation when under draft limit", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(9) // Under limit
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          short: { create: vi.fn().mockResolvedValue(mockCreatedShort) },
          shortStats: { create: vi.fn() },
          tag: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
          shortTag: { create: vi.fn() }
        }
        return fn(tx)
      })

      // Act
      const result = await createShortAction({
        rawVideoKey: "videos/test.mp4",
        title: "Test",
        categoryId: "clxxxxxxxxxxxxxxxxxA"
      })

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    it("returns error when transaction fails", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(0)
      mockPrisma.$transaction.mockRejectedValue(new Error("Database connection failed"))

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CREATE_FAILED")
        expect(result.error).toBe("errors.createFailed")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when short creation fails inside transaction", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(0)
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          short: {
            create: vi.fn().mockRejectedValue(new Error("Foreign key constraint failed"))
          },
          shortStats: { create: vi.fn() },
          tag: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
          shortTag: { create: vi.fn() }
        }
        return fn(tx)
      })

      // Act
      const result = await createShortAction(validInput)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CREATE_FAILED")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles company profile lookup error gracefully", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockRejectedValue(new Error("Database error"))

      // Act & Assert
      await expect(createShortAction(validInput)).rejects.toThrow("Database error")
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // REVALIDATE PATH VERIFICATION
  // ===========================================================================

  describe("Cache Revalidation", () => {
    it("calls revalidatePath with correct path on success", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(0)
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          short: { create: vi.fn().mockResolvedValue(mockCreatedShort) },
          shortStats: { create: vi.fn().mockResolvedValue({ id: "stats-1", shortId: "short-123" }) },
          tag: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation((data) => ({
              id: `tag-${data.data.slug}`,
              name: data.data.name,
              slug: data.data.slug,
              usageCount: 0
            })),
            update: vi.fn()
          },
          shortTag: { create: vi.fn() }
        }
        return fn(tx)
      })

      // Act
      await createShortAction(validInput)

      // Assert - CRITICAL verification
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/panel/shorts", "page")
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("does not call revalidatePath on any failure", async () => {
      // Test auth failure
      mockAuth.mockResolvedValue(null)
      await createShortAction(validInput)
      expect(mockRevalidatePath).not.toHaveBeenCalled()

      // Reset and test validation failure
      vi.clearAllMocks()
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      await createShortAction({ title: "" }) // Invalid input
      expect(mockRevalidatePath).not.toHaveBeenCalled()

      // Reset and test draft limit failure
      vi.clearAllMocks()
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.count.mockResolvedValue(10)
      await createShortAction(validInput)
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })
})
