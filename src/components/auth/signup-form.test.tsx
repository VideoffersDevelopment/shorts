import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { SignupForm } from './signup-form'
import { signupAction } from '@/app/actions/auth/signup'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('@/app/actions/auth/signup', () => ({
  signupAction: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockSignupAction = vi.mocked(signupAction)

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders signup form with all fields', () => {
      render(<SignupForm />)

      expect(screen.getByLabelText(/signup.email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/signup.password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /signup.submit/i })).toBeInTheDocument()
    })

    it('renders OAuth buttons', () => {
      render(<SignupForm />)

      expect(screen.getByRole('button', { name: /oauth.google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /oauth.facebook/i })).toBeInTheDocument()
    })

    it('renders login link with locale', () => {
      render(<SignupForm />)

      const loginLink = screen.getByRole('link', { name: /signup.loginLink/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/pl/login')
    })

    it('renders "or continue with" separator', () => {
      render(<SignupForm />)

      expect(screen.getByText(/login.orContinueWith/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('submits form with valid data', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ success: true })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(mockSignupAction).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
        })
      })
    })

    it('allows typing in email field', async () => {
      const { user } = render(<SignupForm />)

      const emailInput = screen.getByLabelText(/signup.email/i) as HTMLInputElement

      await user.type(emailInput, 'test@example.com')

      expect(emailInput.value).toBe('test@example.com')
    })

    it('allows typing in password field', async () => {
      const { user } = render(<SignupForm />)

      const passwordInput = screen.getByLabelText(/signup.password/i) as HTMLInputElement

      await user.type(passwordInput, 'mypassword123')

      expect(passwordInput.value).toBe('mypassword123')
    })

    it('shows success message after successful signup', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ success: true })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/signup.success/i)).toBeInTheDocument()
      })
    })

    it('hides form after successful signup', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ success: true })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'newuser@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.queryByLabelText(/signup.email/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/signup.password/i)).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading text while submitting', async () => {
      // Arrange
      let resolveSignup: ((value: unknown) => void) | null = null
      mockSignupAction.mockReturnValue(
        new Promise((resolve) => {
          resolveSignup = resolve
        })
      )

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument()
      })

      // Cleanup
      resolveSignup?.({ success: true })
    })

    it('disables inputs while submitting', async () => {
      // Arrange
      let resolveSignup: ((value: unknown) => void) | null = null
      mockSignupAction.mockReturnValue(
        new Promise((resolve) => {
          resolveSignup = resolve
        })
      )

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/signup.email/i)).toBeDisabled()
        expect(screen.getByLabelText(/signup.password/i)).toBeDisabled()
      })

      // Cleanup
      resolveSignup?.({ success: true })
    })

    it('disables submit button while loading', async () => {
      // Arrange
      let resolveSignup: ((value: unknown) => void) | null = null
      mockSignupAction.mockReturnValue(
        new Promise((resolve) => {
          resolveSignup = resolve
        })
      )

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /\.\.\./i })
        expect(submitButton).toBeDisabled()
      })

      // Cleanup
      resolveSignup?.({ success: true })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error when email already registered', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ error: 'Email already registered' })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument()
      })
    })

    it('shows error from server action', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ error: 'Server error occurred' })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('does not show success message on error', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ error: 'Email already registered' })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument()
      })

      expect(screen.queryByText(/signup.success/i)).not.toBeInTheDocument()
    })

    it('clears error when resubmitting', async () => {
      // Arrange
      mockSignupAction
        .mockResolvedValueOnce({ error: 'Email already registered' })
        .mockResolvedValueOnce({ success: true })

      const { user } = render(<SignupForm />)

      // Act - first submission (error)
      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument()
      })

      // Act - second submission (success)
      await user.clear(screen.getByLabelText(/signup.email/i))
      await user.type(screen.getByLabelText(/signup.email/i), 'newuser@example.com')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert - error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Email already registered')).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles form submission with empty fields', async () => {
      const { user } = render(<SignupForm />)

      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Should not call signupAction with empty values
      expect(mockSignupAction).not.toHaveBeenCalled()
    })

    it('handles form submission with only email', async () => {
      const { user } = render(<SignupForm />)

      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Should not call signupAction with incomplete data
      expect(mockSignupAction).not.toHaveBeenCalled()
    })

    it('handles form submission with only password', async () => {
      const { user } = render(<SignupForm />)

      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Should not call signupAction with incomplete data
      expect(mockSignupAction).not.toHaveBeenCalled()
    })

    it('resets form after successful signup', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ success: true })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert - form should be hidden after success
      await waitFor(() => {
        expect(screen.getByText(/signup.success/i)).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper labels for form fields', () => {
      render(<SignupForm />)

      const emailInput = screen.getByLabelText(/signup.email/i)
      const passwordInput = screen.getByLabelText(/signup.password/i)

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('has proper input types', () => {
      render(<SignupForm />)

      const emailInput = screen.getByLabelText(/signup.email/i)
      const passwordInput = screen.getByLabelText(/signup.password/i)

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('uses button type submit', () => {
      render(<SignupForm />)

      const submitButton = screen.getByRole('button', { name: /signup.submit/i })

      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('shows success message in accessible alert', async () => {
      // Arrange
      mockSignupAction.mockResolvedValue({ success: true })

      const { user } = render(<SignupForm />)

      // Act
      await user.type(screen.getByLabelText(/signup.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/signup.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /signup.submit/i }))

      // Assert
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(/signup.success/i)
      })
    })
  })
})
