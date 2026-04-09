"use client"

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Video, Users, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n/client'

type EmptyStateVariant = 'no-shorts' | 'no-following' | 'no-search-results'

interface EmptyStateProps {
  variant: EmptyStateVariant
  query?: string
  onExpandRadius?: () => void
  onClearFilters?: () => void
}

export function EmptyState({
  variant,
  query,
  onExpandRadius,
  onClearFilters,
}: EmptyStateProps) {
  const { t } = useTranslations('feed')
  const { t: tSearch } = useTranslations('search')
  const locale = useLocale()

  const configs: Record<EmptyStateVariant, {
    icon: typeof Video
    title: string
    description: string
    actions: Array<{
      label: string
      onClick?: () => void
      href?: string
      variant?: 'default' | 'outline'
    }>
  }> = {
    'no-shorts': {
      icon: Video,
      title: t('empty.noShorts.title'),
      description: t('empty.noShorts.description'),
      actions: [
        ...(onExpandRadius ? [{
          label: t('empty.noShorts.expandRadius'),
          onClick: onExpandRadius,
          variant: 'outline' as const,
        }] : []),
        ...(onClearFilters ? [{
          label: t('empty.noShorts.clearFilters'),
          onClick: onClearFilters,
          variant: 'outline' as const,
        }] : []),
        {
          label: t('empty.noShorts.browseAll'),
          href: `/${locale}`,
        },
      ],
    },
    'no-following': {
      icon: Users,
      title: t('empty.noFollowing.title'),
      description: t('empty.noFollowing.description'),
      actions: [
        {
          label: t('empty.noFollowing.discoverCta'),
          href: `/${locale}`,
        },
      ],
    },
    'no-search-results': {
      icon: SearchX,
      title: query?.trim() ? tSearch('results.noResults.title', { query }) : tSearch('results.noResults.description'),
      description: tSearch('results.noResults.description'),
      actions: [],
    },
  }

  const config = configs[variant]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md">{config.description}</p>

      {config.actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {config.actions.map((action, i) =>
            action.href ? (
              <Button key={i} variant={action.variant ?? 'default'} asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button
                key={i}
                variant={action.variant ?? 'default'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
