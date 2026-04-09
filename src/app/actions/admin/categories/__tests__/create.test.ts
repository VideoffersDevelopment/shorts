import { describe, it, expect, vi, beforeEach } from "vitest"
import { createCategoryAction } from "../create"
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
      create: vi.fn(),
      aggregate: vi.fn()
    }
  }
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}))

const mockAuth = vi.mocked(auth)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockPrisma = vi.mocked(prisma)

describe("createCategoryAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("creates top-level category with valid input and returns data", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue(null) // No duplicate slug
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 5 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000101",
        name: "Electronics",
        slug: "electronics",
        icon: "📱",
        parentId: null,
        order: 6,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const input = {
        name: "Electronics",
        slug: "electronics",
        icon: "📱"
      }

      // Act
      const result = await createCategoryAction(input)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Electronics")
        expect(result.data.slug).toBe("electronics")
        expect(result.data.parentId).toBe(null)
        expect(result.data.enabled).toBe(true)
        expect(result.data.order).toBe(6)
      }

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Electronics",
          slug: "electronics",
          icon: "📱",
          parentId: null,
          order: 6,
          enabled: true
        })
      })

      // CRITICAL: Verify cache revalidation
      expect(mockRevalidatePath).toHaveBeenCalledWith("/[locale]/admin/categories", "page")
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("creates child category with parentId", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 2 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000102",
        name: "Smartphones",
        slug: "smartphones",
        icon: "📱",
        parentId: "clj0000000000000000000101",
        order: 3,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const input = {
        name: "Smartphones",
        slug: "smartphones",
        icon: "📱",
        parentId: "clj0000000000000000000101"
      }

      // Act
      const result = await createCategoryAction(input)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.parentId).toBe("clj0000000000000000000101")
      }

      expect(mockPrisma.category.aggregate).toHaveBeenCalledWith({
        _max: { order: true },
        where: { parentId: "clj0000000000000000000101" }
      })

      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("creates disabled category when enabled=false", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: null } })
      mockPrisma.category.create.mockResolvedValue({
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

      const input = {
        name: "Test",
        slug: "test",
        enabled: false
      }

      // Act
      const result = await createCategoryAction(input)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(false)
      }

      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("assigns order=1 when no existing categories", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "admin@test.com", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: null } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000104",
        name: "First",
        slug: "first",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: "First",
        slug: "first"
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.order).toBe(1)
      }

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 1 })
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
      const result = await createCategoryAction({
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
      expect(mockPrisma.category.create).not.toHaveBeenCalled()
    })

    it("returns error when session has no user", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: null as unknown as { id: string; email: string; role: string },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      // Act
      const result = await createCategoryAction({
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

    it("returns error when user is not ADMIN", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "user@test.com", role: "USER" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      // Act
      const result = await createCategoryAction({
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
    })

    it("returns error when user is COMPANY", async () => {
      // Arrange
      mockAuth.mockResolvedValue({
        user: { id: "clj0000000000000000000001", email: "company@test.com", role: "COMPANY" },
        expires: new Date(Date.now() + 86400000).toISOString()
      })

      // Act
      const result = await createCategoryAction({
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
      const result = await createCategoryAction({
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
      const result = await createCategoryAction({
        name: "Test Category"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.field).toBe("slug")
      }
    })

    it("returns error for name too short", async () => {
      // Act
      const result = await createCategoryAction({
        name: "A", // Too short (min 2)
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("too short")
      }
    })

    it("returns error for name too long", async () => {
      // Act
      const result = await createCategoryAction({
        name: "A".repeat(51), // Too long (max 50)
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("too long")
      }
    })

    it("returns error for invalid slug format (uppercase)", async () => {
      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "Test-Category" // Invalid: uppercase
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("Invalid slug format")
      }
    })

    it("returns error for invalid slug format (spaces)", async () => {
      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test category" // Invalid: spaces
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("returns error for invalid slug format (special chars)", async () => {
      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test_category!" // Invalid: underscore and exclamation
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("returns error for invalid parentId format", async () => {
      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test",
        parentId: "invalid-cuid" // Invalid CUID format
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("returns error for negative order", async () => {
      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test",
        order: -1 // Invalid: negative
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("returns error for non-integer order", async () => {
      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test",
        order: 1.5 // Invalid: float
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

    it("returns error when slug already exists", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue({
        id: "clj0000000000000000000999",
        name: "Existing",
        slug: "electronics",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: "Electronics",
        slug: "electronics"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categorySlugExists")
        expect(result.code).toBe("SLUG_EXISTS")
      }

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: "electronics" }
      })

      expect(mockPrisma.category.create).not.toHaveBeenCalled()
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

    it("handles database error during slug check", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockRejectedValue(
        new Error("Database connection lost")
      )

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryCreateFailed")
        expect(result.code).toBe("CATEGORY_CREATE_FAILED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles database error during aggregate", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockRejectedValue(
        new Error("Aggregate failed")
      )

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_CREATE_FAILED")
      }
    })

    it("handles database error during create", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 5 } })
      mockPrisma.category.create.mockRejectedValue(
        new Error("Create failed")
      )

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test"
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("admin.errors.categoryCreateFailed")
        expect(result.code).toBe("CATEGORY_CREATE_FAILED")
      }

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("handles foreign key constraint error for invalid parentId", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 1 } })
      mockPrisma.category.create.mockRejectedValue({
        code: "P2003", // Prisma foreign key constraint error
        meta: { field_name: "parentId" }
      })

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test",
        parentId: "clj0000000000000000000999" // Non-existent parent
      })

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CATEGORY_CREATE_FAILED")
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

    it("handles category with minimum valid name length", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 0 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000105",
        name: "AB", // Min length 2
        slug: "ab",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: "AB",
        slug: "ab"
      })

      // Assert
      expect(result.success).toBe(true)
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1)
    })

    it("handles category with maximum valid name length", async () => {
      // Arrange
      const maxName = "A".repeat(50) // Max length 50
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 0 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000106",
        name: maxName,
        slug: "long-name",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: maxName,
        slug: "long-name"
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("handles slug with hyphens and numbers", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 0 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000107",
        name: "Test",
        slug: "test-category-123",
        icon: null,
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test-category-123"
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("handles emoji icons", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 0 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000108",
        name: "Test",
        slug: "test",
        icon: "🎉🔥",
        parentId: null,
        order: 1,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test",
        icon: "🎉🔥"
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.icon).toBe("🎉🔥")
      }
    })

    it("handles undefined icon (omitted field)", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 0 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000109",
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
      const result = await createCategoryAction({
        name: "Test",
        slug: "test"
        // icon omitted
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("handles explicit order value", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 5 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000110",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 10, // Explicit order provided
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test",
        order: 10
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.order).toBe(10)
      }

      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 10 })
      })
    })

    it("handles order=0", async () => {
      // Arrange
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.aggregate.mockResolvedValue({ _max: { order: 5 } })
      mockPrisma.category.create.mockResolvedValue({
        id: "clj0000000000000000000111",
        name: "Test",
        slug: "test",
        icon: null,
        parentId: null,
        order: 0,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Act
      const result = await createCategoryAction({
        name: "Test",
        slug: "test",
        order: 0
      })

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.order).toBe(0)
      }
    })
  })
})
