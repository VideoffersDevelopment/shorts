import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// =============================================================================
// WRAPPER PROVIDERS
// =============================================================================

interface ProvidersProps {
  children: ReactNode
}

/**
 * Wrapper with all providers for testing
 * Add providers here as needed (Theme, Session, etc.)
 */
function AllProviders({ children }: ProvidersProps) {
  return <>{children}</>
}

// =============================================================================
// CUSTOM RENDER
// =============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route for testing */
  route?: string
}

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />)
 * ```
 */
function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { route = '/', ...renderOptions } = options

  // Set up window.location if needed
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route)
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
  }
}

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * Create a mock function with typed return value
 */
export { vi } from 'vitest'

/**
 * Mock session data for authenticated user tests
 */
export const mockAuthenticatedSession = {
  data: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  status: 'authenticated' as const,
  update: async () => null,
}

/**
 * Mock session data for unauthenticated user tests
 */
export const mockUnauthenticatedSession = {
  data: null,
  status: 'unauthenticated' as const,
  update: async () => null,
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export everything from testing-library
export * from '@testing-library/react'
export { userEvent }

// Export custom render as default render
export { renderWithProviders as render }
