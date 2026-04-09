"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from '@/lib/i18n/client'
import { CompanyProfileHeader } from './company-profile-header'
import { type BusinessHours } from './business-hours-picker'
import ReactMarkdown from 'react-markdown'
import { Play, Plus, Video, Eye } from 'lucide-react'
import type { Prisma } from '@prisma/client'

interface SocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
}

interface CompanyShort {
  id: string
  title: string
  thumbnailUrl: string | null
  hlsPlaylistUrl: string | null
  duration: number | null
  stats: {
    views: number
    likes: number
  } | null
}

interface CompanyPublicProfileProps {
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
  shorts?: CompanyShort[]
  isOwner?: boolean
  locale?: string
}

function formatViews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

export function CompanyPublicProfile({
  company,
  shorts = [],
  isOwner = false,
  locale = 'pl'
}: CompanyPublicProfileProps) {
  const { t } = useTranslations('companies')

  const socialLinks = company.socialLinks as SocialLinks | null
  const businessHours = company.businessHours as BusinessHours | null

  return (
    <div className="space-y-6">
      {/* Header with banner, logo, name, social links, contact */}
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
        showContactButton={true}
        isOwner={isOwner}
        locale={locale}
      />

      {/* Description - full width */}
      {company.description && (
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
      )}

      <Separator />

      {/* Video section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('profile.stats.shorts')}</h2>
          {isOwner && (
            <Button asChild size="sm">
              <Link href={`/${locale}/panel/shorts/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {t('profile.addShort')}
              </Link>
            </Button>
          )}
        </div>

        {shorts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isOwner ? t('profile.noShortsOwner.title') : t('profile.noShorts.title')}
              </h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                {isOwner ? t('profile.noShortsOwner.description') : t('profile.noShorts.description')}
              </p>
              {isOwner && (
                <Button asChild>
                  <Link href={`/${locale}/panel/shorts/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('profile.addShort')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shorts.map((short) => (
              <Link
                key={short.id}
                href={`/${locale}/shorts/${short.id}`}
                className="group relative aspect-[9/16] bg-muted rounded-lg overflow-hidden"
              >
                {/* Thumbnail */}
                {short.thumbnailUrl ? (
                  <Image
                    src={short.thumbnailUrl}
                    alt={short.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary ml-1" />
                    </div>
                  </div>
                )}

                {/* Play overlay on hover */}
                {short.thumbnailUrl && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="rounded-full bg-black/50 p-3">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>
                )}

                {/* Gradient overlay for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Views count */}
                <div className="absolute top-2 left-2">
                  <div className="flex items-center gap-1 text-white text-xs bg-black/60 px-1.5 py-0.5 rounded">
                    <Eye className="h-3 w-3" />
                    {formatViews(short.stats?.views ?? 0)}
                  </div>
                </div>

                {/* Title */}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-sm font-medium line-clamp-2">
                    {short.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
