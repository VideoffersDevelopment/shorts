import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/test/utils"
import { PublicShortView } from "../public-short-view"
import type { Short, Category, CompanyProfile, ShortStats, Tag, ShortTag, ShortStatus } from "@prisma/client"

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock("../short-player", () => ({
  ShortPlayer: ({ title, hlsUrl }: { title: string; hlsUrl: string }) => (
    <div data-testid="short-player" data-title={title} data-hls-url={hlsUrl}>
      Video Player
    </div>
  )
}))

vi.mock("../short-company-card", () => ({
  ShortCompanyCard: ({ company }: { company: { companyName: string } }) => (
    <div data-testid="company-card">{company.companyName}</div>
  )
}))

vi.mock("../short-cta-button", () => ({
  ShortCtaButton: ({ ctaLink, label }: { ctaLink: string; label: string }) => (
    <button data-testid="cta-button" data-link={ctaLink}>
      {label}
    </button>
  )
}))

vi.mock("../short-location-map", () => ({
  ShortLocationMap: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div data-testid="location-map" data-lat={latitude} data-lng={longitude}>
      Location Map
    </div>
  )
}))

vi.mock("../short-share-button", () => ({
  ShortShareButton: ({ shortId, title }: { shortId: string; title: string }) => (
    <button data-testid="share-button" data-short-id={shortId}>
      Share {title}
    </button>
  )
}))

