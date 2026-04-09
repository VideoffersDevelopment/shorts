import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ShortStatus } from "@prisma/client"

// ===========================================================================
// MOCKS - Must be defined before imports
// ===========================================================================

vi.mock("@/lib/auth", () => ({
  auth: vi.fn()
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    companyProfile: {
      findUnique: vi.fn()
    },
    short: {
      findFirst: vi.fn()
    }
  }
}))

// Import after mocks
import { GET } from "../route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

const mockAuth = vi.mocked(auth)
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
  id: "company-456"
}

interface MockShortRecord {
  status: ShortStatus
  processingError: string | null
  hlsPlaylistUrl: string | null
  createdAt: Date
}

const mockShortDraft: MockShortRecord = {
  status: "DRAFT",
  processingError: null,
  hlsPlaylistUrl: null,
  createdAt: new Date()
}

const mockShortProcessing: MockShortRecord = {
  status: "PROCESSING",
  processingError: null,
  hlsPlaylistUrl: null,
  createdAt: new Date(Date.now() - 60000) // Started 1 minute ago
}

const mockShortPublished: MockShortRecord = {
  status: "PUBLISHED",
  processingError: null,
  hlsPlaylistUrl: "https://hls.example.com/master.m3u8",
  createdAt: new Date(Date.now() - 300000) // Created 5 minutes ago
}

const mockShortWithError: MockShortRecord = {
  status: "PROCESSING",
  processingError: "Transcoding failed: invalid input",
  hlsPlaylistUrl: null,
  createdAt: new Date()
}

// Helper to create mock request and context
function createMockRequest() {
  return {} as Request
}

function createMockContext(shortId: string) {
  return {
    params: Promise.resolve({ id: shortId })
  }
}

