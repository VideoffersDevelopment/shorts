import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@/test/utils'
import { SearchBar } from '../search-bar'

// ===========================================================================
// MOCKS
// ===========================================================================

// Mock scrollIntoView for cmdk library
Element.prototype.scrollIntoView = vi.fn()

// Mock ResizeObserver more completely for cmdk
class MockResizeObserver {
  callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

vi.mock('@/lib/i18n/client', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`
      }
      return key
    },
  }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

const mockPush = vi.fn()

vi.mock('next/navigation', async () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/en/search'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// Mock useDebounce hook
vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value, // Return immediately for tests
}))

// Mock SearchSuggestions component
vi.mock('../search-suggestions', () => ({
  SearchSuggestions: ({
    recentSearches,
    onSelectQuery,
    onSelectShort,
    onSelectCompany,
    onClearRecent,
  }: {
    suggestions: unknown
    recentSearches: string[]
    onSelectQuery: (q: string) => void
    onSelectShort: (id: string) => void
    onSelectCompany: (slug: string) => void
    onClearRecent: () => void
  }) => (
    <div data-testid="search-suggestions">
      {recentSearches.length > 0 && (
        <div data-testid="recent-searches">
          {recentSearches.map((s) => (
            <button key={s} data-testid={`recent-${s}`} onClick={() => onSelectQuery(s)}>
              {s}
            </button>
          ))}
          <button data-testid="clear-recent" onClick={onClearRecent}>
            Clear
          </button>
        </div>
      )}
      <button data-testid="select-query" onClick={() => onSelectQuery('suggestion query')}>
        Select Query
      </button>
      <button data-testid="select-short" onClick={() => onSelectShort('short-123')}>
        Select Short
      </button>
      <button data-testid="select-company" onClick={() => onSelectCompany('company-slug')}>
        Select Company
      </button>
    </div>
  ),
}))

// Mock fetch API
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('SearchBar', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        recent: [],
        popular: ['trending'],
        shorts: [{ id: 's1', title: 'Short 1', thumbnailUrl: null }],
        companies: [{ id: 'c1', name: 'Company 1', slug: 'company-1', logo: null }],
      }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  describe('Rendering', () => {
    it('renders search input', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders with placeholder text', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      expect(screen.getByPlaceholderText('bar.placeholder')).toBeInTheDocument()
    })

    it('renders keyboard shortcut hint', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      expect(screen.getByText('Ctrl')).toBeInTheDocument()
      expect(screen.getByText('K')).toBeInTheDocument()
    })

    it('renders with default value when provided', async () => {
      await act(async () => {
        render(<SearchBar defaultValue="initial search" />)
      })

      expect(screen.getByRole('combobox')).toHaveValue('initial search')
    })

    it('renders with custom className', async () => {
      let container: HTMLElement
      await act(async () => {
        const result = render(<SearchBar className="custom-class" />)
        container = result.container
      })

      expect(container!.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('does not render clear button when input is empty', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      expect(screen.queryByLabelText(/bar\.clear/i)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // INTERACTIONS
  // ===========================================================================

  describe('Interactions', () => {
    it('opens popover on focus', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      const input = screen.getByRole('combobox')
      await act(async () => {
        input.focus()
      })

      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument()
      })
    })

    it('updates input value on typing', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'test query')
      })

      expect(screen.getByRole('combobox')).toHaveValue('test query')
    })

    it('navigates to search page on Enter', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'test query')
        await user.keyboard('{Enter}')
      })

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test%20query')
    })

    it('does not navigate on Enter when query too short', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'a')
        await user.keyboard('{Enter}')
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('fetches suggestions when typing', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 't')
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/search/suggestions?q=t')
      })
    })

    it('navigates to short page when short selected', async () => {
      const { user } = render(<SearchBar />)

      // Open popover
      await act(async () => {
        screen.getByRole('combobox').focus()
      })

      await waitFor(() => {
        expect(screen.getByTestId('select-short')).toBeInTheDocument()
      })

      await act(async () => {
        await user.click(screen.getByTestId('select-short'))
      })

      expect(mockPush).toHaveBeenCalledWith('/en/shorts/short-123')
    })

    it('navigates to company page when company selected', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        screen.getByRole('combobox').focus()
      })

      await waitFor(() => {
        expect(screen.getByTestId('select-company')).toBeInTheDocument()
      })

      await act(async () => {
        await user.click(screen.getByTestId('select-company'))
      })

      expect(mockPush).toHaveBeenCalledWith('/en/companies/company-slug')
    })

    it('navigates to search page when query suggestion selected', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        screen.getByRole('combobox').focus()
      })

      await waitFor(() => {
        expect(screen.getByTestId('select-query')).toBeInTheDocument()
      })

      await act(async () => {
        await user.click(screen.getByTestId('select-query'))
      })

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=suggestion%20query')
    })
  })

  // ===========================================================================
  // KEYBOARD SHORTCUTS
  // ===========================================================================

  describe('Keyboard Shortcuts', () => {
    it('opens search on Ctrl+K', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument()
      })
    })

    it('opens search on Cmd+K (Mac)', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      await act(async () => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      await waitFor(() => {
        expect(screen.getByTestId('search-suggestions')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // LOCALSTORAGE - RECENT SEARCHES
  // ===========================================================================

  describe('Recent Searches (localStorage)', () => {
    it('loads recent searches from localStorage on mount', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['previous search']))

      await act(async () => {
        render(<SearchBar />)
      })

      // Open popover to see recent searches
      await act(async () => {
        screen.getByRole('combobox').focus()
      })

      await waitFor(() => {
        expect(screen.getByTestId('recent-searches')).toBeInTheDocument()
        expect(screen.getByText('previous search')).toBeInTheDocument()
      })
    })

    it('saves search to localStorage on search', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'new search')
        await user.keyboard('{Enter}')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'videoshorts_recent_searches',
        expect.stringContaining('new search')
      )
    })

    it('clears recent searches when clear button clicked', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['search1', 'search2']))

      const { user } = render(<SearchBar />)

      await act(async () => {
        screen.getByRole('combobox').focus()
      })

      await waitFor(() => {
        expect(screen.getByTestId('clear-recent')).toBeInTheDocument()
      })

      await act(async () => {
        await user.click(screen.getByTestId('clear-recent'))
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('videoshorts_recent_searches')
    })

    it('handles invalid JSON in localStorage gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      // Should not throw
      await act(async () => {
        expect(() => render(<SearchBar />)).not.toThrow()
      })
    })
  })

  // ===========================================================================
  // LOADING STATES
  // ===========================================================================

  describe('Loading States', () => {
    it('component is interactive while fetching suggestions', async () => {
      // Make fetch hang
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'test')
      })

      // Component should still be usable during loading
      expect(screen.getByRole('combobox')).toBeEnabled()
    })
  })

  // ===========================================================================
  // ERROR STATES
  // ===========================================================================

  describe('Error States', () => {
    it('handles fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'test')
      })

      // Should not crash, input should still work
      expect(screen.getByRole('combobox')).toHaveValue('test')
    })

    it('handles non-ok response gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'test')
      })

      // Should not crash
      expect(screen.getByRole('combobox')).toHaveValue('test')
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('does not save search if less than 2 characters', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'a')
        await user.keyboard('{Enter}')
      })

      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'videoshorts_recent_searches',
        expect.anything()
      )
    })

    it('trims whitespace from search query', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), '  test query  ')
        await user.keyboard('{Enter}')
      })

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test%20query')
    })

    it('encodes special characters in URL', async () => {
      const { user } = render(<SearchBar />)

      await act(async () => {
        await user.type(screen.getByRole('combobox'), 'test & query')
        await user.keyboard('{Enter}')
      })

      expect(mockPush).toHaveBeenCalledWith('/en/search?q=test%20%26%20query')
    })
  })

  // ===========================================================================
  // ACCESSIBILITY
  // ===========================================================================

  describe('Accessibility', () => {
    it('input has combobox role', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('keyboard shortcut is announced', async () => {
      await act(async () => {
        render(<SearchBar />)
      })

      // kbd element should be present for screen readers
      expect(screen.getByText('Ctrl')).toBeInTheDocument()
    })
  })
})
