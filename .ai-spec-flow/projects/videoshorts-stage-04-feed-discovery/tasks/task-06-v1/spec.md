# Task 06: Search Components

## Overview

**Priority:** MEDIUM
**Dependencies:** task-05
**Complexity:** Medium (9 files, ~9k tokens)
**Status:** pending

## What to Build

Create search UI components:
1. SearchBar with autocomplete
2. SearchSuggestions dropdown
3. Search results page with tabs
4. SearchResults grid component
5. useDebounce hook

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/search/search-bar.tsx` | Create | Command-based search input |
| `src/components/search/search-suggestions.tsx` | Create | Autocomplete dropdown |
| `src/components/search/search-results.tsx` | Create | Results grid |
| `src/components/search/search-tabs.tsx` | Create | All/Shorts/Companies tabs |
| `src/app/(main)/[locale]/search/page.tsx` | Create | Search results page |
| `src/hooks/use-debounce.ts` | Create | Debounce hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/header.tsx` | Add SearchBar component |

## Implementation Details

### 1. useDebounce Hook

```typescript
// src/hooks/use-debounce.ts
"use client"

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
```

### 2. SearchSuggestions Component

```typescript
// src/components/search/search-suggestions.tsx
"use client"

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Clock, TrendingUp, Video, Building2, X } from 'lucide-react'
import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import type { SuggestionsResponse } from '@/lib/types/feed'

interface SearchSuggestionsProps {
  suggestions: SuggestionsResponse | null
  recentSearches: string[]
  onSelectQuery: (query: string) => void
  onSelectShort: (id: string) => void
  onSelectCompany: (slug: string) => void
  onClearRecent: () => void
}

export function SearchSuggestions({
  suggestions,
  recentSearches,
  onSelectQuery,
  onSelectShort,
  onSelectCompany,
  onClearRecent,
}: SearchSuggestionsProps) {
  const t = useTranslations('search')

  const hasContent =
    recentSearches.length > 0 ||
    (suggestions?.popular?.length ?? 0) > 0 ||
    (suggestions?.shorts?.length ?? 0) > 0 ||
    (suggestions?.companies?.length ?? 0) > 0

  if (!hasContent) return null

  return (
    <>
      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <>
          <CommandGroup
            heading={
              <div className="flex items-center justify-between">
                <span>{t('suggestions.recent')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearRecent()
                  }}
                  className="h-auto py-0.5 px-2 text-xs text-muted-foreground"
                >
                  {t('suggestions.clearRecent')}
                </Button>
              </div>
            }
          >
            {recentSearches.map((query) => (
              <CommandItem
                key={query}
                value={`recent:${query}`}
                onSelect={() => onSelectQuery(query)}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{query}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {/* Popular searches */}
      {suggestions?.popular && suggestions.popular.length > 0 && (
        <>
          <CommandGroup heading={t('suggestions.popular')}>
            {suggestions.popular.map((term) => (
              <CommandItem
                key={term}
                value={`popular:${term}`}
                onSelect={() => onSelectQuery(term)}
              >
                <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{term}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {/* Shorts suggestions */}
      {suggestions?.shorts && suggestions.shorts.length > 0 && (
        <>
          <CommandGroup heading={t('suggestions.shorts')}>
            {suggestions.shorts.map((short) => (
              <CommandItem
                key={short.id}
                value={`short:${short.id}`}
                onSelect={() => onSelectShort(short.id)}
                className="gap-3"
              >
                {short.thumbnailUrl ? (
                  <Image
                    src={short.thumbnailUrl}
                    alt=""
                    width={32}
                    height={48}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-12 rounded bg-muted flex items-center justify-center">
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <span className="truncate">{short.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {/* Companies suggestions */}
      {suggestions?.companies && suggestions.companies.length > 0 && (
        <CommandGroup heading={t('suggestions.companies')}>
          {suggestions.companies.map((company) => (
            <CommandItem
              key={company.id}
              value={`company:${company.slug}`}
              onSelect={() => onSelectCompany(company.slug)}
              className="gap-3"
            >
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="truncate">{company.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </>
  )
}
```

### 3. SearchBar Component

