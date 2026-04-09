"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { X } from 'lucide-react'
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
import { useTranslations } from '@/lib/i18n/client'
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
  const { t } = useTranslations('search')

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
      } catch {
        // Silently fail - suggestions are non-critical
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

    setRecentSearches((prev) => {
      const updated = [
        trimmed,
        ...prev.filter((s) => s !== trimmed),
      ].slice(0, MAX_RECENT_SEARCHES)

      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    }
  }, [handleSearch, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative', className)}>
          <Command className="rounded-lg border shadow-sm [&_[cmdk-input-wrapper]]:border-b-0" shouldFilter={false}>
            <CommandInput
              placeholder={t('bar.placeholder')}
              value={query}
              onValueChange={setQuery}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
            />
            {/* Clear + Kbd overlay — positioned inside the input area */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearInput}
                  className="h-6 w-6 p-0"
                  aria-label={t('bar.clear')}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              {!query && (
                <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-50">
                  <span className="text-xs">Ctrl</span>K
                </kbd>
              )}
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
              {loading ? t('loading') : query.trim() ? t('results.noResults.title', { query }) : null}
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
