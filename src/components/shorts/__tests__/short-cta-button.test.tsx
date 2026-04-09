import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@/test/utils"
import { ShortCtaButton } from "../short-cta-button"

// ===========================================================================
// MOCKS
// ===========================================================================

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, "open", {
  value: mockWindowOpen,
  writable: true
})

// Mock fetch for tracking API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("ShortCtaButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for expected errors
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockFetch.mockResolvedValue({ ok: true })
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders button with default label", () => {
      // Act
      render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Assert
      expect(screen.getByRole("button", { name: /visit website/i })).toBeInTheDocument()
    })

    it("renders button with custom label", () => {
      // Act
      render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
          label="Shop Now"
        />
      )

      // Assert
      expect(screen.getByRole("button", { name: /shop now/i })).toBeInTheDocument()
    })

    it("renders with external link icon", () => {
      // Act
      const { container } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Assert - Check for SVG icon (ExternalLink)
      const icon = container.querySelector("svg")
      expect(icon).toBeInTheDocument()
    })

    it("applies cta-button class", () => {
      // Act
      render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Assert
      const button = screen.getByRole("button")
      expect(button).toHaveClass("cta-button")
    })

    it("applies w-full class for full width", () => {
      // Act
      render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Assert
      const button = screen.getByRole("button")
      expect(button).toHaveClass("w-full")
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("User Interactions", () => {
    it("opens link in new tab when clicked", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("https://example.com"),
        "_blank",
        "noopener,noreferrer"
      )
    })

    it("adds UTM parameters to link", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      const openedUrl = mockWindowOpen.mock.calls[0][0]
      expect(openedUrl).toContain("utm_source=videoshorts")
      expect(openedUrl).toContain("utm_medium=short")
      expect(openedUrl).toContain("utm_campaign=short-123")
    })

    it("tracks CTA click via API", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/shorts/short-123/track",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "cta_click" })
        })
      )
    })

    it("opens link even if tracking fails", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Network error"))
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert - Link should still open
      expect(mockWindowOpen).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // URL VALIDATION
  // ===========================================================================

  describe("URL Validation", () => {
    it("validates https URLs", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://secure.example.com"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it("validates http URLs", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="http://example.com"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it("rejects javascript: URLs", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="javascript:alert(1)"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert - Should not open
      expect(mockWindowOpen).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })

    it("rejects data: URLs", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="data:text/html,<script>alert(1)</script>"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert - Should not open
      expect(mockWindowOpen).not.toHaveBeenCalled()
    })

    it("handles invalid URLs gracefully", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="not-a-valid-url"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(
        "Invalid CTA link:",
        "not-a-valid-url"
      )
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles URL with existing query parameters", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com?ref=social"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      const openedUrl = mockWindowOpen.mock.calls[0][0]
      expect(openedUrl).toContain("ref=social")
      expect(openedUrl).toContain("utm_source=videoshorts")
    })

    it("handles URL with fragment", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com/page#section"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it("handles URL with port", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com:8080/path"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      const openedUrl = mockWindowOpen.mock.calls[0][0]
      expect(openedUrl).toContain(":8080")
    })

    it("handles long shortId in UTM campaign", async () => {
      // Arrange
      const longShortId = "clxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      const { user } = render(
        <ShortCtaButton
          shortId={longShortId}
          ctaLink="https://example.com"
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      const openedUrl = mockWindowOpen.mock.calls[0][0]
      expect(openedUrl).toContain(`utm_campaign=${longShortId}`)
    })

    it("handles empty label prop", () => {
      // Act
      render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
          label=""
        />
      )

      // Assert - Button should still be present
      expect(screen.getByRole("button")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("button is focusable", () => {
      // Act
      render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Assert
      const button = screen.getByRole("button")
      button.focus()
      expect(button).toHaveFocus()
    })

    it("button has visible label text", () => {
      // Act
      render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
          label="Learn More"
        />
      )

      // Assert
      expect(screen.getByRole("button", { name: /learn more/i })).toBeVisible()
    })

    it("button is clickable via keyboard", async () => {
      // Arrange
      const { user } = render(
        <ShortCtaButton
          shortId="short-123"
          ctaLink="https://example.com"
        />
      )

      // Act
      const button = screen.getByRole("button")
      button.focus()
      await user.keyboard("{Enter}")

      // Assert
      expect(mockWindowOpen).toHaveBeenCalled()
    })
  })
})
