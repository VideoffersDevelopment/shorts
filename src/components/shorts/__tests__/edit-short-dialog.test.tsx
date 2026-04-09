import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { EditShortDialog } from '../edit-short-dialog'
import type { Short } from '@prisma/client'

// ===========================================================================
// MOCKS
// ===========================================================================

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key
  })
}))

vi.mock('@/app/actions/shorts/update', () => ({
  updateShortMetadataAction: vi.fn()
}))

import { updateShortMetadataAction } from '@/app/actions/shorts/update'

const mockUpdateAction = vi.mocked(updateShortMetadataAction)

// ===========================================================================
// TEST DATA
// ===========================================================================

const createMockShort = (overrides: Partial<Short> = {}): Short => ({
  id: 'short-1',
  companyId: 'company-1',
  title: 'Test Short',
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
  ctaLink: 'https://example.com',
  status: 'DRAFT',
  publishedAt: null,
  expiresAt: null,
  archivedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides
})

describe('EditShortDialog', () => {
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
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText('edit.title')).toBeInTheDocument()
      expect(screen.getByText('edit.description')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('edit.title')).not.toBeInTheDocument()
    })

    it('populates form with short data', () => {
      render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByDisplayValue('Test Short')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument()
    })

    it('renders all form fields', () => {
      render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('edit.titleLabel')).toBeInTheDocument()
      expect(screen.getByLabelText('edit.descriptionLabel')).toBeInTheDocument()
      expect(screen.getByLabelText('edit.tagsLabel')).toBeInTheDocument()
      expect(screen.getByLabelText('edit.ctaLinkLabel')).toBeInTheDocument()
    })

    it('renders cancel and save buttons', () => {
      render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByRole('button', { name: 'edit.cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'edit.save' })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('updates title input on change', async () => {
      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const titleInput = screen.getByLabelText('edit.titleLabel')
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')

      expect(titleInput).toHaveValue('New Title')
    })

    it('updates description input on change', async () => {
      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const descInput = screen.getByLabelText('edit.descriptionLabel')
      await user.clear(descInput)
      await user.type(descInput, 'New description')

      expect(descInput).toHaveValue('New description')
    })

    it('calls onClose when cancel clicked', async () => {
      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.cancel' }))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('submits form with updated values', async () => {
      mockUpdateAction.mockResolvedValue({ success: true, data: createMockShort() })

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const titleInput = screen.getByLabelText('edit.titleLabel')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledWith('short-1', expect.objectContaining({
          title: 'Updated Title'
        }))
      })
    })

    it('calls onSuccess and onClose on successful submit', async () => {
      mockUpdateAction.mockResolvedValue({ success: true, data: createMockShort() })

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('parses comma-separated tags', async () => {
      mockUpdateAction.mockResolvedValue({ success: true, data: createMockShort() })

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const tagsInput = screen.getByLabelText('edit.tagsLabel')
      await user.type(tagsInput, 'tag1, tag2, tag3')

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledWith('short-1', expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3']
        }))
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('disables inputs during submission', async () => {
      mockUpdateAction.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(screen.getByLabelText('edit.titleLabel')).toBeDisabled()
        expect(screen.getByLabelText('edit.descriptionLabel')).toBeDisabled()
      })
    })

    it('disables buttons during submission', async () => {
      mockUpdateAction.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'edit.cancel' })).toBeDisabled()
      })
    })

    it('prevents dialog close during submission', async () => {
      mockUpdateAction.mockImplementation(() => new Promise(() => {}))

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))
      await user.click(screen.getByRole('button', { name: 'edit.cancel' }))

      // onClose should not be called during loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'edit.cancel' })).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('displays error message on action failure', async () => {
      mockUpdateAction.mockResolvedValue({
        success: false,
        error: 'Update failed',
        code: 'UPDATE_FAILED'
      })

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument()
      })
    })

    it('displays error on exception', async () => {
      mockUpdateAction.mockRejectedValue(new Error('Network error'))

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(screen.getByText('errors.updateFailed')).toBeInTheDocument()
      })
    })

    it('clears error when dialog reopened', async () => {
      mockUpdateAction.mockResolvedValue({
        success: false,
        error: 'Update failed',
        code: 'UPDATE_FAILED'
      })

      const { user, rerender } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument()
      })

      // Close and reopen
      rerender(
        <EditShortDialog
          short={createMockShort()}
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      rerender(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText('Update failed')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles null short gracefully', () => {
      render(
        <EditShortDialog
          short={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      // Form should still render but with empty values
      expect(screen.getByLabelText('edit.titleLabel')).toHaveValue('')
    })

    it('handles null description in short', () => {
      render(
        <EditShortDialog
          short={createMockShort({ description: null })}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('edit.descriptionLabel')).toHaveValue('')
    })

    it('handles null ctaLink in short', () => {
      render(
        <EditShortDialog
          short={createMockShort({ ctaLink: null })}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('edit.ctaLinkLabel')).toHaveValue('')
    })

    it('does not submit when short is null', async () => {
      const { user } = render(
        <EditShortDialog
          short={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      expect(mockUpdateAction).not.toHaveBeenCalled()
    })

    it('filters empty tags from input', async () => {
      mockUpdateAction.mockResolvedValue({ success: true, data: createMockShort() })

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const tagsInput = screen.getByLabelText('edit.tagsLabel')
      await user.type(tagsInput, 'tag1, , tag2, ')

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(mockUpdateAction).toHaveBeenCalledWith('short-1', expect.objectContaining({
          tags: ['tag1', 'tag2']
        }))
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('form fields have labels', () => {
      render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('edit.titleLabel')).toBeInTheDocument()
      expect(screen.getByLabelText('edit.descriptionLabel')).toBeInTheDocument()
      expect(screen.getByLabelText('edit.tagsLabel')).toBeInTheDocument()
      expect(screen.getByLabelText('edit.ctaLinkLabel')).toBeInTheDocument()
    })

    it('title input is required', () => {
      render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByLabelText('edit.titleLabel')).toBeRequired()
    })

    it('error alert is visible when error occurs', async () => {
      mockUpdateAction.mockResolvedValue({
        success: false,
        error: 'Test error',
        code: 'TEST'
      })

      const { user } = render(
        <EditShortDialog
          short={createMockShort()}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      await user.click(screen.getByRole('button', { name: 'edit.save' }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})
