import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "../route"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import * as statsModule from "@/lib/shorts/stats"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/lib/prisma", () => ({
  prisma: {
    short: {
      findUnique: vi.fn()
    }
  }
}))

vi.mock("@/lib/shorts/stats", () => ({
  trackEvent: vi.fn()
}))

const mockPrisma = vi.mocked(prisma)
const mockTrackEvent = vi.mocked(statsModule.trackEvent)

// ===========================================================================
// HELPERS
// ===========================================================================

function createMockRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/shorts/short-123/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
}

async function createRouteParams(id: string): Promise<{ params: Promise<{ id: string }> }> {
  return {
    params: Promise.resolve({ id })
  }
}

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockShortId = "short-123"

const mockPublishedShort = {
  id: mockShortId,
  status: "PUBLISHED" as const
}

const mockArchivedShort = {
  id: mockShortId,
  status: "ARCHIVED" as const
}

describe("POST /api/shorts/[id]/track", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for expected errors
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("tracks cta_click event for published short", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockPublishedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(mockTrackEvent).toHaveBeenCalledWith(mockShortId, "cta_click")
    })

    it("tracks like event for published short", async () => {
      // Arrange
      const request = createMockRequest({ event: "like" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockPublishedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(mockTrackEvent).toHaveBeenCalledWith(mockShortId, "like")
    })

    it("tracks share event for published short", async () => {
      // Arrange
      const request = createMockRequest({ event: "share" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockPublishedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(mockTrackEvent).toHaveBeenCalledWith(mockShortId, "share")
    })

    it("tracks event for archived short (direct link access)", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockArchivedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(mockTrackEvent).toHaveBeenCalledWith(mockShortId, "cta_click")
    })
  })

  // ===========================================================================
  // VALIDATION FAILURES
  // ===========================================================================

  describe("Validation Failures", () => {
    it("returns 400 for invalid event type", async () => {
      // Arrange
      const request = createMockRequest({ event: "invalid_event" })
      const routeParams = await createRouteParams(mockShortId)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: "Invalid event type" })
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it("returns 400 for view event (not allowed via API)", async () => {
      // Arrange - 'view' is tracked server-side, not via this API
      const request = createMockRequest({ event: "view" })
      const routeParams = await createRouteParams(mockShortId)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: "Invalid event type" })
    })

    it("returns 400 for empty event", async () => {
      // Arrange
      const request = createMockRequest({ event: "" })
      const routeParams = await createRouteParams(mockShortId)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: "Invalid event type" })
    })

    it("returns 400 for missing event field", async () => {
      // Arrange
      const request = createMockRequest({})
      const routeParams = await createRouteParams(mockShortId)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: "Invalid event type" })
    })

    it("returns 400 for null event", async () => {
      // Arrange
      const request = createMockRequest({ event: null })
      const routeParams = await createRouteParams(mockShortId)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({ error: "Invalid event type" })
    })
  })

  // ===========================================================================
  // SHORT NOT FOUND
  // ===========================================================================

  describe("Short Not Found", () => {
    it("returns 404 when short does not exist", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams("nonexistent-short")
      mockPrisma.short.findUnique.mockResolvedValue(null)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: "Short not found" })
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // STATUS VALIDATION
  // ===========================================================================

  describe("Status Validation", () => {
    it("returns 403 for DRAFT short", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue({
        id: mockShortId,
        status: "DRAFT"
      } as never)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: "Short not accessible" })
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it("returns 403 for PROCESSING short", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue({
        id: mockShortId,
        status: "PROCESSING"
      } as never)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: "Short not accessible" })
    })

    it("returns 403 for DELETED short", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue({
        id: mockShortId,
        status: "DELETED"
      } as never)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: "Short not accessible" })
    })

    it("returns 403 for PENDING_PAYMENT short", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue({
        id: mockShortId,
        status: "PENDING_PAYMENT"
      } as never)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: "Short not accessible" })
    })

    it("allows tracking for PUBLISHED short", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockPublishedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)

      // Assert
      expect(response.status).toBe(200)
      expect(mockTrackEvent).toHaveBeenCalled()
    })

    it("allows tracking for ARCHIVED short", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockArchivedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)

      // Assert
      expect(response.status).toBe(200)
      expect(mockTrackEvent).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // SERVER ERRORS
  // ===========================================================================

  describe("Server Errors", () => {
    it("returns 500 when database lookup fails", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockRejectedValue(new Error("Database error"))

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: "Failed to track event" })
    })

    it("returns 500 when trackEvent fails", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockPublishedShort as never)
      mockTrackEvent.mockRejectedValue(new Error("Tracking error"))

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: "Failed to track event" })
    })

    it("returns 500 for malformed JSON body", async () => {
      // Arrange
      const request = new NextRequest(
        "http://localhost:3000/api/shorts/short-123/track",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid json"
        }
      )
      const routeParams = await createRouteParams(mockShortId)

      // Act
      const response = await POST(request, routeParams)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: "Failed to track event" })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles special characters in shortId", async () => {
      // Arrange
      const specialId = "short-123-abc"
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(specialId)
      mockPrisma.short.findUnique.mockResolvedValue({
        id: specialId,
        status: "PUBLISHED"
      } as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)

      // Assert
      expect(response.status).toBe(200)
      expect(mockTrackEvent).toHaveBeenCalledWith(specialId, "cta_click")
    })

    it("handles extra fields in request body", async () => {
      // Arrange
      const request = createMockRequest({
        event: "cta_click",
        extra: "field",
        another: 123
      })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockPublishedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      const response = await POST(request, routeParams)

      // Assert
      expect(response.status).toBe(200)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockShortId, "cta_click")
    })

    it("verifies short findUnique is called with correct params", async () => {
      // Arrange
      const request = createMockRequest({ event: "cta_click" })
      const routeParams = await createRouteParams(mockShortId)
      mockPrisma.short.findUnique.mockResolvedValue(mockPublishedShort as never)
      mockTrackEvent.mockResolvedValue(undefined)

      // Act
      await POST(request, routeParams)

      // Assert
      expect(mockPrisma.short.findUnique).toHaveBeenCalledWith({
        where: { id: mockShortId },
        select: {
          id: true,
          status: true
        }
      })
    })
  })
})
