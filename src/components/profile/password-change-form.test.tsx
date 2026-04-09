import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { PasswordChangeForm } from './password-change-form'
import { changePasswordAction } from '@/app/actions/profile/change-password'
import { useRouter } from 'next/navigation'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/app/actions/profile/change-password', () => ({
  changePasswordAction: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockChangePasswordAction = vi.mocked(changePasswordAction)
const mockPush = vi.fn()

describe('PasswordChangeForm', () => {
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
    it('renders password change form with all fields', () => {
      render(<PasswordChangeForm />)

      expect(screen.getByLabelText(/password\.current/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password\.new/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password\.confirm/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /password\.submit/i })).toBeInTheDocument()
    })

    it('renders all password fields with type password', () => {
      render(<PasswordChangeForm />)

      expect(screen.getByLabelText(/password\.current/i)).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText(/password\.new/i)).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText(/password\.confirm/i)).toHaveAttribute('type', 'password')
    })

    it('renders empty form fields initially', () => {
      render(<PasswordChangeForm />)

      expect(screen.getByLabelText(/password\.current/i)).toHaveValue('')
      expect(screen.getByLabelText(/password\.new/i)).toHaveValue('')
      expect(screen.getByLabelText(/password\.confirm/i)).toHaveValue('')
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('allows typing in current password field', async () => {
      const { user } = render(<PasswordChangeForm />)

      const input = screen.getByLabelText(/password\.current/i)
      await user.type(input, 'myoldpassword')

      expect(input).toHaveValue('myoldpassword')
    })

    it('allows typing in new password field', async () => {
      const { user } = render(<PasswordChangeForm />)

      const input = screen.getByLabelText(/password\.new/i)
      await user.type(input, 'mynewpassword123')

      expect(input).toHaveValue('mynewpassword123')
    })

    it('allows typing in confirm password field', async () => {
      const { user } = render(<PasswordChangeForm />)

      const input = screen.getByLabelText(/password\.confirm/i)
      await user.type(input, 'mynewpassword123')

      expect(input).toHaveValue('mynewpassword123')
    })

    it('submits form with valid data', async () => {
      mockChangePasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(mockChangePasswordAction).toHaveBeenCalledWith({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })
    })

    it('shows success message after successful password change', async () => {
      mockChangePasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText(/password\.success/i)).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading text while submitting', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockChangePasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument()
      })

      resolveAction?.({ success: true })
    })

    it('disables inputs while submitting', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockChangePasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/password\.current/i)).toBeDisabled()
        expect(screen.getByLabelText(/password\.new/i)).toBeDisabled()
        expect(screen.getByLabelText(/password\.confirm/i)).toBeDisabled()
      })

      resolveAction?.({ success: true })
    })

    it('disables submit button while loading', async () => {
      let resolveAction: ((value: unknown) => void) | null = null
      mockChangePasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve
        })
      )

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

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
    it('shows error when wrong current password', async () => {
      mockChangePasswordAction.mockResolvedValue({ error: 'Wrong current password' })

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'wrongpassword')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Wrong current password')).toBeInTheDocument()
      })
    })

    it('shows error for OAuth account', async () => {
      mockChangePasswordAction.mockResolvedValue({ error: 'Account created with OAuth' })

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'anypassword')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Account created with OAuth')).toBeInTheDocument()
      })
    })

    it('shows server error message', async () => {
      mockChangePasswordAction.mockResolvedValue({ error: 'Server error occurred' })

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('does not show success message on error', async () => {
      mockChangePasswordAction.mockResolvedValue({ error: 'Wrong current password' })

      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'wrongpassword')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Wrong current password')).toBeInTheDocument()
      })

      expect(screen.queryByText(/password\.success/i)).not.toBeInTheDocument()
    })

    it('clears error when resubmitting', async () => {
      mockChangePasswordAction
        .mockResolvedValueOnce({ error: 'Wrong current password' })
        .mockResolvedValueOnce({ success: true })

      const { user } = render(<PasswordChangeForm />)

      // First submission - error
      await user.type(screen.getByLabelText(/password\.current/i), 'wrongpassword')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Wrong current password')).toBeInTheDocument()
      })

      // Second submission - success
      await user.clear(screen.getByLabelText(/password\.current/i))
      await user.type(screen.getByLabelText(/password\.current/i), 'correctpassword')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      await waitFor(() => {
        expect(screen.queryByText('Wrong current password')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('does not submit with empty fields', async () => {
      const { user } = render(<PasswordChangeForm />)

      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      expect(mockChangePasswordAction).not.toHaveBeenCalled()
    })

    it('does not submit with only current password', async () => {
      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      expect(mockChangePasswordAction).not.toHaveBeenCalled()
    })

    it('does not submit with mismatched passwords', async () => {
      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'newpassword123')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'differentpassword')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      expect(mockChangePasswordAction).not.toHaveBeenCalled()
    })

    it('does not submit with short new password', async () => {
      const { user } = render(<PasswordChangeForm />)

      await user.type(screen.getByLabelText(/password\.current/i), 'oldpassword123')
      await user.type(screen.getByLabelText(/password\.new/i), 'short')
      await user.type(screen.getByLabelText(/password\.confirm/i), 'short')
      await user.click(screen.getByRole('button', { name: /password\.submit/i }))

      expect(mockChangePasswordAction).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper labels for all fields', () => {
      render(<PasswordChangeForm />)

      expect(screen.getByLabelText(/password\.current/i)).toHaveAttribute('id', 'currentPassword')
      expect(screen.getByLabelText(/password\.new/i)).toHaveAttribute('id', 'newPassword')
      expect(screen.getByLabelText(/password\.confirm/i)).toHaveAttribute('id', 'confirmPassword')
    })

    it('has proper input types', () => {
      render(<PasswordChangeForm />)

      expect(screen.getByLabelText(/password\.current/i)).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText(/password\.new/i)).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText(/password\.confirm/i)).toHaveAttribute('type', 'password')
    })

    it('uses button type submit', () => {
      render(<PasswordChangeForm />)

      expect(screen.getByRole('button', { name: /password\.submit/i })).toHaveAttribute('type', 'submit')
    })
  })
})
