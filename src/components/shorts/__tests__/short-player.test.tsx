import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@/test/utils"
import { ShortPlayer } from "../short-player"

// ===========================================================================
// MOCKS
// ===========================================================================

// Mock @vidstack/react components
vi.mock("@vidstack/react", () => ({
  MediaPlayer: vi.fn(({ children, title, autoPlay, muted, onPlay, onEnded, className }) => (
    <div
      data-testid="media-player"
      data-title={title}
      data-autoplay={autoPlay}
      data-muted={muted}
      className={className}
      onClick={onPlay}
      onDoubleClick={onEnded}
    >
      {children}
    </div>
  )),
  MediaProvider: vi.fn(({ children }) => (
    <div data-testid="media-provider">{children}</div>
  )),
  Poster: vi.fn(({ src, alt, className }) => (
    <img data-testid="poster" src={src} alt={alt} className={className} />
  ))
}))

vi.mock("@vidstack/react/player/layouts/default", () => ({
  DefaultVideoLayout: vi.fn(({ thumbnails }) => (
    <div data-testid="video-layout" data-thumbnails={thumbnails}>
      Video Controls
    </div>
  )),
  defaultLayoutIcons: {}
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

const defaultProps = {
  hlsUrl: "https://hls.example.com/master.m3u8",
  title: "Test Short Video"
}

describe("ShortPlayer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders the media player with HLS URL", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toBeInTheDocument()
    })

    it("renders the media provider", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      expect(screen.getByTestId("media-provider")).toBeInTheDocument()
    })

    it("renders the video layout with controls", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      expect(screen.getByTestId("video-layout")).toBeInTheDocument()
      expect(screen.getByText("Video Controls")).toBeInTheDocument()
    })

    it("renders poster when posterUrl is provided", () => {
      // Act
      render(
        <ShortPlayer
          {...defaultProps}
          posterUrl="https://thumb.example.com/poster.jpg"
        />
      )

      // Assert
      const poster = screen.getByTestId("poster")
      expect(poster).toBeInTheDocument()
      expect(poster).toHaveAttribute("src", "https://thumb.example.com/poster.jpg")
      expect(poster).toHaveAttribute("alt", "Test Short Video")
    })

    it("does not render poster when posterUrl is not provided", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      expect(screen.queryByTestId("poster")).not.toBeInTheDocument()
    })

    it("passes title to media player", () => {
      // Act
      render(<ShortPlayer {...defaultProps} title="Custom Title" />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute("data-title", "Custom Title")
    })
  })

  // ===========================================================================
  // PROPS
  // ===========================================================================

  describe("Props", () => {
    it("autoPlay defaults to false", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute("data-autoplay", "false")
    })

    it("sets autoPlay when provided", () => {
      // Act
      render(<ShortPlayer {...defaultProps} autoPlay={true} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute("data-autoplay", "true")
    })

    it("muted defaults to false", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute("data-muted", "false")
    })

    it("sets muted when provided", () => {
      // Act
      render(<ShortPlayer {...defaultProps} muted={true} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute("data-muted", "true")
    })

    it("passes thumbnails to video layout", () => {
      // Act
      render(
        <ShortPlayer
          {...defaultProps}
          posterUrl="https://thumb.example.com/thumb.jpg"
        />
      )

      // Assert
      const layout = screen.getByTestId("video-layout")
      expect(layout).toHaveAttribute(
        "data-thumbnails",
        "https://thumb.example.com/thumb.jpg"
      )
    })
  })

  // ===========================================================================
  // ASPECT RATIOS
  // ===========================================================================

  describe("Aspect Ratios", () => {
    it("defaults to 9:16 aspect ratio (vertical)", () => {
      // Act
      const { container } = render(<ShortPlayer {...defaultProps} />)

      // Assert
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("aspect-[9/16]")
    })

    it("applies 9:16 aspect ratio explicitly", () => {
      // Act
      const { container } = render(
        <ShortPlayer {...defaultProps} aspectRatio="9:16" />
      )

      // Assert
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("aspect-[9/16]")
    })

    it("applies 16:9 aspect ratio for horizontal videos", () => {
      // Act
      const { container } = render(
        <ShortPlayer {...defaultProps} aspectRatio="16:9" />
      )

      // Assert
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("aspect-video")
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("Interactions", () => {
    it("calls onPlay callback when play triggered", async () => {
      // Arrange
      const onPlay = vi.fn()
      const { user } = render(<ShortPlayer {...defaultProps} onPlay={onPlay} />)

      // Act
      const player = screen.getByTestId("media-player")
      await user.click(player)

      // Assert
      expect(onPlay).toHaveBeenCalledTimes(1)
    })

    it("calls onEnded callback when video ends", async () => {
      // Arrange
      const onEnded = vi.fn()
      const { user } = render(<ShortPlayer {...defaultProps} onEnded={onEnded} />)

      // Act
      const player = screen.getByTestId("media-player")
      await user.dblClick(player)

      // Assert
      expect(onEnded).toHaveBeenCalledTimes(1)
    })

    it("does not throw when onPlay is not provided", async () => {
      // Arrange
      const { user } = render(<ShortPlayer {...defaultProps} />)

      // Act & Assert - Should not throw
      const player = screen.getByTestId("media-player")
      await expect(user.click(player)).resolves.not.toThrow()
    })

    it("does not throw when onEnded is not provided", async () => {
      // Arrange
      const { user } = render(<ShortPlayer {...defaultProps} />)

      // Act & Assert - Should not throw
      const player = screen.getByTestId("media-player")
      await expect(user.dblClick(player)).resolves.not.toThrow()
    })
  })

  // ===========================================================================
  // CUSTOM CLASS NAME
  // ===========================================================================

  describe("Custom Class Name", () => {
    it("applies custom className to wrapper", () => {
      // Act
      const { container } = render(
        <ShortPlayer {...defaultProps} className="custom-player-class" />
      )

      // Assert
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("custom-player-class")
    })

    it("preserves default classes when custom className added", () => {
      // Act
      const { container } = render(
        <ShortPlayer {...defaultProps} className="custom-class" />
      )

      // Assert
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("relative")
      expect(wrapper).toHaveClass("w-full")
      expect(wrapper).toHaveClass("custom-class")
    })

    it("handles empty className", () => {
      // Act
      const { container } = render(<ShortPlayer {...defaultProps} className="" />)

      // Assert
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("relative")
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles very long HLS URL", () => {
      // Arrange
      const longUrl = `https://hls.example.com/${"a".repeat(500)}/master.m3u8`

      // Act
      render(<ShortPlayer hlsUrl={longUrl} title="Long URL Test" />)

      // Assert
      expect(screen.getByTestId("media-player")).toBeInTheDocument()
    })

    it("handles special characters in title", () => {
      // Act
      render(
        <ShortPlayer
          hlsUrl="https://hls.example.com/master.m3u8"
          title="Test <script>alert('xss')</script> Video"
        />
      )

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute(
        "data-title",
        "Test <script>alert('xss')</script> Video"
      )
    })

    it("handles unicode in title", () => {
      // Act
      render(
        <ShortPlayer
          hlsUrl="https://hls.example.com/master.m3u8"
          title="Video mit Umlauten: ae oe ue"
        />
      )

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute("data-title", "Video mit Umlauten: ae oe ue")
    })

    it("renders with all props at once", () => {
      // Arrange
      const onPlay = vi.fn()
      const onEnded = vi.fn()

      // Act
      const { container } = render(
        <ShortPlayer
          hlsUrl="https://hls.example.com/master.m3u8"
          posterUrl="https://thumb.example.com/poster.jpg"
          title="Full Props Test"
          autoPlay={true}
          muted={true}
          aspectRatio="16:9"
          onPlay={onPlay}
          onEnded={onEnded}
          className="full-test-class"
        />
      )

      // Assert
      expect(screen.getByTestId("media-player")).toBeInTheDocument()
      expect(screen.getByTestId("poster")).toBeInTheDocument()
      expect(screen.getByTestId("video-layout")).toBeInTheDocument()
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("aspect-video")
      expect(wrapper).toHaveClass("full-test-class")
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("poster has alt text matching title", () => {
      // Act
      render(
        <ShortPlayer
          {...defaultProps}
          posterUrl="https://thumb.example.com/poster.jpg"
        />
      )

      // Assert
      const poster = screen.getByTestId("poster")
      expect(poster).toHaveAttribute("alt", "Test Short Video")
    })

    it("media player has title attribute", () => {
      // Act
      render(<ShortPlayer {...defaultProps} title="Accessible Video Title" />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player).toHaveAttribute("data-title", "Accessible Video Title")
    })

    it("player has rounded corners for visual styling", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player.className).toContain("rounded-lg")
    })
  })

  // ===========================================================================
  // STYLING
  // ===========================================================================

  describe("Styling", () => {
    it("applies overflow hidden to player", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player.className).toContain("overflow-hidden")
    })

    it("player takes full width and height", () => {
      // Act
      render(<ShortPlayer {...defaultProps} />)

      // Assert
      const player = screen.getByTestId("media-player")
      expect(player.className).toContain("h-full")
      expect(player.className).toContain("w-full")
    })

    it("wrapper is positioned relative", () => {
      // Act
      const { container } = render(<ShortPlayer {...defaultProps} />)

      // Assert
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("relative")
    })
  })
})