```typescript
// src/components/search/search-bar.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { SearchSuggestions } from './search-suggestions'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import type { SuggestionsResponse } from '@/lib/types/feed'

interface SearchBarProps {
  className?: string
  defaultValue?: string
}

const RECENT_SEARCHES_KEY = 'videoshorts_recent_searches'
const MAX_RECENT_SEARCHES = 5

export function SearchBar({ className, defaultValue = '' }: SearchBarProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('search')

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [])

  // Fetch suggestions
  useEffect(() => {
    async function fetchSuggestions() {
      if (debouncedQuery.length < 1) {
        setSuggestions(null)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`
        )
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  // Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const saveRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed || trimmed.length < 2) return

    const updated = [
      trimmed,
      ...recentSearches.filter((s) => s !== trimmed),
    ].slice(0, MAX_RECENT_SEARCHES)

    setRecentSearches(updated)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }, [recentSearches])

  const handleSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (trimmed.length >= 2) {
      saveRecentSearch(trimmed)
      router.push(`/${locale}/search?q=${encodeURIComponent(trimmed)}`)
      setOpen(false)
    }
  }, [locale, router, saveRecentSearch])

  const handleSelectShort = useCallback((id: string) => {
    router.push(`/${locale}/shorts/${id}`)
    setOpen(false)
  }, [locale, router])

  const handleSelectCompany = useCallback((slug: string) => {
    router.push(`/${locale}/companies/${slug}`)
    setOpen(false)
  }, [locale, router])

  const handleClearRecent = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }, [])

  const handleClearInput = useCallback(() => {
    setQuery('')
    setSuggestions(null)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative', className)}>
          <Command className="rounded-lg border shadow-sm" shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder={t('bar.placeholder')}
                value={query}
                onValueChange={setQuery}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(query)
                  }
                }}
                className="flex-1"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearInput}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <kbd className="hidden sm:inline-flex ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
                <span className="text-xs">Ctrl</span>K
              </kbd>
            </div>
          </Command>
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>
              {loading ? t('loading') : t('results.noResults.title', { query })}
            </CommandEmpty>

            <SearchSuggestions
              suggestions={suggestions}
              recentSearches={recentSearches}
              onSelectQuery={handleSearch}
              onSelectShort={handleSelectShort}
              onSelectCompany={handleSelectCompany}
              onClearRecent={handleClearRecent}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### 4. SearchTabs Component

```typescript
// src/components/search/search-tabs.tsx
"use client"

import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SearchTabsProps {
  activeTab: 'all' | 'shorts' | 'companies'
}

export function SearchTabs({ activeTab }: SearchTabsProps) {
  const t = useTranslations('search')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('type')
    } else {
      params.set('type', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
        <TabsTrigger value="shorts">{t('tabs.shorts')}</TabsTrigger>
        <TabsTrigger value="companies">{t('tabs.companies')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
```

### 5. SearchResults Component

```typescript
// src/components/search/search-results.tsx
"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { Video, Building2, BadgeCheck, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FeedCard } from '@/components/feed/feed-card'
import { EmptyState } from '@/components/feed/empty-state'
import type { SearchResult, FeedShort, CompanyResult } from '@/lib/types/feed'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
}

export function SearchResults({ results, query }: SearchResultsProps) {
  const locale = useLocale()
  const t = useTranslations('search')

  if (results.length === 0) {
    return <EmptyState variant="no-search-results" query={query} />
  }

  return (
    <div className="space-y-8">
      {/* Shorts section */}
      {results.some((r) => r.type === 'short') && (
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('tabs.shorts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results
              .filter((r) => r.type === 'short')
              .map((result) => (
                <FeedCard key={result.data.id} short={result.data as FeedShort} />
              ))}
          </div>
        </section>
      )}

      {/* Companies section */}
      {results.some((r) => r.type === 'company') && (
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('tabs.companies')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results
              .filter((r) => r.type === 'company')
              .map((result) => {
                const company = result.data as CompanyResult
                return (
                  <Link
                    key={company.id}
                    href={`/${locale}/companies/${company.slug}`}
                  >
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="flex items-center gap-4 p-4">
                        {company.logo ? (
                          <Image
                            src={company.logo}
                            alt={company.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{company.name}</h3>
                            {company.verified && (
                              <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          {company.category && (
                            <p className="text-sm text-muted-foreground truncate">
                              {company.category}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {company.shortsCount} shorts
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
          </div>
        </section>
      )}
    </div>
  )
}
```

