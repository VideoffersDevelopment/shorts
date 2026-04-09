"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { Building2, BadgeCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FeedCard } from '@/components/feed/feed-card'
import { EmptyState } from '@/components/feed/empty-state'
import { useTranslations } from '@/lib/i18n/client'
import type { SearchResult, FeedShort, CompanyResult } from '@/lib/types/feed'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
}

export function SearchResults({ results, query }: SearchResultsProps) {
  const locale = useLocale()
  const { t } = useTranslations('search')

  if (results.length === 0) {
    return <EmptyState variant="no-search-results" query={query} />
  }

  const shorts = results.filter((r) => r.type === 'short')
  const companies = results.filter((r) => r.type === 'company')

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
                          {t('company.shortsCount', { count: company.shortsCount })}
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
