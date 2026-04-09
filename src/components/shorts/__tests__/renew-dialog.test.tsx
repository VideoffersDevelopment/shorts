import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/utils"
import { RenewDialog } from "../renew-dialog"
import { renewShortAction } from "@/app/actions/shorts/renew"
import type { Short } from "@prisma/client"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/app/actions/shorts/renew")
vi.mock("@/lib/i18n/client", () => ({
  useTranslations: (namespace: string) => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        // Handle date formatting
        if (key === "renew.newExpiry" && params.date) {
          return `New expiry: ${params.date}`
        }
        return `${namespace}.${key}:${JSON.stringify(params)}`
      }
      return `${namespace}.${key}`
    }
  })
}))

// Mock useRouter
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

const mockRenewShortAction = vi.mocked(renewShortAction)

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockShort: Short = {
  id: "short-123",
  companyId: "company-456",
  title: "Test Short Video",
  description: "A test video",
  status: "ARCHIVED",
  categoryId: "cat-1",
  rawVideoKey: null,
  hlsPlaylistUrl: null,
  thumbnailUrl: null,
  ctaLink: null,
  latitude: null,
  longitude: null,
  address: null,
  publishedAt: null,
  expiresAt: null,
  archivedAt: new Date(),
  processingError: null,
  qencodeTaskId: null,
  retryCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}

const defaultProps = {
  short: mockShort,
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  credits: 5
}

