import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest"

// ===========================================================================
// ENV VAR SETUP - Must be set before module loads
// ===========================================================================

// Store original env before any modifications
const originalEnv = { ...process.env }

// Set env vars immediately - these will be captured when module loads
process.env.QENCODE_API_KEY = "test-api-key"
process.env.R2_ACCESS_KEY_ID = "test-r2-key"
process.env.R2_SECRET_ACCESS_KEY = "test-r2-secret"
process.env.R2_ENDPOINT = "https://test-endpoint.r2.cloudflarestorage.com"

// ===========================================================================
// MOCKS - Before imports to mock fetch
// ===========================================================================

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// ===========================================================================
// DYNAMIC IMPORT - Forces fresh module load with current env
// ===========================================================================

// Import types statically (safe - no runtime values)
import type { QencodeJobOptions, QencodeWebhookPayload } from "../qencode"

// Runtime functions will be imported dynamically
let startQencodeJob: typeof import("../qencode").startQencodeJob
let validateQencodePayload: typeof import("../qencode").validateQencodePayload
let parseQencodeWebhookPayload: typeof import("../qencode").parseQencodeWebhookPayload

beforeAll(async () => {
  // Reset modules to clear any cached imports
  vi.resetModules()

  // Re-apply env vars after reset
  process.env.QENCODE_API_KEY = "test-api-key"
  process.env.R2_ACCESS_KEY_ID = "test-r2-key"
  process.env.R2_SECRET_ACCESS_KEY = "test-r2-secret"
  process.env.R2_ENDPOINT = "https://test-endpoint.r2.cloudflarestorage.com"

  // Now import with fresh module and correct env vars
  const qencode = await import("../qencode")
  startQencodeJob = qencode.startQencodeJob
  validateQencodePayload = qencode.validateQencodePayload
  parseQencodeWebhookPayload = qencode.parseQencodeWebhookPayload

  // Restore fetch mock after module reset
  globalThis.fetch = mockFetch
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  // Restore original env
  process.env = { ...originalEnv }
  // Re-apply test env for next test
  process.env.QENCODE_API_KEY = "test-api-key"
  process.env.R2_ACCESS_KEY_ID = "test-r2-key"
  process.env.R2_SECRET_ACCESS_KEY = "test-r2-secret"
  process.env.R2_ENDPOINT = "https://test-endpoint.r2.cloudflarestorage.com"
})

// ===========================================================================
// TEST DATA
// ===========================================================================

const validJobOptions: QencodeJobOptions = {
  inputUrl: "https://storage.example.com/video.mp4",
  outputBucket: "hls-bucket",
  outputPath: "shorts/company-1/short-1",
  webhookUrl: "https://app.example.com/api/webhooks/qencode"
}

const mockAccessTokenResponse = {
  error: 0,
  token: "test-access-token-123"
}

const mockCreateTaskResponse = {
  error: 0,
  task_token: "task-token-456"
}

const mockStartEncodeResponse = {
  error: 0,
  task_token: "task-token-456",
  status_url: "https://api.qencode.com/v1/status?task_tokens=task-token-456"
}

