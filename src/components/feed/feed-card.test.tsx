import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { FeedCard } from './feed-card'
import type { FeedShort } from '@/lib/types/feed'

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => `feed.${key}`,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onError,
    ...props
  }: {
    src: string
    alt: string
    onError?: () => void
    fill?: boolean
    className?: string
    sizes?: string
    width?: number
    height?: number
  }) => (
    <img
      src={src}
      alt={alt}
      onError={onError}
      data-fill={props.fill}
      className={props.className}
      {...(props.width && { width: props.width })}
      {...(props.height && { height: props.height })}
    />
  ),
}))

// Mock FeedVideoPreview
vi.mock('./feed-video-preview', () => ({
  FeedVideoPreview: ({ src, onError }: { src: string; onError?: () => void }) => (
    <video data-testid="video-preview" src={src} data-onerror={onError ? 'true' : 'false'} />
  ),
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

function createMockShort(overrides: Partial<FeedShort> = {}): FeedShort {
  return {
    id: 'short-1',
    title: 'Test Short Title',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    hlsPlaylistUrl: 'https://example.com/video.m3u8',
    duration: 30,
    publishedAt: '2025-01-01T00:00:00Z',
    views: 1500,
    likes: 100,
    ctaClicks: 50,
    location: 'New York, NY',
    distance: 5.2,
    company: {
      id: 'company-1',
      name: 'Test Company',
      slug: 'test-company',
      logo: 'https://example.com/logo.jpg',
      verified: true,
    },
    category: {
      id: 'category-1',
      name: 'Technology',
      slug: 'technology',
    },
    ctaLink: 'https://example.com/cta',
    ...overrides,
  }
}

describe('FeedCard', () => {
  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders as a link with correct href', () => {
      const short = createMockShort()
      render(<FeedCard short={short} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/en/shorts/short-1')
    })

    it('renders title', () => {
      const short = createMockShort({ title: 'My Amazing Video' })
      render(<FeedCard short={short} />)

      expect(screen.getByText('My Amazing Video')).toBeInTheDocument()
    })

    it('renders thumbnail image', () => {
      const short = createMockShort()
      render(<FeedCard short={short} />)

      const image = screen.getByAltText('Test Short Title')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
    })

    it('renders company name', () => {
      const short = createMockShort()
      render(<FeedCard short={short} />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    it('renders company logo', () => {
      const short = createMockShort()
      render(<FeedCard short={short} />)

      const companyLogo = screen.getByAltText('Test Company')
      expect(companyLogo).toBeInTheDocument()
    })

    it('renders location when provided', () => {
      const short = createMockShort({ location: 'San Francisco, CA' })
      render(<FeedCard short={short} />)

      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    })

    it('does not render location when null', () => {
      const short = createMockShort({ location: null })
      render(<FeedCard short={short} />)

      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VIEWS AND LIKES
  // ===========================================================================

  describe('Views and Likes', () => {
    it('renders view count', () => {
      const short = createMockShort({ views: 500 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('500')).toBeInTheDocument()
    })

    it('formats views in thousands (K)', () => {
      const short = createMockShort({ views: 1500 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('1.5K')).toBeInTheDocument()
    })

    it('formats views in millions (M)', () => {
      const short = createMockShort({ views: 1500000 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('1.5M')).toBeInTheDocument()
    })

    it('renders likes count when greater than 0', () => {
      const short = createMockShort({ likes: 250 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('250')).toBeInTheDocument()
    })

    it('does not render likes badge when likes is 0', () => {
      const short = createMockShort({ likes: 0, views: 100 })
      const { container } = render(<FeedCard short={short} />)

      // Should show views badge (100), but not likes badge
      expect(screen.getByText('100')).toBeInTheDocument()

      // Look for Heart icon's parent badge - should not exist when likes = 0
      // The likes badge would have a Heart icon sibling
      const heartIcons = container.querySelectorAll('.lucide-heart')
      expect(heartIcons).toHaveLength(0)
    })

    it('formats likes in thousands', () => {
      const short = createMockShort({ likes: 2500 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('2.5K')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // DISTANCE
  // ===========================================================================

  describe('Distance Badge', () => {
    it('renders distance in km when >= 1km', () => {
      const short = createMockShort({ distance: 5.2 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('5.2km')).toBeInTheDocument()
    })

    it('renders distance in meters when < 1km', () => {
      const short = createMockShort({ distance: 0.5 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('500m')).toBeInTheDocument()
    })

    it('does not render distance when null', () => {
      const short = createMockShort({ distance: null })
      render(<FeedCard short={short} />)

      expect(screen.queryByText(/km$/)).not.toBeInTheDocument()
      expect(screen.queryByText(/m$/)).not.toBeInTheDocument()
    })

    it('rounds meters correctly', () => {
      const short = createMockShort({ distance: 0.123 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('123m')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // CTA BADGE
  // ===========================================================================

  describe('CTA Badge', () => {
    it('renders CTA badge when ctaLink is present', () => {
      const short = createMockShort({ ctaLink: 'https://example.com' })
      render(<FeedCard short={short} />)

      expect(screen.getByText('feed.card.cta')).toBeInTheDocument()
    })

    it('does not render CTA badge when ctaLink is null', () => {
      const short = createMockShort({ ctaLink: null })
      render(<FeedCard short={short} />)

      expect(screen.queryByText('feed.card.cta')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VERIFIED BADGE
  // ===========================================================================

  describe('Verified Badge', () => {
    it('renders verified badge when company is verified', () => {
      const short = createMockShort({
        company: {
          ...createMockShort().company,
          verified: true,
        },
      })
      const { container } = render(<FeedCard short={short} />)

      // BadgeCheck icon should be present
      const verifiedIcon = container.querySelector('.text-blue-400')
      expect(verifiedIcon).toBeInTheDocument()
    })

    it('does not render verified badge when company is not verified', () => {
      const short = createMockShort({
        company: {
          ...createMockShort().company,
          verified: false,
        },
      })
      const { container } = render(<FeedCard short={short} />)

      const verifiedIcon = container.querySelector('.text-blue-400')
      expect(verifiedIcon).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // COMPANY LOGO FALLBACK
  // ===========================================================================

  describe('Company Logo Fallback', () => {
    it('renders company initial when logo is null', () => {
      const short = createMockShort({
        company: {
          ...createMockShort().company,
          name: 'Acme Corp',
          logo: null,
        },
      })
      render(<FeedCard short={short} />)

      expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('uppercases company initial', () => {
      const short = createMockShort({
        company: {
          ...createMockShort().company,
          name: 'lowercase company',
          logo: null,
        },
      })
      render(<FeedCard short={short} />)

      expect(screen.getByText('L')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // THUMBNAIL FALLBACK
  // ===========================================================================

  describe('Thumbnail Fallback', () => {
    it('shows play icon fallback when thumbnailUrl is null', () => {
      const short = createMockShort({ thumbnailUrl: null })
      const { container } = render(<FeedCard short={short} />)

      // Should show Play icon instead of image
      const playIcon = container.querySelector('.h-12.w-12')
      expect(playIcon).toBeInTheDocument()
    })

    it('shows play icon fallback on image error', async () => {
      const short = createMockShort()
      const { container } = render(<FeedCard short={short} />)

      const image = screen.getByAltText('Test Short Title')

      // Simulate image error
      fireEvent.error(image)

      await waitFor(() => {
        const playIcon = container.querySelector('.h-12.w-12')
        expect(playIcon).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // HOVER BEHAVIOR
  // ===========================================================================

  describe('Hover Behavior', () => {
    it('shows video preview on hover when hlsPlaylistUrl exists', async () => {
      const short = createMockShort()
      const { container } = render(<FeedCard short={short} />)

      const cardContainer = container.querySelector('.aspect-\\[9\\/16\\]')
      expect(cardContainer).toBeInTheDocument()

      // Simulate mouse enter
      fireEvent.mouseEnter(cardContainer!)

      await waitFor(() => {
        const videoPreview = screen.getByTestId('video-preview')
        expect(videoPreview).toBeInTheDocument()
      })
    })

    it('hides video preview on mouse leave', async () => {
      const short = createMockShort()
      const { container } = render(<FeedCard short={short} />)

      const cardContainer = container.querySelector('.aspect-\\[9\\/16\\]')

      // Show preview
      fireEvent.mouseEnter(cardContainer!)

      await waitFor(() => {
        expect(screen.getByTestId('video-preview')).toBeInTheDocument()
      })

      // Hide preview
      fireEvent.mouseLeave(cardContainer!)

      await waitFor(() => {
        expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument()
      })
    })

    it('does not show video preview when hlsPlaylistUrl is null', async () => {
      const short = createMockShort({ hlsPlaylistUrl: null })
      const { container } = render(<FeedCard short={short} />)

      const cardContainer = container.querySelector('.aspect-\\[9\\/16\\]')
      fireEvent.mouseEnter(cardContainer!)

      // Wait a bit to ensure no preview appears
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('link is accessible', () => {
      const short = createMockShort()
      render(<FeedCard short={short} />)

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
    })

    it('thumbnail image has alt text', () => {
      const short = createMockShort({ title: 'Descriptive Title' })
      render(<FeedCard short={short} />)

      const image = screen.getByAltText('Descriptive Title')
      expect(image).toBeInTheDocument()
    })

    it('company logo has alt text', () => {
      const short = createMockShort({
        company: { ...createMockShort().company, name: 'My Company' },
      })
      render(<FeedCard short={short} />)

      const logo = screen.getByAltText('My Company')
      expect(logo).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles very long title with line clamp', () => {
      const longTitle =
        'This is a very long title that should be clamped to two lines maximum to prevent overflow'
      const short = createMockShort({ title: longTitle })
      const { container } = render(<FeedCard short={short} />)

      const titleElement = container.querySelector('.line-clamp-2')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement).toHaveTextContent(longTitle)
    })

    it('handles views of 0', () => {
      const short = createMockShort({ views: 0 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles distance of 0', () => {
      const short = createMockShort({ distance: 0 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('0m')).toBeInTheDocument()
    })

    it('handles very small distance', () => {
      const short = createMockShort({ distance: 0.001 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('1m')).toBeInTheDocument()
    })

    it('handles distance at exactly 1km', () => {
      const short = createMockShort({ distance: 1 })
      render(<FeedCard short={short} />)

      expect(screen.getByText('1.0km')).toBeInTheDocument()
    })
  })
})
