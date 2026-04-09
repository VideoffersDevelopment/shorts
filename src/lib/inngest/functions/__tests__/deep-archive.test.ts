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

vi.mock("@/lib/r2", () => ({
  deleteObject: vi.fn(),
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
import { deleteObject } from "@/lib/r2"
import { deepArchiveExpiredShorts } from "../deep-archive"

const mockPrisma = vi.mocked(prisma)
const mockDeleteObject = vi.mocked(deleteObject)

// ===========================================================================
// TEST DATA
// ===========================================================================

interface MockStaleShort {
  id: string
  companyId: string
  title: string
  rawVideoKey: string | null
  hlsPlaylistUrl: string | null
  thumbnailUrl: string | null
  expiresAt: Date
}

const now = new Date()
const thirteenMonthsAgo = new Date(now)
thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13)

const mockStaleShorts: MockStaleShort[] = [
  {
    id: "short-1",
    companyId: "company-a",
    title: "Old Expired Short 1",
    rawVideoKey: "raw/company-a/short-1.mp4",
    hlsPlaylistUrl: "https://cdn.example.com/shorts/company-a/short-1/master.m3u8",
    thumbnailUrl: "https://cdn.example.com/shorts/company-a/short-1/thumbnail.jpg",
    expiresAt: thirteenMonthsAgo,
  },
  {
    id: "short-2",
    companyId: "company-b",
    title: "Old Expired Short 2",
    rawVideoKey: "raw/company-b/short-2.mp4",
    hlsPlaylistUrl: "https://cdn.example.com/shorts/company-b/short-2/master.m3u8",
    thumbnailUrl: "https://cdn.example.com/shorts/company-b/short-2/thumbnail.jpg",
    expiresAt: thirteenMonthsAgo,
  },
]

function createMockStep() {
  return {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => {
      return await fn()
    }),
  }
}

type DeepArchiveHandler = (ctx: {
  step: ReturnType<typeof createMockStep>
}) => Promise<{
  success: boolean
  archivedCount: number
  archivedIds?: string[]
  cleanupResults?: { shortId: string; filesDeleted: number; errors: string[] }[]
  message?: string
}>

// ===========================================================================
// TESTS
// ===========================================================================

describe("deepArchiveExpiredShorts Inngest Function", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteObject.mockResolvedValue(undefined)
  })

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe("Happy Path", () => {
    it("finds EXPIRED shorts older than 12 months, deletes R2 files, and marks ARCHIVED", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockStaleShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      const result = await handler({ step: mockStep })

      expect(result).toEqual({
        success: true,
        archivedCount: 2,
        archivedIds: ["short-1", "short-2"],
        cleanupResults: expect.arrayContaining([
          expect.objectContaining({ shortId: "short-1", filesDeleted: 3 }),
          expect.objectContaining({ shortId: "short-2", filesDeleted: 3 }),
        ]),
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
      mockPrisma.short.findMany.mockResolvedValue(mockStaleShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      expect(stepOrder).toEqual([
        "find-stale-expired",
        "cleanup-r2-files",
        "archive-shorts",
        "log-results",
      ])
    })
  })

  // =========================================================================
  // NO STALE SHORTS
  // =========================================================================

  describe("No Stale Shorts", () => {
    it("returns early with archivedCount 0 when no stale shorts found", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      const result = await handler({ step: mockStep })

      expect(result).toEqual({
        success: true,
        archivedCount: 0,
        message: "No stale expired shorts found",
      })
    })

    it("does not call deleteObject or updateMany when no stale shorts", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      expect(mockDeleteObject).not.toHaveBeenCalled()
      expect(mockPrisma.short.updateMany).not.toHaveBeenCalled()
    })

    it("only runs find-stale-expired step", async () => {
      const stepOrder: string[] = []
      const mockStep = {
        run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
          stepOrder.push(name)
          return await fn()
        }),
      }
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      expect(stepOrder).toEqual(["find-stale-expired"])
    })
  })

  // =========================================================================
  // R2 CLEANUP
  // =========================================================================

  describe("R2 Cleanup", () => {
    it("calls deleteObject for raw video, HLS master, and thumbnail", async () => {
      const mockStep = createMockStep()
      const singleShort: MockStaleShort[] = [mockStaleShorts[0]]
      mockPrisma.short.findMany.mockResolvedValue(singleShort as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 1 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      // Raw video
      expect(mockDeleteObject).toHaveBeenCalledWith("raw/company-a/short-1.mp4")
      // HLS master
      expect(mockDeleteObject).toHaveBeenCalledWith("shorts/company-a/short-1/master.m3u8")
      // Thumbnail
      expect(mockDeleteObject).toHaveBeenCalledWith("shorts/company-a/short-1/thumbnail.jpg")
      expect(mockDeleteObject).toHaveBeenCalledTimes(3)
    })

    it("skips rawVideoKey deletion when null", async () => {
      const mockStep = createMockStep()
      const shortWithoutRaw: MockStaleShort[] = [
        { ...mockStaleShorts[0], rawVideoKey: null },
      ]
      mockPrisma.short.findMany.mockResolvedValue(shortWithoutRaw as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 1 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      // Should NOT call delete for raw video
      expect(mockDeleteObject).not.toHaveBeenCalledWith("raw/company-a/short-1.mp4")
      // Should still call for HLS and thumbnail
      expect(mockDeleteObject).toHaveBeenCalledWith("shorts/company-a/short-1/master.m3u8")
      expect(mockDeleteObject).toHaveBeenCalledWith("shorts/company-a/short-1/thumbnail.jpg")
    })

    it("skips thumbnail deletion when thumbnailUrl is null", async () => {
      const mockStep = createMockStep()
      const shortWithoutThumb: MockStaleShort[] = [
        { ...mockStaleShorts[0], thumbnailUrl: null },
      ]
      mockPrisma.short.findMany.mockResolvedValue(shortWithoutThumb as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 1 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      expect(mockDeleteObject).not.toHaveBeenCalledWith("shorts/company-a/short-1/thumbnail.jpg")
      expect(mockDeleteObject).toHaveBeenCalledWith("raw/company-a/short-1.mp4")
      expect(mockDeleteObject).toHaveBeenCalledWith("shorts/company-a/short-1/master.m3u8")
    })
  })

  // =========================================================================
  // R2 ERRORS (GRACEFUL HANDLING)
  // =========================================================================

  describe("R2 Error Handling", () => {
    it("continues with other files when deleteObject fails for raw video", async () => {
      const mockStep = createMockStep()
      const singleShort: MockStaleShort[] = [mockStaleShorts[0]]
      mockPrisma.short.findMany.mockResolvedValue(singleShort as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 1 })

      mockDeleteObject
        .mockRejectedValueOnce(new Error("R2 timeout"))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      const result = await handler({ step: mockStep })

      // Should still succeed overall
      expect(result.success).toBe(true)
      expect(result.archivedCount).toBe(1)

      // Should have recorded the error
      const cleanup = result.cleanupResults?.[0]
      expect(cleanup?.errors).toHaveLength(1)
      expect(cleanup?.errors[0]).toContain("R2 timeout")
      expect(cleanup?.filesDeleted).toBe(2)
    })

    it("continues archiving even when all R2 deletions fail", async () => {
      const mockStep = createMockStep()
      const singleShort: MockStaleShort[] = [mockStaleShorts[0]]
      mockPrisma.short.findMany.mockResolvedValue(singleShort as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 1 })

      mockDeleteObject.mockRejectedValue(new Error("R2 unavailable"))

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      const result = await handler({ step: mockStep })

      // Still archives in the DB
      expect(result.success).toBe(true)
      expect(result.archivedCount).toBe(1)
      expect(mockPrisma.short.updateMany).toHaveBeenCalled()

      const cleanup = result.cleanupResults?.[0]
      expect(cleanup?.errors).toHaveLength(3)
      expect(cleanup?.filesDeleted).toBe(0)
    })

    it("records error messages from deleteObject failures", async () => {
      const mockStep = createMockStep()
      const singleShort: MockStaleShort[] = [mockStaleShorts[0]]
      mockPrisma.short.findMany.mockResolvedValue(singleShort as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 1 })

      mockDeleteObject
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("HLS not found"))
        .mockResolvedValueOnce(undefined)

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      const result = await handler({ step: mockStep })

      const cleanup = result.cleanupResults?.[0]
      expect(cleanup?.errors).toEqual([expect.stringContaining("HLS not found")])
      expect(cleanup?.filesDeleted).toBe(2)
    })
  })

  // =========================================================================
  // NULLIFIES MEDIA FIELDS
  // =========================================================================

  describe("Nullifies Media Fields", () => {
    it("sets hlsPlaylistUrl, thumbnailUrl, and rawVideoKey to null in updateMany", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockStaleShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      const updateCall = vi.mocked(mockPrisma.short.updateMany).mock.calls[0][0]
      expect(updateCall.data).toEqual(
        expect.objectContaining({
          hlsPlaylistUrl: null,
          thumbnailUrl: null,
          rawVideoKey: null,
        })
      )
    })
  })

  // =========================================================================
  // SETS ARCHIVED AT
  // =========================================================================

  describe("Sets archivedAt", () => {
    it("sets archivedAt timestamp when archiving", async () => {
      const mockStep = createMockStep()
      const beforeTest = new Date()
      mockPrisma.short.findMany.mockResolvedValue(mockStaleShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })
      const afterTest = new Date()

      const updateCall = vi.mocked(mockPrisma.short.updateMany).mock.calls[0][0]
      const archivedAt = (updateCall.data as { archivedAt: Date }).archivedAt
      expect(archivedAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime())
      expect(archivedAt.getTime()).toBeLessThanOrEqual(afterTest.getTime())
    })

    it("sets status to ARCHIVED", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockStaleShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      const updateCall = vi.mocked(mockPrisma.short.updateMany).mock.calls[0][0]
      expect(updateCall.data).toHaveProperty("status", "ARCHIVED")
    })
  })

  // =========================================================================
  // CUTOFF CALCULATION
  // =========================================================================

  describe("Cutoff Calculation", () => {
    it("queries for EXPIRED shorts with expiresAt 12+ months ago", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      const findCall = vi.mocked(mockPrisma.short.findMany).mock.calls[0][0]
      const cutoffDate = (findCall.where as { expiresAt: { lte: Date } }).expiresAt.lte

      // Cutoff should be approximately 12 months ago
      const expectedCutoff = new Date()
      expectedCutoff.setMonth(expectedCutoff.getMonth() - 12)

      // Allow a small tolerance (within 5 seconds)
      expect(Math.abs(cutoffDate.getTime() - expectedCutoff.getTime())).toBeLessThan(5000)
    })

    it("only queries shorts with EXPIRED status", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "EXPIRED",
          }),
        })
      )
    })

    it("uses EXPIRED status in updateMany WHERE clause as safety check", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockStaleShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockResolvedValue({ count: 2 })

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      const updateCall = vi.mocked(mockPrisma.short.updateMany).mock.calls[0][0]
      expect(updateCall.where).toHaveProperty("status", "EXPIRED")
    })

    it("selects correct fields including companyId and media URLs", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await handler({ step: mockStep })

      expect(mockPrisma.short.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            companyId: true,
            title: true,
            rawVideoKey: true,
            hlsPlaylistUrl: true,
            thumbnailUrl: true,
            expiresAt: true,
          },
        })
      )
    })
  })

  // =========================================================================
  // DATABASE ERRORS
  // =========================================================================

  describe("Database Errors", () => {
    it("throws error when findMany fails", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockRejectedValue(new Error("DB connection lost"))

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await expect(handler({ step: mockStep })).rejects.toThrow("DB connection lost")
    })

    it("throws error when updateMany fails", async () => {
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockStaleShorts as unknown as Short[])
      mockPrisma.short.updateMany.mockRejectedValue(new Error("Archive update failed"))

      const handler = deepArchiveExpiredShorts as unknown as DeepArchiveHandler
      await expect(handler({ step: mockStep })).rejects.toThrow("Archive update failed")
    })
  })
})
