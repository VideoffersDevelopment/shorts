export type FeedSortOption =
  | 'algorithmic'
  | 'newest'
  | 'popular'
  | 'trending'
  | 'following'

export interface FeedFilters {
  sort: FeedSortOption
  categoryIds?: string[]
  tags?: string[]
  lat?: number
  lng?: number
  radius?: number
  verifiedOnly?: boolean
}

export interface FeedShort {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  publishedAt: string
  views: number
  likes: number
  comments?: number
  ctaClicks: number
  location: string | null
  distance: number | null
  company: {
    id: string
    name: string
    slug: string
    logo: string | null
    verified: boolean
  }
  category: {
    id: string
    name: string
    slug: string
  }
  ctaLink: string | null
}

export interface FeedResponse {
  shorts: FeedShort[]
  nextPage: number | null
  totalCount: number
  hasMore: boolean
}

// Search-related types

export interface SearchResult {
  type: 'short' | 'company'
  data: FeedShort | CompanyResult
  rank: number
}

export interface CompanyResult {
  id: string
  name: string
  slug: string
  logo: string | null
  verified: boolean
  category: string | null
  shortsCount: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  nextPage: number | null
  query: string
}

export interface SuggestionsResponse {
  recent: string[]
  popular: string[]
  shorts: ShortSuggestion[]
  companies: CompanySuggestion[]
}

export interface ShortSuggestion {
  id: string
  title: string
  thumbnailUrl: string | null
}

export interface CompanySuggestion {
  id: string
  name: string
  slug: string
  logo: string | null
}
