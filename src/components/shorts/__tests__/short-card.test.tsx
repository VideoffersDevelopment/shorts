import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { ShortCard } from '../short-card'
import type { Short, ShortStats } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

// ===========================================================================
// TEST DATA
// ===========================================================================

type ShortWithStats = Short & { stats: ShortStats | null }

const createMockShort = (overrides: Partial<ShortWithStats> = {}): ShortWithStats => ({
  id: 'short-1',
  companyId: 'company-1',
  title: 'Test Short Title',
  description: 'Test description',
  rawVideoKey: 'raw/video.mp4',
  qencodeTaskId: null,
  hlsPlaylistUrl: null,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  customThumbnail: false,
  duration: 45,
  aspectRatio: '9:16',
  categoryId: 'cat-1',
  latitude: null,
  longitude: null,
  address: null,
  ctaLink: null,
  status: 'DRAFT',
  publishedAt: null,
  expiresAt: null,
  archivedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  stats: { id: 'stats-1', shortId: 'short-1', views: 150, likes: 25, clicks: 10, saves: 5, updatedAt: new Date() },
  ...overrides
})

describe('ShortCard', () => {
  const mockOnAction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders card with short title', () => {
      render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      expect(screen.getByText('Test Short Title')).toBeInTheDocument()
    })

    it('displays thumbnail image when available', () => {
      render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
      expect(img).toHaveAttribute('alt', 'Test Short Title')
    })

    it('displays status badge', () => {
      render(<ShortCard short={createMockShort({ status: 'DRAFT' })} onAction={mockOnAction} />)

      expect(screen.getByText('status.DRAFT')).toBeInTheDocument()
    })

    it('displays view count from stats', () => {
      render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      // The component renders "150 detail.views" in one span
      expect(screen.getByText(/150\s+detail\.views/)).toBeInTheDocument()
    })

    it('displays like count from stats', () => {
      render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      // The component renders "25 detail.likes" in one span
      expect(screen.getByText(/25\s+detail\.likes/)).toBeInTheDocument()
    })

    it('displays duration badge', () => {
      render(<ShortCard short={createMockShort({ duration: 90 })} onAction={mockOnAction} />)

      expect(screen.getByText('1:30')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // STATUS VARIANTS
  // ===========================================================================

  describe('Status Variants', () => {
    it('renders DRAFT badge with outline variant', () => {
      render(<ShortCard short={createMockShort({ status: 'DRAFT' })} onAction={mockOnAction} />)

      expect(screen.getByText('status.DRAFT')).toBeInTheDocument()
    })

    it('renders PUBLISHED badge with default variant', () => {
      render(<ShortCard short={createMockShort({ status: 'PUBLISHED' })} onAction={mockOnAction} />)

      expect(screen.getByText('status.PUBLISHED')).toBeInTheDocument()
    })

    it('renders PROCESSING badge with secondary variant', () => {
      render(<ShortCard short={createMockShort({ status: 'PROCESSING' })} onAction={mockOnAction} />)

      expect(screen.getByText('status.PROCESSING')).toBeInTheDocument()
    })

    it('renders ARCHIVED badge with destructive variant', () => {
      render(<ShortCard short={createMockShort({ status: 'ARCHIVED' })} onAction={mockOnAction} />)

      expect(screen.getByText('status.ARCHIVED')).toBeInTheDocument()
    })

    it('renders PENDING_PAYMENT badge with outline variant', () => {
      render(<ShortCard short={createMockShort({ status: 'PENDING_PAYMENT' })} onAction={mockOnAction} />)

      expect(screen.getByText('status.PENDING_PAYMENT')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens dropdown menu on action button click', async () => {
      const { user } = render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      const actionButton = screen.getByRole('button')
      await user.click(actionButton)

      expect(screen.getByText('actions.view')).toBeInTheDocument()
    })

    it('calls onAction with view when View clicked', async () => {
      const { user } = render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('actions.view'))

      expect(mockOnAction).toHaveBeenCalledWith('view', expect.objectContaining({ id: 'short-1' }))
    })

    it('calls onAction with edit for DRAFT', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'DRAFT' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('actions.edit'))

      expect(mockOnAction).toHaveBeenCalledWith('edit', expect.objectContaining({ status: 'DRAFT' }))
    })

    it('calls onAction with publish for DRAFT', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'DRAFT' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('actions.publish'))

      expect(mockOnAction).toHaveBeenCalledWith('publish', expect.anything())
    })

    it('calls onAction with delete for DRAFT', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'DRAFT' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('actions.delete'))

      expect(mockOnAction).toHaveBeenCalledWith('delete', expect.anything())
    })

    it('calls onAction with archive for PUBLISHED', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'PUBLISHED' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('actions.archive'))

      expect(mockOnAction).toHaveBeenCalledWith('archive', expect.anything())
    })

    it('calls onAction with duplicate', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'DRAFT' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('actions.duplicate'))

      expect(mockOnAction).toHaveBeenCalledWith('duplicate', expect.anything())
    })

    it('calls onAction with renew for ARCHIVED', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'ARCHIVED' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('actions.renew'))

      expect(mockOnAction).toHaveBeenCalledWith('renew', expect.anything())
    })
  })

  // ===========================================================================
  // STATUS-BASED ACTIONS
  // ===========================================================================

  describe('Status-Based Actions', () => {
    it('shows correct actions for DRAFT', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'DRAFT' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('actions.view')).toBeInTheDocument()
      expect(screen.getByText('actions.edit')).toBeInTheDocument()
      expect(screen.getByText('actions.publish')).toBeInTheDocument()
      expect(screen.getByText('actions.duplicate')).toBeInTheDocument()
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })

    it('shows correct actions for PUBLISHED', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'PUBLISHED' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('actions.view')).toBeInTheDocument()
      expect(screen.getByText('actions.edit')).toBeInTheDocument()
      expect(screen.getByText('actions.archive')).toBeInTheDocument()
      expect(screen.getByText('actions.duplicate')).toBeInTheDocument()
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument()
    })

    it('shows correct actions for ARCHIVED', async () => {
      const { user } = render(<ShortCard short={createMockShort({ status: 'ARCHIVED' })} onAction={mockOnAction} />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('actions.view')).toBeInTheDocument()
      expect(screen.getByText('actions.renew')).toBeInTheDocument()
      expect(screen.getByText('actions.duplicate')).toBeInTheDocument()
      expect(screen.queryByText('actions.edit')).not.toBeInTheDocument()
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles null thumbnail gracefully', () => {
      render(<ShortCard short={createMockShort({ thumbnailUrl: null })} onAction={mockOnAction} />)

      // Should show placeholder, no image
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('handles null stats gracefully', () => {
      render(<ShortCard short={createMockShort({ stats: null })} onAction={mockOnAction} />)

      // Should show 0 views/likes with default i18n keys
      expect(screen.getByText(/0\s+detail\.views/)).toBeInTheDocument()
      expect(screen.getByText(/0\s+detail\.likes/)).toBeInTheDocument()
    })

    it('handles null duration gracefully', () => {
      render(<ShortCard short={createMockShort({ duration: null })} onAction={mockOnAction} />)

      // Should not show duration badge
      expect(screen.queryByText(/:/)).not.toBeInTheDocument()
    })

    it('handles zero duration', () => {
      render(<ShortCard short={createMockShort({ duration: 0 })} onAction={mockOnAction} />)

      // Zero duration treated as falsy, no badge shown
      expect(screen.queryByText('0:00')).not.toBeInTheDocument()
    })

    it('formats long durations correctly', () => {
      render(<ShortCard short={createMockShort({ duration: 125 })} onAction={mockOnAction} />)

      expect(screen.getByText('2:05')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('action button has screen reader text', () => {
      render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      const button = screen.getByRole('button')
      const srText = button.querySelector('.sr-only')
      expect(srText).toBeInTheDocument()
    })

    it('thumbnail image has alt text', () => {
      render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', 'Test Short Title')
    })

    it('card has proper structure', () => {
      const { container } = render(<ShortCard short={createMockShort()} onAction={mockOnAction} />)

      // Card should be present
      expect(container.querySelector('.overflow-hidden')).toBeInTheDocument()
    })
  })
})
