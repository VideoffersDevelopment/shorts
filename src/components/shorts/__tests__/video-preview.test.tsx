import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@/test/utils"
import { VideoPreview } from "../video-preview"

describe("VideoPreview", () => {
  const defaultProps = {
    src: "blob:mock-video-url",
    duration: 30,
    aspectRatio: "9:16"
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders video element with correct src", () => {
      render(<VideoPreview {...defaultProps} />)

      const video = document.querySelector("video")
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute("src", "blob:mock-video-url")
    })

    it("renders video with muted by default", () => {
      render(<VideoPreview {...defaultProps} />)

      const video = document.querySelector("video") as HTMLVideoElement
      // React sets muted as a property, check the DOM property
      expect(video.muted).toBe(true)
    })

    it("renders video with playsInline attribute", () => {
      render(<VideoPreview {...defaultProps} />)

      const video = document.querySelector("video")
      expect(video).toHaveAttribute("playsinline")
    })

    it("displays formatted duration", () => {
      render(<VideoPreview {...defaultProps} />)

      // Duration 30 seconds = "0:30"
      expect(screen.getByText("0:30")).toBeInTheDocument()
    })

    it("displays duration with minutes for longer videos", () => {
      render(<VideoPreview {...defaultProps} duration={65} />)

      // Duration 65 seconds = "1:05"
      expect(screen.getByText("1:05")).toBeInTheDocument()
    })

    it("renders play overlay when video is paused", () => {
      render(<VideoPreview {...defaultProps} />)

      // Play overlay should be visible initially (video is paused)
      const playOverlay = document.querySelector("[class*='inset-0'][class*='cursor-pointer']")
      expect(playOverlay).toBeInTheDocument()
    })

    it("shows change video button when onChangeVideo is provided", () => {
      const onChangeVideo = vi.fn()
      render(<VideoPreview {...defaultProps} onChangeVideo={onChangeVideo} />)

      expect(screen.getByRole("button", { name: /shorts.wizard.video.changeVideo/i })).toBeInTheDocument()
    })

    it("hides change video button when onChangeVideo is not provided", () => {
      render(<VideoPreview {...defaultProps} />)

      expect(screen.queryByRole("button", { name: /changeVideo/i })).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ASPECT RATIO WARNING
  // ===========================================================================

  describe("Aspect Ratio Warning", () => {
    it("shows warning for non-optimal aspect ratio (16:9 horizontal)", () => {
      render(<VideoPreview {...defaultProps} aspectRatio="16:9" />)

      expect(screen.getByText("shorts.wizard.video.aspectWarning")).toBeInTheDocument()
    })

    it("shows warning for 1:1 square aspect ratio", () => {
      render(<VideoPreview {...defaultProps} aspectRatio="1:1" />)

      expect(screen.getByText("shorts.wizard.video.aspectWarning")).toBeInTheDocument()
    })

    it("does not show warning for optimal 9:16 aspect ratio", () => {
      render(<VideoPreview {...defaultProps} aspectRatio="9:16" />)

      expect(screen.queryByText("shorts.wizard.video.aspectWarning")).not.toBeInTheDocument()
    })

    it("does not show warning for aspect ratio close to 9:16", () => {
      // 1080:1920 is exactly 9:16
      render(<VideoPreview {...defaultProps} aspectRatio="1080:1920" />)

      expect(screen.queryByText("shorts.wizard.video.aspectWarning")).not.toBeInTheDocument()
    })

    it("shows warning for 4:3 aspect ratio", () => {
      render(<VideoPreview {...defaultProps} aspectRatio="4:3" />)

      expect(screen.getByText("shorts.wizard.video.aspectWarning")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("Interactions", () => {
    it("calls onChangeVideo when change button is clicked", async () => {
      const onChangeVideo = vi.fn()
      const { user } = render(<VideoPreview {...defaultProps} onChangeVideo={onChangeVideo} />)

      await user.click(screen.getByRole("button", { name: /shorts.wizard.video.changeVideo/i }))

      expect(onChangeVideo).toHaveBeenCalledTimes(1)
    })

    it("renders play/pause button", () => {
      render(<VideoPreview {...defaultProps} />)

      // Control buttons are rendered
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    it("renders restart button", () => {
      render(<VideoPreview {...defaultProps} />)

      // There should be multiple control buttons
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThanOrEqual(3) // Play, Restart, Mute
    })

    it("renders mute/unmute button", () => {
      render(<VideoPreview {...defaultProps} />)

      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })

    it("renders progress slider", () => {
      render(<VideoPreview {...defaultProps} />)

      const slider = document.querySelector('input[type="range"]')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveAttribute("min", "0")
      expect(slider).toHaveAttribute("max", "30")
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles zero duration", () => {
      render(<VideoPreview {...defaultProps} duration={0} />)

      // Both current time and duration show 0:00
      const timeElements = screen.getAllByText("0:00")
      expect(timeElements.length).toBeGreaterThanOrEqual(2)
    })

    it("handles maximum duration (60 seconds)", () => {
      render(<VideoPreview {...defaultProps} duration={60} />)

      // Duration display shows 1:00
      expect(screen.getByText("1:00")).toBeInTheDocument()
    })

    it("handles invalid aspect ratio gracefully", () => {
      render(<VideoPreview {...defaultProps} aspectRatio="invalid" />)

      // Should not crash, warning might or might not show
      expect(document.querySelector("video")).toBeInTheDocument()
    })

    it("handles empty aspect ratio", () => {
      render(<VideoPreview {...defaultProps} aspectRatio="" />)

      expect(document.querySelector("video")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      render(<VideoPreview {...defaultProps} className="custom-class" />)

      const container = document.querySelector(".custom-class")
      expect(container).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("has accessible control buttons", () => {
      render(<VideoPreview {...defaultProps} onChangeVideo={vi.fn()} />)

      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)

      // All buttons should be accessible
      buttons.forEach(button => {
        expect(button).toHaveAttribute("type", "button")
      })
    })

    it("progress slider is interactive", () => {
      render(<VideoPreview {...defaultProps} />)

      const slider = document.querySelector('input[type="range"]') as HTMLInputElement
      expect(slider).not.toBeDisabled()
    })

    it("current time display is visible", () => {
      render(<VideoPreview {...defaultProps} />)

      // Initial current time is 0:00, duration is 0:30 - current time element exists
      const timeElements = screen.getAllByText(/0:00|0:30/)
      expect(timeElements.length).toBeGreaterThan(0)
    })
  })
})
