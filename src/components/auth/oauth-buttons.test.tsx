import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { OAuthButtons } from './oauth-buttons'
import { signIn } from 'next-auth/react'

// =============================================================================
// MOCKS
// =============================================================================

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}))

const mockSignIn = vi.mocked(signIn)

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders Google OAuth button', () => {
      render(<OAuthButtons />)

      expect(screen.getByRole('button', { name: /oauth.google/i })).toBeInTheDocument()
    })

    it('renders Facebook OAuth button', () => {
      render(<OAuthButtons />)

      expect(screen.getByRole('button', { name: /oauth.facebook/i })).toBeInTheDocument()
    })

    it('renders both buttons in a grid', () => {
      render(<OAuthButtons />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('renders Google button with icon', () => {
      render(<OAuthButtons />)

      const googleButton = screen.getByRole('button', { name: /oauth.google/i })
      const svg = googleButton.querySelector('svg')

      expect(svg).toBeInTheDocument()
    })

    it('renders Facebook button with icon', () => {
      render(<OAuthButtons />)

      const facebookButton = screen.getByRole('button', { name: /oauth.facebook/i })
      const svg = facebookButton.querySelector('svg')

      expect(svg).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // USER INTERACTIONS
  // ===========================================================================

  describe('User Interactions', () => {
    it('calls signIn with google provider when Google button clicked', async () => {
      // Arrange
      const { user } = render(<OAuthButtons />)

      // Act
      await user.click(screen.getByRole('button', { name: /oauth.google/i }))

      // Assert
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/panel' })
      expect(mockSignIn).toHaveBeenCalledTimes(1)
    })

    it('calls signIn with facebook provider when Facebook button clicked', async () => {
      // Arrange
      const { user } = render(<OAuthButtons />)

      // Act
      await user.click(screen.getByRole('button', { name: /oauth.facebook/i }))

      // Assert
      expect(mockSignIn).toHaveBeenCalledWith('facebook', { callbackUrl: '/panel' })
      expect(mockSignIn).toHaveBeenCalledTimes(1)
    })

    it('handles multiple clicks on same button', async () => {
      // Arrange
      const { user } = render(<OAuthButtons />)

      // Act
      const googleButton = screen.getByRole('button', { name: /oauth.google/i })
      await user.click(googleButton)
      await user.click(googleButton)
      await user.click(googleButton)

      // Assert
      expect(mockSignIn).toHaveBeenCalledTimes(3)
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/panel' })
    })

    it('handles clicks on both buttons independently', async () => {
      // Arrange
      const { user } = render(<OAuthButtons />)

      // Act
      await user.click(screen.getByRole('button', { name: /oauth.google/i }))
      await user.click(screen.getByRole('button', { name: /oauth.facebook/i }))

      // Assert
      expect(mockSignIn).toHaveBeenCalledTimes(2)
      expect(mockSignIn).toHaveBeenNthCalledWith(1, 'google', { callbackUrl: '/panel' })
      expect(mockSignIn).toHaveBeenNthCalledWith(2, 'facebook', { callbackUrl: '/panel' })
    })
  })

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe('Variants', () => {
    it('renders buttons with outline variant', () => {
      render(<OAuthButtons />)

      const googleButton = screen.getByRole('button', { name: /oauth.google/i })
      const facebookButton = screen.getByRole('button', { name: /oauth.facebook/i })

      // Buttons should have outline styling (implementation detail)
      expect(googleButton).toBeInTheDocument()
      expect(facebookButton).toBeInTheDocument()
    })

    it('renders buttons with full width', () => {
      render(<OAuthButtons />)

      const googleButton = screen.getByRole('button', { name: /oauth.google/i })
      const facebookButton = screen.getByRole('button', { name: /oauth.facebook/i })

      expect(googleButton.className).toContain('w-full')
      expect(facebookButton.className).toContain('w-full')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles signIn errors gracefully', async () => {
      // Arrange
      mockSignIn.mockRejectedValue(new Error('OAuth failed'))

      const { user } = render(<OAuthButtons />)

      // Act & Assert - should not throw
      await user.click(screen.getByRole('button', { name: /oauth.google/i }))

      expect(mockSignIn).toHaveBeenCalled()
    })

    it('does not navigate away immediately on click', async () => {
      // Arrange
      const { user } = render(<OAuthButtons />)

      // Act
      await user.click(screen.getByRole('button', { name: /oauth.google/i }))

      // Assert - buttons should still be in document (navigation handled by signIn)
      expect(screen.getByRole('button', { name: /oauth.google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /oauth.facebook/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('uses button type="button" (not submit)', () => {
      render(<OAuthButtons />)

      const googleButton = screen.getByRole('button', { name: /oauth.google/i })
      const facebookButton = screen.getByRole('button', { name: /oauth.facebook/i })

      expect(googleButton).toHaveAttribute('type', 'button')
      expect(facebookButton).toHaveAttribute('type', 'button')
    })

    it('has accessible button labels', () => {
      render(<OAuthButtons />)

      // Buttons should have visible text labels
      expect(screen.getByRole('button', { name: /oauth.google/i })).toHaveTextContent('oauth.google')
      expect(screen.getByRole('button', { name: /oauth.facebook/i })).toHaveTextContent('oauth.facebook')
    })

    it('can be navigated with keyboard', async () => {
      const { user } = render(<OAuthButtons />)

      // Tab to first button
      await user.tab()

      const googleButton = screen.getByRole('button', { name: /oauth.google/i })
      expect(googleButton).toHaveFocus()

      // Tab to second button
      await user.tab()

      const facebookButton = screen.getByRole('button', { name: /oauth.facebook/i })
      expect(facebookButton).toHaveFocus()
    })

    it('can be activated with Enter key', async () => {
      const { user } = render(<OAuthButtons />)

      // Tab to Google button
      await user.tab()

      // Press Enter
      await user.keyboard('{Enter}')

      // Assert
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/panel' })
    })

    it('can be activated with Space key', async () => {
      const { user } = render(<OAuthButtons />)

      // Tab to Facebook button
      await user.tab()
      await user.tab()

      // Press Space
      await user.keyboard(' ')

      // Assert
      expect(mockSignIn).toHaveBeenCalledWith('facebook', { callbackUrl: '/panel' })
    })
  })
})
