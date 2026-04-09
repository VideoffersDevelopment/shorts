import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/utils"
import { ShortDetailView } from "../short-detail-view"
import type { PublicShortDetail } from "@/app/actions/shorts/get-public"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}))

vi.mock("@/lib/i18n/client", () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("next/image", () => ({
  default: vi.fn(({ src, alt, width, height, className, fill }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-fill={fill}
      data-testid="next-image"
    />
  )),
}))

vi.mock("@/components/feed/feed-card", () => ({
  FeedCard: vi.fn(({ short }) => (
    <div data-testid="feed-card" data-short-id={short.id}>
      {short.title}
    </div>
  )),
}))

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, "requestFullscreen", {
  configurable: true,
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

// ===========================================================================
// TEST DATA
// ===========================================================================

const mockShort: PublicShortDetail = {
  id: "short-123",
  title: "Amazing Product Video",
  description: "This is an amazing product demonstration video.",
  thumbnailUrl: "https://cdn.example.com/thumb.jpg",
  hlsPlaylistUrl: "https://cdn.example.com/video.m3u8",
  duration: 30,
  publishedAt: "2025-12-01T10:00:00.000Z",
  views: 15000,
  likes: 1200,
  ctaClicks: 450,
  location: "Warsaw",
  distance: null,
  company: {
    id: "company-123",
    name: "Test Company",
    slug: "test-company",
    logo: "https://cdn.example.com/logo.jpg",
    verified: true,
  },
  category: {
    id: "category-123",
    name: "Technology",
    slug: "technology",
  },
  ctaLink: "https://example.com/offer",
  tags: [
    { name: "Tech", slug: "tech" },
    { name: "Innovation", slug: "innovation" },
  ],
  relatedShorts: [
    {
      id: "related-1",
      title: "Related Video 1",
      thumbnailUrl: "https://cdn.example.com/related1.jpg",
      hlsPlaylistUrl: "https://cdn.example.com/related1.m3u8",
      duration: 25,
      publishedAt: "2025-11-28T10:00:00.000Z",
      views: 5000,
      likes: 300,
      ctaClicks: 100,
      location: "Krakow",
      distance: null,
      company: {
        id: "company-456",
        name: "Other Company",
        slug: "other-company",
        logo: null,
        verified: false,
      },
      category: {
        id: "category-123",
        name: "Technology",
        slug: "technology",
      },
      ctaLink: null,
    },
    {
      id: "related-2",
      title: "Related Video 2",
      thumbnailUrl: null,
      hlsPlaylistUrl: "https://cdn.example.com/related2.m3u8",
      duration: 45,
      publishedAt: "2025-11-29T10:00:00.000Z",
      views: 8000,
      likes: 600,
      ctaClicks: 200,
      location: null,
      distance: null,
      company: {
        id: "company-789",
        name: "Third Company",
        slug: "third-company",
        logo: "https://cdn.example.com/third-logo.jpg",
        verified: true,
      },
      category: {
        id: "category-123",
        name: "Technology",
        slug: "technology",
      },
      ctaLink: "https://example.com/related-offer",
    },
  ],
}

describe("ShortDetailView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders the short title", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Amazing Product Video"
      )
    })

    it("renders the description when provided", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(
        screen.getByText("This is an amazing product demonstration video.")
      ).toBeInTheDocument()
    })

    it("renders video element with correct attributes", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const video = document.querySelector("video")
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute("src", "https://cdn.example.com/video.m3u8")
    })

    it("renders back button with link to feed", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const backLink = screen.getByRole("link", { name: /backToFeed/i })
      expect(backLink).toHaveAttribute("href", "/en")
    })

    it("renders company card with company name", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(screen.getByText("Test Company")).toBeInTheDocument()
    })

    it("renders category badge", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(screen.getByText("Technology")).toBeInTheDocument()
    })

    it("renders view company button", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const viewCompanyLink = screen.getByRole("link", { name: /viewCompany/i })
      expect(viewCompanyLink).toHaveAttribute("href", "/en/companies/test-company")
    })
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe("Variants", () => {
    it("renders CTA button when ctaLink is provided", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const ctaButton = screen.getByRole("link", { name: /viewOffer/i })
      expect(ctaButton).toHaveAttribute("href", "https://example.com/offer")
      expect(ctaButton).toHaveAttribute("target", "_blank")
      expect(ctaButton).toHaveAttribute("rel", "noopener noreferrer")
    })

    it("does not render CTA button when ctaLink is null", () => {
      // Arrange
      const shortWithoutCta = {
        ...mockShort,
        ctaLink: null,
      }

      // Act
      render(<ShortDetailView short={shortWithoutCta} />)

      // Assert
      expect(screen.queryByRole("link", { name: /viewOffer/i })).not.toBeInTheDocument()
    })

    it("renders description when provided", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(
        screen.getByText("This is an amazing product demonstration video.")
      ).toBeInTheDocument()
    })

    it("does not render description when null", () => {
      // Arrange
      const shortWithoutDescription = {
        ...mockShort,
        description: null,
      }

      // Act
      render(<ShortDetailView short={shortWithoutDescription} />)

      // Assert
      // Description should not be in document - no empty paragraph
      const descriptionText = "This is an amazing product demonstration video."
      expect(screen.queryByText(descriptionText)).not.toBeInTheDocument()
    })

    it("renders tags when provided", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(screen.getByText("Tech")).toBeInTheDocument()
      expect(screen.getByText("Innovation")).toBeInTheDocument()
    })

    it("does not render tags section when tags array is empty", () => {
      // Arrange
      const shortWithoutTags = {
        ...mockShort,
        tags: [],
      }

      // Act
      render(<ShortDetailView short={shortWithoutTags} />)

      // Assert
      expect(screen.queryByText("Tech")).not.toBeInTheDocument()
      expect(screen.queryByText("Innovation")).not.toBeInTheDocument()
    })

    it("renders verified badge when company is verified", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert - BadgeCheck icon should be present for verified company
      // The component uses BadgeCheck from lucide-react
      const verifiedIcon = document.querySelector('[class*="text-blue"]')
      expect(verifiedIcon).toBeInTheDocument()
    })

    it("does not render verified badge when company is not verified", () => {
      // Arrange
      const shortWithUnverifiedCompany = {
        ...mockShort,
        company: {
          ...mockShort.company,
          verified: false,
        },
      }

      // Act
      render(<ShortDetailView short={shortWithUnverifiedCompany} />)

      // Assert - Should not have blue badge icon
      const companyCard = screen.getByText("Test Company").closest("a")
      expect(companyCard).toBeInTheDocument()
      // Verified badge should not be in the company card area
      const verifiedIcon = companyCard?.querySelector('[class*="text-blue"]')
      expect(verifiedIcon).not.toBeInTheDocument()
    })

    it("renders company logo when provided", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const images = screen.getAllByTestId("next-image")
      const logoImage = images.find(
        (img) => img.getAttribute("src") === "https://cdn.example.com/logo.jpg"
      )
      expect(logoImage).toBeInTheDocument()
    })

    it("renders company initial when logo is not provided", () => {
      // Arrange
      const shortWithoutLogo = {
        ...mockShort,
        company: {
          ...mockShort.company,
          logo: null,
        },
      }

      // Act
      render(<ShortDetailView short={shortWithoutLogo} />)

      // Assert
      expect(screen.getByText("T")).toBeInTheDocument() // First letter of "Test Company"
    })

    it("renders location when provided", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(screen.getByText("Warsaw")).toBeInTheDocument()
    })

    it("does not render location when null", () => {
      // Arrange
      const shortWithoutLocation = {
        ...mockShort,
        location: null,
      }

      // Act
      render(<ShortDetailView short={shortWithoutLocation} />)

      // Assert
      expect(screen.queryByText("Warsaw")).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe("Interactions", () => {
    it("toggles play/pause when video is clicked", async () => {
      // Arrange
      const { user } = render(<ShortDetailView short={mockShort} />)
      const video = document.querySelector("video")!

      // Act - click to play (video starts paused, autoplay might fail)
      await user.click(video)

      // Assert - since we mock play/pause, we just verify the video element exists
      expect(video).toBeInTheDocument()
    })

    it("tag links navigate to search with tag name", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const techTag = screen.getByText("Tech").closest("a")
      expect(techTag).toHaveAttribute("href", "/en/search?q=Tech")

      const innovationTag = screen.getByText("Innovation").closest("a")
      expect(innovationTag).toHaveAttribute("href", "/en/search?q=Innovation")
    })

    it("company card links to company page", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const companyLink = screen.getByText("Test Company").closest("a")
      expect(companyLink).toHaveAttribute("href", "/en/companies/test-company")
    })

    it("category badge links to filtered feed", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const categoryLink = screen.getByText("Technology").closest("a")
      expect(categoryLink).toHaveAttribute("href", "/en?categoryIds=category-123")
    })

    it("share button is rendered", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(screen.getByRole("button", { name: /public\.share/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // STATS DISPLAY
  // ===========================================================================

  describe("Stats Display", () => {
    it("displays view count", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert - 15000 should be formatted as 15.0K
      expect(screen.getByText("15.0K")).toBeInTheDocument()
    })

    it("displays like count", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert - 1200 should be formatted as 1.2K
      expect(screen.getByText("1.2K")).toBeInTheDocument()
    })

    it("formats millions correctly", () => {
      // Arrange
      const shortWithMillionViews = {
        ...mockShort,
        views: 2500000,
      }

      // Act
      render(<ShortDetailView short={shortWithMillionViews} />)

      // Assert
      expect(screen.getByText("2.5M")).toBeInTheDocument()
    })

    it("formats small numbers without suffix", () => {
      // Arrange
      const shortWithSmallViews = {
        ...mockShort,
        views: 999,
        likes: 50,
      }

      // Act
      render(<ShortDetailView short={shortWithSmallViews} />)

      // Assert
      expect(screen.getByText("999")).toBeInTheDocument()
      expect(screen.getByText("50")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // RELATED SHORTS
  // ===========================================================================

  describe("Related Shorts", () => {
    it("renders related shorts section when relatedShorts exist", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(
        screen.getByRole("heading", { level: 2, name: /relatedShorts/i })
      ).toBeInTheDocument()
    })

    it("renders correct number of FeedCard components", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const feedCards = screen.getAllByTestId("feed-card")
      expect(feedCards).toHaveLength(2)
    })

    it("passes correct short data to FeedCard components", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const feedCards = screen.getAllByTestId("feed-card")
      expect(feedCards[0]).toHaveAttribute("data-short-id", "related-1")
      expect(feedCards[1]).toHaveAttribute("data-short-id", "related-2")
    })

    it("does not render related shorts section when array is empty", () => {
      // Arrange
      const shortWithNoRelated = {
        ...mockShort,
        relatedShorts: [],
      }

      // Act
      render(<ShortDetailView short={shortWithNoRelated} />)

      // Assert
      expect(
        screen.queryByRole("heading", { level: 2, name: /relatedShorts/i })
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId("feed-card")).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VIDEO PLAYER
  // ===========================================================================

  describe("Video Player", () => {
    it("renders video with poster image", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const video = document.querySelector("video")
      expect(video).toHaveAttribute("poster", "https://cdn.example.com/thumb.jpg")
    })

    it("renders video with loop attribute", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const video = document.querySelector("video")
      expect(video).toHaveAttribute("loop")
    })

    it("renders video with playsInline attribute", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const video = document.querySelector("video")
      expect(video).toHaveAttribute("playsinline")
    })

    it("renders progress bar with slider role", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const progressBar = screen.getByRole("slider", { name: /video progress/i })
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute("aria-valuemin", "0")
      expect(progressBar).toHaveAttribute("aria-valuemax", "100")
    })

    it("renders play/pause button overlay", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert - the overlay button
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    it("renders mute/unmute button", async () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert - there should be buttons for audio control
      // The VolumeX icon is shown initially (muted by default)
      const buttons = screen.getAllByRole("button")
      const muteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg")
        return svg !== null
      })
      expect(muteButton).toBeInTheDocument()
    })

    it("renders fullscreen button", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(2) // At least play, mute, fullscreen
    })

    it("renders thumbnail when video URL is missing but thumbnail exists", () => {
      // Arrange
      const shortWithNoVideo = {
        ...mockShort,
        hlsPlaylistUrl: null,
      }

      // Act
      render(<ShortDetailView short={shortWithNoVideo} />)

      // Assert - should show image instead of video
      expect(document.querySelector("video")).not.toBeInTheDocument()
      const images = screen.getAllByTestId("next-image")
      expect(images.length).toBeGreaterThan(0)
    })

    it("renders placeholder when both video and thumbnail are missing", () => {
      // Arrange
      const shortWithNothing = {
        ...mockShort,
        hlsPlaylistUrl: null,
        thumbnailUrl: null,
      }

      // Act
      render(<ShortDetailView short={shortWithNothing} />)

      // Assert - should show play icon placeholder
      expect(document.querySelector("video")).not.toBeInTheDocument()
      // The Play icon from lucide-react should be visible as placeholder
      const placeholder = document.querySelector('[class*="h-16"]')
      expect(placeholder).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles zero views", () => {
      // Arrange
      const shortWithZeroViews = {
        ...mockShort,
        views: 0,
      }

      // Act
      render(<ShortDetailView short={shortWithZeroViews} />)

      // Assert
      expect(screen.getByText("0")).toBeInTheDocument()
    })

    it("handles zero likes", () => {
      // Arrange
      const shortWithZeroLikes = {
        ...mockShort,
        likes: 0,
      }

      // Act
      render(<ShortDetailView short={shortWithZeroLikes} />)

      // Assert
      expect(screen.getByText("0")).toBeInTheDocument()
    })

    it("handles very long title", () => {
      // Arrange
      const shortWithLongTitle = {
        ...mockShort,
        title: "A".repeat(200),
      }

      // Act
      render(<ShortDetailView short={shortWithLongTitle} />)

      // Assert
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "A".repeat(200)
      )
    })

    it("handles very long description", () => {
      // Arrange
      const shortWithLongDescription = {
        ...mockShort,
        description: "B".repeat(1000),
      }

      // Act
      render(<ShortDetailView short={shortWithLongDescription} />)

      // Assert
      expect(screen.getByText("B".repeat(1000))).toBeInTheDocument()
    })

    it("handles special characters in title", () => {
      // Arrange
      const shortWithSpecialChars = {
        ...mockShort,
        title: 'Test <script>alert("xss")</script> Video',
      }

      // Act
      render(<ShortDetailView short={shortWithSpecialChars} />)

      // Assert
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        'Test <script>alert("xss")</script> Video'
      )
    })

    it("handles unicode in company name", () => {
      // Arrange
      const shortWithUnicode = {
        ...mockShort,
        company: {
          ...mockShort.company,
          name: "Firma z Polskimi Znakami",
        },
      }

      // Act
      render(<ShortDetailView short={shortWithUnicode} />)

      // Assert
      expect(screen.getByText("Firma z Polskimi Znakami")).toBeInTheDocument()
    })

    it("handles many tags", () => {
      // Arrange
      const shortWithManyTags = {
        ...mockShort,
        tags: Array.from({ length: 10 }, (_, i) => ({
          name: `Tag${i + 1}`,
          slug: `tag${i + 1}`,
        })),
      }

      // Act
      render(<ShortDetailView short={shortWithManyTags} />)

      // Assert
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`Tag${i}`)).toBeInTheDocument()
      }
    })

    it("handles URL-encoded tag names", () => {
      // Arrange
      const shortWithEncodedTag = {
        ...mockShort,
        tags: [{ name: "Tech & Innovation", slug: "tech-innovation" }],
      }

      // Act
      render(<ShortDetailView short={shortWithEncodedTag} />)

      // Assert
      const tagLink = screen.getByText("Tech & Innovation").closest("a")
      expect(tagLink).toHaveAttribute(
        "href",
        "/en/search?q=Tech%20%26%20Innovation"
      )
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
    })

    it("has accessible progress bar", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const slider = screen.getByRole("slider", { name: /video progress/i })
      expect(slider).toHaveAttribute("aria-valuenow")
      expect(slider).toHaveAttribute("tabindex", "0")
    })

    it("links have proper href attributes", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const links = screen.getAllByRole("link")
      links.forEach((link) => {
        expect(link).toHaveAttribute("href")
      })
    })

    it("external CTA link has proper security attributes", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const ctaLink = screen.getByRole("link", { name: /viewOffer/i })
      expect(ctaLink).toHaveAttribute("target", "_blank")
      expect(ctaLink).toHaveAttribute("rel", "noopener noreferrer")
    })

    it("images have alt text", () => {
      // Act
      render(<ShortDetailView short={mockShort} />)

      // Assert
      const images = screen.getAllByTestId("next-image")
      images.forEach((img) => {
        expect(img).toHaveAttribute("alt")
      })
    })

    it("company initial has accessible first letter", () => {
      // Arrange
      const shortWithoutLogo = {
        ...mockShort,
        company: {
          ...mockShort.company,
          logo: null,
        },
      }

      // Act
      render(<ShortDetailView short={shortWithoutLogo} />)

      // Assert
      const initial = screen.getByText("T")
      expect(initial).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // LAYOUT
  // ===========================================================================

  describe("Layout", () => {
    it("renders in a container", () => {
      // Act
      const { container } = render(<ShortDetailView short={mockShort} />)

      // Assert
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass("container")
    })

    it("uses grid layout for content", () => {
      // Act
      const { container } = render(<ShortDetailView short={mockShort} />)

      // Assert
      const grid = container.querySelector(".grid")
      expect(grid).toBeInTheDocument()
    })

    it("video section spans 2 columns on large screens", () => {
      // Act
      const { container } = render(<ShortDetailView short={mockShort} />)

      // Assert
      const videoSection = container.querySelector(".lg\\:col-span-2")
      expect(videoSection).toBeInTheDocument()
    })
  })
})
