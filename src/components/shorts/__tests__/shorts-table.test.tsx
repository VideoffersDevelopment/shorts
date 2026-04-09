import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@/test/utils'
import { ShortsTable } from '../shorts-table'
import type { Short, ShortStats, ShortTag, Tag } from '@prisma/client'

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

interface ShortWithRelations extends Short {
  stats: ShortStats | null
  tags: (ShortTag & { tag: Tag })[]
}

const createMockShort = (overrides: Partial<ShortWithRelations> = {}): ShortWithRelations => ({
  id: 'short-1',
  companyId: 'company-1',
  title: 'Test Short',
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
  processingError: null,
  retryCount: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  stats: { id: 'stats-1', shortId: 'short-1', views: 100, uniqueViews: 10, likes: 10, comments: 0, ctaClicks: 5, avgWatchTime: null, updatedAt: new Date() },
  tags: [],
  ...overrides
})

const mockShorts: ShortWithRelations[] = [
  createMockShort({ id: 'short-1', title: 'First Short', status: 'DRAFT' }),
  createMockShort({
    id: 'short-2',
    title: 'Second Short',
    status: 'PUBLISHED',
    publishedAt: new Date('2025-01-15'),
    expiresAt: new Date('2025-02-15')
  }),
  createMockShort({ id: 'short-3', title: 'Third Short', status: 'ARCHIVED', archivedAt: new Date() })
]

const defaultHandlers = {
  onView: vi.fn(),
  onEdit: vi.fn(),
  onPublish: vi.fn(),
  onArchive: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  onRenew: vi.fn()
}

