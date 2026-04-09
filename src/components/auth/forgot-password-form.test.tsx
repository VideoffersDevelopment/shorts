import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { ForgotPasswordForm } from './forgot-password-form'
import { forgotPasswordAction } from '@/app/actions/auth/forgot-password'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/app/actions/auth/forgot-password', () => ({
  forgotPasswordAction: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockForgotPasswordAction = vi.mocked(forgotPasswordAction)

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders forgot password form with email field', () => {
      render(<ForgotPasswordForm />)

      expect(screen.getByLabelText(/forgotPassword.email/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /forgotPassword.submit/i })).toBeInTheDocument()
    })

    it('renders back to login link with locale', () => {
      render(<ForgotPasswordForm />)

      const loginLink = screen.getByRole('link', { name: /forgotPassword.backToLogin/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/pl/login')
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('submits form with valid email', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(mockForgotPasswordAction).toHaveBeenCalledWith({
          email: 'user@example.com',
        })
      })
    })

    it('allows typing in email field', async () => {
      const { user } = render(<ForgotPasswordForm />)

      const emailInput = screen.getByLabelText(/forgotPassword.email/i) as HTMLInputElement

      await user.type(emailInput, 'test@example.com')

      expect(emailInput.value).toBe('test@example.com')
    })

    it('shows success message after successful submission', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/forgotPassword.success/i)).toBeInTheDocument()
      })
    })

    it('hides form after successful submission', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.queryByLabelText(/forgotPassword.email/i)).not.toBeInTheDocument()
      })
    })

    it('resets form after successful submission', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert - form should be hidden, showing success message instead
      await waitFor(() => {
        expect(screen.getByText(/forgotPassword.success/i)).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading text while submitting', async () => {
      // Arrange
      let resolveForgotPassword: ((value: unknown) => void) | null = null
      mockForgotPasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveForgotPassword = resolve
        })
      )

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument()
      })

      // Cleanup
      resolveForgotPassword?.({ success: true })
    })

    it('disables email input while submitting', async () => {
      // Arrange
      let resolveForgotPassword: ((value: unknown) => void) | null = null
      mockForgotPasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveForgotPassword = resolve
        })
      )

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/forgotPassword.email/i)).toBeDisabled()
      })

      // Cleanup
      resolveForgotPassword?.({ success: true })
    })

    it('disables submit button while loading', async () => {
      // Arrange
      let resolveForgotPassword: ((value: unknown) => void) | null = null
      mockForgotPasswordAction.mockReturnValue(
        new Promise((resolve) => {
          resolveForgotPassword = resolve
        })
      )

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /\.\.\./i })
        expect(submitButton).toBeDisabled()
      })

      // Cleanup
      resolveForgotPassword?.({ success: true })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error from server action', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ error: 'Server error occurred' })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('does not show success message on error', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ error: 'Invalid email' })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'invalid@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument()
      })

      expect(screen.queryByText(/forgotPassword.success/i)).not.toBeInTheDocument()
    })

    it('keeps form visible on error', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ error: 'Server error' })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/forgotPassword.email/i)).toBeInTheDocument()
    })

    it('clears error when resubmitting', async () => {
      // Arrange
      mockForgotPasswordAction
        .mockResolvedValueOnce({ error: 'Invalid email' })
        .mockResolvedValueOnce({ success: true })

      const { user } = render(<ForgotPasswordForm />)

      // Act - first submission (error)
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'invalid@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument()
      })

      // Act - second submission (success)
      await user.clear(screen.getByLabelText(/forgotPassword.email/i))
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'valid@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert - error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid email')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles form submission with empty email', async () => {
      const { user } = render(<ForgotPasswordForm />)

      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Should not call action with empty value
      expect(mockForgotPasswordAction).not.toHaveBeenCalled()
    })

    it('handles very long email addresses', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ForgotPasswordForm />)

      const longEmail = 'a'.repeat(100) + '@example.com'

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), longEmail)
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        expect(mockForgotPasswordAction).toHaveBeenCalledWith({ email: longEmail })
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper label for email field', () => {
      render(<ForgotPasswordForm />)

      const emailInput = screen.getByLabelText(/forgotPassword.email/i)

      expect(emailInput).toHaveAttribute('id', 'email')
    })

    it('has proper input type', () => {
      render(<ForgotPasswordForm />)

      const emailInput = screen.getByLabelText(/forgotPassword.email/i)

      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('uses button type submit', () => {
      render(<ForgotPasswordForm />)

      const submitButton = screen.getByRole('button', { name: /forgotPassword.submit/i })

      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('shows success message in accessible alert', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ success: true })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(/forgotPassword.success/i)
      })
    })

    it('shows error in accessible alert', async () => {
      // Arrange
      mockForgotPasswordAction.mockResolvedValue({ error: 'Server error' })

      const { user } = render(<ForgotPasswordForm />)

      // Act
      await user.type(screen.getByLabelText(/forgotPassword.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /forgotPassword.submit/i }))

      // Assert
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent('Server error')
      })
    })
  })
})
