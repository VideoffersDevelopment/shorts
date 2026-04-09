# Search Feature

**Status:** Implemented
**Stage:** 04 - Feed & Discovery

---

## Overview

The search feature enables users to find shorts and companies through full-text search with autocomplete suggestions. It supports fuzzy matching for typo tolerance and provides a responsive search experience.

### User Stories

- As a user, I can search for shorts by title or description
- As a user, I can search for companies by name
- As a user, I can see autocomplete suggestions as I type
- As a user, I can access search with keyboard shortcut (Ctrl+K)
- As a user, I can see my recent searches
- As a user, I can filter search results by type (all/shorts/companies)

---

## Implementation

### Search Technologies

| Technology | Purpose |
|------------|---------|
| PostgreSQL Full-Text Search | Text matching with language support |
| `pg_trgm` Extension | Trigram similarity for fuzzy matching |
| `plainto_tsquery` | Natural language query parsing |
| `ts_rank` | Relevance scoring |
| `similarity()` | Fuzzy match scoring |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/search` | GET | Main search with results |
| `/api/search/suggestions` | GET | Autocomplete suggestions |

### Components

| Component | File | Purpose |
|-----------|------|---------|
| SearchBar | `src/components/search/search-bar.tsx` | Input with autocomplete |
| SearchSuggestions | `src/components/search/search-suggestions.tsx` | Dropdown suggestions |
| SearchResults | `src/components/search/search-results.tsx` | Results display |
| SearchTabs | `src/components/search/search-tabs.tsx` | Type filter tabs |

### Pages

| Route | File | Purpose |
|-------|------|---------|
| `/[locale]/search` | `src/app/(main)/[locale]/search/page.tsx` | Search results page |

---

## Search API

### GET /api/search

Main search endpoint returning ranked results.

**Request Parameters:**
```typescript
interface SearchParams {
  q: string              // Search query (min 2 chars, required)
  type?: string          // 'all' | 'shorts' | 'companies' (default: 'all')
  page?: number          // Page number (default: 1)
  limit?: number         // Results per page (default: 20, max: 100)
  categoryIds?: string   // Optional category filter
  lat?: number           // Optional latitude for distance
  lng?: number           // Optional longitude for distance
  radius?: number        // Optional radius filter (km)
}
```

**Response:**
```typescript
interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  nextPage: number | null
  query: string
}

interface SearchResult {
  type: 'short' | 'company'
  data: FeedShort | CompanyResult
  rank: number           // Relevance score
}

interface CompanyResult {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: number
}
```

**Example:**
```bash
GET /api/search?q=restaurant&type=all&limit=20

Response:
{
  "results": [
    {
      "type": "short",
      "data": { "id": "short_123", "title": "Best Restaurant Deal", ... },
      "rank": 0.85
    },
    {
      "type": "company",
      "data": { "id": "comp_456", "name": "Restaurant ABC", ... },
      "rank": 0.72
    }
  ],
  "totalCount": 45,
  "nextPage": 2,
  "query": "restaurant"
}
```

### GET /api/search/suggestions

Autocomplete suggestions for search input.

**Request Parameters:**
```typescript
interface SuggestionsParams {
  q: string  // Query (min 1 char, required)
}
```

**Response:**
```typescript
interface SuggestionsResponse {
  recent: string[]           // Client-side only (empty from API)
  popular: string[]          // Popular search terms (from tags)
  shorts: ShortSuggestion[]  // Matching shorts
  companies: CompanySuggestion[]  // Matching companies
}

interface ShortSuggestion {
  id: string
  title: string
  thumbnailUrl: string | null
}

interface CompanySuggestion {
  id: string
  name: string
  slug: string
  logo: string | null
}
```

**Example:**
```bash
GET /api/search/suggestions?q=rest

Response:
{
  "recent": [],
  "popular": ["food", "deals", "local"],
  "shorts": [
    { "id": "short_123", "title": "Restaurant Special", "thumbnailUrl": "..." }
  ],
  "companies": [
    { "id": "comp_456", "name": "Restaurant ABC", "slug": "restaurant-abc", "logo": "..." }
  ]
}
```

---

## Search Queries

### Full-Text Search (Shorts)

```sql
SELECT s.*,
  ts_rank(
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
    plainto_tsquery('polish', $1)
  ) + similarity(s.title, $1) as rank
