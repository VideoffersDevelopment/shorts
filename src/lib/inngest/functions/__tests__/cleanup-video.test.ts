import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Short } from "@prisma/client"

// ===========================================================================
// MOCKS - Must be defined before imports
// ===========================================================================

vi.mock("@/lib/prisma", () => ({
  prisma: {
    short: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

vi.mock("@/lib/r2-video", () => ({
  deleteVideoObject: vi.fn()
}))

// Mock Inngest client
vi.mock("../../client", () => ({
  inngest: {
    createFunction: vi.fn((config, trigger, handler) => {
      return {
        ...config,
        trigger,
        handler
      }
    })
  }
}))

// Import after mocks
import { prisma } from "@/lib/prisma"
import { deleteVideoObject } from "@/lib/r2-video"
import { cleanupRawVideo } from "../cleanup-video"

const mockPrisma = vi.mocked(prisma)
const mockDeleteVideoObject = vi.mocked(deleteVideoObject)

// ===========================================================================
// TEST DATA
// ===========================================================================

interface MockShortRecord {
  id: string
  rawVideoKey: string | null
  status: string
}

const mockShort: MockShortRecord = {
  id: "short-123",
  rawVideoKey: "videos/raw/short-123.mp4",
  status: "PUBLISHED"
}

const mockSuccessEvent = {
  name: "shorts/transcode.completed" as const,
  data: {
    shortId: "short-123",
    qencodeTaskId: "qencode-task-abc",
    hlsPlaylistUrl: "https://hls.example.com/master.m3u8",
    thumbnailUrl: "https://thumb.example.com/thumb.jpg",
    duration: 30,
    success: true
  }
}

const mockFailureEvent = {
  name: "shorts/transcode.completed" as const,
  data: {
    shortId: "short-123",
    qencodeTaskId: "qencode-task-abc",
    hlsPlaylistUrl: "",
    thumbnailUrl: null,
    duration: 0,
    success: false,
    error: "Transcoding failed"
  }
}

// Helper to create a mock step runner
function createMockStep() {
  return {
    run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
      return await fn()
    })
  }
}

describe("cleanupRawVideo Inngest Function", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // FUNCTION CONFIGURATION
  // ===========================================================================

  describe("Function Configuration", () => {
    it("has correct function id", () => {
      expect(cleanupRawVideo.id).toBe("cleanup-raw-video")
    })

    it("has correct function name", () => {
      expect(cleanupRawVideo.name).toBe("Cleanup Raw Video from R2")
    })

    it("listens to shorts/transcode.completed event", () => {
      expect(cleanupRawVideo.trigger).toEqual({
        event: "shorts/transcode.completed"
      })
    })

    it("has retry configuration", () => {
      expect(cleanupRawVideo.retries).toBe(3)
    })
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("successfully deletes raw video and clears key from database", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockDeleteVideoObject.mockResolvedValue(undefined)
      mockPrisma.short.update.mockResolvedValue({
        ...mockShort,
        rawVideoKey: null
      } as unknown as Short)

      // Act
      const result = await cleanupRawVideo.handler({
        event: mockSuccessEvent,
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: true,
        shortId: "short-123",
        deletedKey: "videos/raw/short-123.mp4"
      })
    })

    it("executes all steps in correct order", async () => {
      // Arrange
      const stepOrder: string[] = []
      const mockStep = {
        run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
          stepOrder.push(name)
          return await fn()
        })
      }

      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockDeleteVideoObject.mockResolvedValue(undefined)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await cleanupRawVideo.handler({
        event: mockSuccessEvent,
        step: mockStep
      })

      // Assert
      expect(stepOrder).toEqual([
        "get-short",
        "delete-raw-video",
        "clear-raw-video-key"
      ])
    })

    it("calls deleteVideoObject with correct key", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue({
        ...mockShort,
        rawVideoKey: "custom/path/to/video.mp4"
      } as unknown as Short)
      mockDeleteVideoObject.mockResolvedValue(undefined)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await cleanupRawVideo.handler({
        event: mockSuccessEvent,
        step: mockStep
      })

      // Assert
      expect(mockDeleteVideoObject).toHaveBeenCalledWith("custom/path/to/video.mp4")
    })

    it("clears rawVideoKey in database", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockDeleteVideoObject.mockResolvedValue(undefined)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await cleanupRawVideo.handler({
        event: mockSuccessEvent,
        step: mockStep
      })

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: { rawVideoKey: null }
      })
    })
  })

  // ===========================================================================
  // TRANSCODING FAILED - SKIP CLEANUP
  // ===========================================================================

  describe("Transcoding Failed - Skip Cleanup", () => {
    it("skips cleanup when transcoding failed", async () => {
      // Arrange
      const mockStep = createMockStep()

      // Act
      const result = await cleanupRawVideo.handler({
        event: mockFailureEvent,
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Skipping cleanup - transcoding failed"
      })
      expect(mockPrisma.short.findUnique).not.toHaveBeenCalled()
      expect(mockDeleteVideoObject).not.toHaveBeenCalled()
    })

    it("does not modify database when transcoding failed", async () => {
      // Arrange
      const mockStep = createMockStep()

      // Act
      await cleanupRawVideo.handler({
        event: mockFailureEvent,
        step: mockStep
      })

      // Assert
      expect(mockPrisma.short.update).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // SHORT NOT FOUND
  // ===========================================================================

  describe("Short Not Found", () => {
    it("returns failure when short does not exist", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(null)

      // Act
      const result = await cleanupRawVideo.handler({
        event: mockSuccessEvent,
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Short short-123 not found"
      })
      expect(mockDeleteVideoObject).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // NO RAW VIDEO KEY
  // ===========================================================================

  describe("No Raw Video Key", () => {
    it("returns success when short has no raw video key", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue({
        ...mockShort,
        rawVideoKey: null
      } as unknown as Short)

      // Act
      const result = await cleanupRawVideo.handler({
        event: mockSuccessEvent,
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: true,
        message: "No raw video key to cleanup"
      })
      expect(mockDeleteVideoObject).not.toHaveBeenCalled()
      expect(mockPrisma.short.update).not.toHaveBeenCalled()
    })

    it("handles empty string rawVideoKey", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue({
        ...mockShort,
        rawVideoKey: ""
      } as unknown as Short)

      // Act
      const result = await cleanupRawVideo.handler({
        event: mockSuccessEvent,
        step: mockStep
      })

      // Assert - Empty string is falsy, so should skip
      expect(result).toEqual({
        success: true,
        message: "No raw video key to cleanup"
      })
    })
  })

  // ===========================================================================
  // R2 DELETION ERRORS
  // ===========================================================================

  describe("R2 Deletion Errors", () => {
    it("throws error when R2 deletion fails", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockDeleteVideoObject.mockRejectedValue(new Error("R2 deletion failed"))

      // Act & Assert
      await expect(
        cleanupRawVideo.handler({
          event: mockSuccessEvent,
          step: mockStep
        })
      ).rejects.toThrow("R2 deletion failed")

      // Verify database was not updated
      expect(mockPrisma.short.update).not.toHaveBeenCalled()
    })

    it("throws error when R2 returns access denied", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockDeleteVideoObject.mockRejectedValue(new Error("Access Denied"))

      // Act & Assert
      await expect(
        cleanupRawVideo.handler({
          event: mockSuccessEvent,
          step: mockStep
        })
      ).rejects.toThrow("Access Denied")
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    it("throws error when short lookup fails", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      )

      // Act & Assert
      await expect(
        cleanupRawVideo.handler({
          event: mockSuccessEvent,
          step: mockStep
        })
      ).rejects.toThrow("Database connection failed")
    })

    it("throws error when clearing rawVideoKey fails", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockDeleteVideoObject.mockResolvedValue(undefined)
      mockPrisma.short.update.mockRejectedValue(new Error("Update failed"))

      // Act & Assert
      await expect(
        cleanupRawVideo.handler({
          event: mockSuccessEvent,
          step: mockStep
        })
      ).rejects.toThrow("Update failed")
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles various raw video key formats", async () => {
      const testKeys = [
        "videos/raw/short-123.mp4",
        "uploads/company-1/2025/01/video.mov",
        "raw/temp_video_file.webm",
        "videos/with spaces/video.mp4",
        "videos/unicode-\u00e9\u00e8\u00ea.mp4"
      ]

      for (const key of testKeys) {
        vi.clearAllMocks()
        const mockStep = createMockStep()
        mockPrisma.short.findUnique.mockResolvedValue({
          ...mockShort,
          rawVideoKey: key
        } as unknown as Short)
        mockDeleteVideoObject.mockResolvedValue(undefined)
        mockPrisma.short.update.mockResolvedValue({} as Short)

        // Act
        const result = await cleanupRawVideo.handler({
          event: mockSuccessEvent,
          step: mockStep
        })

        // Assert
        expect(result.success).toBe(true)
        expect(result.deletedKey).toBe(key)
        expect(mockDeleteVideoObject).toHaveBeenCalledWith(key)
      }
    })

    it("uses shortId from event data", async () => {
      // Arrange
      const mockStep = createMockStep()
      const customEvent = {
        ...mockSuccessEvent,
        data: { ...mockSuccessEvent.data, shortId: "custom-short-id" }
      }
      mockPrisma.short.findUnique.mockResolvedValue(null)

      // Act
      const result = await cleanupRawVideo.handler({
        event: customEvent,
        step: mockStep
      })

      // Assert
      expect(result.message).toContain("custom-short-id")
      expect(mockPrisma.short.findUnique).toHaveBeenCalledWith({
        where: { id: "custom-short-id" },
        select: {
          id: true,
          rawVideoKey: true,
          status: true
        }
      })
    })

    it("handles success=true with empty error field", async () => {
      // Arrange
      const mockStep = createMockStep()
      const eventWithEmptyError = {
        ...mockSuccessEvent,
        data: { ...mockSuccessEvent.data, error: "" }
      }
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockDeleteVideoObject.mockResolvedValue(undefined)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      const result = await cleanupRawVideo.handler({
        event: eventWithEmptyError,
        step: mockStep
      })

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
