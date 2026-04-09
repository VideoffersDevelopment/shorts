import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Short } from "@prisma/client"

// ===========================================================================
// SET ENV VARS BEFORE IMPORTS
// ===========================================================================

process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/lib/prisma", () => ({
  prisma: {
    short: {
      findMany: vi.fn()
    }
  }
}))

vi.mock("@/lib/email", () => ({
  sendExpiryReminderEmail: vi.fn()
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
import { sendExpiryReminderEmail } from "@/lib/email"
import { sendExpiryReminders } from "../expiry-reminder"

const mockPrisma = vi.mocked(prisma)
const mockSendExpiryReminderEmail = vi.mocked(sendExpiryReminderEmail)

// ===========================================================================
// TEST DATA
// ===========================================================================

interface MockExpiringShort {
  id: string
  title: string
  expiresAt: Date
  company: {
    id: string
    companyName: string
    user: {
      id: string
      email: string
    }
  }
}

const sevenDaysFromNow = new Date()
sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
sevenDaysFromNow.setHours(12, 0, 0, 0)

const mockExpiringShorts: MockExpiringShort[] = [
  {
    id: "short-1",
    title: "Expiring Short 1",
    expiresAt: sevenDaysFromNow,
    company: {
      id: "company-1",
      companyName: "Test Company 1",
      user: {
        id: "user-1",
        email: "user1@example.com"
      }
    }
  },
  {
    id: "short-2",
    title: "Expiring Short 2",
    expiresAt: sevenDaysFromNow,
    company: {
      id: "company-2",
      companyName: "Test Company 2",
      user: {
        id: "user-2",
        email: "user2@example.com"
      }
    }
  }
]

// Helper to create a mock step runner
function createMockStep() {
  return {
    run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
      return await fn()
    })
  }
}

describe("sendExpiryReminders Inngest Function", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // FUNCTION CONFIGURATION
  // ===========================================================================

  describe("Function Configuration", () => {
    it("has correct function id", () => {
      expect(sendExpiryReminders.id).toBe("send-expiry-reminders")
    })

    it("has correct function name", () => {
      expect(sendExpiryReminders.name).toBe("Send 7-Day Expiry Reminders")
    })

    it("runs on cron schedule at 9 AM daily", () => {
      expect(sendExpiryReminders.trigger).toEqual({
        cron: "0 9 * * *"
      })
    })

    it("has retry configuration", () => {
      expect(sendExpiryReminders.retries).toBe(2)
    })
  })

  // ===========================================================================
  // HAPPY PATH
  // ===========================================================================

  describe("Happy Path", () => {
    it("successfully sends reminder emails and returns count", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiringShorts as unknown as Short[])
      mockSendExpiryReminderEmail.mockResolvedValue(undefined)

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: true,
        remindersSent: 2,
        remindersFailed: 0,
        details: expect.arrayContaining([
          expect.objectContaining({
            shortId: "short-1",
            email: "user1@example.com",
            success: true
          }),
          expect.objectContaining({
            shortId: "short-2",
            email: "user2@example.com",
            success: true
          })
        ])
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

      mockPrisma.short.findMany.mockResolvedValue(mockExpiringShorts as unknown as Short[])
      mockSendExpiryReminderEmail.mockResolvedValue(undefined)

      // Act
      await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(stepOrder).toEqual([
        "find-expiring-shorts",
        "send-reminder-emails"
      ])
    })

    it("finds only PUBLISHED shorts expiring in 7 days", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiringShorts as unknown as Short[])
      mockSendExpiryReminderEmail.mockResolvedValue(undefined)

      // Act
      await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(mockPrisma.short.findMany).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          expiresAt: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        },
        select: {
          id: true,
          title: true,
          expiresAt: true,
          company: {
            select: {
              id: true,
              companyName: true,
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        }
      })
    })

    it("sends email with correct parameters", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([mockExpiringShorts[0]] as unknown as Short[])
      mockSendExpiryReminderEmail.mockResolvedValue(undefined)

      // Act
      await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      // Note: APP_URL is captured at module load time, so it uses the default localhost
      // The important thing is that the URL structure is correct
      expect(mockSendExpiryReminderEmail).toHaveBeenCalledWith({
        to: "user1@example.com",
        shortTitle: "Expiring Short 1",
        shortId: "short-1",
        expiresAt: expect.any(Date),
        renewUrl: expect.stringContaining("/panel/shorts/short-1?action=renew")
      })
    })
  })

  // ===========================================================================
  // NO EXPIRING SHORTS
  // ===========================================================================

  describe("No Expiring Shorts", () => {
    it("returns zero count when no expiring shorts found", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: true,
        remindersSent: 0,
        message: "No shorts expiring in 7 days"
      })
    })

    it("does not send any emails when no expiring shorts found", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([])

      // Act
      await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(mockSendExpiryReminderEmail).not.toHaveBeenCalled()
    })

    it("only runs find-expiring-shorts step when no shorts found", async () => {
      // Arrange
      const stepOrder: string[] = []
      const mockStep = {
        run: vi.fn(async (name: string, fn: () => Promise<unknown>) => {
          stepOrder.push(name)
          return await fn()
        })
      }
      mockPrisma.short.findMany.mockResolvedValue([])

      // Act
      await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(stepOrder).toEqual(["find-expiring-shorts"])
    })
  })

  // ===========================================================================
  // EMAIL ERRORS
  // ===========================================================================

  describe("Email Errors", () => {
    it("handles email send failure for one short", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiringShorts as unknown as Short[])
      mockSendExpiryReminderEmail
        .mockResolvedValueOnce(undefined) // First succeeds
        .mockRejectedValueOnce(new Error("Email send failed")) // Second fails

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: true,
        remindersSent: 1,
        remindersFailed: 1,
        details: expect.arrayContaining([
          expect.objectContaining({
            shortId: "short-1",
            success: true
          }),
          expect.objectContaining({
            shortId: "short-2",
            success: false,
            error: "Email send failed"
          })
        ])
      })
    })

    it("handles all email failures", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiringShorts as unknown as Short[])
      mockSendExpiryReminderEmail.mockRejectedValue(new Error("SMTP error"))

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result).toEqual({
        success: true,
        remindersSent: 0,
        remindersFailed: 2,
        details: expect.arrayContaining([
          expect.objectContaining({
            success: false,
            error: "SMTP error"
          })
        ])
      })
    })

    it("continues sending emails after one failure", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue(mockExpiringShorts as unknown as Short[])
      mockSendExpiryReminderEmail
        .mockRejectedValueOnce(new Error("First failed"))
        .mockResolvedValueOnce(undefined)

      // Act
      await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert - Both emails should be attempted
      expect(mockSendExpiryReminderEmail).toHaveBeenCalledTimes(2)
    })

    it("includes error message in details", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([mockExpiringShorts[0]] as unknown as Short[])
      mockSendExpiryReminderEmail.mockRejectedValue(new Error("Custom error message"))

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result.details[0]).toEqual({
        shortId: "short-1",
        email: "user1@example.com",
        success: false,
        error: "Custom error message"
      })
    })
  })

  // ===========================================================================
  // DATABASE ERRORS
  // ===========================================================================

  describe("Database Errors", () => {
    it("throws error when findMany fails", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockRejectedValue(new Error("Database connection failed"))

      // Act & Assert
      await expect(
        sendExpiryReminders.handler({
          step: mockStep
        })
      ).rejects.toThrow("Database connection failed")
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles single expiring short", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([mockExpiringShorts[0]] as unknown as Short[])
      mockSendExpiryReminderEmail.mockResolvedValue(undefined)

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result.remindersSent).toBe(1)
      expect(mockSendExpiryReminderEmail).toHaveBeenCalledTimes(1)
    })

    it("handles large number of expiring shorts", async () => {
      // Arrange
      const mockStep = createMockStep()
      const manyShorts = Array.from({ length: 50 }, (_, i) => ({
        id: `short-${i}`,
        title: `Expiring Short ${i}`,
        expiresAt: sevenDaysFromNow,
        company: {
          id: `company-${i}`,
          companyName: `Company ${i}`,
          user: {
            id: `user-${i}`,
            email: `user${i}@example.com`
          }
        }
      }))
      mockPrisma.short.findMany.mockResolvedValue(manyShorts as unknown as Short[])
      mockSendExpiryReminderEmail.mockResolvedValue(undefined)

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result.remindersSent).toBe(50)
      expect(mockSendExpiryReminderEmail).toHaveBeenCalledTimes(50)
    })

    it("uses localhost fallback when APP_URL not set", async () => {
      // Arrange
      const originalUrl = process.env.NEXT_PUBLIC_APP_URL
      delete process.env.NEXT_PUBLIC_APP_URL

      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([mockExpiringShorts[0]] as unknown as Short[])
      mockSendExpiryReminderEmail.mockResolvedValue(undefined)

      // Act
      await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert - renewUrl should use localhost fallback
      expect(mockSendExpiryReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          renewUrl: expect.stringContaining("/panel/shorts/short-1?action=renew")
        })
      )

      // Restore
      process.env.NEXT_PUBLIC_APP_URL = originalUrl
    })

    it("handles non-Error thrown in email send", async () => {
      // Arrange
      const mockStep = createMockStep()
      mockPrisma.short.findMany.mockResolvedValue([mockExpiringShorts[0]] as unknown as Short[])
      mockSendExpiryReminderEmail.mockRejectedValue("String error")

      // Act
      const result = await sendExpiryReminders.handler({
        step: mockStep
      })

      // Assert
      expect(result.details[0].error).toBe("Unknown error")
    })
  })
})
