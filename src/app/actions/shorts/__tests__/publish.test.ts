import { describe, it, expect, vi, beforeEach } from "vitest"
import { publishShortAction } from "../publish"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest/client"
import { revalidatePath } from "next/cache"
import { getWalletBalance, spendCredits } from "@/lib/wallet/wallet-service"
import { getPrice } from "@/lib/wallet/pricing-service"
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
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}))
vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: vi.fn()
  }
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}))
vi.mock("@/lib/wallet/wallet-service", () => ({
  getWalletBalance: vi.fn(),
  spendCredits: vi.fn()
}))
vi.mock("@/lib/wallet/pricing-service", () => ({
  getPrice: vi.fn()
}))

const mockAuth = vi.mocked(auth)
const mockPrisma = vi.mocked(prisma)
const mockInngest = vi.mocked(inngest)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockGetWalletBalance = vi.mocked(getWalletBalance)
const mockSpendCredits = vi.mocked(spendCredits)
const mockGetPrice = vi.mocked(getPrice)

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
  id: "company-456",
  viesVerified: true
}

const mockShort = {
  id: "short-789",
  status: "DRAFT" as const,
  rawVideoKey: "videos/raw/short-789.mp4",
  title: "Test Short Video"
}

describe("publishShortAction Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 100,
        transactionIds: ["tx-1"],
        batchesAffected: [{ batchId: "batch-1", amountDeducted: 100, wallet: "MAIN" }]
      })
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
    })

    it("successfully publishes short and returns processing state", async () => {
      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processing).toBe(true)
        expect(result.data.redirectUrl).toBe("/panel/shorts/short-789")
      }
    })

    it("spends credits via wallet service", async () => {
      // Act
      await publishShortAction("short-789")

      // Assert - Verify spendCredits was called correctly
      expect(mockGetPrice).toHaveBeenCalledWith("PUBLICATION")
      expect(mockGetWalletBalance).toHaveBeenCalledWith("user-123")
      expect(mockSpendCredits).toHaveBeenCalledWith(
        "user-123",
        100,
        "PUBLICATION",
        "short-789"
      )
    })

    it("updates short status to PROCESSING", async () => {
      // Act
      await publishShortAction("short-789")

      // Assert - Verify short.update was called to set PROCESSING
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-789" },
        data: {
          status: "PROCESSING",
          processingError: null,
          retryCount: 0
        }
      })
    })

    it("sends Inngest event to start transcoding", async () => {
      // Act
      await publishShortAction("short-789")

      // Assert
      expect(mockInngest.send).toHaveBeenCalledWith({
        name: "shorts/transcode.started",
        data: {
          shortId: "short-789",
          rawVideoKey: "videos/raw/short-789.mp4",
          userId: "user-123"
        }
      })
    })

    it("calls revalidatePath on success", async () => {
      // Act
      await publishShortAction("short-789")

      // Assert
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/panel/shorts", "page")
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/[locale]/panel/shorts/short-789",
        "page"
      )
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
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
      const result = await publishShortAction("short-789")

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
        expires: new Date().toISOString()
      } as Session)

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when user has no id", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { email: "test@example.com" },
        expires: new Date().toISOString()
      } as Session)

      // Act
      const result = await publishShortAction("short-789")

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
    it("returns error when user role is not COMPANY", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        ...validSession,
        user: { ...validSession.user, role: "USER" }
      })

      // Act
      const result = await publishShortAction("short-789")

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
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NO_COMPANY_PROFILE")
        expect(result.error).toBe("errors.unauthorized")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when short does not exist", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(null)

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SHORT_NOT_FOUND")
        expect(result.error).toBe("errors.notFound")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when short belongs to different company", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(null) // findFirst with companyId filter

      // Act
      const result = await publishShortAction("other-company-short")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SHORT_NOT_FOUND")
      }
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe("Validation Failures", () => {
    it("returns error when short is not in DRAFT status", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShort,
        status: "PROCESSING"
      } as never)

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_DRAFT")
        expect(result.error).toBe("errors.invalidStatus")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for PUBLISHED status", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShort,
        status: "PUBLISHED"
      } as never)

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_DRAFT")
      }
    })

    it("returns error when short has no raw video", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShort,
        rawVideoKey: null
      } as never)

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NO_RAW_VIDEO")
        expect(result.error).toBe("errors.noVideo")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VERIFICATION REQUIRED
  // ===========================================================================

  describe("Verification Required", () => {
    it("returns requiresVerification when company not VIES verified", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        ...mockCompanyProfile,
        viesVerified: false
      } as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requiresVerification).toBe(true)
        expect(result.data.processing).toBeUndefined()
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // CREDIT CHECK - REQUIRES PAYMENT
  // ===========================================================================

  describe("Credit Check - Requires Payment", () => {
    it("returns requiresPayment when user has no credits", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 0,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 0, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requiresPayment).toBe(true)
        expect(result.data.processing).toBeUndefined()
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns requiresPayment when wallet balance is insufficient", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 50,
        promo: { balance: 50, expiresAt: null, daysRemaining: null },
        main: { balance: 0, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.requiresPayment).toBe(true)
      }
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    it("returns error when credit spending fails", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockRejectedValue(new Error("Wallet transaction failed"))

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("PUBLISH_FAILED")
        expect(result.error).toBe("errors.publishFailed")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when Inngest send fails", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 100,
        transactionIds: ["tx-1"],
        batchesAffected: [{ batchId: "batch-1", amountDeducted: 100, wallet: "MAIN" }]
      })
      mockInngest.send.mockRejectedValue(new Error("Inngest unavailable"))

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("PUBLISH_FAILED")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles company profile lookup error", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockRejectedValue(
        new Error("Database error")
      )

      // Act & Assert
      await expect(publishShortAction("short-789")).rejects.toThrow("Database error")
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // REVALIDATE PATH VERIFICATION
  // ===========================================================================

  describe("Cache Revalidation", () => {
    it("calls revalidatePath with correct paths on success", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 100,
        transactionIds: ["tx-1"],
        batchesAffected: [{ batchId: "batch-1", amountDeducted: 100, wallet: "MAIN" }]
      })
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })

      // Act
      await publishShortAction("short-789")

      // Assert - CRITICAL verification
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/panel/shorts", "page")
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/[locale]/panel/shorts/short-789",
        "page"
      )
      expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
    })

    it("does not call revalidatePath on auth failure", async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      await publishShortAction("short-789")

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("does not call revalidatePath when requiresPayment", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 0,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 0, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })

      // Act
      await publishShortAction("short-789")

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("does not call revalidatePath when requiresVerification", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        ...mockCompanyProfile,
        viesVerified: false
      } as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)

      // Act
      await publishShortAction("short-789")

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("does not call revalidatePath on database error", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockRejectedValue(new Error("DB error"))

      // Act
      await publishShortAction("short-789")

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles wallet with exactly enough balance", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 100,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 100, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 100,
        transactionIds: ["tx-1"],
        batchesAffected: [{ batchId: "batch-1", amountDeducted: 100, wallet: "MAIN" }]
      })
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })

      // Act
      const result = await publishShortAction("short-789")

      // Assert - Should succeed with exactly enough balance
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processing).toBe(true)
      }
    })

    it("spendCredits is called with correct shortId", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShort,
        title: "My Awesome Video"
      } as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockResolvedValue({
        success: true,
        totalSpent: 100,
        transactionIds: ["tx-1"],
        batchesAffected: [{ batchId: "batch-1", amountDeducted: 100, wallet: "MAIN" }]
      })
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })

      // Act
      await publishShortAction("short-789")

      // Assert - Verify spendCredits was called with shortId
      expect(mockSpendCredits).toHaveBeenCalledWith(
        "user-123",
        100,
        "PUBLICATION",
        "short-789"
      )
    })

    it("handles empty rawVideoKey as falsy", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShort,
        rawVideoKey: ""
      } as never)

      // Act
      const result = await publishShortAction("short-789")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NO_RAW_VIDEO")
      }
    })

    it("verifies correct shortId passed to findFirst", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(null)

      // Act
      await publishShortAction("specific-short-id")

      // Assert
      expect(mockPrisma.short.findFirst).toHaveBeenCalledWith({
        where: {
          id: "specific-short-id",
          companyId: "company-456"
        },
        select: expect.any(Object)
      })
    })
  })
})
