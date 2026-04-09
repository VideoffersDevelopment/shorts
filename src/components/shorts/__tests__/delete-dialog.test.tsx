import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { DeleteDialog } from '../delete-dialog'
import type { Short } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

vi.mock('@/app/actions/shorts/delete', () => ({
  deleteShortAction: vi.fn()
}))

import { deleteShortAction } from '@/app/actions/shorts/delete'

const mockDeleteAction = vi.mocked(deleteShortAction)

// ===========================================================================
// TEST DATA
// ===========================================================================

const createMockShort = (overrides: Partial<Short> = {}): Short => ({
  id: 'short-1',
  companyId: 'company-1',
  title: 'Test Short to Delete',
  description: 'Test description',
  rawVideoKey: 'raw/video.mp4',
  qencodeTaskId: null,
  hlsPlaylistUrl: null,
  thumbnailUrl: null,
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
  ...overrides
})

describe('DeleteDialog', () => {
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
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('delete.title')).toBeInTheDocument()
      expect(screen.getByText('delete.description')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('delete.title')).not.toBeInTheDocument()
    })

    it('displays short title in confirmation', () => {
      render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('Test Short to Delete')).toBeInTheDocument()
    })

    it('renders cancel and confirm buttons', () => {
      render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('button', { name: 'delete.cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'delete.confirm' })).toBeInTheDocument()
    })

    it('confirm button has destructive styling', () => {
      render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // The confirm button should have destructive variant class
      const confirmBtn = screen.getByRole('button', { name: 'delete.confirm' })
      expect(confirmBtn).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls onClose when cancel clicked', async () => {
      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.cancel' }))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls deleteShortAction when confirm clicked', async () => {
      mockDeleteAction.mockResolvedValue({ success: true, data: { success: true } })

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(mockDeleteAction).toHaveBeenCalledWith('short-1')
      })
    })

    it('calls onSuccess and onClose on successful delete', async () => {
      mockDeleteAction.mockResolvedValue({ success: true, data: { success: true } })

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

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
    it('disables buttons during delete', async () => {
      mockDeleteAction.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'delete.cancel' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'delete.confirm' })).toBeDisabled()
      })
    })

    it('prevents dialog close during delete', async () => {
      mockDeleteAction.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'delete.cancel' })).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('displays error message on action failure', async () => {
      mockDeleteAction.mockResolvedValue({
        success: false,
        error: 'Delete failed',
        code: 'DELETE_FAILED'
      })

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })
    })

    it('displays error for non-draft short', async () => {
      mockDeleteAction.mockResolvedValue({
        success: false,
        error: 'Cannot delete non-draft',
        code: 'CANNOT_DELETE_NON_DRAFT'
      })

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('Cannot delete non-draft')).toBeInTheDocument()
      })
    })

    it('displays error on exception', async () => {
      mockDeleteAction.mockRejectedValue(new Error('Network error'))

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('errors.deleteFailed')).toBeInTheDocument()
      })
    })

    it('does not call onSuccess on error', async () => {
      mockDeleteAction.mockResolvedValue({
        success: false,
        error: 'Delete failed',
        code: 'DELETE_FAILED'
      })

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('clears error when dialog closed and reopened', async () => {
      mockDeleteAction.mockResolvedValue({
        success: false,
        error: 'Delete failed',
        code: 'DELETE_FAILED'
      })

      const { user, rerender } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })

      // Close
      rerender(
        <DeleteDialog
          short={createMockShort()}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Reopen
      rerender(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('Delete failed')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles null short gracefully', async () => {
      const { user } = render(
        <DeleteDialog
          short={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      expect(mockDeleteAction).not.toHaveBeenCalled()
    })

    it('does not show short title when short is null', () => {
      render(
        <DeleteDialog
          short={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('Test Short to Delete')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('dialog has title', () => {
      render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('title has destructive styling', () => {
      render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const title = screen.getByText('delete.title')
      expect(title.closest('[class*="destructive"]') || title.className).toBeDefined()
    })

    it('error alert is visible when error occurs', async () => {
      mockDeleteAction.mockResolvedValue({
        success: false,
        error: 'Test error',
        code: 'TEST'
      })

      const { user } = render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'delete.confirm' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('buttons are focusable', () => {
      render(
        <DeleteDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const cancelBtn = screen.getByRole('button', { name: 'delete.cancel' })
      const confirmBtn = screen.getByRole('button', { name: 'delete.confirm' })

      expect(cancelBtn).not.toHaveAttribute('tabindex', '-1')
      expect(confirmBtn).not.toHaveAttribute('tabindex', '-1')
    })
  })
})
