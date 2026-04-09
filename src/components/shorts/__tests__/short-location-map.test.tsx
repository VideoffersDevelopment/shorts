import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@/test/utils"
import { ShortLocationMap } from "../short-location-map"

// ===========================================================================
// MOCKS
// ===========================================================================

// Mock window.open
const mockWindowOpen = vi.fn()
Object.defineProperty(window, "open", {
  value: mockWindowOpen,
  writable: true
})

describe("ShortLocationMap Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders map iframe with correct src", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      const iframe = screen.getByTitle("Location Map")
      expect(iframe).toBeInTheDocument()
      expect(iframe.getAttribute("src")).toContain("openstreetmap.org")
    })

    it("renders map with marker at correct coordinates", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      const iframe = screen.getByTitle("Location Map")
      const src = iframe.getAttribute("src") || ""
      expect(src).toContain("marker=52.2297%2C21.0122")
    })

    it("renders button with default label", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      expect(screen.getByRole("button", { name: /open in google maps/i })).toBeInTheDocument()
    })

    it("renders button with custom label", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
          openInMapsLabel="Nawiguj"
        />
      )

      // Assert
      expect(screen.getByRole("button", { name: /nawiguj/i })).toBeInTheDocument()
    })

    it("renders address when provided", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
          address="ul. Marszalkowska 1, Warszawa"
        />
      )

      // Assert
      expect(screen.getByText("ul. Marszalkowska 1, Warszawa")).toBeInTheDocument()
    })

    it("does not render address when not provided", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert - Should not have address section with MapPin icon outside button
      const button = screen.getByRole("button")
      expect(button.textContent).not.toContain("ul.")
    })

    it("applies location-map class to card", () => {
      // Act
      const { container } = render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      expect(container.querySelector(".location-map")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("User Interactions", () => {
    it("opens Google Maps when button clicked", async () => {
      // Arrange
      const { user } = render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://www.google.com/maps/search/?api=1&query=52.2297,21.0122",
        "_blank",
        "noopener,noreferrer"
      )
    })

    it("passes correct coordinates to Google Maps URL", async () => {
      // Arrange
      const { user } = render(
        <ShortLocationMap
          latitude={40.7128}
          longitude={-74.006}
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      const url = mockWindowOpen.mock.calls[0][0]
      expect(url).toContain("40.7128,-74.006")
    })
  })

  // ===========================================================================
  // MAP IFRAME
  // ===========================================================================

  describe("Map Iframe", () => {
    it("iframe has lazy loading", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      const iframe = screen.getByTitle("Location Map")
      expect(iframe.getAttribute("loading")).toBe("lazy")
    })

    it("iframe has no border", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      const iframe = screen.getByTitle("Location Map")
      expect(iframe).toHaveClass("border-0")
    })

    it("iframe fullscreen is disabled", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      const iframe = screen.getByTitle("Location Map")
      // allowFullScreen={false} should not add the attribute
      expect(iframe).not.toHaveAttribute("allowfullscreen")
    })

    it("calculates correct bbox for map", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={50.0}
          longitude={20.0}
        />
      )

      // Assert
      const iframe = screen.getByTitle("Location Map")
      const src = iframe.getAttribute("src") || ""
      // bbox should be longitude-0.01, latitude-0.01, longitude+0.01, latitude+0.01
      expect(src).toContain("bbox=19.99") // 20 - 0.01
      expect(src).toContain("49.99") // 50 - 0.01
      expect(src).toContain("20.01") // 20 + 0.01
      expect(src).toContain("50.01") // 50 + 0.01
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles negative latitude", async () => {
      // Arrange - Sydney, Australia
      const { user } = render(
        <ShortLocationMap
          latitude={-33.8688}
          longitude={151.2093}
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://www.google.com/maps/search/?api=1&query=-33.8688,151.2093",
        "_blank",
        "noopener,noreferrer"
      )
    })

    it("handles negative longitude", async () => {
      // Arrange - New York
      const { user } = render(
        <ShortLocationMap
          latitude={40.7128}
          longitude={-74.006}
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      const url = mockWindowOpen.mock.calls[0][0]
      expect(url).toContain("-74.006")
    })

    it("handles zero coordinates", async () => {
      // Arrange - Gulf of Guinea
      const { user } = render(
        <ShortLocationMap
          latitude={0}
          longitude={0}
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://www.google.com/maps/search/?api=1&query=0,0",
        "_blank",
        "noopener,noreferrer"
      )
    })

    it("handles long address", () => {
      // Act
      const longAddress = "Very Long Street Name 123/456, Building A, Floor 7, Room 890, Some District, Warsaw, Poland, 00-001"
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
          address={longAddress}
        />
      )

      // Assert
      expect(screen.getByText(longAddress)).toBeInTheDocument()
    })

    it("handles empty address string", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
          address=""
        />
      )

      // Assert - Empty string is falsy, so address section should not render
      const button = screen.getByRole("button")
      // Button should still exist
      expect(button).toBeInTheDocument()
    })

    it("handles decimal precision in coordinates", async () => {
      // Arrange
      const { user } = render(
        <ShortLocationMap
          latitude={52.22970123456789}
          longitude={21.01220123456789}
        />
      )

      // Act
      await user.click(screen.getByRole("button"))

      // Assert
      const url = mockWindowOpen.mock.calls[0][0]
      expect(url).toContain("52.22970123456789,21.01220123456789")
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("iframe has accessible title", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      expect(screen.getByTitle("Location Map")).toBeInTheDocument()
    })

    it("button has visible label", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      const button = screen.getByRole("button")
      expect(button).toBeVisible()
      expect(button.textContent).toContain("Open in Google Maps")
    })

    it("button is focusable", () => {
      // Act
      render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Assert
      const button = screen.getByRole("button")
      button.focus()
      expect(button).toHaveFocus()
    })

    it("button is keyboard accessible", async () => {
      // Arrange
      const { user } = render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
        />
      )

      // Act
      const button = screen.getByRole("button")
      button.focus()
      await user.keyboard("{Enter}")

      // Assert
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it("address has MapPin icon for visual context", () => {
      // Act
      const { container } = render(
        <ShortLocationMap
          latitude={52.2297}
          longitude={21.0122}
          address="Test Address"
        />
      )

      // Assert - Should have SVG icon for MapPin
      const addressSection = container.querySelector(".flex.items-start.gap-2")
      expect(addressSection).toBeInTheDocument()
      expect(addressSection?.querySelector("svg")).toBeInTheDocument()
    })
  })
})
