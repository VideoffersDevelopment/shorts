import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill TextEncoder/TextDecoder for Zod validation in Node.js test environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/pl/panel'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ locale: 'pl' })),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock next/server (required by next-auth)
vi.mock('next/server', () => ({
  NextRequest: class NextRequest extends Request {
    nextUrl: URL
    cookies: Map<string, string>

    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(input, init)
      this.nextUrl = new URL(typeof input === 'string' ? input : input.toString())
      this.cookies = new Map()
    }
  },
  NextResponse: class NextResponse extends Response {
    static json(data: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          ...init?.headers,
          'Content-Type': 'application/json',
        },
      })
    }

    static redirect(url: string | URL, status = 307) {
      return new Response(null, {
        status,
        headers: { Location: url.toString() },
      })
    }
  },
  cookies: () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
    has: () => false,
    getAll: () => [],
  }),
  headers: () => new Headers(),
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    return (key: string, params?: Record<string, string | number>) => {
      // Return key path for testing, e.g., "login.title"
      const fullKey = `${namespace}.${key}`
      if (params) {
        return `${fullKey} ${JSON.stringify(params)}`
      }
      return fullKey
    }
  },
  useLocale: () => 'pl',
  useMessages: () => ({}),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock @/lib/i18n/client (custom wrapper)
vi.mock('@/lib/i18n/client', () => ({
  useTranslations: (namespace: string) => {
    const t = (key: string, params?: Record<string, string | number>) => {
      const fullKey = `${namespace}.${key}`
      if (params) {
        return `${fullKey} ${JSON.stringify(params)}`
      }
      return fullKey
    }
    return { t }
  },
}))

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
    themes: ['light', 'dark', 'system'],
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock @/lib/auth (server-side auth - prevents next-auth server imports)
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))
