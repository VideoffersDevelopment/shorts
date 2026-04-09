import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { ResetPasswordForm } from './reset-password-form'
import { resetPasswordAction } from '@/app/actions/auth/reset-password'
import { useRouter } from 'next/navigation'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/app/actions/auth/reset-password', () => ({
  resetPasswordAction: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockResetPasswordAction = vi.mocked(resetPasswordAction)
const mockPush = vi.fn()

describe('ResetPasswordForm', () => {
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
    it('renders reset password form with all fields', () => {
      render(<ResetPasswordForm token="test-token" />)

      expect(screen.getByLabelText(/resetPassword.password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/resetPassword.confirmPassword/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /resetPassword.submit/i })).toBeInTheDocument()
    })

    it('renders password fields with type password', () => {
      render(<ResetPasswordForm token="test-token" />)

      const passwordInput = screen.getByLabelText(/^resetPassword\.password$/i)
      const confirmPasswordInput = screen.getByLabelText(/resetPassword.confirmPassword/i)

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('submits form with valid passwords', async () => {
      // Arrange
      mockResetPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ResetPasswordForm token="reset-token-123" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'newpassword123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(mockResetPasswordAction).toHaveBeenCalledWith({
          token: 'reset-token-123',
          password: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })
    })

    it('allows typing in password field', async () => {
      const { user } = render(<ResetPasswordForm token="test-token" />)

      const passwordInput = screen.getByLabelText(/^resetPassword\.password$/i) as HTMLInputElement

      await user.type(passwordInput, 'mypassword123')

      expect(passwordInput.value).toBe('mypassword123')
    })

    it('allows typing in confirm password field', async () => {
      const { user } = render(<ResetPasswordForm token="test-token" />)

      const confirmPasswordInput = screen.getByLabelText(/resetPassword.confirmPassword/i) as HTMLInputElement

      await user.type(confirmPasswordInput, 'mypassword123')

      expect(confirmPasswordInput.value).toBe('mypassword123')
    })

    it('redirects to login page after successful reset', async () => {
      // Arrange
      mockResetPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ResetPasswordForm token="reset-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'newpassword123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'newpassword123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
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
      // Arrange
      let resolveResetPassword: ((value: unknown) => void) | null = null
      mockResetPasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveResetPassword = resolve
        })
      )

      const { user } = render(<ResetPasswordForm token="test-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument()
      })

      // Cleanup
      resolveResetPassword?.({ success: true })
    })

    it('disables password inputs while submitting', async () => {
      // Arrange
      let resolveResetPassword: ((value: unknown) => void) | null = null
      mockResetPasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveResetPassword = resolve
        })
      )

      const { user } = render(<ResetPasswordForm token="test-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/^resetPassword\.password$/i)).toBeDisabled()
        expect(screen.getByLabelText(/resetPassword.confirmPassword/i)).toBeDisabled()
      })

      // Cleanup
      resolveResetPassword?.({ success: true })
    })

    it('disables submit button while loading', async () => {
      // Arrange
      let resolveResetPassword: ((value: unknown) => void) | null = null
      mockResetPasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveResetPassword = resolve
        })
      )

      const { user } = render(<ResetPasswordForm token="test-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /\.\.\./i })
        expect(submitButton).toBeDisabled()
      })

      // Cleanup
      resolveResetPassword?.({ success: true })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error when token is invalid', async () => {
      // Arrange
      mockResetPasswordAction.mockResolvedValue({ error: 'Token expired or invalid' })

      const { user } = render(<ResetPasswordForm token="expired-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Token expired or invalid')).toBeInTheDocument()
      })
    })

    it('shows error from server action', async () => {
      // Arrange
      mockResetPasswordAction.mockResolvedValue({ error: 'Server error occurred' })

      const { user } = render(<ResetPasswordForm token="test-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('does not redirect to login on error', async () => {
      // Arrange
      mockResetPasswordAction.mockResolvedValue({ error: 'Token expired' })

      const { user } = render(<ResetPasswordForm token="expired-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('clears error when resubmitting', async () => {
      // Arrange
      mockResetPasswordAction
        .mockResolvedValueOnce({ error: 'Token expired' })
        .mockResolvedValueOnce({ success: true })

      const { user } = render(<ResetPasswordForm token="test-token" />)

      // Act - first submission (error)
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Token expired')).toBeInTheDocument()
      })

      // Act - second submission (success)
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert - error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Token expired')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles form submission with empty fields', async () => {
      const { user } = render(<ResetPasswordForm token="test-token" />)

      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Should not call action with empty values
      expect(mockResetPasswordAction).not.toHaveBeenCalled()
    })

    it('handles form submission with only password field filled', async () => {
      const { user } = render(<ResetPasswordForm token="test-token" />)

      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Should not call action with incomplete data
      expect(mockResetPasswordAction).not.toHaveBeenCalled()
    })

    it('handles form submission with only confirm password field filled', async () => {
      const { user } = render(<ResetPasswordForm token="test-token" />)

      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Should not call action with incomplete data
      expect(mockResetPasswordAction).not.toHaveBeenCalled()
    })

    it('handles form submission with mismatched passwords', async () => {
      const { user } = render(<ResetPasswordForm token="test-token" />)

      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'different123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Should not call action if client-side validation catches mismatch
      // Note: Actual behavior depends on form validation implementation
      expect(mockResetPasswordAction).not.toHaveBeenCalled()
    })

    it('receives token as prop', () => {
      render(<ResetPasswordForm token="my-special-token" />)

      // Component should store the token for form submission
      expect(screen.getByRole('button', { name: /resetPassword.submit/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper labels for form fields', () => {
      render(<ResetPasswordForm token="test-token" />)

      const passwordInput = screen.getByLabelText(/^resetPassword\.password$/i)
      const confirmPasswordInput = screen.getByLabelText(/resetPassword.confirmPassword/i)

      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword')
    })

    it('has proper input types', () => {
      render(<ResetPasswordForm token="test-token" />)

      const passwordInput = screen.getByLabelText(/^resetPassword\.password$/i)
      const confirmPasswordInput = screen.getByLabelText(/resetPassword.confirmPassword/i)

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })

    it('uses button type submit', () => {
      render(<ResetPasswordForm token="test-token" />)

      const submitButton = screen.getByRole('button', { name: /resetPassword.submit/i })

      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('shows error in accessible alert', async () => {
      // Arrange
      mockResetPasswordAction.mockResolvedValue({ error: 'Server error' })

      const { user } = render(<ResetPasswordForm token="test-token" />)

      // Act
      await user.type(screen.getByLabelText(/^resetPassword\.password$/i), 'password123')
      await user.type(screen.getByLabelText(/resetPassword.confirmPassword/i), 'password123')
      await user.click(screen.getByRole('button', { name: /resetPassword.submit/i }))

      // Assert
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent('Server error')
      })
    })
  })
})
