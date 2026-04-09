import { describe, it, expect, vi, beforeEach } from "vitest"
import { deleteCategoryAction } from "../delete"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Mock dependencies
vi.mock("@/lib/auth")
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      delete: vi.fn()
    }
  }
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}))

const mockAuth = vi.mocked(auth)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockPrisma = vi.mocked(prisma)

describe("deleteCategoryAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("deletes category with no companies or children", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Empty Category",
        slug: "empty",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 0
        }
      })

      mockPrisma.category.delete.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Empty Category",
        slug: "empty",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeUndefined()
      }

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "clj0000000000000000000101" },
        include: {
          _count: {
            select: {
              companyProfiles: true,
              children: true
            }
          }
        }
      })

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: "clj0000000000000000000101" }
      })

      // CRITICAL: Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/admin/categories", "page")
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("deletes child category with no companies or children", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000102",
        name: "Child Category",
        slug: "child",
        icon: null,
        parentId: "clj0000000000000000000999",
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 0
        }
      })

      mockPrisma.category.delete.mockResolvedValue({
        id: "clj0000000000000000000102",
        name: "Child Category",
        slug: "child",
        icon: null,
        parentId: "clj0000000000000000000999",
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000102")

      // Assert
      expect(result.success).toBe(true)
      expect(mockPrisma.category.delete).toHaveBeenCalledTimes(1)
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // AUTH FAILURES
  // ===========================================================================

  describe("Auth Failures", () => {
    it("returns error when not authenticated", async () => {
      // Arrange
      mockAuth.mockResolvedValue(null)

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("errors.unauthorized")
        expect(result.code).toBe("UNAUTHORIZED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
      expect(mockPrisma.category.delete).not.toHaveBeenCalled()
    })

    it("returns error when session has no user", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null as unknown as { id: string; email: string; role: string },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when user is not ADMIN", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "user@test.com", role: "USER" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("errors.unauthorized")
        expect(result.code).toBe("UNAUTHORIZED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when user is COMPANY", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "company@test.com", role: "COMPANY" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe("Validation Failures", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })
    })

    it("returns error when category not found", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000999")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryNotFound")
        expect(result.code).toBe("CATEGORY_NOT_FOUND")
      }

      expect(mockPrisma.category.delete).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // AUTHORIZATION / BUSINESS LOGIC FAILURES
  // ===========================================================================

  describe("Authorization / Business Logic Failures", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })
    })

    it("returns error when category has companies", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Popular Category",
        slug: "popular",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 5, // Has companies
          children: 0
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryHasCompanies")
        expect(result.code).toBe("CATEGORY_HAS_COMPANIES")
      }

      expect(mockPrisma.category.delete).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when category has children", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Parent Category",
        slug: "parent",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 3 // Has children
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryHasChildren")
        expect(result.code).toBe("CATEGORY_HAS_CHILDREN")
      }

      expect(mockPrisma.category.delete).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when category has both companies and children", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Busy Category",
        slug: "busy",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 10,
          children: 5
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        // Should check companies first
        expect(result.error).toBe("admin.errors.categoryHasCompanies")
        expect(result.code).toBe("CATEGORY_HAS_COMPANIES")
      }

      expect(mockPrisma.category.delete).not.toHaveBeenCalled()
    })

    it("prioritizes companies check over children check", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 1, // Has companies
          children: 1 // Also has children
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        // Companies error should come first
        expect(result.code).toBe("CATEGORY_HAS_COMPANIES")
      }
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })
    })

    it("handles database error during category lookup", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockRejectedValue(
        new Error("Database connection lost")
      )

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryDeleteFailed")
        expect(result.code).toBe("CATEGORY_DELETE_FAILED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles database error during delete", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 0
        }
      })

      mockPrisma.category.delete.mockRejectedValue(
        new Error("Delete failed")
      )

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryDeleteFailed")
        expect(result.code).toBe("CATEGORY_DELETE_FAILED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles foreign key constraint error", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 0
        }
      })

      mockPrisma.category.delete.mockRejectedValue({
        code: "P2003", // Prisma foreign key constraint error
        meta: { field_name: "categoryId" }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_DELETE_FAILED")
      }
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })
    })

    it("handles deleting category with exactly 1 company", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 1, // Exactly 1
          children: 0
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_HAS_COMPANIES")
      }
    })

    it("handles deleting category with exactly 1 child", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 1 // Exactly 1
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_HAS_CHILDREN")
      }
    })

    it("handles deleting disabled category", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: false, // Disabled
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 0
        }
      })

      mockPrisma.category.delete.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(true)
      expect(mockPrisma.category.delete).toHaveBeenCalledTimes(1)
    })

    it("handles deleting category with icon", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: "🎉",
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 0
        }
      })

      mockPrisma.category.delete.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: "🎉",
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(true)
    })

    it("handles deleting category with large company count", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 1000, // Large number
          children: 0
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_HAS_COMPANIES")
      }
    })

    it("handles deleting category with large children count", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          companyProfiles: 0,
          children: 50 // Large number
        }
      })

      // Act
      const result = await deleteCategoryAction("clj0000000000000000000101")

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_HAS_CHILDREN")
      }
    })
  })
})
