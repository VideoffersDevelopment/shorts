import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { LoginForm } from './login-form'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Tests use global mocks from src/test/setup.ts
const mockSignIn = vi.mocked(signIn)
const mockUseRouter = vi.mocked(useRouter)

describe('LoginForm', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Configure router mock
    mockUseRouter.mockReturnValue({
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
    it('renders login form with all fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/auth\.login\.email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/auth\.login\.password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /auth\.login\.submit/i })).toBeInTheDocument()
    })

    it('renders OAuth buttons', () => {
      render(<LoginForm />)

      expect(screen.getByRole('button', { name: /auth\.oauth\.google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /auth\.oauth\.facebook/i })).toBeInTheDocument()
    })

    it('renders forgot password link with locale', () => {
      render(<LoginForm />)

      const forgotLink = screen.getByRole('link', { name: /auth\.login\.forgotPassword/i })
      expect(forgotLink).toBeInTheDocument()
      expect(forgotLink).toHaveAttribute('href', '/pl/forgot-password')
    })

    it('renders signup link with locale', () => {
      render(<LoginForm />)

      const signupLink = screen.getByRole('link', { name: /auth\.login\.signupLink/i })
      expect(signupLink).toBeInTheDocument()
      expect(signupLink).toHaveAttribute('href', '/pl/signup')
    })

    it('renders "or continue with" separator', () => {
      render(<LoginForm />)

      expect(screen.getByText(/auth\.login\.orContinueWith/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('submits form with valid credentials', async () => {
      // Arrange
      mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/panel' })

      const { user } = render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'user@example.com',
          password: 'password123',
          redirect: false,
        })
      })

      expect(mockPush).toHaveBeenCalledWith('/pl/panel')
    })

    it('allows typing in email field', async () => {
      const { user } = render(<LoginForm />)

      const emailInput = screen.getByLabelText(/auth\.login\.email/i) as HTMLInputElement

      await user.type(emailInput, 'test@example.com')

      expect(emailInput.value).toBe('test@example.com')
    })

    it('allows typing in password field', async () => {
      const { user } = render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/auth\.login\.password/i) as HTMLInputElement

      await user.type(passwordInput, 'mypassword')

      expect(passwordInput.value).toBe('mypassword')
    })

    it('clears error when resubmitting', async () => {
      // Arrange
      mockSignIn
        .mockResolvedValueOnce({ ok: false, error: 'Invalid credentials', status: 401, url: null })
        .mockResolvedValueOnce({ ok: true, error: null, status: 200, url: '/panel' })

      const { user } = render(<LoginForm />)

      // Act - first submission (error)
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'wrong')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      await waitFor(() => {
        expect(screen.getByText(/auth\.login\.errors\.invalidCredentials/i)).toBeInTheDocument()
      })

      // Act - second submission (success)
      await user.clear(screen.getByLabelText(/auth\.login\.password/i))
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'correct')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert - error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/auth\.login\.errors\.invalidCredentials/i)).not.toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading text while submitting', async () => {
      // Arrange
      let resolveSignIn: ((value: unknown) => void) | null = null
      mockSignIn.mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve
        })
      )

      const { user } = render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument()
      })

      // Cleanup
      resolveSignIn?.({ ok: true, error: null, status: 200, url: '/panel' })
    })

    it('disables inputs while submitting', async () => {
      // Arrange
      let resolveSignIn: ((value: unknown) => void) | null = null
      mockSignIn.mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve
        })
      )

      const { user } = render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/auth\.login\.email/i)).toBeDisabled()
        expect(screen.getByLabelText(/auth\.login\.password/i)).toBeDisabled()
      })

      // Cleanup
      resolveSignIn?.({ ok: true, error: null, status: 200, url: '/panel' })
    })

    it('disables submit button while loading', async () => {
      // Arrange
      let resolveSignIn: ((value: unknown) => void) | null = null
      mockSignIn.mockReturnValue(
        new Promise((resolve) => {
          resolveSignIn = resolve
        })
      )

      const { user } = render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /\.\.\./i })
        expect(submitButton).toBeDisabled()
      })

      // Cleanup
      resolveSignIn?.({ ok: true, error: null, status: 200, url: '/panel' })
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('shows error for invalid credentials', async () => {
      // Arrange
      mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials', status: 401, url: null })

      const { user } = render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/auth\.login\.errors\.invalidCredentials/i)).toBeInTheDocument()
      })
    })

    it('shows error for unverified email', async () => {
      // Arrange
      mockSignIn.mockResolvedValue({ ok: false, error: 'EMAIL_NOT_VERIFIED', status: 401, url: null })

      const { user } = render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/auth\.login\.errors\.emailNotVerified/i)).toBeInTheDocument()
      })
    })

    it('does not navigate to panel on error', async () => {
      // Arrange
      mockSignIn.mockResolvedValue({ ok: false, error: 'Invalid credentials', status: 401, url: null })

      const { user } = render(<LoginForm />)

      // Act
      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/auth\.login\.errors\.invalidCredentials/i)).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles form submission with empty fields', async () => {
      const { user } = render(<LoginForm />)

      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Should not call signIn with empty values
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('handles form submission with only email', async () => {
      const { user } = render(<LoginForm />)

      await user.type(screen.getByLabelText(/auth\.login\.email/i), 'user@example.com')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Should not call signIn with incomplete data
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('handles form submission with only password', async () => {
      const { user } = render(<LoginForm />)

      await user.type(screen.getByLabelText(/auth\.login\.password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /auth\.login\.submit/i }))

      // Should not call signIn with incomplete data
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('has proper labels for form fields', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/auth\.login\.email/i)
      const passwordInput = screen.getByLabelText(/auth\.login\.password/i)

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('has proper input types', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/auth\.login\.email/i)
      const passwordInput = screen.getByLabelText(/auth\.login\.password/i)

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('uses button type submit', () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /auth\.login\.submit/i })

      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })
})