describe('ShortsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders table with column headers', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      // Use role-based queries for column headers to avoid conflicts with sr-only spans
      expect(screen.getByRole('columnheader', { name: 'table.columns.thumbnail' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'table.columns.title' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'table.columns.status' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'table.columns.views' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'table.columns.publishedAt' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'table.columns.expiresAt' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'table.columns.actions' })).toBeInTheDocument()
    })

    it('renders all shorts in table rows', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      expect(screen.getByText('First Short')).toBeInTheDocument()
      expect(screen.getByText('Second Short')).toBeInTheDocument()
      expect(screen.getByText('Third Short')).toBeInTheDocument()
    })

    it('displays short titles', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      mockShorts.forEach(short => {
        expect(screen.getByText(short.title)).toBeInTheDocument()
      })
    })

    it('displays view counts from stats', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      expect(screen.getAllByText('100')).toHaveLength(3)
    })

    it('displays status badges', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      expect(screen.getByText('status.DRAFT')).toBeInTheDocument()
      expect(screen.getByText('status.PUBLISHED')).toBeInTheDocument()
      expect(screen.getByText('status.ARCHIVED')).toBeInTheDocument()
    })

    it('displays thumbnail images when available', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
      expect(images[0]).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    })

    it('formats duration correctly', () => {
      render(<ShortsTable shorts={[createMockShort({ duration: 45 })]} {...defaultHandlers} />)

      expect(screen.getByText('0:45')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================

  describe('Empty State', () => {
    it('renders empty state when no shorts', () => {
      render(<ShortsTable shorts={[]} {...defaultHandlers} />)

      expect(screen.getByText('table.empty')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens dropdown menu when action button clicked', async () => {
      const { user } = render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      // Find first actions button
      const actionButtons = screen.getAllByRole('button')
      const firstActionButton = actionButtons[0]

      await user.click(firstActionButton)

      // Dropdown should be visible
      expect(screen.getByText('actions.view')).toBeInTheDocument()
    })

    it('calls onView when View clicked', async () => {
      const { user } = render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      const actionButtons = screen.getAllByRole('button')
      await user.click(actionButtons[0])
      await user.click(screen.getByText('actions.view'))

      expect(defaultHandlers.onView).toHaveBeenCalledWith('short-1')
    })

    it('calls onEdit when Edit clicked on draft', async () => {
      const draftShorts = [createMockShort({ id: 'draft-1', status: 'DRAFT' })]
      const { user } = render(<ShortsTable shorts={draftShorts} {...defaultHandlers} />)

      const actionButton = screen.getByRole('button')
      await user.click(actionButton)
      await user.click(screen.getByText('actions.edit'))

      expect(defaultHandlers.onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'draft-1' }))
    })

    it('calls onPublish when Publish clicked on draft', async () => {
      const draftShorts = [createMockShort({ id: 'draft-1', status: 'DRAFT' })]
      const { user } = render(<ShortsTable shorts={draftShorts} {...defaultHandlers} />)

      const actionButton = screen.getByRole('button')
      await user.click(actionButton)
      await user.click(screen.getByText('actions.publish'))

      expect(defaultHandlers.onPublish).toHaveBeenCalledWith(expect.objectContaining({ id: 'draft-1' }))
    })

    it('calls onDelete when Delete clicked on draft', async () => {
      const draftShorts = [createMockShort({ id: 'draft-1', status: 'DRAFT' })]
      const { user } = render(<ShortsTable shorts={draftShorts} {...defaultHandlers} />)

      const actionButton = screen.getByRole('button')
      await user.click(actionButton)
      await user.click(screen.getByText('actions.delete'))

      expect(defaultHandlers.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'draft-1' }))
    })

    it('calls onArchive when Archive clicked on published', async () => {
      const publishedShorts = [createMockShort({ id: 'pub-1', status: 'PUBLISHED' })]
      const { user } = render(<ShortsTable shorts={publishedShorts} {...defaultHandlers} />)

      const actionButton = screen.getByRole('button')
      await user.click(actionButton)
      await user.click(screen.getByText('actions.archive'))

      expect(defaultHandlers.onArchive).toHaveBeenCalledWith(expect.objectContaining({ id: 'pub-1' }))
    })

    it('calls onDuplicate when Duplicate clicked', async () => {
      const draftShorts = [createMockShort({ id: 'draft-1', status: 'DRAFT' })]
      const { user } = render(<ShortsTable shorts={draftShorts} {...defaultHandlers} />)

      const actionButton = screen.getByRole('button')
      await user.click(actionButton)
      await user.click(screen.getByText('actions.duplicate'))

      expect(defaultHandlers.onDuplicate).toHaveBeenCalledWith(expect.objectContaining({ id: 'draft-1' }))
    })

    it('calls onRenew when Renew clicked on archived', async () => {
      const archivedShorts = [createMockShort({ id: 'arch-1', status: 'ARCHIVED' })]
      const { user } = render(<ShortsTable shorts={archivedShorts} {...defaultHandlers} />)

      const actionButton = screen.getByRole('button')
      await user.click(actionButton)
      await user.click(screen.getByText('actions.renew'))

      expect(defaultHandlers.onRenew).toHaveBeenCalledWith(expect.objectContaining({ id: 'arch-1' }))
    })
  })

  // ===========================================================================
  // STATUS-BASED ACTIONS
  // ===========================================================================

  describe('Status-Based Actions', () => {
    it('shows edit, publish, duplicate, delete for DRAFT', async () => {
      const draftShorts = [createMockShort({ status: 'DRAFT' })]
      const { user } = render(<ShortsTable shorts={draftShorts} {...defaultHandlers} />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('actions.view')).toBeInTheDocument()
      expect(screen.getByText('actions.edit')).toBeInTheDocument()
      expect(screen.getByText('actions.publish')).toBeInTheDocument()
      expect(screen.getByText('actions.duplicate')).toBeInTheDocument()
      expect(screen.getByText('actions.delete')).toBeInTheDocument()
    })

    it('shows edit, archive, duplicate for PUBLISHED', async () => {
      const publishedShorts = [createMockShort({ status: 'PUBLISHED' })]
      const { user } = render(<ShortsTable shorts={publishedShorts} {...defaultHandlers} />)

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('actions.view')).toBeInTheDocument()
      expect(screen.getByText('actions.edit')).toBeInTheDocument()
      expect(screen.getByText('actions.archive')).toBeInTheDocument()
      expect(screen.getByText('actions.duplicate')).toBeInTheDocument()
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument()
    })

    it('shows renew, duplicate for ARCHIVED', async () => {
      const archivedShorts = [createMockShort({ status: 'ARCHIVED' })]
      const { user } = render(<ShortsTable shorts={archivedShorts} {...defaultHandlers} />)

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
    it('handles null stats gracefully', () => {
      const shortsWithNullStats = [createMockShort({ stats: null })]
      render(<ShortsTable shorts={shortsWithNullStats} {...defaultHandlers} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles null thumbnail gracefully', () => {
      const shortsWithNullThumb = [createMockShort({ thumbnailUrl: null })]
      render(<ShortsTable shorts={shortsWithNullThumb} {...defaultHandlers} />)

      // Should show placeholder icon instead of image
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('handles null duration gracefully', () => {
      const shortsWithNullDuration = [createMockShort({ duration: null })]
      render(<ShortsTable shorts={shortsWithNullDuration} {...defaultHandlers} />)

      // Should not show duration
      expect(screen.queryByText(/:/)).not.toBeInTheDocument()
    })

    it('handles null publishedAt gracefully', () => {
      const shorts = [createMockShort({ publishedAt: null })]
      render(<ShortsTable shorts={shorts} {...defaultHandlers} />)

      // Should show dash or empty
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('handles null expiresAt gracefully', () => {
      const shorts = [createMockShort({ expiresAt: null })]
      render(<ShortsTable shorts={shorts} {...defaultHandlers} />)

      expect(screen.getByText('Test Short')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible table structure', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
      expect(screen.getAllByRole('columnheader').length).toBe(7)
    })

    it('action button has screen reader text', async () => {
      const { user } = render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      const buttons = screen.getAllByRole('button')
      const srOnlySpans = buttons[0].querySelectorAll('.sr-only')
      expect(srOnlySpans.length).toBeGreaterThan(0)
    })

    it('images have alt text', () => {
      render(<ShortsTable shorts={mockShorts} {...defaultHandlers} />)

      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
      })
    })
  })
})
