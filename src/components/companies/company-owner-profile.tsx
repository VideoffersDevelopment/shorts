"use client"

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from '@/lib/i18n/client'
import { CompanyProfileHeader } from './company-profile-header'
import { CompanyStatsCard } from './company-stats-card'
import { type BusinessHours } from './business-hours-picker'
import { ExternalLink, Edit, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Prisma } from '@prisma/client'

interface SocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
}

interface CompanyOwnerProfileProps {
  company: {
    id: string
    companyName: string
    slug: string
    logo: string | null
    banner: string | null
    description: string | null
    viesVerified: boolean
    website: string | null
    street: string | null
    postalCode: string | null
    city: string | null
    phone: string | null
    latitude: number | null
    longitude: number | null
    socialLinks: Prisma.JsonValue
    businessHours: Prisma.JsonValue
    category: {
      name: string
      slug: string
    } | null
  }
  stats?: {
    viewsThisWeek?: number
    viewsChange?: number
    activeCampaigns?: number
    walletBalance?: number
  }
  locale?: string
}

export function CompanyOwnerProfile({
  company,
  stats,
  locale = 'pl'
}: CompanyOwnerProfileProps) {
  const { t } = useTranslations('companies')

  const socialLinks = company.socialLinks as SocialLinks | null
  const businessHours = company.businessHours as BusinessHours | null

  return (
    <div className="space-y-6">
      {/* Title row with action buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('profile.overview.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/companies/${company.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('profile.overview.viewPublic')}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/panel/company/profile`}>
              <Edit className="h-4 w-4 mr-2" />
              {t('profile.overview.editProfile')}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${locale}/panel/shorts/new`}>
              <Plus className="h-4 w-4 mr-2" />
              {t('profile.overview.addShort')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Header with banner, logo, name */}
      <CompanyProfileHeader
        companyId={company.id}
        companyName={company.companyName}
        slug={company.slug}
        logo={company.logo}
        banner={company.banner}
        categoryName={company.category?.name ?? null}
        viesVerified={company.viesVerified}
        street={company.street}
        postalCode={company.postalCode}
        city={company.city}
        phone={company.phone}
        website={company.website}
        socialLinks={socialLinks}
        businessHours={businessHours}
        latitude={company.latitude}
        longitude={company.longitude}
        showContactButton={false}
        isOwner={true}
        locale={locale}
      />

      {/* Stats cards */}
      <CompanyStatsCard
        viewsThisWeek={stats?.viewsThisWeek}
        viewsChange={stats?.viewsChange}
        activeCampaigns={stats?.activeCampaigns}
        walletBalance={stats?.walletBalance}
      />

      <Separator />

      {/* Description - full width */}
      {company.description ? (
        <Card>
          <CardContent className="pt-6">
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  script: () => null,
                  iframe: () => null,
                }}
                disallowedElements={['script', 'iframe', 'object', 'embed']}
                unwrapDisallowed={true}
              >
                {company.description}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>{t('profile.overview.noDescription')}</p>
            <Button variant="link" asChild className="mt-2">
              <Link href={`/${locale}/panel/company/profile`}>
                {t('profile.overview.addDescription')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
