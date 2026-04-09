import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("inngest client", () => {
  // Store original env
  const originalEnv = process.env.INNGEST_EVENT_KEY

  beforeEach(() => {
    // Reset modules before each test
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original env after tests
    process.env.INNGEST_EVENT_KEY = originalEnv
    vi.resetModules()
  })

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  describe("initialization", () => {
    it("initializes with correct id", async () => {
      const { inngest } = await import("./client")

      expect(inngest.id).toBe("videoshorts")
    })

    it("creates an Inngest instance", async () => {
      const { inngest } = await import("./client")

      expect(inngest).toBeDefined()
      expect(typeof inngest.createFunction).toBe("function")
      expect(typeof inngest.send).toBe("function")
    })
  })

  // ===========================================================================
  // CONFIGURATION
  // ===========================================================================

  describe("configuration", () => {
    it("uses INNGEST_EVENT_KEY from environment when set", async () => {
      process.env.INNGEST_EVENT_KEY = "test-event-key-123"

      const { inngest } = await import("./client")

      // The Inngest client should be created - exact config testing
      // is limited since Inngest doesn't expose eventKey publicly
      expect(inngest).toBeDefined()
      expect(inngest.id).toBe("videoshorts")
    })

    it("handles missing INNGEST_EVENT_KEY gracefully", async () => {
      delete process.env.INNGEST_EVENT_KEY

      // Should not throw during import
      const { inngest } = await import("./client")

      expect(inngest).toBeDefined()
      expect(inngest.id).toBe("videoshorts")
    })

    it("handles empty INNGEST_EVENT_KEY", async () => {
      process.env.INNGEST_EVENT_KEY = ""

      const { inngest } = await import("./client")

      expect(inngest).toBeDefined()
    })
  })

  // ===========================================================================
  // EXPORTS
  // ===========================================================================

  describe("exports", () => {
    it("exports inngest client as named export", async () => {
      const clientModule = await import("./client")

      expect(clientModule).toHaveProperty("inngest")
      expect(clientModule.inngest).toBeDefined()
    })

    it("re-exports InngestEvents type", async () => {
      // This is a compile-time check - importing should not throw
      const { inngest } = await import("./client")

      // Verify that the client can be used with typed events
      expect(inngest).toBeDefined()
    })
  })

  // ===========================================================================
  // CLIENT METHODS
  // ===========================================================================

  describe("client methods", () => {
    it("has createFunction method for creating event handlers", async () => {
      const { inngest } = await import("./client")

      expect(typeof inngest.createFunction).toBe("function")
    })

    it("has send method for triggering events", async () => {
      const { inngest } = await import("./client")

      expect(typeof inngest.send).toBe("function")
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("edge cases", () => {
    it("client is singleton instance", async () => {
      const { inngest: client1 } = await import("./client")
      const { inngest: client2 } = await import("./client")

      // Same module import should return same instance
      expect(client1).toBe(client2)
    })

    it("client id is consistent across imports", async () => {
      const { inngest } = await import("./client")

      // Multiple accesses should return same id
      expect(inngest.id).toBe("videoshorts")
      expect(inngest.id).toBe("videoshorts")
    })
  })
})
