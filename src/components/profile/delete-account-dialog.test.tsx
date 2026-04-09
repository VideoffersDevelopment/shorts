import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { DeleteAccountDialog } from './delete-account-dialog'
import { deleteAccountAction } from '@/app/actions/profile/delete-account'
import { useRouter } from 'next/navigation'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/app/actions/profile/delete-account', () => ({
  deleteAccountAction: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockDeleteAccountAction = vi.mocked(deleteAccountAction)
const mockPush = vi.fn()

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    })
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders delete account trigger button', () => {
      render(<DeleteAccountDialog />)

      expect(screen.getByRole('button', { name: /account\.deleteAccount/i })).toBeInTheDocument()
    })

    it('renders destructive button variant', () => {
      render(<DeleteAccountDialog />)

      const button = screen.getByRole('button', { name: /account\.deleteAccount/i })
      expect(button).toBeInTheDocument()
    })

    it('dialog is closed by default', () => {
      render(<DeleteAccountDialog />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('opens dialog when trigger button clicked', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('shows dialog title and warning when opened', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByText(/delete\.title/i)).toBeInTheDocument()
        expect(screen.getAllByText(/delete\.warning/i).length).toBeGreaterThan(0)
      })
    })

    it('shows confirmation input in dialog', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/delete\.confirm/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument()
      })
    })

    it('allows typing in confirmation field', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const input = screen.getByLabelText(/delete\.confirm/i)
      await user.type(input, 'DELETE')

      expect(input).toHaveValue('DELETE')
    })

    it('submits form with DELETE confirmation', async () => {
      mockDeleteAccountAction.mockResolvedValue({ success: true })

      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(mockDeleteAccountAction).toHaveBeenCalledWith({
          confirmation: 'DELETE',
        })
      })
    })

    it('redirects to login after successful deletion', async () => {
      mockDeleteAccountAction.mockResolvedValue({ success: true })

      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading text while submitting', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockDeleteAccountAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument()
      })

      resolveAction?.({ success: true })
    })

    it('disables confirmation input while submitting', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockDeleteAccountAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/delete\.confirm/i)).toBeDisabled()
      })

      resolveAction?.({ success: true })
    })

    it('disables submit button while loading', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockDeleteAccountAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\.\.\./i })).toBeDisabled()
      })

      resolveAction?.({ success: true })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error from server action', async () => {
      mockDeleteAccountAction.mockResolvedValue({ error: 'Server error' })

      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
    })

    it('does not redirect on error', async () => {
      mockDeleteAccountAction.mockResolvedValue({ error: 'Unauthorized' })

      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Unauthorized')).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('clears error when dialog is reopened', async () => {
      mockDeleteAccountAction.mockResolvedValue({ error: 'Server error' })

      const { user } = render(<DeleteAccountDialog />)

      // Open dialog
      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Submit and get error
      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELETE')
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })

      // Close dialog by pressing Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Reopen dialog
      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Error should be cleared
      expect(screen.queryByText('Server error')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('does not submit with wrong confirmation', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/delete\.confirm/i), 'delete') // lowercase
      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      expect(mockDeleteAccountAction).not.toHaveBeenCalled()
    })

    it('does not submit with empty confirmation', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /delete\.submit/i }))

      expect(mockDeleteAccountAction).not.toHaveBeenCalled()
    })

    it('resets form when dialog is closed', async () => {
      const { user } = render(<DeleteAccountDialog />)

      // Open dialog
      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Type something
      await user.type(screen.getByLabelText(/delete\.confirm/i), 'DELE')

      // Close dialog
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Reopen dialog
      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Input should be empty
      expect(screen.getByLabelText(/delete\.confirm/i)).toHaveValue('')
    })

    it('shows destructive alert warning', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Should show warning alert
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('dialog has proper role', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('confirmation input has label', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/delete\.confirm/i)).toHaveAttribute('id', 'confirmation')
    })

    it('submit button has type submit', async () => {
      const { user } = render(<DeleteAccountDialog />)

      await user.click(screen.getByRole('button', { name: /account\.deleteAccount/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /delete\.submit/i })).toHaveAttribute('type', 'submit')
    })
  })
})
