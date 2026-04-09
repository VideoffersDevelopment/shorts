import { describe, it, expect } from "vitest"
import type {
  TranscodeStartedEvent,
  TranscodeCompletedEvent,
  AutoArchiveEvent,
  ExpiryReminderEvent,
  PaymentCompletedEvent,
  InngestEvents,
  InngestEventName
} from "./events"

describe("inngest events", () => {
  // ===========================================================================
  // TranscodeStartedEvent
  // ===========================================================================

  describe("TranscodeStartedEvent", () => {
    it("has correct event name", () => {
      const event: TranscodeStartedEvent = {
        name: "shorts/transcode.started",
        data: {
          shortId: "clrwxyz1234567890abcde",
          rawVideoKey: "uploads/abc123/video.mp4",
          userId: "user_123"
        }
      }

      expect(event.name).toBe("shorts/transcode.started")
    })

    it("requires all data fields", () => {
      const event: TranscodeStartedEvent = {
        name: "shorts/transcode.started",
        data: {
          shortId: "short_1",
          rawVideoKey: "key_1",
          userId: "user_1"
        }
      }

      expect(event.data).toHaveProperty("shortId")
      expect(event.data).toHaveProperty("rawVideoKey")
      expect(event.data).toHaveProperty("userId")
    })

    it("data fields are strings", () => {
      const event: TranscodeStartedEvent = {
        name: "shorts/transcode.started",
        data: {
          shortId: "short_123",
          rawVideoKey: "videos/raw/abc.mp4",
          userId: "user_456"
        }
      }

      expect(typeof event.data.shortId).toBe("string")
      expect(typeof event.data.rawVideoKey).toBe("string")
      expect(typeof event.data.userId).toBe("string")
    })
  })

  // ===========================================================================
  // TranscodeCompletedEvent
  // ===========================================================================

  describe("TranscodeCompletedEvent", () => {
    it("has correct event name", () => {
      const event: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "short_123",
          qencodeTaskId: "task_abc",
          hlsPlaylistUrl: "https://cdn.example.com/hls/playlist.m3u8",
          thumbnailUrl: "https://cdn.example.com/thumb.jpg",
          duration: 30,
          success: true
        }
      }

      expect(event.name).toBe("shorts/transcode.completed")
    })

    it("accepts successful transcoding data", () => {
      const event: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "short_123",
          qencodeTaskId: "qencode_task_xyz",
          hlsPlaylistUrl: "https://r2.example.com/hls/master.m3u8",
          thumbnailUrl: "https://r2.example.com/thumbs/0001.jpg",
          duration: 45,
          success: true
        }
      }

      expect(event.data.success).toBe(true)
      expect(event.data.error).toBeUndefined()
    })

    it("accepts failed transcoding data with error", () => {
      const event: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "short_123",
          qencodeTaskId: "qencode_task_xyz",
          hlsPlaylistUrl: "",
          thumbnailUrl: null,
          duration: 0,
          success: false,
          error: "Transcoding failed: unsupported codec"
        }
      }

      expect(event.data.success).toBe(false)
      expect(event.data.error).toBe("Transcoding failed: unsupported codec")
    })

    it("accepts null thumbnailUrl", () => {
      const event: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "short_123",
          qencodeTaskId: "task_abc",
          hlsPlaylistUrl: "https://cdn.example.com/hls/playlist.m3u8",
          thumbnailUrl: null,
          duration: 30,
          success: true
        }
      }

      expect(event.data.thumbnailUrl).toBeNull()
    })

    it("duration is a number", () => {
      const event: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "short_123",
          qencodeTaskId: "task_abc",
          hlsPlaylistUrl: "https://cdn.example.com/hls/playlist.m3u8",
          thumbnailUrl: null,
          duration: 59,
          success: true
        }
      }

      expect(typeof event.data.duration).toBe("number")
      expect(event.data.duration).toBe(59)
    })
  })

  // ===========================================================================
  // AutoArchiveEvent
  // ===========================================================================

  describe("AutoArchiveEvent", () => {
    it("has correct event name", () => {
      const event: AutoArchiveEvent = {
        name: "shorts/auto-archive",
        data: {}
      }

      expect(event.name).toBe("shorts/auto-archive")
    })

    it("has empty data object", () => {
      const event: AutoArchiveEvent = {
        name: "shorts/auto-archive",
        data: {}
      }

      expect(event.data).toEqual({})
      expect(Object.keys(event.data)).toHaveLength(0)
    })
  })

  // ===========================================================================
  // ExpiryReminderEvent
  // ===========================================================================

  describe("ExpiryReminderEvent", () => {
    it("has correct event name", () => {
      const event: ExpiryReminderEvent = {
        name: "shorts/expiry-reminder",
        data: {}
      }

      expect(event.name).toBe("shorts/expiry-reminder")
    })

    it("has empty data object", () => {
      const event: ExpiryReminderEvent = {
        name: "shorts/expiry-reminder",
        data: {}
      }

      expect(event.data).toEqual({})
      expect(Object.keys(event.data)).toHaveLength(0)
    })
  })

  // ===========================================================================
  // PaymentCompletedEvent
  // ===========================================================================

  describe("PaymentCompletedEvent", () => {
    it("has correct event name", () => {
      const event: PaymentCompletedEvent = {
        name: "payments/completed",
        data: {
          paymentId: "pay_123",
          userId: "user_456",
          credits: 5
        }
      }

      expect(event.name).toBe("payments/completed")
    })

    it("accepts data with shortId", () => {
      const event: PaymentCompletedEvent = {
        name: "payments/completed",
        data: {
          paymentId: "pay_abc",
          userId: "user_xyz",
          credits: 20,
          shortId: "short_123"
        }
      }

      expect(event.data.shortId).toBe("short_123")
    })

    it("accepts data without shortId", () => {
      const event: PaymentCompletedEvent = {
        name: "payments/completed",
        data: {
          paymentId: "pay_abc",
          userId: "user_xyz",
          credits: 50
        }
      }

      expect(event.data.shortId).toBeUndefined()
    })

    it("credits is a number", () => {
      const event: PaymentCompletedEvent = {
        name: "payments/completed",
        data: {
          paymentId: "pay_123",
          userId: "user_456",
          credits: 1
        }
      }

      expect(typeof event.data.credits).toBe("number")
      expect(event.data.credits).toBe(1)
    })
  })

  // ===========================================================================
  // InngestEvents (Union Type)
  // ===========================================================================

  describe("InngestEvents", () => {
    it("accepts TranscodeStartedEvent", () => {
      const event: InngestEvents = {
        name: "shorts/transcode.started",
        data: {
          shortId: "short_1",
          rawVideoKey: "key_1",
          userId: "user_1"
        }
      }

      expect(event.name).toBe("shorts/transcode.started")
    })

    it("accepts TranscodeCompletedEvent", () => {
      const event: InngestEvents = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "short_1",
          qencodeTaskId: "task_1",
          hlsPlaylistUrl: "https://example.com/hls.m3u8",
          thumbnailUrl: null,
          duration: 30,
          success: true
        }
      }

      expect(event.name).toBe("shorts/transcode.completed")
    })

    it("accepts AutoArchiveEvent", () => {
      const event: InngestEvents = {
        name: "shorts/auto-archive",
        data: {}
      }

      expect(event.name).toBe("shorts/auto-archive")
    })

    it("accepts ExpiryReminderEvent", () => {
      const event: InngestEvents = {
        name: "shorts/expiry-reminder",
        data: {}
      }

      expect(event.name).toBe("shorts/expiry-reminder")
    })

    it("accepts PaymentCompletedEvent", () => {
      const event: InngestEvents = {
        name: "payments/completed",
        data: {
          paymentId: "pay_1",
          userId: "user_1",
          credits: 5
        }
      }

      expect(event.name).toBe("payments/completed")
    })
  })

  // ===========================================================================
  // InngestEventName (Literal Type)
  // ===========================================================================

  describe("InngestEventName", () => {
    it("includes all event names", () => {
      const eventNames: InngestEventName[] = [
        "shorts/transcode.started",
        "shorts/transcode.completed",
        "shorts/auto-archive",
        "shorts/expiry-reminder",
        "payments/completed"
      ]

      expect(eventNames).toHaveLength(5)
      expect(eventNames).toContain("shorts/transcode.started")
      expect(eventNames).toContain("shorts/transcode.completed")
      expect(eventNames).toContain("shorts/auto-archive")
      expect(eventNames).toContain("shorts/expiry-reminder")
      expect(eventNames).toContain("payments/completed")
    })

    it("can be used for type narrowing", () => {
      const eventName: InngestEventName = "shorts/transcode.started"

      // Type assertion works correctly
      expect(eventName).toBe("shorts/transcode.started")
    })
  })

  // ===========================================================================
  // TYPE SAFETY
  // ===========================================================================

  describe("type safety", () => {
    it("event structure matches interface", () => {
      // These are compile-time checks that TypeScript validates
      const transcodeStarted: TranscodeStartedEvent = {
        name: "shorts/transcode.started",
        data: { shortId: "s", rawVideoKey: "k", userId: "u" }
      }

      const transcodeCompleted: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "s",
          qencodeTaskId: "q",
          hlsPlaylistUrl: "url",
          thumbnailUrl: null,
          duration: 30,
          success: true
        }
      }

      const autoArchive: AutoArchiveEvent = {
        name: "shorts/auto-archive",
        data: {}
      }

      const expiryReminder: ExpiryReminderEvent = {
        name: "shorts/expiry-reminder",
        data: {}
      }

      const paymentCompleted: PaymentCompletedEvent = {
        name: "payments/completed",
        data: { paymentId: "p", userId: "u", credits: 5 }
      }

      // All events should be valid
      expect(transcodeStarted.name).toBeDefined()
      expect(transcodeCompleted.name).toBeDefined()
      expect(autoArchive.name).toBeDefined()
      expect(expiryReminder.name).toBeDefined()
      expect(paymentCompleted.name).toBeDefined()
    })

    it("event names are properly discriminated", () => {
      const events: InngestEvents[] = [
        {
          name: "shorts/transcode.started",
          data: { shortId: "s", rawVideoKey: "k", userId: "u" }
        },
        {
          name: "payments/completed",
          data: { paymentId: "p", userId: "u", credits: 5 }
        }
      ]

      // Discriminated union allows type narrowing based on name
      events.forEach((event) => {
        if (event.name === "shorts/transcode.started") {
          // TypeScript knows this is TranscodeStartedEvent
          expect(event.data.rawVideoKey).toBeDefined()
        }
        if (event.name === "payments/completed") {
          // TypeScript knows this is PaymentCompletedEvent
          expect(event.data.credits).toBeDefined()
        }
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("edge cases", () => {
    it("handles empty strings in TranscodeStartedEvent", () => {
      const event: TranscodeStartedEvent = {
        name: "shorts/transcode.started",
        data: {
          shortId: "",
          rawVideoKey: "",
          userId: ""
        }
      }

      // Types allow empty strings - validation would happen elsewhere
      expect(event.data.shortId).toBe("")
    })

    it("handles very long strings", () => {
      const longString = "a".repeat(10000)
      const event: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: longString,
          qencodeTaskId: longString,
          hlsPlaylistUrl: longString,
          thumbnailUrl: longString,
          duration: 60,
          success: true
        }
      }

      expect(event.data.shortId.length).toBe(10000)
    })

    it("handles zero duration", () => {
      const event: TranscodeCompletedEvent = {
        name: "shorts/transcode.completed",
        data: {
          shortId: "short_1",
          qencodeTaskId: "task_1",
          hlsPlaylistUrl: "url",
          thumbnailUrl: null,
          duration: 0,
          success: true
        }
      }

      expect(event.data.duration).toBe(0)
    })

    it("handles zero credits in PaymentCompletedEvent", () => {
      const event: PaymentCompletedEvent = {
        name: "payments/completed",
        data: {
          paymentId: "pay_1",
          userId: "user_1",
          credits: 0
        }
      }

      // Types allow zero - business logic validation elsewhere
      expect(event.data.credits).toBe(0)
    })

    it("handles large credit amounts", () => {
      const event: PaymentCompletedEvent = {
        name: "payments/completed",
        data: {
          paymentId: "pay_1",
          userId: "user_1",
          credits: 999999
        }
      }

      expect(event.data.credits).toBe(999999)
    })
  })
})