### 6. Search Page

```typescript
// src/app/(main)/[locale]/search/page.tsx
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { SearchBar } from '@/components/search/search-bar'
import { SearchTabs } from '@/components/search/search-tabs'
import { SearchResults } from '@/components/search/search-results'
import { FeedGridSkeleton } from '@/components/feed/feed-skeleton'
import type { SearchResponse } from '@/lib/types/feed'

interface SearchPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    q?: string
    type?: 'all' | 'shorts' | 'companies'
    page?: string
  }>
}

async function fetchSearchResults(
  query: string,
  type: string = 'all',
  page: number = 1
): Promise<SearchResponse | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      type,
      page: page.toString(),
    })

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/search?${params.toString()}`,
      { cache: 'no-store' }
    )

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const t = await getTranslations('search')

  return {
    title: q ? t('results.title', { query: q }) : 'Search',
  }
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params
  const { q, type = 'all', page = '1' } = await searchParams
  const t = await getTranslations('search')

  // If no query, show search prompt
  if (!q || q.length < 2) {
    return (
      <div className="container py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('bar.placeholder')}</h1>
          <SearchBar />
        </div>
      </div>
    )
  }

  // Fetch results
  const searchData = await fetchSearchResults(q, type, parseInt(page))

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {t('results.title', { query: q })}
        </h1>
        {searchData && (
          <p className="text-muted-foreground">
            {t('results.count', { count: searchData.totalCount })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <SearchTabs activeTab={type as 'all' | 'shorts' | 'companies'} />
      </div>

      {/* Results */}
      <Suspense fallback={<FeedGridSkeleton />}>
        {searchData ? (
          <SearchResults results={searchData.results} query={q} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('results.noResults.title', { query: q })}
            </p>
          </div>
        )}
      </Suspense>
    </div>
  )
}
```

### 7. Header Modification

Add SearchBar to header:

```typescript
// In src/components/layout/header.tsx

import { SearchBar } from '@/components/search/search-bar'

// In the header JSX, between logo and user controls:
<div className="flex-1 max-w-xl mx-4 hidden md:block">
  <SearchBar />
</div>

// For mobile, add search icon that opens search page:
<Link href={`/${locale}/search`} className="md:hidden">
  <Button variant="ghost" size="icon">
    <Search className="h-5 w-5" />
  </Button>
</Link>
```

## Acceptance Criteria

- [ ] SearchBar shows in header (desktop)
- [ ] SearchBar opens popover with suggestions on focus
- [ ] Typing shows autocomplete suggestions (debounced 300ms)
- [ ] Recent searches stored in localStorage
- [ ] Clear recent searches button works
- [ ] Ctrl+K opens search
- [ ] Enter navigates to search page
- [ ] Clicking suggestion navigates appropriately
- [ ] Search page shows results for query
- [ ] SearchTabs filter results by type
- [ ] Empty state shows for no results
- [ ] Mobile shows search icon linking to search page
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Published shorts with searchable content

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Focus search bar | Popover opens | Click search input |
| 2 | Type "test" | Suggestions appear | Wait 300ms |
| 3 | Press Enter | Navigate to /search?q=test | Check URL |
| 4 | Check tabs | All/Shorts/Companies visible | Tab buttons |
| 5 | Click Shorts tab | URL updates, results filter | ?type=shorts |
| 6 | Press Ctrl+K | Search opens | Keyboard shortcut |
| 7 | Clear input | Suggestions reset | Click X button |

### Screenshot Checkpoints
- `01-search-bar.png` - Search bar in header
- `02-suggestions.png` - Autocomplete dropdown
- `03-search-results.png` - Search page with results
- `04-tabs-filtered.png` - Filtered by type

## Notes

1. **localStorage:** Recent searches are stored client-side only for privacy.

2. **Debounce:** 300ms delay prevents excessive API calls while typing.

3. **Mobile UX:** On mobile, clicking search icon navigates to full search page instead of popover.

4. **SSR:** Search page is server-rendered for SEO. Suggestions are client-side only.
