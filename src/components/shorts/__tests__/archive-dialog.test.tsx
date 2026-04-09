import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { ArchiveDialog } from '../archive-dialog'
import type { Short } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

vi.mock('@/app/actions/shorts/archive', () => ({
  archiveShortAction: vi.fn()
}))

import { archiveShortAction } from '@/app/actions/shorts/archive'

const mockArchiveAction = vi.mocked(archiveShortAction)

// ===========================================================================
// TEST DATA
// ===========================================================================

const createMockShort = (overrides: Partial<Short> = {}): Short => ({
  id: 'short-1',
  companyId: 'company-1',
  title: 'Test Short to Archive',
  description: 'Test description',
  rawVideoKey: 'raw/video.mp4',
  qencodeTaskId: null,
  hlsPlaylistUrl: 'https://cdn.example.com/playlist.m3u8',
  thumbnailUrl: null,
  customThumbnail: false,
  duration: 45,
  aspectRatio: '9:16',
  categoryId: 'cat-1',
  latitude: null,
  longitude: null,
  address: null,
  ctaLink: null,
  status: 'PUBLISHED',
  publishedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  archivedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides
})

describe('ArchiveDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders dialog when open', () => {
      render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('archive.title')).toBeInTheDocument()
      expect(screen.getByText('archive.description')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('archive.title')).not.toBeInTheDocument()
    })

    it('displays short title in confirmation', () => {
      render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Test Short to Archive')).toBeInTheDocument()
    })

    it('renders cancel and confirm buttons', () => {
      render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('button', { name: 'archive.cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'archive.confirm' })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls onClose when cancel clicked', async () => {
      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.cancel' }))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls archiveShortAction when confirm clicked', async () => {
      mockArchiveAction.mockResolvedValue({ success: true, data: createMockShort() })

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(mockArchiveAction).toHaveBeenCalledWith('short-1')
      })
    })

    it('calls onSuccess and onClose on successful archive', async () => {
      mockArchiveAction.mockResolvedValue({ success: true, data: createMockShort() })

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('disables buttons during archive', async () => {
      mockArchiveAction.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'archive.cancel' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'archive.confirm' })).toBeDisabled()
      })
    })

    it('prevents dialog close during archive', async () => {
      mockArchiveAction.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      // Try to cancel while loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'archive.cancel' })).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('displays error message on action failure', async () => {
      mockArchiveAction.mockResolvedValue({
        success: false,
        error: 'Archive failed',
        code: 'ARCHIVE_FAILED'
      })

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('Archive failed')).toBeInTheDocument()
      })
    })

    it('displays error on exception', async () => {
      mockArchiveAction.mockRejectedValue(new Error('Network error'))

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('errors.archiveFailed')).toBeInTheDocument()
      })
    })

    it('does not call onSuccess on error', async () => {
      mockArchiveAction.mockResolvedValue({
        success: false,
        error: 'Archive failed',
        code: 'ARCHIVE_FAILED'
      })

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('Archive failed')).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('clears error when dialog closed and reopened', async () => {
      mockArchiveAction.mockResolvedValue({
        success: false,
        error: 'Archive failed',
        code: 'ARCHIVE_FAILED'
      })

      const { user, rerender } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('Archive failed')).toBeInTheDocument()
      })

      // Close
      rerender(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Reopen
      rerender(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('Archive failed')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles null short gracefully', async () => {
      const { user } = render(
        <ArchiveDialog
          short={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      // Should not call archive action with null short
      expect(mockArchiveAction).not.toHaveBeenCalled()
    })

    it('does not show short title when short is null', () => {
      render(
        <ArchiveDialog
          short={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('Test Short to Archive')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('dialog has title', () => {
      render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('error alert is visible when error occurs', async () => {
      mockArchiveAction.mockResolvedValue({
        success: false,
        error: 'Test error',
        code: 'TEST'
      })

      const { user } = render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'archive.confirm' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('buttons are focusable', () => {
      render(
        <ArchiveDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const cancelBtn = screen.getByRole('button', { name: 'archive.cancel' })
      const confirmBtn = screen.getByRole('button', { name: 'archive.confirm' })

      expect(cancelBtn).not.toHaveAttribute('tabindex', '-1')
      expect(confirmBtn).not.toHaveAttribute('tabindex', '-1')
    })
  })
})
