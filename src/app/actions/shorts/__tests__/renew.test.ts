import { describe, it, expect, vi, beforeEach } from "vitest"
import { renewShortAction } from "../renew"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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
  id: "company-456"
}

const mockArchivedShort = {
  id: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
  status: "ARCHIVED" as const,
  title: "Test Archived Short"
}

describe("renewShortAction Server Action", () => {
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
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
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
    })

    it("successfully renews archived short and returns processing state", async () => {
      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processing).toBe(true)
        expect(result.data.renewedUntil).toBeDefined()
        // Verify it's 30 days from now
        const renewedDate = new Date(result.data.renewedUntil!)
        const now = new Date()
        const diffDays = Math.round((renewedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        expect(diffDays).toBe(30)
      }
    })

    it("spends credits via wallet service", async () => {
      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert - Verify wallet service calls
      expect(mockGetPrice).toHaveBeenCalledWith("EXTENSION_30D")
      expect(mockGetWalletBalance).toHaveBeenCalledWith("user-123")
      expect(mockSpendCredits).toHaveBeenCalledWith(
        "user-123",
        100,
        "EXTENSION",
        mockArchivedShort.id
      )
    })

    it("updates short status to PUBLISHED with new expiry date", async () => {
      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: mockArchivedShort.id },
        data: expect.objectContaining({
          status: "PUBLISHED",
          archivedAt: null
        })
      })
    })

    it("calls revalidatePath on success - CRITICAL", async () => {
      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/panel/shorts", "page")
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        `/[locale]/panel/shorts/${mockArchivedShort.id}`,
        "page"
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        `/[locale]/shorts/${mockArchivedShort.id}`,
        "page"
      )
      expect(mockRevalidatePath).toHaveBeenCalledTimes(3)
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
      const result = await renewShortAction(mockArchivedShort.id)

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
      const result = await renewShortAction(mockArchivedShort.id)

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
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe("Validation Failures", () => {
    it("returns error for invalid shortId (not CUID)", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)

      // Act - Pass invalid shortId that doesn't match CUID format
      const result = await renewShortAction("invalid-short-id-123")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("INVALID_INPUT")
        expect(result.error).toBe("errors.invalidInput")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for empty shortId", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)

      // Act
      const result = await renewShortAction("")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("INVALID_INPUT")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for shortId with special characters", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)

      // Act
      const result = await renewShortAction("short-id-<script>")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("INVALID_INPUT")
      }
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
      const result = await renewShortAction(mockArchivedShort.id)

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
      const result = await renewShortAction(mockArchivedShort.id)

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
      const result = await renewShortAction(mockArchivedShort.id)

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
      mockPrisma.short.findFirst.mockResolvedValue(null) // findFirst with companyId filter returns null

      // Act
      const result = await renewShortAction("clxxxxxxxxxxxxxxxxxxxxxxxxy")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SHORT_NOT_FOUND")
      }
    })
  })

  // ===========================================================================
  // STATUS VALIDATION
  // ===========================================================================

  describe("Status Validation", () => {
    it("returns error when short is not in ARCHIVED status", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockArchivedShort,
        status: "PUBLISHED"
      } as never)

      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_ARCHIVED")
        expect(result.error).toBe("errors.invalidStatus")
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for DRAFT status", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockArchivedShort,
        status: "DRAFT"
      } as never)

      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_ARCHIVED")
      }
    })

    it("returns error for PROCESSING status", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockArchivedShort,
        status: "PROCESSING"
      } as never)

      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_ARCHIVED")
      }
    })
  })

  // ===========================================================================
  // CREDIT CHECK - REQUIRES PAYMENT
  // ===========================================================================

  describe("Credit Check - Requires Payment", () => {
    it("returns needsPayment when user has no credits", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 0,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 0, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })

      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.needsPayment).toBe(true)
        expect(result.data.processing).toBeUndefined()
      }
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns needsPayment when wallet balance is insufficient", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 50,
        promo: { balance: 50, expiresAt: null, daysRemaining: null },
        main: { balance: 0, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })

      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.needsPayment).toBe(true)
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
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockRejectedValue(new Error("Wallet transaction failed"))

      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("RENEW_FAILED")
        expect(result.error).toBe("errors.renewFailed")
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
      await expect(renewShortAction(mockArchivedShort.id)).rejects.toThrow("Database error")
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
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
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

      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert - CRITICAL verification
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/panel/shorts", "page")
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        `/[locale]/panel/shorts/${mockArchivedShort.id}`,
        "page"
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        `/[locale]/shorts/${mockArchivedShort.id}`,
        "page"
      )
      expect(mockRevalidatePath).toHaveBeenCalledTimes(3)
    })

    it("does not call revalidatePath on auth failure", async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("does not call revalidatePath when needsPayment", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 0,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 0, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })

      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("does not call revalidatePath on database error", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
      mockGetPrice.mockResolvedValue(100)
      mockGetWalletBalance.mockResolvedValue({
        total: 500,
        promo: { balance: 0, expiresAt: null, daysRemaining: null },
        main: { balance: 500, expiresAt: null, isMaintenanceFeeActive: false },
        batches: []
      })
      mockSpendCredits.mockRejectedValue(new Error("DB error"))

      // Act
      await renewShortAction(mockArchivedShort.id)

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
      mockPrisma.short.findFirst.mockResolvedValue(mockArchivedShort as never)
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

      // Act
      const result = await renewShortAction(mockArchivedShort.id)

      // Assert - Should succeed with exactly enough balance
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.processing).toBe(true)
      }
    })

    it("spendCredits is called with correct shortId and action type", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockArchivedShort,
        title: "My Awesome Archived Video"
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

      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert - Verify spendCredits was called with EXTENSION action type
      expect(mockSpendCredits).toHaveBeenCalledWith(
        "user-123",
        100,
        "EXTENSION",
        mockArchivedShort.id
      )
    })

    it("verifies correct shortId passed to findFirst", async () => {
      // Arrange
      mockAuth.mockResolvedValue(validSession)
      mockPrisma.companyProfile.findUnique.mockResolvedValue(mockCompanyProfile as never)
      mockPrisma.short.findFirst.mockResolvedValue(null)

      // Act
      await renewShortAction(mockArchivedShort.id)

      // Assert
      expect(mockPrisma.short.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockArchivedShort.id,
          companyId: "company-456"
        },
        select: expect.any(Object)
      })
    })
  })
})
