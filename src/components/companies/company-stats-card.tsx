"use client"

import { TrendingUp, Video, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n/client'

interface CompanyStatsCardProps {
  viewsThisWeek?: number
  viewsChange?: number
  activeCampaigns?: number
  walletBalance?: number
  onTopUp?: () => void
}

export function CompanyStatsCard({
  viewsThisWeek = 0,
  viewsChange = 0,
  activeCampaigns = 0,
  walletBalance = 0,
  onTopUp
}: CompanyStatsCardProps) {
  const { t } = useTranslations('companies')

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Views this week */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t('profile.stats.viewsThisWeek')}
            </p>
            {viewsChange > 0 && (
              <TrendingUp className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{formatNumber(viewsThisWeek)}</p>
            {viewsChange !== 0 && (
              <p className={`text-xs font-bold ${viewsChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {viewsChange > 0 ? '+' : ''}{viewsChange}%
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t('profile.stats.activeCampaigns')}
            </p>
            <Video className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{activeCampaigns}</p>
        </CardContent>
      </Card>

      {/* Wallet Balance */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t('profile.stats.walletBalance')}
            </p>
            <Wallet className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">${walletBalance}</p>
            {onTopUp && (
              <Button variant="link" size="sm" onClick={onTopUp} className="text-primary p-0 h-auto">
                {t('profile.stats.topUp')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
