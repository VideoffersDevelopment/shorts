import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Short } from "@prisma/client"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/lib/prisma", () => ({
  prisma: {
    short: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock("../../client", () => ({
  inngest: {
    createFunction: vi.fn(
      (_config: Record<string, unknown>, _trigger: Record<string, unknown>, handler: unknown) =>
        handler
    ),
  },
}))

// Import after mocks
import { prisma } from "@/lib/prisma"
import { expirePublishedShorts } from "../archive-expired"

const mockPrisma = vi.mocked(prisma)

// ===========================================================================
// TEST DATA
// ===========================================================================

interface MockShortRecord {
  id: string
  title: string
  expiresAt: Date
}

const now = new Date()
const expiredDate = new Date(now)
expiredDate.setDate(expiredDate.getDate() - 1)

const mockExpiredShorts: MockShortRecord[] = [
  { id: "short-1", title: "Expired Short 1", expiresAt: expiredDate },
  { id: "short-2", title: "Expired Short 2", expiresAt: expiredDate },
]

function createMockStep() {
  return {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => {
      return await fn()
    }),
  }
}

// ===========================================================================
// TESTS
// ===========================================================================

describe("expirePublishedShorts Inngest Function", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe("Happy Path", () => {
    it("finds PUBLISHED shorts past expiresAt and marks them EXPIRED", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<{ success: boolean; expiredCount: number; expiredIds: string[] }>
      const result = await handler({ step: mockStep })

      expect(result).toEqual({
        success: true,
        expiredCount: 2,
        expiredIds: ["short-1", "short-2"],
      })
    })

    it("sets status to EXPIRED, not ARCHIVED", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      expect(mockPrisma.short.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["short-1", "short-2"] },
          status: "PUBLISHED",
        },
        data: {
          status: "EXPIRED",
        },
      })
    })

    it("executes steps in correct order", async () => {
      const stepOrder: string[] = []
      const mockStep = {
        run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
          stepOrder.push(name)
          return await fn()
        }),
      }
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      expect(stepOrder).toEqual(["find-expired-shorts", "expire-shorts", "log-results"])
    })
  })

  // =========================================================================
  // NO EXPIRED SHORTS
  // =========================================================================

  describe("No Expired Shorts", () => {
    it("returns early with expiredCount 0 when no expired shorts found", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<{ success: boolean; expiredCount: number; message: string }>
      const result = await handler({ step: mockStep })

      expect(result).toEqual({
        success: true,
        expiredCount: 0,
        message: "No expired shorts found",
      })
    })

    it("does not call updateMany when no expired shorts found", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      expect(mockPrisma.short.updateMany).not.toHaveBeenCalled()
    })

    it("only runs find-expired-shorts step when no shorts found", async () => {
      const stepOrder: string[] = []
      const mockStep = {
        run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
          stepOrder.push(name)
          return await fn()
        }),
      }
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      expect(stepOrder).toEqual(["find-expired-shorts"])
    })
  })

  // =========================================================================
  // MULTIPLE SHORTS (BATCH UPDATE)
  // =========================================================================

  describe("Multiple Shorts", () => {
    it("handles batch update of many expired shorts", async () => {
      const mockStep = createMockStep()
      const manyShorts = Array.from({ length: 50 }, (_, i) => ({
        id: `short-${i}`,
        title: `Expired Short ${i}`,
        expiresAt: expiredDate,
      }))
      mockPrisma.short.findMany.mockResolvedValue(manyShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 50 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<{ success: boolean; expiredCount: number; expiredIds: string[] }>
      const result = await handler({ step: mockStep })

      expect(result.success).toBe(true)
      expect(result.expiredCount).toBe(50)
      expect(result.expiredIds).toHaveLength(50)
    })

    it("passes all short IDs to updateMany", async () => {
      const mockStep = createMockStep()
      const threeShorts = [
        { id: "s-a", title: "A", expiresAt: expiredDate },
        { id: "s-b", title: "B", expiresAt: expiredDate },
        { id: "s-c", title: "C", expiresAt: expiredDate },
      ]
      mockPrisma.short.findMany.mockResolvedValue(threeShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 3 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      expect(mockPrisma.short.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ["s-a", "s-b", "s-c"] },
          }),
        })
      )
    })
  })

  // =========================================================================
  // STATUS FILTER
  // =========================================================================

  describe("Status Filter", () => {
    it("only queries shorts with PUBLISHED status", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      expect(mockPrisma.short.findMany).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          expiresAt: { lte: expect.any(Date) },
        },
        select: {
          id: true,
          title: true,
          expiresAt: true,
        },
      })
    })

    it("uses PUBLISHED status in updateMany WHERE clause as double-check", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      const updateCall = vi.mocked(mockPrisma.short.updateMany).mock.calls[0][0]
      expect(updateCall.where).toHaveProperty("status", "PUBLISHED")
    })
  })

  // =========================================================================
  // DATABASE ERRORS
  // =========================================================================

  describe("Database Errors", () => {
    it("throws error when findMany fails", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockRejectedValue(new Error("Database connection failed"))

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>

      await expect(handler({ step: mockStep })).rejects.toThrow("Database connection failed")
    })

    it("throws error when updateMany fails", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockRejectedValue(new Error("Update failed"))

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>

      await expect(handler({ step: mockStep })).rejects.toThrow("Update failed")
    })
  })

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("handles partial update when some shorts already changed status", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 1 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<{ expiredCount: number; expiredIds: string[] }>
      const result = await handler({ step: mockStep })

      expect(result.expiredCount).toBe(1)
      expect(result.expiredIds).toEqual(["short-1", "short-2"])
    })

    it("does not set archivedAt (only EXPIRED status)", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiredShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = expirePublishedShorts as unknown as (ctx: {
        step: typeof mockStep
      }) => Promise<unknown>
      await handler({ step: mockStep })

      const updateCall = vi.mocked(mockPrisma.short.updateMany).mock.calls[0][0]
      expect(updateCall.data).toEqual({ status: "EXPIRED" })
      expect(updateCall.data).not.toHaveProperty("archivedAt")
    })
  })
})
