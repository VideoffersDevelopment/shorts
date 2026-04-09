"use client"

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from '@/lib/i18n/client'

interface SearchTabsProps {
  activeTab: 'all' | 'shorts' | 'companies'
}

export function SearchTabs({ activeTab }: SearchTabsProps) {
  const { t } = useTranslations('search')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('type')
    } else {
      params.set('type', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

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
