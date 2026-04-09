import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@/test/utils"
import { StepIndicator, type WizardStep } from "../step-indicator"

describe("StepIndicator", () => {
  const mockOnStepClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders all four steps", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      expect(screen.getByText("shorts.wizard.steps.video")).toBeInTheDocument()
      expect(screen.getByText("shorts.wizard.steps.metadata")).toBeInTheDocument()
      expect(screen.getByText("shorts.wizard.steps.thumbnail")).toBeInTheDocument()
      expect(screen.getByText("shorts.wizard.steps.review")).toBeInTheDocument()
    })

    it("renders step numbers for non-completed steps", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("4")).toBeInTheDocument()
    })

    it("renders check icon for completed steps", () => {
      render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
        />
      )

      // First step (video) should have check icon, not number
      expect(screen.queryByText("1")).not.toBeInTheDocument()

      // Other steps should still have numbers
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("4")).toBeInTheDocument()
    })

    it("renders navigation element with aria-label", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      const nav = screen.getByRole("navigation", { name: /progress/i })
      expect(nav).toBeInTheDocument()
    })

    it("renders ordered list of steps", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      const list = document.querySelector("ol")
      expect(list).toBeInTheDocument()

      const items = document.querySelectorAll("li")
      expect(items.length).toBe(4)
    })

    it("renders mobile step indicator", () => {
      render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
        />
      )

      // Mobile indicator shows current step info
      expect(screen.getByText(/\(2\/4\)/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // STEP STATES
  // ===========================================================================

  describe("Step States", () => {
    it("highlights current step", () => {
      render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
        />
      )

      // Current step label should have foreground color
      const metadataLabel = screen.getByText("shorts.wizard.steps.metadata")
      expect(metadataLabel).toHaveClass("text-foreground")
    })

    it("shows completed steps with primary color", () => {
      render(
        <StepIndicator
          currentStep="thumbnail"
          completedSteps={["video", "metadata"]}
        />
      )

      // Completed steps should have primary styling
      const buttons = document.querySelectorAll("button")

      // First two buttons (video, metadata) should be completed
      expect(buttons[0]).toHaveClass("border-primary", "bg-primary")
      expect(buttons[1]).toHaveClass("border-primary", "bg-primary")
    })

    it("shows pending steps with muted styling", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      const buttons = document.querySelectorAll("button")

      // Steps 2, 3, 4 should be pending (muted)
      expect(buttons[1]).toHaveClass("border-muted-foreground/25")
      expect(buttons[2]).toHaveClass("border-muted-foreground/25")
      expect(buttons[3]).toHaveClass("border-muted-foreground/25")
    })

    it("shows connector lines between steps", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      // Connector lines (3 of them, between 4 steps)
      const connectors = document.querySelectorAll(".h-0\\.5")
      expect(connectors.length).toBe(3)
    })

    it("colors completed connector lines with primary", () => {
      render(
        <StepIndicator
          currentStep="thumbnail"
          completedSteps={["video", "metadata"]}
        />
      )

      const connectors = document.querySelectorAll(".h-0\\.5")

      // First two connectors should be primary (after completed steps)
      expect(connectors[0]).toHaveClass("bg-primary")
      expect(connectors[1]).toHaveClass("bg-primary")
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("Interactions", () => {
    it("calls onStepClick when clicking completed step", async () => {
      const { user } = render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
          onStepClick={mockOnStepClick}
        />
      )

      const videoButton = screen.getAllByRole("button")[0]
      await user.click(videoButton)

      expect(mockOnStepClick).toHaveBeenCalledWith("video")
    })

    it("calls onStepClick when clicking current step", async () => {
      const { user } = render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
          onStepClick={mockOnStepClick}
        />
      )

      const metadataButton = screen.getAllByRole("button")[1]
      await user.click(metadataButton)

      expect(mockOnStepClick).toHaveBeenCalledWith("metadata")
    })

    it("does not call onStepClick when clicking future step", async () => {
      const { user } = render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
          onStepClick={mockOnStepClick}
        />
      )

      const thumbnailButton = screen.getAllByRole("button")[2]
      await user.click(thumbnailButton)

      // Should not be called for future step
      expect(mockOnStepClick).not.toHaveBeenCalled()
    })

    it("disables future step buttons", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
          onStepClick={mockOnStepClick}
        />
      )

      const buttons = screen.getAllByRole("button")

      // Future steps should be disabled
      expect(buttons[1]).toBeDisabled() // metadata
      expect(buttons[2]).toBeDisabled() // thumbnail
      expect(buttons[3]).toBeDisabled() // review
    })

    it("enables completed step buttons", () => {
      render(
        <StepIndicator
          currentStep="thumbnail"
          completedSteps={["video", "metadata"]}
          onStepClick={mockOnStepClick}
        />
      )

      const buttons = screen.getAllByRole("button")

      // Completed steps should be enabled
      expect(buttons[0]).not.toBeDisabled() // video
      expect(buttons[1]).not.toBeDisabled() // metadata
    })

    it("enables current step button", () => {
      render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
          onStepClick={mockOnStepClick}
        />
      )

      const buttons = screen.getAllByRole("button")

      // Current step should be enabled
      expect(buttons[1]).not.toBeDisabled() // metadata
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles first step as current", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      const buttons = screen.getAllByRole("button")

      // First step should be active but not completed
      expect(buttons[0]).toHaveClass("border-primary")
      expect(buttons[0]).not.toHaveClass("bg-primary")
    })

    it("handles last step as current", () => {
      render(
        <StepIndicator
          currentStep="review"
          completedSteps={["video", "metadata", "thumbnail"]}
        />
      )

      const buttons = screen.getAllByRole("button")

      // Last step should be current
      expect(buttons[3]).toHaveClass("border-primary")

      // Previous steps should be completed
      expect(buttons[0]).toHaveClass("bg-primary")
      expect(buttons[1]).toHaveClass("bg-primary")
      expect(buttons[2]).toHaveClass("bg-primary")
    })

    it("handles all steps completed", () => {
      render(
        <StepIndicator
          currentStep="review"
          completedSteps={["video", "metadata", "thumbnail", "review"]}
        />
      )

      // All steps including review should have check marks
      expect(screen.queryByText("1")).not.toBeInTheDocument()
      expect(screen.queryByText("2")).not.toBeInTheDocument()
      expect(screen.queryByText("3")).not.toBeInTheDocument()
      expect(screen.queryByText("4")).not.toBeInTheDocument()
    })

    it("handles empty completedSteps array", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      // All steps should show numbers
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("4")).toBeInTheDocument()
    })

    it("handles onStepClick not provided", async () => {
      const { user } = render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
          // No onStepClick
        />
      )

      const videoButton = screen.getAllByRole("button")[0]

      // Should not throw error
      await user.click(videoButton)
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("has navigation landmark with label", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      const nav = screen.getByRole("navigation", { name: "Progress" })
      expect(nav).toBeInTheDocument()
    })

    it("step buttons have type button", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      const buttons = screen.getAllByRole("button")
      buttons.forEach(button => {
        expect(button).toHaveAttribute("type", "button")
      })
    })

    it("disabled buttons have disabled attribute", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
          onStepClick={mockOnStepClick}
        />
      )

      const buttons = screen.getAllByRole("button")

      // Future steps should have disabled attribute
      expect(buttons[1]).toHaveAttribute("disabled")
      expect(buttons[2]).toHaveAttribute("disabled")
      expect(buttons[3]).toHaveAttribute("disabled")
    })

    it("shows step count in mobile view", () => {
      render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
        />
      )

      // Mobile view shows "(2/4)"
      expect(screen.getByText(/\(2\/4\)/)).toBeInTheDocument()
    })

    it("uses semantic ordered list", () => {
      render(
        <StepIndicator
          currentStep="video"
          completedSteps={[]}
        />
      )

      const ol = document.querySelector("ol")
      expect(ol).toBeInTheDocument()

      const listItems = ol?.querySelectorAll("li")
      expect(listItems?.length).toBe(4)
    })
  })

  // ===========================================================================
  // STEP CLICKABILITY LOGIC
  // ===========================================================================

  describe("Step Clickability Logic", () => {
    it("allows clicking previous steps", async () => {
      const { user } = render(
        <StepIndicator
          currentStep="thumbnail"
          completedSteps={["video", "metadata"]}
          onStepClick={mockOnStepClick}
        />
      )

      // Click on video (first step)
      await user.click(screen.getAllByRole("button")[0])
      expect(mockOnStepClick).toHaveBeenCalledWith("video")

      // Click on metadata (second step)
      await user.click(screen.getAllByRole("button")[1])
      expect(mockOnStepClick).toHaveBeenCalledWith("metadata")
    })

    it("prevents clicking steps after current that are not completed", async () => {
      const { user } = render(
        <StepIndicator
          currentStep="metadata"
          completedSteps={["video"]}
          onStepClick={mockOnStepClick}
        />
      )

      vi.clearAllMocks()

      // Try to click review (future step)
      await user.click(screen.getAllByRole("button")[3])

      expect(mockOnStepClick).not.toHaveBeenCalled()
    })

    it("allows clicking completed steps even if not adjacent", async () => {
      const { user } = render(
        <StepIndicator
          currentStep="review"
          completedSteps={["video", "metadata", "thumbnail"]}
          onStepClick={mockOnStepClick}
        />
      )

      // Click on video (first step, from review)
      await user.click(screen.getAllByRole("button")[0])
      expect(mockOnStepClick).toHaveBeenCalledWith("video")
    })
  })
})
