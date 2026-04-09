import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextResponse } from "next/server"

// ===========================================================================
// MOCKS - Must be defined before imports
// ===========================================================================

vi.mock("@/lib/prisma", () => ({
  prisma: {
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

vi.mock("@/lib/qencode", () => ({
  validateQencodePayload: vi.fn(),
  parseQencodeWebhookPayload: vi.fn()
}))

vi.mock("@/lib/r2-video", () => ({
  getHlsPublicUrl: vi.fn(),
  getThumbnailPublicUrl: vi.fn()
}))

vi.mock("@/lib/email", () => ({
  sendProcessingCompleteEmail: vi.fn()
}))

vi.mock("@/lib/publication/publication-controller", () => ({
  refundCredit: vi.fn()
}))

// Import after mocks
import { POST } from "../route"
import { prisma } from "@/lib/prisma"
import { inngest } from "@/lib/inngest/client"
import { validateQencodePayload, parseQencodeWebhookPayload } from "@/lib/qencode"
import { getHlsPublicUrl, getThumbnailPublicUrl } from "@/lib/r2-video"
import { sendProcessingCompleteEmail } from "@/lib/email"
import { refundCredit } from "@/lib/publication/publication-controller"

const mockPrisma = vi.mocked(prisma)
const mockInngest = vi.mocked(inngest)
const mockValidatePayload = vi.mocked(validateQencodePayload)
const mockParsePayload = vi.mocked(parseQencodeWebhookPayload)
const mockGetHlsPublicUrl = vi.mocked(getHlsPublicUrl)
const mockGetThumbnailPublicUrl = vi.mocked(getThumbnailPublicUrl)
const mockSendEmail = vi.mocked(sendProcessingCompleteEmail)
const mockRefundCredit = vi.mocked(refundCredit)

// Store original env
const originalEnv = { ...process.env }

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockShortWithCompany = {
  id: "short-123",
  title: "Test Short",
  companyId: "company-456",
  rawVideoKey: "videos/raw/short-123.mp4",
  thumbnailUrl: null,
  duration: null,
  retryCount: 0,
  company: {
    userId: "user-789",
    user: {
      id: "user-789",
      email: "test@example.com"
    }
  }
}

const completedPayload = {
  task_token: "task-token-abc",
  status: "completed" as const,
  percent: 100,
  videos: [
    {
      url: "https://output.example.com/master.m3u8",
      type: "hls",
      duration: 30,
      size: 1024000,
      thumbnail: "https://thumb.example.com/thumb.jpg"
    }
  ]
}

const errorPayload = {
  task_token: "task-token-abc",
  status: "error" as const,
  error_code: 101,
  error_message: "Input file not found"
}

const encodingPayload = {
  task_token: "task-token-abc",
  status: "encoding" as const,
  percent: 50
}

// Helper to create mock request
function createMockRequest(body: string) {
  return {
    text: () => Promise.resolve(body)
  } as unknown as Request
}

describe("Qencode Webhook Handler - POST /api/webhooks/qencode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // ===========================================================================
  // PAYLOAD VALIDATION
  // ===========================================================================

  describe("Payload Validation", () => {
    it("returns 400 for invalid payload structure", async () => {
      // Arrange
      mockParsePayload.mockReturnValue(completedPayload)
      mockValidatePayload.mockReturnValue(false)
      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Invalid payload")
    })

    it("returns 400 for missing task_token", async () => {
      // Arrange
      mockParsePayload.mockReturnValue({ status: "completed" } as never)
      mockValidatePayload.mockReturnValue(false)
      const request = createMockRequest(JSON.stringify({ status: "completed" }))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
    })

    it("proceeds when payload is valid", async () => {
      // Arrange
      mockParsePayload.mockReturnValue(completedPayload)
      mockValidatePayload.mockReturnValue(true)
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
      mockSendEmail.mockResolvedValue(undefined)

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
    })
  })

  // ===========================================================================
  // PAYLOAD PARSING
  // ===========================================================================

  describe("Payload Parsing", () => {
    it("returns 400 for invalid JSON payload", async () => {
      // Arrange
      mockParsePayload.mockImplementation(() => {
        throw new Error("Invalid JSON")
      })
      const request = createMockRequest("{ invalid json }")

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Invalid payload")
    })
  })

  // ===========================================================================
  // SHORT NOT FOUND
  // ===========================================================================

  describe("Short Not Found", () => {
    it("returns 404 when short not found by task token", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue(null)

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe("Short not found")
    })

    it("searches for short by qencodeTaskId", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue(null)

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockPrisma.short.findFirst).toHaveBeenCalledWith({
        where: { qencodeTaskId: "task-token-abc" },
        include: expect.objectContaining({
          company: expect.objectContaining({
            include: expect.objectContaining({
              user: expect.any(Object)
            })
          })
        })
      })
    })
  })

  // ===========================================================================
  // COMPLETED STATUS - HAPPY PATH
  // ===========================================================================

  describe("Completed Status - Happy Path", () => {
    beforeEach(() => {
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
      mockSendEmail.mockResolvedValue(undefined)
    })

    it("updates short to PUBLISHED status", async () => {
      // Arrange
      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: expect.objectContaining({
          status: "PUBLISHED",
          hlsPlaylistUrl: "https://hls.example.com/master.m3u8",
          thumbnailUrl: "https://thumb.example.com/thumbnail.jpg",
          processingError: null
        })
      })
    })

    it("sets publishedAt and expiresAt dates", async () => {
      // Arrange
      const request = createMockRequest(JSON.stringify(completedPayload))
      const now = new Date()
      vi.setSystemTime(now)

      // Act
      await POST(request)

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: expect.objectContaining({
          publishedAt: expect.any(Date),
          expiresAt: expect.any(Date)
        })
      })
    })

    it("sends transcode.completed Inngest event", async () => {
      // Arrange
      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockInngest.send).toHaveBeenCalledWith({
        name: "shorts/transcode.completed",
        data: expect.objectContaining({
          shortId: "short-123",
          qencodeTaskId: "task-token-abc",
          success: true
        })
      })
    })

    it("sends processing complete email", async () => {
      // Arrange
      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert - Note: APP_URL is captured at module load, so we check the URL structure
      expect(mockSendEmail).toHaveBeenCalledWith({
        to: "test@example.com",
        shortTitle: "Test Short",
        shortId: "short-123",
        publicUrl: expect.stringContaining("/shorts/short-123")
      })
    })

    it("returns success response", async () => {
      // Arrange
      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({ success: true, status: "published" })
    })

    it("uses getThumbnailPublicUrl to generate thumbnail URL", async () => {
      // Arrange
      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockGetThumbnailPublicUrl).toHaveBeenCalledWith("company-456", "short-123")
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: expect.objectContaining({
          thumbnailUrl: "https://thumb.example.com/thumbnail.jpg"
        })
      })
    })
  })

  // ===========================================================================
  // COMPLETED STATUS - NO HLS OUTPUT
  // ===========================================================================

  describe("Completed Status - No HLS Output", () => {
    it("returns 400 when no HLS output found", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue({
        ...completedPayload,
        videos: []
      })
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")

      const request = createMockRequest(JSON.stringify({ ...completedPayload, videos: [] }))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("No HLS output")
    })

    it("returns 400 when videos array is undefined", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue({
        task_token: "task-token-abc",
        status: "completed" as const
        // No videos field
      })
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")

      const request = createMockRequest(JSON.stringify({ task_token: "task-token-abc", status: "completed" }))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(400)
    })
  })

  // ===========================================================================
  // ERROR STATUS - RETRY
  // ===========================================================================

  describe("Error Status - Retry", () => {
    beforeEach(() => {
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(errorPayload)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
    })

    it("increments retryCount and triggers retry when under limit", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortWithCompany,
        retryCount: 0
      } as never)
      mockPrisma.short.update.mockResolvedValue({
        ...mockShortWithCompany,
        retryCount: 1
      } as never)

      const request = createMockRequest(JSON.stringify(errorPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: {
          retryCount: { increment: 1 },
          processingError: "Input file not found"
        }
      })
      expect(mockInngest.send).toHaveBeenCalledWith({
        name: "shorts/transcode.started",
        data: expect.objectContaining({
          shortId: "short-123"
        })
      })
      const data = await response.json()
      expect(data.status).toBe("retrying")
    })

    it("uses default error message when not provided", async () => {
      // Arrange
      mockParsePayload.mockReturnValue({
        task_token: "task-token-abc",
        status: "error" as const
        // No error_message
      })
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortWithCompany,
        retryCount: 0
      } as never)
      mockPrisma.short.update.mockResolvedValue({ retryCount: 1 } as never)

      const request = createMockRequest(JSON.stringify({ task_token: "abc", status: "error" }))

      // Act
      await POST(request)

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: expect.objectContaining({
          processingError: "Transcoding failed"
        })
      })
    })
  })

  // ===========================================================================
  // ERROR STATUS - MAX RETRIES - REFUND
  // ===========================================================================

  describe("Error Status - Max Retries - Refund", () => {
    beforeEach(() => {
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(errorPayload)
      mockRefundCredit.mockResolvedValue(undefined)
    })

    it("refunds credit when max retries reached", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortWithCompany,
        retryCount: 2
      } as never)
      mockPrisma.short.update.mockResolvedValue({
        ...mockShortWithCompany,
        retryCount: 3 // After increment
      } as never)

      const request = createMockRequest(JSON.stringify(errorPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(mockRefundCredit).toHaveBeenCalledWith("user-789", "short-123")
      const data = await response.json()
      expect(data.status).toBe("refunded")
    })

    it("uses publication controller to refund credit", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortWithCompany,
        retryCount: 2
      } as never)
      mockPrisma.short.update.mockResolvedValue({ retryCount: 3 } as never)

      const request = createMockRequest(JSON.stringify(errorPayload))

      // Act
      await POST(request)

      // Assert - Verify refundCredit was called with correct args
      expect(mockRefundCredit).toHaveBeenCalledWith("user-789", "short-123")
      expect(mockRefundCredit).toHaveBeenCalledTimes(1)
    })

    it("updates short status back to DRAFT", async () => {
      // Arrange
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortWithCompany,
        retryCount: 2
      } as never)
      mockPrisma.short.update
        .mockResolvedValueOnce({ retryCount: 3 } as never) // First call: increment retry
        .mockResolvedValueOnce({ status: "DRAFT" } as never) // Second call: set DRAFT

      const request = createMockRequest(JSON.stringify(errorPayload))

      // Act
      await POST(request)

      // Assert - The second short.update call sets DRAFT status
      const updateCalls = mockPrisma.short.update.mock.calls
      expect(updateCalls).toHaveLength(2)
      expect(updateCalls[1][0]).toMatchObject({
        where: { id: "short-123" },
        data: {
          status: "DRAFT",
          processingError: expect.stringContaining("3 attempts")
        }
      })
    })
  })

  // ===========================================================================
  // ENCODING/PENDING STATUS
  // ===========================================================================

  describe("Encoding/Pending Status", () => {
    it("acknowledges encoding status without changes", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(encodingPayload)
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)

      const request = createMockRequest(JSON.stringify(encodingPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({ success: true, status: "encoding" })
      expect(mockPrisma.short.update).not.toHaveBeenCalled()
    })

    it("acknowledges pending status without changes", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue({
        task_token: "task-token-abc",
        status: "pending" as const
      })
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)

      const request = createMockRequest(JSON.stringify({ task_token: "abc", status: "pending" }))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe("pending")
    })
  })

  // ===========================================================================
  // EMAIL ERRORS - NON-BLOCKING
  // ===========================================================================

  describe("Email Errors - Non-Blocking", () => {
    it("continues successfully when email fails", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
      mockSendEmail.mockRejectedValue(new Error("Email service unavailable"))

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      const response = await POST(request)

      // Assert - Should still return success
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe("published")
    })

    it("skips email when user has no email", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortWithCompany,
        company: {
          ...mockShortWithCompany.company,
          user: { id: "user-789", email: null }
        }
      } as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockSendEmail).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // INTERNAL ERRORS
  // ===========================================================================

  describe("Internal Errors", () => {
    it("returns 500 on unexpected errors", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockRejectedValue(new Error("Database error"))

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe("Internal server error")
    })

    it("returns 500 when Inngest event fails", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockRejectedValue(new Error("Inngest unavailable"))

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(500)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("constructs correct HLS URL path", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue({
        ...mockShortWithCompany,
        id: "short-custom",
        companyId: "company-custom"
      } as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
      mockSendEmail.mockResolvedValue(undefined)

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockGetHlsPublicUrl).toHaveBeenCalledWith(
        "shorts/company-custom/short-custom/master.m3u8"
      )
      expect(mockGetThumbnailPublicUrl).toHaveBeenCalledWith(
        "company-custom",
        "short-custom"
      )
    })

    it("rounds duration to integer", async () => {
      // Arrange
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue({
        ...completedPayload,
        videos: [{ ...completedPayload.videos[0], duration: 30.7 }]
      })
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
      mockSendEmail.mockResolvedValue(undefined)

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockPrisma.short.update).toHaveBeenCalledWith({
        where: { id: "short-123" },
        data: expect.objectContaining({
          duration: 31 // Rounded from 30.7
        })
      })
    })

    it("uses localhost URL when NEXT_PUBLIC_APP_URL not set", async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_APP_URL
      mockValidatePayload.mockReturnValue(true)
      mockParsePayload.mockReturnValue(completedPayload)
      mockPrisma.short.findFirst.mockResolvedValue(mockShortWithCompany as never)
      mockGetHlsPublicUrl.mockReturnValue("https://hls.example.com/master.m3u8")
      mockGetThumbnailPublicUrl.mockReturnValue("https://thumb.example.com/thumbnail.jpg")
      mockPrisma.short.update.mockResolvedValue({} as never)
      mockInngest.send.mockResolvedValue({ ids: ["event-1"] })
      mockSendEmail.mockResolvedValue(undefined)

      const request = createMockRequest(JSON.stringify(completedPayload))

      // Act
      await POST(request)

      // Assert
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          publicUrl: "http://localhost:3000/shorts/short-123"
        })
      )
    })
  })
})
