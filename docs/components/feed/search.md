# Search Components

UI components for search functionality including autocomplete and results display.

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| SearchBar | `src/components/search/search-bar.tsx` | Command-based search input |
| SearchSuggestions | `src/components/search/search-suggestions.tsx` | Autocomplete dropdown |
| SearchResults | `src/components/search/search-results.tsx` | Results grid |
| SearchTabs | `src/components/search/search-tabs.tsx` | Type filter tabs |

---

## SearchBar

Command-based search input with autocomplete popover.

**File:** `src/components/search/search-bar.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `className` | `string` | No | - | Additional CSS classes |
| `defaultValue` | `string` | No | `''` | Initial search value |

### Usage

```tsx
import { SearchBar } from '@/components/search/search-bar'

// In header
<div className="hidden md:block max-w-xl">
  <SearchBar />
</div>

// With default value
<SearchBar defaultValue="restaurant" />
```

### Features

- Debounced input (300ms)
- Keyboard shortcut (Ctrl+K / Cmd+K)
- Recent searches (localStorage)
- Autocomplete suggestions
- Clear button
- Escape to close

### Implementation

```tsx
export function SearchBar({ className, defaultValue = '' }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debouncedQuery = useDebounce(query, 300)

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setSuggestions(null)
      return
    }

    fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(setSuggestions)
  }, [debouncedQuery])

  // Keyboard shortcut
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Command className="rounded-lg border shadow-sm" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <CommandInput
              placeholder={t('bar.placeholder')}
              value={query}
              onValueChange={setQuery}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch(query)
              }}
            />
            {query && (
              <Button variant="ghost" size="sm" onClick={() => setQuery('')}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <kbd className="hidden sm:inline-flex ml-2 h-5 items-center rounded border bg-muted px-1.5 text-[10px]">
              Ctrl K
            </kbd>
          </div>
        </Command>
      </PopoverAnchor>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
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

---

## SearchSuggestions

Autocomplete suggestions dropdown content.

**File:** `src/components/search/search-suggestions.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `suggestions` | `SuggestionsResponse \| null` | Yes | API response |
| `recentSearches` | `string[]` | Yes | Recent search terms |
| `onSelectQuery` | `(query: string) => void` | Yes | Search callback |
| `onSelectShort` | `(id: string) => void` | Yes | Short navigation |
| `onSelectCompany` | `(slug: string) => void` | Yes | Company navigation |
| `onClearRecent` | `() => void` | Yes | Clear history |

### Usage

```tsx
<SearchSuggestions
  suggestions={suggestions}
  recentSearches={recentSearches}
  onSelectQuery={(q) => router.push(`/search?q=${q}`)}
  onSelectShort={(id) => router.push(`/shorts/${id}`)}
  onSelectCompany={(slug) => router.push(`/companies/${slug}`)}
  onClearRecent={() => localStorage.removeItem('recent_searches')}
/>
```

### Sections

1. **Recent Searches** - User's recent queries (localStorage)
2. **Popular Searches** - Popular tags from API
3. **Shorts** - Matching short titles with thumbnails
4. **Companies** - Matching company names with logos

### Implementation

```tsx
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
        <CommandGroup
          heading={
            <div className="flex items-center justify-between">
              <span>{t('suggestions.recent')}</span>
              <Button variant="ghost" size="sm" onClick={onClearRecent}>
                {t('suggestions.clearRecent')}
              </Button>
            </div>
          }
        >
          {recentSearches.map((query) => (
            <CommandItem key={query} onSelect={() => onSelectQuery(query)}>
              <Clock className="mr-2 h-4 w-4" />
              {query}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {/* Popular searches */}
      {suggestions?.popular?.length > 0 && (
        <CommandGroup heading={t('suggestions.popular')}>
          {suggestions.popular.map((term) => (
            <CommandItem key={term} onSelect={() => onSelectQuery(term)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              {term}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {/* Shorts */}
      {suggestions?.shorts?.length > 0 && (
        <CommandGroup heading={t('suggestions.shorts')}>
          {suggestions.shorts.map((short) => (
            <CommandItem key={short.id} onSelect={() => onSelectShort(short.id)}>
              {short.thumbnailUrl ? (
                <Image src={short.thumbnailUrl} alt="" width={32} height={48} className="rounded" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              <span className="truncate">{short.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {/* Companies */}
      {suggestions?.companies?.length > 0 && (
        <CommandGroup heading={t('suggestions.companies')}>
          {suggestions.companies.map((company) => (
            <CommandItem key={company.id} onSelect={() => onSelectCompany(company.slug)}>
              {company.logo ? (
                <Image src={company.logo} alt="" width={24} height={24} className="rounded-full" />
              ) : (
                <Building2 className="h-4 w-4" />
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

---

## SearchTabs

Tabs for filtering search results by type.

**File:** `src/components/search/search-tabs.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeTab` | `'all' \| 'shorts' \| 'companies'` | Yes | Current tab |

### Usage

```tsx
import { SearchTabs } from '@/components/search/search-tabs'

<SearchTabs activeTab={type} />
```

### Implementation

```tsx
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

---

## SearchResults

Grid display of search results.

**File:** `src/components/search/search-results.tsx`
**Type:** Client Component

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `results` | `SearchResult[]` | Yes | Search results |
| `query` | `string` | Yes | Search query |

### Usage

```tsx
import { SearchResults } from '@/components/search/search-results'

<SearchResults results={searchData.results} query={q} />
```

### Implementation

```tsx
export function SearchResults({ results, query }: SearchResultsProps) {
  const locale = useLocale()
  const t = useTranslations('search')

  if (results.length === 0) {
    return <EmptyState variant="no-search-results" query={query} />
  }

  const shorts = results.filter(r => r.type === 'short')
  const companies = results.filter(r => r.type === 'company')

  return (
    <div className="space-y-8">
      {/* Shorts section */}
      {shorts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('tabs.shorts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {shorts.map((result) => (
              <FeedCard key={result.data.id} short={result.data as FeedShort} />
            ))}
          </div>
        </section>
      )}

      {/* Companies section */}
      {companies.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">{t('tabs.companies')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {companies.map((result) => {
              const company = result.data as CompanyResult
              return (
                <Link key={company.id} href={`/${locale}/companies/${company.slug}`}>
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardContent className="flex items-center gap-4 p-4">
                      {company.logo ? (
                        <Image
                          src={company.logo}
                          alt={company.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{company.name}</h3>
                          {company.verified && (
                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        {company.category && (
                          <p className="text-sm text-muted-foreground">{company.category}</p>
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

---

## Recent Searches Storage

```typescript
const RECENT_SEARCHES_KEY = 'videoshorts_recent_searches'
const MAX_RECENT_SEARCHES = 5

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  const recent = getRecentSearches()
  const updated = [
    query,
    ...recent.filter(s => s !== query)
  ].slice(0, MAX_RECENT_SEARCHES)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}
```

---

## Related

- [Search Feature Documentation](../../features/feed/search.md)
- [Search API](../../api/routes/search.md)
- [FeedCard Component](./feed-card.md)

---

**Last Updated:** 2026-01-11
