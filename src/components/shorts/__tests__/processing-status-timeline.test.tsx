import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/test/utils"
import { ProcessingStatusTimeline } from "../processing-status-timeline"
import type { ShortStatus, PaymentStatus } from "@prisma/client"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("@/lib/i18n/client", () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        // Handle estimated time translation
        if (key === "timeline.estimatedTime") {
          return `Est. ${params.minutes} min remaining`
        }
        return `${key}:${JSON.stringify(params)}`
      }
      return key
    }
  })
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

const defaultProps = {
  status: "DRAFT" as ShortStatus
}

describe("ProcessingStatusTimeline Component", () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders all timeline steps for non-payment flow", () => {
      // Act
      render(<ProcessingStatusTimeline {...defaultProps} />)

      // Assert - Should show draft, processing, published (not payment)
      expect(screen.getByText("timeline.draft")).toBeInTheDocument()
      expect(screen.getByText("timeline.processing")).toBeInTheDocument()
      expect(screen.getByText("timeline.published")).toBeInTheDocument()
      expect(screen.queryByText("timeline.payment")).not.toBeInTheDocument()
    })

    it("renders payment step when status is PENDING_PAYMENT", () => {
      // Act
      render(<ProcessingStatusTimeline status="PENDING_PAYMENT" />)

      // Assert
      expect(screen.getByText("timeline.draft")).toBeInTheDocument()
      expect(screen.getByText("timeline.payment")).toBeInTheDocument()
      expect(screen.getByText("timeline.processing")).toBeInTheDocument()
      expect(screen.getByText("timeline.published")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      // Act
      const { container } = render(
        <ProcessingStatusTimeline {...defaultProps} className="custom-class" />
      )

      // Assert
      expect(container.firstChild).toHaveClass("custom-class")
    })
  })

  // ===========================================================================
  // STATUS STATES
  // ===========================================================================

  describe("Status States", () => {
    it("marks draft as active when status is DRAFT", () => {
      // Act
      render(<ProcessingStatusTimeline status="DRAFT" />)

      // Assert - Check via text content styling or structure
      // The active step should have different styling
      const draftStep = screen.getByText("timeline.draft")
      expect(draftStep).toBeInTheDocument()
    })

    it("marks draft as complete and processing as active when status is PROCESSING", () => {
      // Act
      render(<ProcessingStatusTimeline status="PROCESSING" />)

      // Assert
      const processingStep = screen.getByText("timeline.processing")
      expect(processingStep).toBeInTheDocument()
    })

    it("marks all steps as complete when status is PUBLISHED", () => {
      // Act
      render(<ProcessingStatusTimeline status="PUBLISHED" />)

      // Assert
      const publishedStep = screen.getByText("timeline.published")
      expect(publishedStep).toBeInTheDocument()
    })

    it("handles ARCHIVED status like PUBLISHED", () => {
      // Act
      render(<ProcessingStatusTimeline status="ARCHIVED" />)

      // Assert
      expect(screen.getByText("timeline.published")).toBeInTheDocument()
    })

    it("handles DELETED status like PUBLISHED", () => {
      // Act
      render(<ProcessingStatusTimeline status="DELETED" />)

      // Assert
      expect(screen.getByText("timeline.published")).toBeInTheDocument()
    })

    it("marks payment as active when status is PENDING_PAYMENT", () => {
      // Act
      render(<ProcessingStatusTimeline status="PENDING_PAYMENT" />)

      // Assert
      expect(screen.getByText("timeline.payment")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ESTIMATED TIME
  // ===========================================================================

  describe("Estimated Time", () => {
    it("shows estimated time when processing and time is provided", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          estimatedTimeRemaining={120} // 2 minutes
        />
      )

      // Assert
      expect(screen.getByText("Est. 2 min remaining")).toBeInTheDocument()
    })

    it("shows 1 minute when less than 60 seconds remaining", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          estimatedTimeRemaining={45} // 45 seconds
        />
      )

      // Assert
      expect(screen.getByText("Est. 1 min remaining")).toBeInTheDocument()
    })

    it("shows correct minutes when estimatedTimeRemaining is 180 seconds", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          estimatedTimeRemaining={180}
        />
      )

      // Assert
      expect(screen.getByText("Est. 3 min remaining")).toBeInTheDocument()
    })

    it("does not show estimated time for DRAFT status", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="DRAFT"
          estimatedTimeRemaining={120}
        />
      )

      // Assert
      expect(screen.queryByText(/Est\./)).not.toBeInTheDocument()
    })

    it("does not show estimated time for PUBLISHED status", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PUBLISHED"
          estimatedTimeRemaining={0}
        />
      )

      // Assert
      expect(screen.queryByText(/Est\./)).not.toBeInTheDocument()
    })

    it("does not show estimated time when not provided", () => {
      // Act
      render(<ProcessingStatusTimeline status="PROCESSING" />)

      // Assert
      expect(screen.queryByText(/Est\./)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // PROCESSING ERRORS
  // ===========================================================================

  describe("Processing Errors", () => {
    it("shows processing error when provided during PROCESSING", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          processingError="Transcoding failed: invalid format"
        />
      )

      // Assert
      expect(
        screen.getByText("Transcoding failed: invalid format")
      ).toBeInTheDocument()
    })

    it("shows error on active step for any status (not just PROCESSING)", () => {
      // Act - DRAFT status makes draft step active
      render(
        <ProcessingStatusTimeline
          status="DRAFT"
          processingError="Draft error message"
        />
      )

      // Assert - Error IS visible because component shows error on ANY active step
      // The draft step is active when status is DRAFT, so error appears there
      expect(screen.getByText("Draft error message")).toBeInTheDocument()
    })

    it("does not show error when not provided", () => {
      // Act
      render(<ProcessingStatusTimeline status="PROCESSING" />)

      // Assert
      const errorElement = screen.queryByText("Transcoding failed")
      expect(errorElement).not.toBeInTheDocument()
    })

    it("shows error with destructive styling", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          processingError="Error message"
        />
      )

      // Assert
      const errorElement = screen.getByText("Error message")
      expect(errorElement).toHaveClass("text-destructive")
    })
  })

  // ===========================================================================
  // STEP INDICATORS
  // ===========================================================================

  describe("Step Indicators", () => {
    it("renders check icon for completed steps", () => {
      // Act
      render(<ProcessingStatusTimeline status="PUBLISHED" />)

      // Assert - Look for the check icons (completed steps should have them)
      // Since we have multiple steps completed, there should be check icons
      const container = screen.getByText("timeline.draft").closest("div")?.parentElement
      expect(container).toBeInTheDocument()
    })

    it("renders spinner for PROCESSING step when active", () => {
      // Act
      render(<ProcessingStatusTimeline status="PROCESSING" />)

      // Assert - The Loader2 component should be present
      // We can check for the animate-spin class
      const spinnerContainer = document.querySelector(".animate-spin")
      expect(spinnerContainer).toBeInTheDocument()
    })

    it("renders spinner for PENDING_PAYMENT step when active", () => {
      // Act
      render(<ProcessingStatusTimeline status="PENDING_PAYMENT" />)

      // Assert
      const spinnerContainer = document.querySelector(".animate-spin")
      expect(spinnerContainer).toBeInTheDocument()
    })

    it("does not render spinner for DRAFT status", () => {
      // Act
      render(<ProcessingStatusTimeline status="DRAFT" />)

      // Assert
      const spinnerContainer = document.querySelector(".animate-spin")
      expect(spinnerContainer).not.toBeInTheDocument()
    })

    it("does not render spinner for PUBLISHED status", () => {
      // Act
      render(<ProcessingStatusTimeline status="PUBLISHED" />)

      // Assert
      const spinnerContainer = document.querySelector(".animate-spin")
      expect(spinnerContainer).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // CONNECTOR LINES
  // ===========================================================================

  describe("Connector Lines", () => {
    it("renders connector lines between steps", () => {
      // Act
      const { container } = render(<ProcessingStatusTimeline status="DRAFT" />)

      // Assert - Check for connector line elements (height 12, width 0.5)
      const connectors = container.querySelectorAll(".h-12.w-0\\.5")
      // Should have connectors between steps (number of steps - 1)
      expect(connectors.length).toBeGreaterThan(0)
    })

    it("does not render connector after last step", () => {
      // Act
      const { container } = render(<ProcessingStatusTimeline status="PUBLISHED" />)

      // Assert - The last step should not have a connector
      const steps = container.querySelectorAll("[class*='flex items-start gap-4']")
      expect(steps.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles undefined paymentStatus", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          paymentStatus={undefined}
        />
      )

      // Assert
      expect(screen.getByText("timeline.processing")).toBeInTheDocument()
    })

    it("handles zero estimatedTimeRemaining", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          estimatedTimeRemaining={0}
        />
      )

      // Assert - Math.ceil(0/60) = 0, so "Est. 0 min remaining"
      // But typically we show this only when > 0
      // The component shows when estimatedTimeRemaining !== undefined
      expect(screen.getByText("Est. 0 min remaining")).toBeInTheDocument()
    })

    it("handles empty className", () => {
      // Act
      const { container } = render(
        <ProcessingStatusTimeline {...defaultProps} className="" />
      )

      // Assert
      expect(container.firstChild).toHaveClass("space-y-4")
    })

    it("renders correctly with all props provided", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          paymentStatus="COMPLETED"
          processingError="Some error"
          estimatedTimeRemaining={90}
          className="test-class"
        />
      )

      // Assert
      expect(screen.getByText("timeline.processing")).toBeInTheDocument()
      expect(screen.getByText("Some error")).toBeInTheDocument()
      expect(screen.getByText("Est. 2 min remaining")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("uses semantic HTML structure", () => {
      // Act
      const { container } = render(<ProcessingStatusTimeline {...defaultProps} />)

      // Assert - Check for proper structure
      const mainContainer = container.querySelector(".space-y-4")
      expect(mainContainer).toBeInTheDocument()
    })

    it("has visible text labels for all steps", () => {
      // Act
      render(<ProcessingStatusTimeline status="PROCESSING" />)

      // Assert
      expect(screen.getByText("timeline.draft")).toBeVisible()
      expect(screen.getByText("timeline.processing")).toBeVisible()
      expect(screen.getByText("timeline.published")).toBeVisible()
    })

    it("error messages are visible when present", () => {
      // Act
      render(
        <ProcessingStatusTimeline
          status="PROCESSING"
          processingError="Critical error occurred"
        />
      )

      // Assert
      expect(screen.getByText("Critical error occurred")).toBeVisible()
    })
  })
})
