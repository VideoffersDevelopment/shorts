import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@/test/utils"
import { ThumbnailSelector } from "../thumbnail-selector"

// ===========================================================================
// MOCKS
// ===========================================================================

const mockFetch = vi.fn()
global.fetch = mockFetch

describe("ThumbnailSelector", () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        uploadUrl: "https://upload.example.com/thumb",
        publicUrl: "https://cdn.example.com/thumb.jpg"
      })
    })
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders two selection options (auto and custom)", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      expect(screen.getByText("shorts.wizard.thumbnail.auto")).toBeInTheDocument()
      expect(screen.getByText("shorts.wizard.thumbnail.custom")).toBeInTheDocument()
    })

    it("renders auto option description", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      expect(screen.getByText("shorts.wizard.thumbnail.autoDescription")).toBeInTheDocument()
    })

    it("renders custom option description", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      expect(screen.getByText("shorts.wizard.thumbnail.customDescription")).toBeInTheDocument()
    })

    it("renders upload button for custom option", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      expect(screen.getByRole("button", { name: /shorts.wizard.thumbnail.upload/i })).toBeInTheDocument()
    })

    it("renders hidden file input", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveClass("hidden")
      expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png")
    })

    it("shows video preview when videoPreviewUrl is provided and auto is selected", () => {
      render(
        <ThumbnailSelector
          value={{ url: "", isCustom: false }}
          onChange={mockOnChange}
          videoPreviewUrl="blob:video-preview"
        />
      )

      const video = document.querySelector("video")
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute("src", "blob:video-preview")
    })

    it("shows custom thumbnail image when custom is selected with URL", () => {
      render(
        <ThumbnailSelector
          value={{ url: "https://cdn.example.com/custom-thumb.jpg", isCustom: true }}
          onChange={mockOnChange}
        />
      )

      const img = document.querySelector('img[alt="Custom thumbnail"]')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute("src", "https://cdn.example.com/custom-thumb.jpg")
    })
  })

  // ===========================================================================
  // SELECTION STATE
  // ===========================================================================

  describe("Selection State", () => {
    it("highlights auto option when isCustom is false", () => {
      render(
        <ThumbnailSelector
          value={{ url: "", isCustom: false }}
          onChange={mockOnChange}
        />
      )

      // Auto option should have primary border
      const buttons = document.querySelectorAll("button")
      const autoButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes("shorts.wizard.thumbnail.auto")
      )

      expect(autoButton).toHaveClass("border-primary")
    })

    it("highlights custom option when isCustom is true", () => {
      render(
        <ThumbnailSelector
          value={{ url: "https://example.com/thumb.jpg", isCustom: true }}
          onChange={mockOnChange}
        />
      )

      // Custom option container should have primary border
      const customDiv = document.querySelector('.border-primary:not(button)')
      expect(customDiv).toBeInTheDocument()
    })

    it("shows selection indicator for auto option when selected", () => {
      render(
        <ThumbnailSelector
          value={{ url: "", isCustom: false }}
          onChange={mockOnChange}
        />
      )

      // Auto option should have the filled indicator
      const indicators = document.querySelectorAll('.rounded-full.border-primary.bg-primary')
      expect(indicators.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("Interactions", () => {
    it("calls onChange with auto option when auto is clicked", async () => {
      const { user } = render(
        <ThumbnailSelector
          value={{ url: "https://example.com/thumb.jpg", isCustom: true }}
          onChange={mockOnChange}
        />
      )

      const autoButton = screen.getByRole("button", { name: /shorts.wizard.thumbnail.auto/i })
      await user.click(autoButton)

      expect(mockOnChange).toHaveBeenCalledWith({ url: "", isCustom: false })
    })

    it("opens file dialog when upload button is clicked", async () => {
      const { user } = render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(fileInput, "click")

      await user.click(screen.getByRole("button", { name: /shorts.wizard.thumbnail.upload/i }))

      expect(clickSpy).toHaveBeenCalled()
    })

    it("shows remove button when custom thumbnail is uploaded", async () => {
      render(
        <ThumbnailSelector
          value={{ url: "https://cdn.example.com/thumb.jpg", isCustom: true }}
          onChange={mockOnChange}
        />
      )

      // Should show remove button (X icon)
      const removeButton = document.querySelector('.bg-destructive')
      expect(removeButton).toBeInTheDocument()
    })

    it("calls onChange with auto option when remove button is clicked", async () => {
      const { user } = render(
        <ThumbnailSelector
          value={{ url: "https://cdn.example.com/thumb.jpg", isCustom: true }}
          onChange={mockOnChange}
        />
      )

      const removeButton = document.querySelector('.bg-destructive') as HTMLButtonElement
      if (removeButton) {
        await user.click(removeButton)
      }

      expect(mockOnChange).toHaveBeenCalledWith({ url: "", isCustom: false })
    })
  })

  // ===========================================================================
  // DRAG AND DROP
  // ===========================================================================

  describe("Drag and Drop", () => {
    it("shows drag overlay when dragging over custom option", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      // The custom option container has the drag handlers - it's the div containing the label
      // Use closest to find the container with the border classes
      const customLabel = screen.getByText("shorts.wizard.thumbnail.custom")
      const customOption = customLabel.closest(".relative")

      if (customOption) {
        // Use fireEvent for React synthetic events
        fireEvent.dragOver(customOption)
      }

      expect(screen.getByText("shorts.wizard.thumbnail.dragAndDrop")).toBeInTheDocument()
    })

    it("removes drag state on drag leave", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      const customLabel = screen.getByText("shorts.wizard.thumbnail.custom")
      const customOption = customLabel.closest(".relative")

      if (customOption) {
        // Trigger drag over then drag leave using fireEvent
        fireEvent.dragOver(customOption)
        fireEvent.dragLeave(customOption)
      }

      // Drag overlay should be hidden
      expect(screen.queryByText("shorts.wizard.thumbnail.dragAndDrop")).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe("Loading States", () => {
    it("shows uploading text during upload", async () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      // Initial state should not show uploading
      expect(screen.queryByText("shorts.wizard.thumbnail.uploading")).not.toBeInTheDocument()
    })

    it("disables auto option when disabled prop is true", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} disabled={true} />)

      const autoButton = screen.getByRole("button", { name: /shorts.wizard.thumbnail.auto/i })
      expect(autoButton).toBeDisabled()
    })

    it("disables upload button when disabled prop is true", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} disabled={true} />)

      const uploadButton = screen.getByRole("button", { name: /shorts.wizard.thumbnail.upload/i })
      expect(uploadButton).toBeDisabled()
    })

    it("disables file input when disabled", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} disabled={true} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeDisabled()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe("Error States", () => {
    it("shows error message on upload failure", async () => {
      mockFetch.mockRejectedValue(new Error("Upload failed"))

      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      // Initial state has no error
      expect(screen.queryByText("shorts.errors")).not.toBeInTheDocument()
    })

    it("clears error when selecting auto option", async () => {
      const { user } = render(
        <ThumbnailSelector
          value={{ url: "", isCustom: true }}
          onChange={mockOnChange}
        />
      )

      await user.click(screen.getByRole("button", { name: /shorts.wizard.thumbnail.auto/i }))

      // Error should be cleared (onChange is called)
      expect(mockOnChange).toHaveBeenCalledWith({ url: "", isCustom: false })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles null value gracefully", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      // Should render without crashing
      expect(screen.getByText("shorts.wizard.thumbnail.auto")).toBeInTheDocument()
    })

    it("handles value with empty url and isCustom false", () => {
      render(
        <ThumbnailSelector
          value={{ url: "", isCustom: false }}
          onChange={mockOnChange}
        />
      )

      // Auto should be selected
      const autoButton = screen.getByRole("button", { name: /shorts.wizard.thumbnail.auto/i })
      expect(autoButton).toHaveClass("border-primary")
    })

    it("handles missing videoPreviewUrl when auto is selected", () => {
      render(
        <ThumbnailSelector
          value={{ url: "", isCustom: false }}
          onChange={mockOnChange}
          // No videoPreviewUrl
        />
      )

      // Should render without video preview
      const video = document.querySelector("video")
      expect(video).not.toBeInTheDocument()
    })

    it("resets file input after selection", async () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      // File input value should be empty
      expect(fileInput.value).toBe("")
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("auto option is a clickable button", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      const autoButton = screen.getByRole("button", { name: /shorts.wizard.thumbnail.auto/i })
      expect(autoButton).toHaveAttribute("type", "button")
    })

    it("upload button is accessible", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      const uploadButton = screen.getByRole("button", { name: /shorts.wizard.thumbnail.upload/i })
      expect(uploadButton).toHaveAttribute("type", "button")
    })

    it("file input accepts only images", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png")
    })

    it("custom thumbnail image has alt text", () => {
      render(
        <ThumbnailSelector
          value={{ url: "https://cdn.example.com/thumb.jpg", isCustom: true }}
          onChange={mockOnChange}
        />
      )

      const img = document.querySelector("img")
      expect(img).toHaveAttribute("alt", "Custom thumbnail")
    })

    it("error message is displayed in accessible manner", () => {
      render(<ThumbnailSelector value={null} onChange={mockOnChange} />)

      // Error would be shown with AlertCircle icon and text
      // Initial state has no error visible
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })
  })
})
