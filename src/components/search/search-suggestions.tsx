"use client"

import Image from 'next/image'
import { Clock, TrendingUp, Video, Building2 } from 'lucide-react'
import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n/client'
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
  const { t } = useTranslations('search')

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
