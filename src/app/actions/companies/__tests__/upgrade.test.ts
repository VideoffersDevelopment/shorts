import { describe, it, expect, vi, beforeEach } from "vitest"
import { upgradeToCompanyAction } from "../upgrade"
import { checkVATWithRetry } from "@/lib/vies"
import { generateSlug } from "@/lib/utils/slug"
import { revalidatePath } from "next/cache"

// Mock dependencies BEFORE imports
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    companyProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/vies")
vi.mock("@/lib/utils/slug")
vi.mock("next/cache")

// Import mocked modules AFTER mocking
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const mockAuth = vi.mocked(auth)
const mockCheckVATWithRetry = vi.mocked(checkVATWithRetry)
const mockGenerateSlug = vi.mocked(generateSlug)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockPrisma = vi.mocked(prisma)

describe("upgradeToCompanyAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // AUTH VALIDATION
  // ===========================================================================

  describe("Auth validation", () => {
    it("returns UNAUTHORIZED error when no session", async () => {
      mockAuth.mockResolvedValue(null)

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: "+48123456789",
      })

      expect(result).toEqual({
        success: false,
        error: "errors.unauthorized",
        code: "UNAUTHORIZED",
      })
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("returns UNAUTHORIZED error when session has no user", async () => {
      mockAuth.mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result).toEqual({
        success: false,
        error: "errors.unauthorized",
        code: "UNAUTHORIZED",
      })
    })

    it("returns UNAUTHORIZED error when session has no user id", async () => {
      mockAuth.mockResolvedValue({
        user: { id: null, email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result).toEqual({
        success: false,
        error: "errors.unauthorized",
        code: "UNAUTHORIZED",
      })
    })
  })

  // ===========================================================================
  // ALREADY COMPANY CHECK
  // ===========================================================================

  describe("Already company check", () => {
    it("returns ALREADY_COMPANY error when user has existing company", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
      mockPrisma.companyProfile.findUnique.mockResolvedValue({
        id: "company-1",
        userId: "user-1",
        companyName: "Existing Company",
        slug: "existing-company",
        nip: "1234567890",
        address: "Old Street 1",
        phone: null,
        viesVerified: false,
        verifiedAt: null,
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "9876543210",
        address: "Test Street 123",
      })

      expect(result).toEqual({
        success: false,
        error: "companies.errors.alreadyCompany",
        code: "ALREADY_COMPANY",
      })
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe("Zod validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
    })

    it("rejects missing companyName", async () => {
      const result = await upgradeToCompanyAction({
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.field).toBe("companyName")
      }
    })

    it("rejects companyName too short (< 2 chars)", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "T",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("short")
      }
    })

    it("rejects companyName too long (> 100 chars)", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "A".repeat(101),
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("long")
      }
    })

    it("rejects missing nip", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        address: "Test Street 123",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.field).toBe("nip")
      }
    })

    it("rejects invalid nip format (letters)", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "ABC1234567",
        address: "Test Street 123",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("Invalid NIP format")
      }
    })

    it("rejects invalid nip format (wrong length)", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "12345",
        address: "Test Street 123",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("Invalid NIP format")
      }
    })

    it("accepts valid nip format with dashes", async () => {
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      mockCheckVATWithRetry.mockResolvedValue({
        valid: true,
        name: "Test Company",
        address: "Test Address",
        countryCode: "PL",
        vatNumber: "1234567890",
        requestDate: new Date(),
      })
      mockGenerateSlug.mockResolvedValue("test-company")
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.companyProfile.create.mockResolvedValue({
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "12-345-678-90",
        address: "Test Street 123",
      })

      expect(result.success).toBe(true)
    })

    it("rejects missing address", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.field).toBe("address")
      }
    })

    it("rejects address too short (< 5 chars)", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "abc",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("short")
      }
    })

    it("rejects address too long (> 200 chars)", async () => {
      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "A".repeat(201),
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
        expect(result.error).toContain("long")
      }
    })

    it("accepts valid data without phone (optional field)", async () => {
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      mockCheckVATWithRetry.mockResolvedValue({
        valid: true,
        name: "Test Company",
        address: "Test Address",
        countryCode: "PL",
        vatNumber: "1234567890",
        requestDate: new Date(),
      })
      mockGenerateSlug.mockResolvedValue("test-company")
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.companyProfile.create.mockResolvedValue({
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result.success).toBe(true)
    })
  })

  // ===========================================================================
  // NIP UNIQUENESS
  // ===========================================================================

  describe("NIP uniqueness check", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
    })

    it("returns NIP_EXISTS error when NIP already taken", async () => {
      mockPrisma.companyProfile.findUnique
        .mockResolvedValueOnce(null) // First check: user doesn't have company
        .mockResolvedValueOnce({
          // Second check: NIP exists
          id: "company-2",
          userId: "user-2",
          companyName: "Other Company",
          slug: "other-company",
          nip: "1234567890",
          address: "Other Street 1",
          phone: null,
          viesVerified: false,
          verifiedAt: null,
          description: null,
          website: null,
          categoryId: null,
          socialLinks: null,
          logo: null,
          banner: null,
          latitude: null,
          longitude: null,
          businessHours: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result).toEqual({
        success: false,
        error: "companies.errors.nipExists",
        code: "NIP_EXISTS",
        field: "nip",
      })
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // VIES VERIFICATION
  // ===========================================================================

  describe("VIES verification", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      mockGenerateSlug.mockResolvedValue("test-company")
    })

    it("marks company as verified when VIES returns valid", async () => {
      const verifiedDate = new Date()
      mockCheckVATWithRetry.mockResolvedValue({
        valid: true,
        name: "Test Company",
        address: "Test Address",
        countryCode: "PL",
        vatNumber: "1234567890",
        requestDate: verifiedDate,
      })

      const createdCompany = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: "+48123456789",
        viesVerified: true,
        verifiedAt: expect.any(Date),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.companyProfile.create.mockResolvedValue(createdCompany)

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: "+48123456789",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.viesStatus).toBe("verified")
        expect(result.data.company.viesVerified).toBe(true)
      }

      expect(mockCheckVATWithRetry).toHaveBeenCalledWith("PL", "1234567890")
    })

    it("marks company as pending when VIES returns invalid", async () => {
      mockCheckVATWithRetry.mockResolvedValue({
        valid: false,
        name: "",
        address: "",
        countryCode: "PL",
        vatNumber: "1234567890",
        requestDate: new Date(),
      })

      const createdCompany = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: null,
        viesVerified: false,
        verifiedAt: null,
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.companyProfile.create.mockResolvedValue(createdCompany)

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.viesStatus).toBe("pending_manual_review")
        expect(result.data.company.viesVerified).toBe(false)
        expect(result.data.company.verifiedAt).toBeNull()
      }
    })

    it("gracefully handles VIES API failure", async () => {
      mockCheckVATWithRetry.mockRejectedValue(new Error("VIES_API_UNAVAILABLE"))

      const createdCompany = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: null,
        viesVerified: false,
        verifiedAt: null,
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.companyProfile.create.mockResolvedValue(createdCompany)

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.viesStatus).toBe("pending_manual_review")
        expect(result.data.company.viesVerified).toBe(false)
      }
    })
  })

  // ===========================================================================
  // SLUG GENERATION
  // ===========================================================================

  describe("Slug generation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      mockCheckVATWithRetry.mockResolvedValue({
        valid: true,
        name: "Test Company",
        address: "Test Address",
        countryCode: "PL",
        vatNumber: "1234567890",
        requestDate: new Date(),
      })
    })

    it("calls generateSlug with company name", async () => {
      mockGenerateSlug.mockResolvedValue("my-awesome-company")

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.companyProfile.create.mockResolvedValue({
        id: "company-1",
        userId: "user-1",
        companyName: "My Awesome Company",
        slug: "my-awesome-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await upgradeToCompanyAction({
        companyName: "My Awesome Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(mockGenerateSlug).toHaveBeenCalledWith(
        "My Awesome Company",
        expect.any(Object)
      )
    })
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy path", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      mockCheckVATWithRetry.mockResolvedValue({
        valid: true,
        name: "Test Company",
        address: "Test Address",
        countryCode: "PL",
        vatNumber: "1234567890",
        requestDate: new Date(),
      })
      mockGenerateSlug.mockResolvedValue("test-company")
    })

    it("creates company with all data and updates user role", async () => {
      const createdCompany = {
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: "+48123456789",
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.user.update.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        role: "COMPANY",
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        password: null,
        displayName: null,
        bio: null,
        location: null,
        latitude: null,
        longitude: null,
        avatar: null,
        darkMode: false,
      })
      mockPrisma.companyProfile.create.mockResolvedValue(createdCompany)

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: "+48123456789",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.company).toMatchObject({
          companyName: "Test Company",
          slug: "test-company",
          nip: "1234567890",
          address: "Test Street 123",
          phone: "+48123456789",
        })
        expect(result.data.viesStatus).toBe("verified")
      }

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { role: "COMPANY" },
      })

      expect(mockPrisma.companyProfile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          companyName: "Test Company",
          slug: "test-company",
          nip: "1234567890",
          viesVerified: true,
          verifiedAt: expect.any(Date),
          address: "Test Street 123",
          phone: "+48123456789",
        },
      })
    })

    it("revalidates correct paths after successful creation", async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma)
      })
      mockPrisma.companyProfile.create.mockResolvedValue({
        id: "company-1",
        userId: "user-1",
        companyName: "Test Company",
        slug: "test-company",
        nip: "1234567890",
        address: "Test Street 123",
        phone: null,
        viesVerified: true,
        verifiedAt: new Date(),
        description: null,
        website: null,
        categoryId: null,
        socialLinks: null,
        logo: null,
        banner: null,
        latitude: null,
        longitude: null,
        businessHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result.success).toBe(true)

      expect(mockRevalidatePath).toHaveBeenCalledWith("/companies/test-company")
      expect(mockRevalidatePath).toHaveBeenCalledWith("/panel/company")
      expect(mockRevalidatePath).toHaveBeenCalledWith("/settings")
      expect(mockRevalidatePath).toHaveBeenCalledTimes(3)
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database errors", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })
      mockPrisma.companyProfile.findUnique.mockResolvedValue(null)
      mockCheckVATWithRetry.mockResolvedValue({
        valid: true,
        name: "Test Company",
        address: "Test Address",
        countryCode: "PL",
        vatNumber: "1234567890",
        requestDate: new Date(),
      })
      mockGenerateSlug.mockResolvedValue("test-company")
    })

    it("returns CREATE_FAILED error when transaction fails", async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error("Database error"))

      const result = await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(result).toEqual({
        success: false,
        error: "companies.errors.createFailed",
        code: "CREATE_FAILED",
      })
      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })

    it("does not revalidate paths when transaction fails", async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error("Database error"))

      await upgradeToCompanyAction({
        companyName: "Test Company",
        nip: "1234567890",
        address: "Test Street 123",
      })

      expect(mockRevalidatePath).not.toHaveBeenCalled()
    })
  })
})