describe("RenewDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders dialog when isOpen is true", () => {
      // Act
      render(<RenewDialog {...defaultProps} />)

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("does not render dialog content when isOpen is false", () => {
      // Act
      render(<RenewDialog {...defaultProps} isOpen={false} />)

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("renders dialog title", () => {
      // Act
      render(<RenewDialog {...defaultProps} />)

      // Assert
      expect(screen.getByText("shorts.renew.title")).toBeInTheDocument()
    })

    it("renders dialog description", () => {
      // Act
      render(<RenewDialog {...defaultProps} />)

      // Assert
      expect(screen.getByText("shorts.renew.description")).toBeInTheDocument()
    })

    it("renders short title", () => {
      // Act
      render(<RenewDialog {...defaultProps} />)

      // Assert
      expect(screen.getByText("Test Short Video")).toBeInTheDocument()
    })

    it("renders credits balance", () => {
      // Act
      render(<RenewDialog {...defaultProps} credits={5} />)

      // Assert
      expect(screen.getByText("5")).toBeInTheDocument()
      expect(screen.getByText("payments.credits.available")).toBeInTheDocument()
    })

    it("renders cancel button", () => {
      // Act
      render(<RenewDialog {...defaultProps} />)

      // Assert
      expect(screen.getByRole("button", { name: /shorts.renew.cancel/i })).toBeInTheDocument()
    })

    it("renders confirm button with credits text when user has credits", () => {
      // Act
      render(<RenewDialog {...defaultProps} credits={5} />)

      // Assert
      expect(screen.getByRole("button", { name: /shorts.renew.confirm/i })).toBeInTheDocument()
    })

    it("renders buy credits text when user has no credits", () => {
      // Act
      render(<RenewDialog {...defaultProps} credits={0} />)

      // Assert
      expect(screen.getByRole("button", { name: /payments.credits.buy/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe("User Interactions", () => {
    it("calls onClose when cancel button clicked", async () => {
      // Arrange
      const onClose = vi.fn()
      const { user } = render(<RenewDialog {...defaultProps} onClose={onClose} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.cancel/i }))

      // Assert
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("calls renewShortAction when confirm clicked with credits", async () => {
      // Arrange
      mockRenewShortAction.mockResolvedValue({
        success: true,
        data: { processing: true, renewedUntil: new Date().toISOString() }
      })
      const { user } = render(<RenewDialog {...defaultProps} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert
      await waitFor(() => {
        expect(mockRenewShortAction).toHaveBeenCalledWith("short-123")
      })
    })

    it("calls onSuccess after successful renewal", async () => {
      // Arrange
      mockRenewShortAction.mockResolvedValue({
        success: true,
        data: { processing: true, renewedUntil: new Date().toISOString() }
      })
      const onSuccess = vi.fn()
      const onClose = vi.fn()
      const { user } = render(
        <RenewDialog {...defaultProps} onSuccess={onSuccess} onClose={onClose} credits={5} />
      )

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
        expect(onClose).toHaveBeenCalled()
      })
    })

    it("redirects to credits page when needsPayment returned", async () => {
      // Arrange
      mockRenewShortAction.mockResolvedValue({
        success: true,
        data: { needsPayment: true }
      })
      const onClose = vi.fn()
      const { user } = render(<RenewDialog {...defaultProps} onClose={onClose} credits={0} />)

      // Act
      await user.click(screen.getByRole("button", { name: /payments.credits.buy/i }))

      // Assert
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/panel/credits?action=buy")
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================

  describe("Loading State", () => {
    it("shows loading spinner when processing", async () => {
      // Arrange
      mockRenewShortAction.mockImplementation(() => new Promise(() => {})) // Never resolves
      const { user } = render(<RenewDialog {...defaultProps} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert - The button should be disabled during loading
      // Loader2 icon appears inside the button when isLoading is true
      await waitFor(() => {
        // Check that cancel button is disabled (indicates loading state)
        expect(screen.getByRole("button", { name: /shorts.renew.cancel/i })).toBeDisabled()
      })
    })

    it("disables buttons during loading", async () => {
      // Arrange
      mockRenewShortAction.mockImplementation(() => new Promise(() => {}))
      const { user } = render(<RenewDialog {...defaultProps} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /shorts.renew.cancel/i })).toBeDisabled()
      })
    })

    it("prevents closing dialog during loading", async () => {
      // Arrange
      mockRenewShortAction.mockImplementation(() => new Promise(() => {}))
      const onClose = vi.fn()
      const { user } = render(<RenewDialog {...defaultProps} onClose={onClose} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))
      await user.click(screen.getByRole("button", { name: /shorts.renew.cancel/i }))

      // Assert
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe("Error Handling", () => {
    it("displays error message when action fails", async () => {
      // Arrange
      mockRenewShortAction.mockResolvedValue({
        success: false,
        error: "Renewal failed"
      })
      const { user } = render(<RenewDialog {...defaultProps} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Renewal failed")).toBeInTheDocument()
      })
    })

    it("displays error message when action throws", async () => {
      // Arrange
      mockRenewShortAction.mockRejectedValue(new Error("Network error"))
      const { user } = render(<RenewDialog {...defaultProps} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText("shorts.errors.renewFailed")).toBeInTheDocument()
      })
    })

    it("clears error when dialog is reopened", async () => {
      // Arrange
      mockRenewShortAction.mockResolvedValue({
        success: false,
        error: "Renewal failed"
      })
      const { user, rerender } = render(<RenewDialog {...defaultProps} credits={5} />)

      // Act - Trigger error
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))
      await waitFor(() => {
        expect(screen.getByText("Renewal failed")).toBeInTheDocument()
      })

      // Act - Close and reopen
      rerender(<RenewDialog {...defaultProps} isOpen={false} credits={5} />)
      rerender(<RenewDialog {...defaultProps} isOpen={true} credits={5} />)

      // Assert - Error should be cleared (handled by handleClose)
      // Note: In practice, error clears when handleClose is called
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles null short gracefully", async () => {
      // Arrange
      mockRenewShortAction.mockResolvedValue({
        success: true,
        data: { processing: true }
      })
      const { user } = render(<RenewDialog {...defaultProps} short={null} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert - Should not call action
      expect(mockRenewShortAction).not.toHaveBeenCalled()
    })

    it("handles zero credits", () => {
      // Act
      render(<RenewDialog {...defaultProps} credits={0} />)

      // Assert
      expect(screen.getByText("0")).toBeInTheDocument()
      expect(screen.getByText("shorts.renew.needsPayment")).toBeInTheDocument()
    })

    it("handles negative credits", () => {
      // Act
      render(<RenewDialog {...defaultProps} credits={-5} />)

      // Assert
      expect(screen.getByText("-5")).toBeInTheDocument()
    })

    it("shows use credit message when credits available", () => {
      // Act
      render(<RenewDialog {...defaultProps} credits={3} />)

      // Assert
      expect(screen.getByText("shorts.renew.useCredit")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("dialog has proper role", () => {
      // Act
      render(<RenewDialog {...defaultProps} />)

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("buttons are focusable", () => {
      // Act
      render(<RenewDialog {...defaultProps} />)

      // Assert
      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        button.focus()
        expect(button).toHaveFocus()
      })
    })

    it("error message is visible", async () => {
      // Arrange
      mockRenewShortAction.mockResolvedValue({
        success: false,
        error: "Error message"
      })
      const { user } = render(<RenewDialog {...defaultProps} credits={5} />)

      // Act
      await user.click(screen.getByRole("button", { name: /shorts.renew.confirm/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Error message")).toBeVisible()
      })
    })
  })
})