FROM "Short" s
WHERE
  s.status = 'PUBLISHED'
  AND (
    to_tsvector('polish', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
    @@ plainto_tsquery('polish', $1)
    OR s.title % $1  -- Trigram similarity
  )
ORDER BY rank DESC
LIMIT $2 OFFSET $3
```

### Fuzzy Matching (Companies)

```sql
SELECT c.*,
  similarity(c."companyName", $1) as rank,
  (SELECT COUNT(*) FROM "Short" s WHERE s."companyId" = c.id AND s.status = 'PUBLISHED') as "shortsCount"
FROM "CompanyProfile" c
WHERE c."companyName" % $1  -- Trigram similarity threshold
ORDER BY rank DESC
LIMIT $2 OFFSET $3
```

### Suggestions Query

```sql
SELECT s.id, s.title, s."thumbnailUrl"
FROM "Short" s
WHERE
  s.status = 'PUBLISHED'
  AND (
    s.title ILIKE '%' || $1 || '%'
    OR s.title % $1
  )
ORDER BY
  CASE WHEN s.title ILIKE $1 || '%' THEN 0 ELSE 1 END,  -- Prefix match first
  similarity(s.title, $1) DESC
LIMIT 5
```

---

## SearchBar Component

Command-based search input with keyboard shortcuts and autocomplete.

### Features

- Debounced input (300ms)
- Keyboard shortcut (Ctrl+K / Cmd+K)
- Recent searches (localStorage)
- Autocomplete dropdown
- Clear button
- Mobile-responsive

### Usage

```tsx
import { SearchBar } from '@/components/search/search-bar'

// In header (desktop)
<div className="hidden md:block max-w-xl">
  <SearchBar />
</div>

// With default value
<SearchBar defaultValue="restaurant" />

// With custom className
<SearchBar className="w-full" />
```

### Implementation

```typescript
interface SearchBarProps {
  className?: string
  defaultValue?: string
}

const RECENT_SEARCHES_KEY = 'videoshorts_recent_searches'
const MAX_RECENT_SEARCHES = 5

export function SearchBar({ className, defaultValue = '' }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debouncedQuery = useDebounce(query, 300)

  // Fetch suggestions when debounced query changes
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
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ... rest of implementation
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K / Cmd+K | Open search |
| Escape | Close search |
| Enter | Submit search |
| Arrow Up/Down | Navigate suggestions |

---

## Recent Searches

Recent searches are stored client-side in localStorage for privacy.

### Storage

```typescript
const RECENT_SEARCHES_KEY = 'videoshorts_recent_searches'
const MAX_RECENT_SEARCHES = 5

// Save search
function saveRecentSearch(query: string) {
  const recent = getRecentSearches()
  const updated = [
    query,
    ...recent.filter(s => s !== query)
  ].slice(0, MAX_RECENT_SEARCHES)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

// Get searches
function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Clear searches
function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}
```

### UI Integration

Recent searches appear at the top of the suggestions dropdown with:
- Clock icon
- "Clear history" button
- Click to search again

---

## Search Results Page

The `/[locale]/search` page displays search results with type filtering.

### Page Structure

```tsx
export default async function SearchPage({ searchParams }) {
  const { q, type = 'all', page = '1' } = await searchParams

  // No query - show search prompt
  if (!q || q.length < 2) {
    return (
      <div className="container">
        <h1>{t('bar.placeholder')}</h1>
        <SearchBar />
      </div>
    )
  }

  // Fetch results
  const results = await fetchSearchResults(q, type, parseInt(page))

  return (
    <div className="container">
      <h1>{t('results.title', { query: q })}</h1>
      <p>{t('results.count', { count: results.totalCount })}</p>

      <SearchTabs activeTab={type} />

      <SearchResults results={results.results} query={q} />
    </div>
  )
}
```

### SearchTabs Component

Filter results by type (All / Shorts / Companies).

```tsx
export function SearchTabs({ activeTab }: { activeTab: 'all' | 'shorts' | 'companies' }) {
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

### SearchResults Component

Mixed results display with grouped sections.

```tsx
export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return <EmptyState variant="no-search-results" query={query} />
  }

  const shorts = results.filter(r => r.type === 'short')
  const companies = results.filter(r => r.type === 'company')

  return (
    <div className="space-y-8">
      {shorts.length > 0 && (
        <section>
          <h2>{t('tabs.shorts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shorts.map(result => (
              <FeedCard key={result.data.id} short={result.data} />
            ))}
          </div>
        </section>
      )}

      {companies.length > 0 && (
        <section>
          <h2>{t('tabs.companies')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {companies.map(result => (
              <CompanyCard key={result.data.id} company={result.data} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

---

## Translations

### Polish (pl) - search.json
```json
{
  "bar": {
    "placeholder": "Szukaj shortow, firm, kategorii...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Ostatnie wyszukiwania",
    "popular": "Popularne wyszukiwania",
    "shorts": "Shorty",
    "companies": "Firmy",
    "clearRecent": "Wyczysc historie"
  },
  "tabs": {
    "all": "Wszystko",
    "shorts": "Shorty",
    "companies": "Firmy"
  },
  "results": {
    "title": "Wyniki dla \"{query}\"",
    "count": "{count} wynikow",
    "noResults": {
      "title": "Nie znaleziono wynikow dla \"{query}\"",
      "description": "Sprobuj innych slow kluczowych lub sprawdz pisownie"
    }
  },
  "loading": "Szukanie..."
}
```

### English (en) - search.json
```json
{
  "bar": {
    "placeholder": "Search shorts, companies, categories...",
    "shortcut": "Ctrl+K"
  },
  "suggestions": {
    "recent": "Recent searches",
    "popular": "Popular searches",
    "shorts": "Shorts",
    "companies": "Companies",
    "clearRecent": "Clear history"
  },
  "tabs": {
    "all": "All",
    "shorts": "Shorts",
    "companies": "Companies"
  },
  "results": {
    "title": "Results for \"{query}\"",
    "count": "{count} results",
    "noResults": {
      "title": "No results found for \"{query}\"",
      "description": "Try different keywords or check spelling"
    }
  },
  "loading": "Searching..."
}
```

---

## Mobile UX

### Header Integration

- **Desktop:** Full search bar in header
- **Mobile:** Search icon linking to `/search` page

```tsx
// Desktop
<div className="flex-1 max-w-xl mx-4 hidden md:block">
  <SearchBar />
</div>

// Mobile
<Link href={`/${locale}/search`} className="md:hidden">
  <Button variant="ghost" size="icon">
    <Search className="h-5 w-5" />
  </Button>
</Link>
```

### Mobile Search Page

Full-screen search experience on mobile:
- Large search input
- Full-width suggestions
- Touch-friendly results

---

## Related Documentation

- [Feed Overview](./overview.md)
- [Search API Reference](../api/routes/search.md)
- [Search Components](../components/feed/search.md)

---

**Implemented:** 2026-01-02
**Last Updated:** 2026-01-11