describe("Qencode Client", () => {
  // ===========================================================================
  // startQencodeJob - HAPPY PATH
  // ===========================================================================

  describe("startQencodeJob - Happy Path", () => {
    it("successfully starts a transcoding job and returns task token", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreateTaskResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStartEncodeResponse)
        })

      // Act
      const result = await startQencodeJob(validJobOptions)

      // Assert
      expect(result.taskToken).toBe("task-token-456")
      expect(result.statusUrl).toBe(
        "https://api.qencode.com/v1/status?task_tokens=task-token-456"
      )
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it("makes correct API calls with proper parameters", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreateTaskResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStartEncodeResponse)
        })

      // Act
      await startQencodeJob(validJobOptions)

      // Assert - Access token call
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        "https://api.qencode.com/v1/access_token",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })
      )

      // Assert - Create task call
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "https://api.qencode.com/v1/create_task",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })
      )

      // Assert - Start encode call
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        "https://api.qencode.com/v1/start_encode",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        })
      )
    })

    it("constructs correct output destination URL", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreateTaskResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStartEncodeResponse)
        })

      // Act
      await startQencodeJob(validJobOptions)

      // Assert - Check the start_encode call body contains correct S3 destination
      const startEncodeCall = mockFetch.mock.calls[2]
      const body = startEncodeCall[1]?.body as URLSearchParams
      const queryParam = body.get("query")
      expect(queryParam).toBeDefined()

      const query = JSON.parse(queryParam!)
      expect(query.destination.url).toBe("s3://hls-bucket/shorts/company-1/short-1")
      expect(query.callback_url).toBe("https://app.example.com/api/webhooks/qencode")
    })
  })

  // ===========================================================================
  // startQencodeJob - API ERRORS
  // ===========================================================================

  describe("startQencodeJob - API Errors", () => {
    it("throws error when access token request fails (HTTP error)", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized"
      })

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow(
        "Failed to get Qencode access token: Unauthorized"
      )
    })

    it("throws error when access token API returns error code", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            error: 1,
            message: "Invalid API key"
          })
      })

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow(
        "Qencode API error: Invalid API key"
      )
    })

    it("throws error when create task request fails", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Bad Request"
        })

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow(
        "Failed to create Qencode task: Bad Request"
      )
    })

    it("throws error when create task API returns error code", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              error: 1,
              message: "Token expired"
            })
        })

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow(
        "Qencode API error: Token expired"
      )
    })

    it("throws error when start encode request fails", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreateTaskResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Internal Server Error"
        })

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow(
        "Failed to start Qencode job: Internal Server Error"
      )
    })

    it("throws error when start encode API returns error code", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreateTaskResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              error: 1,
              message: "Invalid input URL"
            })
        })

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow(
        "Qencode API error: Invalid input URL"
      )
    })

    it("handles unknown error message gracefully", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            error: 1
            // No message field
          })
      })

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow(
        "Qencode API error: Unknown error"
      )
    })
  })

  // ===========================================================================
  // startQencodeJob - EDGE CASES
  // ===========================================================================

  describe("startQencodeJob - Edge Cases", () => {
    it("provides default status_url when not in response", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAccessTokenResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCreateTaskResponse) // Returns task-token-456
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              error: 0
              // No status_url - should generate default
            })
        })

      // Act
      const result = await startQencodeJob(validJobOptions)

      // Assert - Uses taskToken from createTask (mockCreateTaskResponse.task_token = task-token-456)
      expect(result.statusUrl).toBe(
        "https://api.qencode.com/v1/status?task_tokens=task-token-456"
      )
    })

    it("handles network errors gracefully", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      // Act & Assert
      await expect(startQencodeJob(validJobOptions)).rejects.toThrow("Network error")
    })
  })

  // ===========================================================================
  // validateQencodePayload - HAPPY PATH
  // ===========================================================================

  describe("validateQencodePayload - Happy Path", () => {
    it("returns true for valid completed payload", () => {
      // Arrange
      const payload: QencodeWebhookPayload = {
        task_token: "test-token",
        status: "completed"
      }

      // Act
      const result = validateQencodePayload(payload)

      // Assert
      expect(result).toBe(true)
    })

    it("returns true for all valid status types", () => {
      // Arrange
      const statuses: Array<"completed" | "error" | "encoding" | "pending"> = [
        "completed",
        "error",
        "encoding",
        "pending"
      ]

      for (const status of statuses) {
        const payload: QencodeWebhookPayload = {
          task_token: `task-${status}`,
          status
        }

        // Act & Assert
        expect(validateQencodePayload(payload)).toBe(true)
      }
    })
  })

  // ===========================================================================
  // validateQencodePayload - VALIDATION FAILURES
  // ===========================================================================

  describe("validateQencodePayload - Validation Failures", () => {
    it("returns false for missing task_token", () => {
      // Arrange
      const payload = {
        status: "completed"
      } as QencodeWebhookPayload

      // Act
      const result = validateQencodePayload(payload)

      // Assert
      expect(result).toBe(false)
    })

    it("returns false for empty task_token", () => {
      // Arrange
      const payload: QencodeWebhookPayload = {
        task_token: "",
        status: "completed"
      }

      // Act
      const result = validateQencodePayload(payload)

      // Assert
      expect(result).toBe(false)
    })

    it("returns false for missing status", () => {
      // Arrange
      const payload = {
        task_token: "test-token"
      } as QencodeWebhookPayload

      // Act
      const result = validateQencodePayload(payload)

      // Assert
      expect(result).toBe(false)
    })

    it("returns false for invalid status", () => {
      // Arrange
      const payload = {
        task_token: "test-token",
        status: "invalid-status"
      } as unknown as QencodeWebhookPayload

      // Act
      const result = validateQencodePayload(payload)

      // Assert
      expect(result).toBe(false)
    })

    it("returns false for non-string task_token", () => {
      // Arrange
      const payload = {
        task_token: 12345,
        status: "completed"
      } as unknown as QencodeWebhookPayload

      // Act
      const result = validateQencodePayload(payload)

      // Assert
      expect(result).toBe(false)
    })
  })

  // ===========================================================================
  // parseQencodeWebhookPayload - HAPPY PATH
  // ===========================================================================

  describe("parseQencodeWebhookPayload - Happy Path", () => {
    it("parses completed status payload correctly", () => {
      // Arrange
      const rawBody = JSON.stringify({
        task_token: "task-123",
        status: "completed",
        percent: 100,
        videos: [
          {
            url: "https://storage.example.com/output.m3u8",
            type: "hls",
            duration: 30,
            size: 1024000
          }
        ]
      })

      // Act
      const result = parseQencodeWebhookPayload(rawBody)

      // Assert
      expect(result.task_token).toBe("task-123")
      expect(result.status).toBe("completed")
      expect(result.percent).toBe(100)
      expect(result.videos).toHaveLength(1)
      expect(result.videos![0].type).toBe("hls")
      expect(result.videos![0].duration).toBe(30)
    })

    it("parses error status payload correctly", () => {
      // Arrange
      const rawBody = JSON.stringify({
        task_token: "task-456",
        status: "error",
        error_code: 101,
        error_message: "Input file not found"
      })

      // Act
      const result = parseQencodeWebhookPayload(rawBody)

      // Assert
      expect(result.task_token).toBe("task-456")
      expect(result.status).toBe("error")
      expect(result.error_code).toBe(101)
      expect(result.error_message).toBe("Input file not found")
    })

    it("parses encoding status payload correctly", () => {
      // Arrange
      const rawBody = JSON.stringify({
        task_token: "task-789",
        status: "encoding",
        percent: 45
      })

      // Act
      const result = parseQencodeWebhookPayload(rawBody)

      // Assert
      expect(result.task_token).toBe("task-789")
      expect(result.status).toBe("encoding")
      expect(result.percent).toBe(45)
    })

    it("parses pending status payload correctly", () => {
      // Arrange
      const rawBody = JSON.stringify({
        task_token: "task-000",
        status: "pending"
      })

      // Act
      const result = parseQencodeWebhookPayload(rawBody)

      // Assert
      expect(result.task_token).toBe("task-000")
      expect(result.status).toBe("pending")
    })
  })

  // ===========================================================================
  // parseQencodeWebhookPayload - PARSING ERRORS
  // ===========================================================================

  describe("parseQencodeWebhookPayload - Parsing Errors", () => {
    it("throws error for invalid JSON", () => {
      // Arrange
      const invalidJson = "{ invalid json }"

      // Act & Assert
      expect(() => parseQencodeWebhookPayload(invalidJson)).toThrow()
    })

    it("throws error for empty string", () => {
      // Act & Assert
      expect(() => parseQencodeWebhookPayload("")).toThrow()
    })

    it("handles null body as string", () => {
      // Arrange
      const rawBody = "null"

      // Act
      const result = parseQencodeWebhookPayload(rawBody)

      // Assert - JSON.parse("null") returns null
      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // parseQencodeWebhookPayload - VIDEO OUTPUT TYPES
  // ===========================================================================

  describe("parseQencodeWebhookPayload - Video Output Types", () => {
    it("parses video output with all fields", () => {
      // Arrange
      const rawBody = JSON.stringify({
        task_token: "task-full",
        status: "completed",
        videos: [
          {
            url: "https://storage.example.com/video.m3u8",
            type: "hls",
            duration: 45.5,
            size: 2048000,
            width: 1080,
            height: 1920,
            thumbnail: "https://storage.example.com/thumb.jpg"
          }
        ]
      })

      // Act
      const result = parseQencodeWebhookPayload(rawBody)

      // Assert
      expect(result.videos).toBeDefined()
      expect(result.videos![0]).toMatchObject({
        url: "https://storage.example.com/video.m3u8",
        type: "hls",
        duration: 45.5,
        size: 2048000,
        width: 1080,
        height: 1920,
        thumbnail: "https://storage.example.com/thumb.jpg"
      })
    })

    it("parses multiple video outputs", () => {
      // Arrange
      const rawBody = JSON.stringify({
        task_token: "task-multi",
        status: "completed",
        videos: [
          { url: "https://storage.example.com/1080p.m3u8", type: "hls" },
          { url: "https://storage.example.com/720p.m3u8", type: "hls" },
          { url: "https://storage.example.com/480p.m3u8", type: "hls" }
        ]
      })

      // Act
      const result = parseQencodeWebhookPayload(rawBody)

      // Assert
      expect(result.videos).toHaveLength(3)
    })
  })
})