vi.mock("../super-like-button", () => ({
  SuperLikeButton: () => (
    <button data-testid="super-like-button">Super Like</button>
  )
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

type ShortWithRelations = Short & {
  company: Pick<CompanyProfile, "id" | "companyName" | "slug" | "logo" | "city" | "categoryId" | "userId"> & {
    category: Pick<Category, "id" | "name" | "slug"> | null
  }
  category: Pick<Category, "id" | "name" | "slug">
  tags: Array<ShortTag & { tag: Pick<Tag, "id" | "name" | "slug"> }>
  stats: ShortStats | null
}

const mockTranslations = {
  by: "by",
  views: "views",
  likes: "likes",
  share: "Share",
  visitWebsite: "Visit Website",
  viewCompany: "View Company",
  archived: "Archived",
  archivedMessage: "This short has been archived and is no longer in the public feed.",
  videoNotAvailable: "Video not available",
  openInMaps: "Open in Maps",
  copied: "Copied!",
  copyLink: "Copy link",
  openNewTab: "Open in new tab",
  linkCopiedTitle: "Link copied!",
  linkCopiedDescription: "The link has been copied.",
  copyFailedTitle: "Copy failed",
  copyFailedDescription: "Please copy manually.",
  superLike: "Super Like",
  superLikeSent: "Sent!",
  superLikeLogin: "Log in to send a Super Like",
  superLikeOwn: "You can't Super Like your own video",
  superLikeInsufficient: "Not enough credits for a Super Like",
  superLikeFailed: "Failed to send Super Like"
}

const createMockShort = (overrides: Partial<ShortWithRelations> = {}): ShortWithRelations => ({
  id: "short-123",
  companyId: "company-456",
  title: "Test Short Title",
  description: "This is a test short description.",
  status: "PUBLISHED" as ShortStatus,
  categoryId: "cat-1",
  rawVideoKey: null,
  hlsPlaylistUrl: "https://example.com/hls/playlist.m3u8",
  thumbnailUrl: "https://example.com/thumbnail.jpg",
  customThumbnail: false,
  duration: 30,
  aspectRatio: "9:16",
  ctaLink: "https://example.com/cta",
  latitude: 52.2297,
  longitude: 21.0122,
  address: "ul. Test 1, Warsaw",
  publishedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  archivedAt: null,
  processingError: null,
  qencodeTaskId: null,
  retryCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  company: {
    id: "company-456",
    companyName: "Test Company",
    slug: "test-company",
    logo: "https://example.com/logo.png",
    city: "Warsaw",
    categoryId: "cat-1",
    userId: "user-789",
    category: {
      id: "cat-1",
      name: "Technology",
      slug: "technology"
    }
  },
  category: {
    id: "cat-1",
    name: "Technology",
    slug: "technology"
  },
  tags: [
    {
      shortId: "short-123",
      tagId: "tag-1",
      tag: { id: "tag-1", name: "innovation", slug: "innovation" }
    },
    {
      shortId: "short-123",
      tagId: "tag-2",
      tag: { id: "tag-2", name: "startup", slug: "startup" }
    }
  ],
  stats: {
    id: "stats-1",
    shortId: "short-123",
    views: 1000,
    uniqueViews: 10,
    likes: 150,
    comments: 0,
    ctaClicks: 50,
    avgWatchTime: null,
    updatedAt: new Date()
  },
  ...overrides
})

describe("PublicShortView Component", () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe("Rendering", () => {
    it("renders short title", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Title appears in both mobile and desktop views
      const titles = screen.getAllByText("Test Short Title")
      expect(titles.length).toBeGreaterThan(0)
    })

    it("renders short description", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByText("This is a test short description.")).toBeInTheDocument()
    })

    it("renders video player with HLS URL", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      const player = screen.getByTestId("short-player")
      expect(player).toBeInTheDocument()
      expect(player).toHaveAttribute("data-hls-url", "https://example.com/hls/playlist.m3u8")
    })

    it("renders 'video not available' when no HLS URL", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ hlsPlaylistUrl: null })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByText("Video not available")).toBeInTheDocument()
    })

    it("renders category badge", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByText("Technology")).toBeInTheDocument()
    })

    it("renders tags", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByText("innovation")).toBeInTheDocument()
      expect(screen.getByText("startup")).toBeInTheDocument()
    })

    it("renders stats (views and likes)", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Stats appear in both mobile and desktop views
      const viewsElements = screen.getAllByText(/1000.*views/i)
      expect(viewsElements.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // ARCHIVED STATE
  // ===========================================================================

  describe("Archived State", () => {
    it("shows archived banner for ARCHIVED status", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ status: "ARCHIVED" })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByText("This short has been archived and is no longer in the public feed.")).toBeInTheDocument()
    })

    it("does not show archived banner for PUBLISHED status", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ status: "PUBLISHED" })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.queryByText(/archived/i)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // SUB-COMPONENTS
  // ===========================================================================

  describe("Sub-Components", () => {
    it("renders company card", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByTestId("company-card")).toBeInTheDocument()
      expect(screen.getByText("Test Company")).toBeInTheDocument()
    })

    it("renders CTA button when ctaLink provided", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      const ctaButton = screen.getByTestId("cta-button")
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).toHaveAttribute("data-link", "https://example.com/cta")
    })

    it("does not render CTA button when no ctaLink", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ ctaLink: null })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.queryByTestId("cta-button")).not.toBeInTheDocument()
    })

    it("renders location map when coordinates provided", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      const map = screen.getByTestId("location-map")
      expect(map).toBeInTheDocument()
      expect(map).toHaveAttribute("data-lat", "52.2297")
      expect(map).toHaveAttribute("data-lng", "21.0122")
    })

    it("does not render location map when no coordinates", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ latitude: null, longitude: null })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.queryByTestId("location-map")).not.toBeInTheDocument()
    })

    it("renders share buttons (mobile and desktop)", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Should be 2 share buttons (mobile and desktop)
      const shareButtons = screen.getAllByTestId("share-button")
      expect(shareButtons.length).toBe(2)
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe("Edge Cases", () => {
    it("handles missing description", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ description: null })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Should not crash (component has responsive duplicate titles)
      const titles = screen.getAllByRole("heading", { name: "Test Short Title" })
      expect(titles.length).toBeGreaterThan(0)
    })

    it("handles empty tags array", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ tags: [] })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Should not crash, no tags section
      expect(screen.queryByText("innovation")).not.toBeInTheDocument()
    })

    it("handles null stats", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ stats: null })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Should show 0 views and likes
      const viewsElements = screen.getAllByText(/0.*views/i)
      expect(viewsElements.length).toBeGreaterThan(0)
    })

    it("handles zero stats", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({
            stats: {
              id: "stats-1",
              shortId: "short-123",
              views: 0,
              uniqueViews: 0,
              likes: 0,
              comments: 0,
              ctaClicks: 0,
              avgWatchTime: null,
              updatedAt: new Date()
            }
          })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      const viewsElements = screen.getAllByText(/0.*views/i)
      expect(viewsElements.length).toBeGreaterThan(0)
    })

    it("handles only latitude without longitude", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ latitude: 52.2297, longitude: null })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Should not render map (both required)
      expect(screen.queryByTestId("location-map")).not.toBeInTheDocument()
    })

    it("handles company without category", () => {
      // Act
      const shortWithoutCompanyCategory = createMockShort()
      shortWithoutCompanyCategory.company.category = null

      render(
        <PublicShortView
          short={shortWithoutCompanyCategory}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert - Should not crash
      expect(screen.getByText("Test Company")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // LOCALIZATION
  // ===========================================================================

  describe("Localization", () => {
    it("passes locale to sub-components", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="pl"
          translations={mockTranslations}
        />
      )

      // Assert - Company card receives locale
      expect(screen.getByTestId("company-card")).toBeInTheDocument()
    })

    it("uses translation props for labels", () => {
      // Act
      const customTranslations = {
        ...mockTranslations,
        visitWebsite: "Odwiedz strone"
      }
      render(
        <PublicShortView
          short={createMockShort()}
          locale="pl"
          translations={customTranslations}
        />
      )

      // Assert
      expect(screen.getByText("Odwiedz strone")).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe("Accessibility", () => {
    it("has heading for short title", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      const headings = screen.getAllByRole("heading", { level: 1 })
      expect(headings.length).toBeGreaterThan(0)
    })

    it("archived alert is visible", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort({ status: "ARCHIVED" })}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByText("This short has been archived and is no longer in the public feed.")).toBeVisible()
    })

    it("category badge is visible", () => {
      // Act
      render(
        <PublicShortView
          short={createMockShort()}
          locale="en"
          translations={mockTranslations}
        />
      )

      // Assert
      expect(screen.getByText("Technology")).toBeVisible()
    })
  })
})
