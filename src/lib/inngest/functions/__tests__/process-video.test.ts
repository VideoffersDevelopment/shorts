import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Short, ShortStatus } from "@prisma/client"

// ===========================================================================
// SET ENV VARS BEFORE IMPORTS (captured at module load time)
// ===========================================================================

process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"
process.env.R2_VIDEO_HLS_BUCKET = "hls-bucket"

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
  getVideoDownloadUrl: vi.fn()
}))

vi.mock("@/lib/qencode", () => ({
  startQencodeJob: vi.fn()
}))

// Mock Inngest client
vi.mock("../../client", () => ({
  inngest: {
    createFunction: vi.fn((config, trigger, handler) => {
      // Return a wrapper that exposes the handler for testing
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
import { getVideoDownloadUrl } from "@/lib/r2-video"
import { startQencodeJob } from "@/lib/qencode"
import { startTranscoding } from "../process-video"

const mockPrisma = vi.mocked(prisma)
const mockGetVideoDownloadUrl = vi.mocked(getVideoDownloadUrl)
const mockStartQencodeJob = vi.mocked(startQencodeJob)

// ===========================================================================
// TEST DATA
// ===========================================================================

interface MockShortRecord {
  id: string
  status: ShortStatus
  rawVideoKey: string | null
  companyId: string
}

const mockShort: MockShortRecord = {
  id: "short-123",
  status: "PROCESSING",
  rawVideoKey: "videos/raw/short-123.mp4",
  companyId: "company-456"
}

const mockEvent = {
  name: "shorts/transcode.started" as const,
  data: {
    shortId: "short-123",
    rawVideoKey: "videos/raw/short-123.mp4",
    userId: "user-789"
  }
}

const mockQencodeResult = {
  taskToken: "qencode-task-token-abc",
  statusUrl: "https://api.qencode.com/v1/status?task_tokens=qencode-task-token-abc"
}

// Helper to create a mock step runner
function createMockStep() {
  return {
    run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
      return await fn()
    })
  }
}

describe("startTranscoding Inngest Function", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"
    process.env.R2_VIDEO_HLS_BUCKET = "hls-bucket"
  })

  // ===========================================================================
  // FUNCTION CONFIGURATION
  // ===========================================================================

  describe("Function Configuration", () => {
    it("has correct function id", () => {
      expect(startTranscoding.id).toBe("start-transcoding")
    })

    it("has correct function name", () => {
      expect(startTranscoding.name).toBe("Start Video Transcoding")
    })

    it("listens to shorts/transcode.started event", () => {
      expect(startTranscoding.trigger).toEqual({
        event: "shorts/transcode.started"
      })
    })

    it("has retry configuration", () => {
      expect(startTranscoding.retries).toBe(3)
    })
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("successfully starts transcoding and returns task token", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue(
        "https://storage.example.com/presigned-url"
      )
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({
        ...mockShort,
        qencodeTaskId: mockQencodeResult.taskToken
      } as unknown as Short)

      // Act
      const result = await startTranscoding.handler({
        event: mockEvent,
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: true,
        shortId: "short-123",
        taskToken: "qencode-task-token-abc",
        statusUrl: "https://api.qencode.com/v1/status?task_tokens=qencode-task-token-abc"
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
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await startTranscoding.handler({
        event: mockEvent,
        step: mockStep
      })

      // Assert
      expect(stepOrder).toEqual([
        "verify-short",
        "get-download-url",
        "start-qencode-job",
        "update-short-task-id"
      ])
    })

    it("calls startQencodeJob with correct parameters", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue(
        "https://storage.example.com/presigned-video.mp4"
      )
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await startTranscoding.handler({
        event: mockEvent,
        step: mockStep
      })

      // Assert - Note: ENV vars captured at module load, so we check structure
      // outputBucket may be undefined in test env (R2_VIDEO_HLS_BUCKET not set)
      const callArgs = mockStartQencodeJob.mock.calls[0][0]
      expect(callArgs).toMatchObject({
        inputUrl: "https://storage.example.com/presigned-video.mp4",
        outputPath: "shorts/company-456/short-123"
      })
      expect(callArgs.webhookUrl).toMatch(/\/api\/webhooks\/qencode$/)
      expect(callArgs).toHaveProperty("outputBucket")
    })

    it("updates short with qencode task ID", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await startTranscoding.handler({
        event: mockEvent,
        step: mockStep
      })

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: { qencodeTaskId: "qencode-task-token-abc" }
      })
    })

    it("uses rawVideoKey from event data when provided", async () => {
      // Arrange
      const mockStep = createMockStep()
      const eventWithKey = {
        ...mockEvent,
        data: { ...mockEvent.data, rawVideoKey: "custom/path/video.mp4" }
      }
      mockPrisma.short.findUnique.mockResolvedValue({
        ...mockShort,
        rawVideoKey: "original/path.mp4"
      } as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await startTranscoding.handler({
        event: eventWithKey,
        step: mockStep
      })

      // Assert
      expect(mockGetVideoDownloadUrl).toHaveBeenCalledWith({
        key: "custom/path/video.mp4",
        expiresIn: 3600
      })
    })
  })

  // ===========================================================================
  // SHORT NOT FOUND
  // ===========================================================================

  describe("Short Not Found", () => {
    it("throws error when short does not exist", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(
        startTranscoding.handler({
          event: mockEvent,
          step: mockStep
        })
      ).rejects.toThrow("Short short-123 not found")
    })
  })

  // ===========================================================================
  // INVALID STATUS
  // ===========================================================================

  describe("Invalid Status", () => {
    const invalidStatuses: ShortStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED", "DELETED", "PENDING_PAYMENT"]

    for (const status of invalidStatuses) {
      it(`throws error when short status is ${status}`, async () => {
        // Arrange
        const mockStep = createMockStep()
        mockPrisma.short.findUnique.mockResolvedValue({
          ...mockShort,
          status
        } as unknown as Short)

        // Act & Assert
        await expect(
          startTranscoding.handler({
            event: mockEvent,
            step: mockStep
          })
        ).rejects.toThrow(
          `Short short-123 is not in PROCESSING status (current: ${status})`
        )
      })
    }
  })

  // ===========================================================================
  // NO RAW VIDEO KEY
  // ===========================================================================

  describe("No Raw Video Key", () => {
    it("throws error when no raw video key in event or short", async () => {
      // Arrange
      const mockStep = createMockStep()
      const eventWithoutKey = {
        ...mockEvent,
        data: { ...mockEvent.data, rawVideoKey: "" }
      }
      mockPrisma.short.findUnique.mockResolvedValue({
        ...mockShort,
        rawVideoKey: null
      } as unknown as Short)

      // Act & Assert
      await expect(
        startTranscoding.handler({
          event: eventWithoutKey,
          step: mockStep
        })
      ).rejects.toThrow("No raw video key for short short-123")
    })

    it("uses short.rawVideoKey when event rawVideoKey is empty", async () => {
      // Arrange
      const mockStep = createMockStep()
      const eventWithEmptyKey = {
        ...mockEvent,
        data: { ...mockEvent.data, rawVideoKey: "" }
      }
      mockPrisma.short.findUnique.mockResolvedValue({
        ...mockShort,
        rawVideoKey: "from-database/video.mp4"
      } as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await startTranscoding.handler({
        event: eventWithEmptyKey,
        step: mockStep
      })

      // Assert
      expect(mockGetVideoDownloadUrl).toHaveBeenCalledWith({
        key: "from-database/video.mp4",
        expiresIn: 3600
      })
    })
  })

  // ===========================================================================
  // QENCODE API ERRORS
  // ===========================================================================

  describe("Qencode API Errors", () => {
    it("throws error when Qencode job fails to start", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockRejectedValue(new Error("Qencode API error"))

      // Act & Assert
      await expect(
        startTranscoding.handler({
          event: mockEvent,
          step: mockStep
        })
      ).rejects.toThrow("Qencode API error")

      // Verify short was not updated with task ID
      expect(mockPrisma.short.update).not.toHaveBeenCalled()
    })

    it("throws error when presigned URL generation fails", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockGetVideoDownloadUrl.mockRejectedValue(new Error("R2 signing error"))

      // Act & Assert
      await expect(
        startTranscoding.handler({
          event: mockEvent,
          step: mockStep
        })
      ).rejects.toThrow("R2 signing error")
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    it("throws error when short lookup fails", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockRejectedValue(new Error("Database connection failed"))

      // Act & Assert
      await expect(
        startTranscoding.handler({
          event: mockEvent,
          step: mockStep
        })
      ).rejects.toThrow("Database connection failed")
    })

    it("throws error when short update fails", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockRejectedValue(new Error("Update failed"))

      // Act & Assert
      await expect(
        startTranscoding.handler({
          event: mockEvent,
          step: mockStep
        })
      ).rejects.toThrow("Update failed")
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles localhost URL for development", async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_APP_URL
      const mockStep = createMockStep()
      mockPrisma.short.findUnique.mockResolvedValue(mockShort as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      // Act
      await startTranscoding.handler({
        event: mockEvent,
        step: mockStep
      })

      // Assert - Should use localhost fallback
      expect(mockStartQencodeJob).toHaveBeenCalledWith(
        expect.objectContaining({
          webhookUrl: "http://localhost:3000/api/webhooks/qencode"
        })
      )
    })

    it("constructs correct output path with company and short ID", async () => {
      // Arrange
      const mockStep = createMockStep()
      const customShort = {
        ...mockShort,
        id: "short-custom-id",
        companyId: "company-custom-id"
      }
      mockPrisma.short.findUnique.mockResolvedValue(customShort as unknown as Short)
      mockGetVideoDownloadUrl.mockResolvedValue("https://presigned-url")
      mockStartQencodeJob.mockResolvedValue(mockQencodeResult)
      mockPrisma.short.update.mockResolvedValue({} as Short)

      const customEvent = {
        ...mockEvent,
        data: { ...mockEvent.data, shortId: "short-custom-id" }
      }

      // Act
      await startTranscoding.handler({
        event: customEvent,
        step: mockStep
      })

      // Assert
      expect(mockStartQencodeJob).toHaveBeenCalledWith(
        expect.objectContaining({
          outputPath: "shorts/company-custom-id/short-custom-id"
        })
      )
    })
  })
})
