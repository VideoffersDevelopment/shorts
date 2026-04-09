import { describe, it, expect, vi, beforeEach } from "vitest"
import { updateCategoryAction } from "../update"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Mock dependencies
vi.mock("@/lib/auth")
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}))

const mockAuth = vi.mocked(auth)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockPrisma = vi.mocked(prisma)

describe("updateCategoryAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("updates category with valid input and returns data", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Old Name",
        slug: "old-slug",
        icon: "📱",
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null) // No duplicate slug

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Updated Name",
        slug: "updated-slug",
        icon: "📱",
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const input = {
        name: "Updated Name",
        slug: "updated-slug",
        icon: "📱"
      }

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", input)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Updated Name")
        expect(result.data.slug).toBe("updated-slug")
      }

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: "clj0000000000000000000101" },
        data: expect.objectContaining({
          name: "Updated Name",
          slug: "updated-slug",
          icon: "📱",
          parentId: null,
          enabled: true
        })
      })

      // CRITICAL: Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/admin/categories", "page")
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("updates category to have a parent", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000102",
        name: "Child",
        slug: "child",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000102",
        name: "Child",
        slug: "child",
        icon: null,
        parentId: "clj0000000000000000000101",
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000102", {
        name: "Child",
        slug: "child",
        parentId: "clj0000000000000000000101"
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBe("clj0000000000000000000101")
      }

      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("updates category to remove parent", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000102",
        name: "Child",
        slug: "child",
        icon: null,
        parentId: "clj0000000000000000000101",
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000102",
        name: "Child",
        slug: "child",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000102", {
        name: "Child",
        slug: "child",
        parentId: null
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBe(null)
      }

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: "clj0000000000000000000102" },
        data: expect.objectContaining({ parentId: null })
      })
    })

    it("updates category enabled status", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000103",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000103",
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
      const result = await updateCategoryAction("clj0000000000000000000103", {
        name: "Test",
        slug: "test",
        enabled: false
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(false)
      }
    })

    it("keeps same slug when updating other fields", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000104",
        name: "Old Name",
        slug: "electronics",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Slug check should exclude current category
      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000104",
        name: "New Name",
        slug: "electronics",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000104", {
        name: "New Name",
        slug: "electronics" // Same slug
      })

      // Assert
      expect(result.success).toBe(true)

      // Verify slug check excluded current category
      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          slug: "electronics",
          NOT: { id: "clj0000000000000000000104" }
        }
      })
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
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("errors.unauthorized")
        expect(result.code).toBe("UNAUTHORIZED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
      expect(mockPrisma.category.update).not.toHaveBeenCalled()
    })

    it("returns error when user is not ADMIN", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "user@test.com", role: "USER" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
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
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test"
      })

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

    it("returns error for missing name", async () => {
      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.field).toBe("name")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error for missing slug", async () => {
      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.field).toBe("slug")
      }
    })

    it("returns error for invalid slug format", async () => {
      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "Invalid Slug" // Invalid: uppercase and space
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("Invalid slug format")
      }
    })

    it("returns error for name too short", async () => {
      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "A",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("returns error for name too long", async () => {
      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "A".repeat(51),
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
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

    it("returns error when category not found", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)

      // Act
      const result = await updateCategoryAction("clj0000000000000000000999", {
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryNotFound")
        expect(result.code).toBe("CATEGORY_NOT_FOUND")
      }

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "clj0000000000000000000999" }
      })

      expect(mockPrisma.category.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when slug exists for different category", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Current",
        slug: "current-slug",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue({
        id: "clj0000000000000000000102", // Different category
        name: "Other",
        slug: "electronics",
        icon: null,
        parentId: null,
        order: 2,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Current",
        slug: "electronics" // Slug already taken by category 102
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categorySlugExists")
        expect(result.code).toBe("SLUG_EXISTS")
      }

      expect(mockPrisma.category.findFirst).toHaveBeenCalledWith({
        where: {
          slug: "electronics",
          NOT: { id: "clj0000000000000000000101" }
        }
      })

      expect(mockPrisma.category.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns error when trying to set self as parent", async () => {
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
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test",
        parentId: "clj0000000000000000000101" // Self as parent
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categorySelfParent")
        expect(result.code).toBe("SELF_PARENT")
      }

      expect(mockPrisma.category.update).not.toHaveBeenCalled()
      expect(mockRevalidatePath).not.toHaveBeenCalled()
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
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryUpdateFailed")
        expect(result.code).toBe("CATEGORY_UPDATE_FAILED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles database error during slug check", async () => {
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
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockRejectedValue(
        new Error("Database error")
      )

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "new-slug"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_UPDATE_FAILED")
      }
    })

    it("handles database error during update", async () => {
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
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockRejectedValue(
        new Error("Update failed")
      )

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryUpdateFailed")
        expect(result.code).toBe("CATEGORY_UPDATE_FAILED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles foreign key constraint error for invalid parentId", async () => {
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
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockRejectedValue({
        code: "P2003", // Prisma foreign key constraint error
        meta: { field_name: "parentId" }
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test",
        parentId: "clj0000000000000000000999" // Non-existent parent
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_UPDATE_FAILED")
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

    it("handles updating all fields at once", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Old",
        slug: "old",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "New",
        slug: "new",
        icon: "🎉",
        parentId: "clj0000000000000000000999",
        order: 5,
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "New",
        slug: "new",
        icon: "🎉",
        parentId: "clj0000000000000000000999",
        order: 5,
        enabled: false
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("New")
        expect(result.data.slug).toBe("new")
        expect(result.data.icon).toBe("🎉")
        expect(result.data.parentId).toBe("clj0000000000000000000999")
        expect(result.data.order).toBe(5)
        expect(result.data.enabled).toBe(false)
      }
    })

    it("handles removing icon", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: "📱",
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: undefined,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test",
        icon: undefined
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("handles empty string parentId (converts to null)", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: "clj0000000000000000000999",
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "Test",
        slug: "test",
        parentId: "" as unknown as null // Empty string should convert to null
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBe(null)
      }

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: "clj0000000000000000000101" },
        data: expect.objectContaining({ parentId: null })
      })
    })

    it("handles minimum valid name length", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Old",
        slug: "old",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "AB",
        slug: "ab",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: "AB",
        slug: "ab"
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("handles maximum valid name length", async () => {
      // Arrange
      const maxName = "A".repeat(50)
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Old",
        slug: "old",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockPrisma.category.findFirst.mockResolvedValue(null)

      mockPrisma.category.update.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: maxName,
        slug: "long",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await updateCategoryAction("clj0000000000000000000101", {
        name: maxName,
        slug: "long"
      })

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