describe("Short Status API - GET /api/shorts/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe("Auth Failures", () => {
    it("returns 401 when not authenticated (null session)", async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe("Unauthorized")
    })

    it("returns 401 when session has no user", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: undefined,
        expires: new Date().toISOString()
      } as Session)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(401)
    })

    it("returns 401 when user has no id", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { email: "test@example.com" },
        expires: new Date().toISOString()
      } as Session)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(401)
    })
  })

  // ===========================================================================
  // AUTHORIZATION FAILURES
  // ===========================================================================

  describe("Authorization Failures", () => {
    it("returns 403 when user has no company profile", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe("No company profile")
    })

    it("looks up company profile by user id", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      await GET(request, context)

      // Assert
      expect(mockPrisma.companyProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        select: { id: true }
      })
    })
  })

  // ===========================================================================
  // SHORT NOT FOUND
  // ===========================================================================

  describe("Short Not Found", () => {
    it("returns 404 when short does not exist", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.findFirst.mockResolvedValue(null)
      const request = createMockRequest()
      const context = createMockContext("nonexistent-short")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe("Short not found")
    })

    it("returns 404 when short belongs to different company", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.findFirst.mockResolvedValue(null) // findFirst with companyId filter returns null
      const request = createMockRequest()
      const context = createMockContext("other-company-short")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(404)
    })

    it("queries short with correct id and companyId", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.findFirst.mockResolvedValue(mockShortDraft as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      await GET(request, context)

      // Assert
      expect(mockPrisma.short.findFirst).toHaveBeenCalledWith({
        where: {
          id: "short-123",
          companyId: "company-456"
        },
        select: {
          status: true,
          processingError: true,
          hlsPlaylistUrl: true,
          createdAt: true
        }
      })
    })
  })

  // ===========================================================================
  // HAPPY PATH - DIFFERENT STATUSES
  // ===========================================================================

  describe("Happy Path - Different Statuses", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
    })

    it("returns DRAFT status correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortDraft as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe("DRAFT")
      expect(data.hlsPlaylistUrl).toBeUndefined()
      expect(data.processingError).toBeUndefined()
      expect(data.estimatedTimeRemaining).toBeUndefined()
    })

    it("returns PROCESSING status with estimated time", async () => {
      // Arrange
      const now = Date.now()
      vi.setSystemTime(now)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortProcessing,
        createdAt: new Date(now - 60000) // 60 seconds ago
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe("PROCESSING")
      expect(data.estimatedTimeRemaining).toBe(120) // 180 - 60 = 120 seconds
    })

    it("returns PUBLISHED status with HLS URL", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortPublished as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe("PUBLISHED")
      expect(data.hlsPlaylistUrl).toBe("https://hls.example.com/master.m3u8")
      expect(data.estimatedTimeRemaining).toBeUndefined()
    })

    it("returns processing error when present", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithError as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe("PROCESSING")
      expect(data.processingError).toBe("Transcoding failed: invalid input")
    })
  })

  // ===========================================================================
  // ESTIMATED TIME CALCULATION
  // ===========================================================================

  describe("Estimated Time Calculation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
    })

    it("returns 180 seconds (3 min) when just started", async () => {
      // Arrange
      const now = Date.now()
      vi.setSystemTime(now)
      mockPrisma.short.findFirst.mockResolvedValue({
        status: "PROCESSING" as ShortStatus,
        processingError: null,
        hlsPlaylistUrl: null,
        createdAt: new Date(now) // Just started
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      const data = await response.json()
      expect(data.estimatedTimeRemaining).toBe(180)
    })

    it("returns 0 when processing exceeds 3 minutes", async () => {
      // Arrange
      const now = Date.now()
      vi.setSystemTime(now)
      mockPrisma.short.findFirst.mockResolvedValue({
        status: "PROCESSING" as ShortStatus,
        processingError: null,
        hlsPlaylistUrl: null,
        createdAt: new Date(now - 300000) // 5 minutes ago
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      const data = await response.json()
      expect(data.estimatedTimeRemaining).toBe(0) // Math.max(0, 180 - 300) = 0
    })

    it("returns correct remaining time at 90 seconds", async () => {
      // Arrange
      const now = Date.now()
      vi.setSystemTime(now)
      mockPrisma.short.findFirst.mockResolvedValue({
        status: "PROCESSING" as ShortStatus,
        processingError: null,
        hlsPlaylistUrl: null,
        createdAt: new Date(now - 90000) // 90 seconds ago
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      const data = await response.json()
      expect(data.estimatedTimeRemaining).toBe(90) // 180 - 90 = 90
    })

    it("does not include estimatedTimeRemaining for non-PROCESSING status", async () => {
      // Arrange
      const statuses: ShortStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "DELETED", "PENDING_PAYMENT"]

      for (const status of statuses) {
        vi.clearAllMocks()
        mockAuth.mockResolvedValue(validSession)
        mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
        mockPrisma.short.findFirst.mockResolvedValue({
          status,
          processingError: null,
          hlsPlaylistUrl: status === "PUBLISHED" ? "https://example.com/hls.m3u8" : null,
          createdAt: new Date()
        } as never)

        const request = createMockRequest()
        const context = createMockContext("short-123")

        // Act
        const response = await GET(request, context)
        const data = await response.json()

        // Assert
        expect(data.estimatedTimeRemaining).toBeUndefined()
      }
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    it("returns 500 on company profile lookup error", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      )
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Internal server error")
    })

    it("returns 500 on short lookup error", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
      mockPrisma.short.findFirst.mockRejectedValue(new Error("Query timeout"))
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)

      // Assert
      expect(response.status).toBe(500)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile)
    })

    it("handles null processingError correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        status: "PROCESSING" as ShortStatus,
        processingError: null,
        hlsPlaylistUrl: null,
        createdAt: new Date()
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      expect(data.processingError).toBeUndefined()
    })

    it("handles empty string processingError correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        status: "PROCESSING" as ShortStatus,
        processingError: "",
        hlsPlaylistUrl: null,
        createdAt: new Date()
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      expect(data.processingError).toBeUndefined() // Empty string should become undefined
    })

    it("handles null hlsPlaylistUrl correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        status: "DRAFT" as ShortStatus,
        processingError: null,
        hlsPlaylistUrl: null,
        createdAt: new Date()
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      expect(data.hlsPlaylistUrl).toBeUndefined()
    })

    it("handles empty string hlsPlaylistUrl correctly", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        status: "PUBLISHED" as ShortStatus,
        processingError: null,
        hlsPlaylistUrl: "",
        createdAt: new Date()
      } as never)
      const request = createMockRequest()
      const context = createMockContext("short-123")

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      expect(data.hlsPlaylistUrl).toBeUndefined() // Empty string should become undefined
    })

    it("correctly extracts short id from params", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue(mockShortDraft as never)
      const request = createMockRequest()
      const context = createMockContext("unique-short-id-xyz")

      // Act
      await GET(request, context)

      // Assert
      expect(mockPrisma.short.findFirst).toHaveBeenCalledWith({
        where: {
          id: "unique-short-id-xyz",
          companyId: "company-456"
        },
        select: expect.any(Object)
      })
    })
  })
})
