"use client"

import { useState, useEffect, useCallback } from "react"
import { ShortPlayer } from "./short-player"
import { ShortCompanyCard } from "./short-company-card"
import { ShortCtaButton } from "./short-cta-button"
import { ShortLocationMap } from "./short-location-map"
import { ShortShareButton } from "./short-share-button"
import { SuperLikeButton } from "./super-like-button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Archive, Eye, Heart, Tag } from "lucide-react"
import type { Short, Category, CompanyProfile, ShortStats, Tag as TagModel, ShortTag } from "@prisma/client"

type ShortWithRelations = Short & {
  company: Pick<CompanyProfile, "id" | "companyName" | "slug" | "logo" | "city" | "categoryId" | "userId"> & {
    category: Pick<Category, "id" | "name" | "slug"> | null
  }
  category: Pick<Category, "id" | "name" | "slug">
  tags: Array<ShortTag & { tag: Pick<TagModel, "id" | "name" | "slug"> }>
  stats: ShortStats | null
}

interface PublicShortViewTranslations {
  by: string
  views: string
  likes: string
  share: string
  visitWebsite: string
  viewCompany: string
  archived: string
  archivedMessage: string
  videoNotAvailable: string
  openInMaps: string
  copied: string
  copyLink: string
  openNewTab: string
  linkCopiedTitle: string
  linkCopiedDescription: string
  copyFailedTitle: string
  copyFailedDescription: string
  superLike: string
  superLikeSent: string
  superLikeLogin: string
  superLikeOwn: string
  superLikeInsufficient: string
  superLikeFailed: string
}

interface PublicShortViewProps {
  short: ShortWithRelations
  locale: string
  translations: PublicShortViewTranslations
  isAuthenticated?: boolean
  currentUserId?: string | null
}

export function PublicShortView({
  short,
  locale,
  translations: t,
  isAuthenticated = false,
  currentUserId = null
}: PublicShortViewProps) {
  const [currentShort, setCurrentShort] = useState(short)
  const [rawVideoUrl, setRawVideoUrl] = useState<string | null>(null)
  const isArchived = currentShort.status === "ARCHIVED"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

  // Fetch raw video URL if status is PROCESSING
  const fetchRawVideoUrl = useCallback(async () => {
    if (currentShort.status !== 'PROCESSING') {
      setRawVideoUrl(null)
      return
    }

    try {
      const response = await fetch(`/api/shorts/${currentShort.id}/raw-video-url`)
      if (response.ok) {
        const data = await response.json()
        setRawVideoUrl(data.rawVideoUrl)
      } else {
        console.warn('Raw video URL not available:', response.status)
        setRawVideoUrl(null)
      }
    } catch (error) {
      console.error('Failed to fetch raw video URL:', error)
      setRawVideoUrl(null)
    }
  }, [currentShort.id, currentShort.status])

  // Poll for status updates during PROCESSING
  useEffect(() => {
    if (currentShort.status !== 'PROCESSING') return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/shorts/${currentShort.id}/status`)
        if (response.ok) {
          const statusData = await response.json()

          // If status changed to PUBLISHED, fetch full short data
          if (statusData.status === 'PUBLISHED' && statusData.hlsPlaylistUrl) {
            setCurrentShort(prev => ({
              ...prev,
              status: statusData.status,
              hlsPlaylistUrl: statusData.hlsPlaylistUrl
            }))
            setRawVideoUrl(null) // Clear raw URL
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [currentShort.id, currentShort.status])

  // Fetch raw video URL on mount if PROCESSING
  useEffect(() => {
    fetchRawVideoUrl()
  }, [fetchRawVideoUrl])

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Archived banner */}
      {isArchived && (
        <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
          <Archive className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {t.archivedMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Video column */}
        <div className="space-y-6">
          {/* Video player */}
          <div className="relative mx-auto max-w-[360px] lg:max-w-none">
            <ShortPlayer
              hlsUrl={currentShort.hlsPlaylistUrl}
              rawVideoUrl={rawVideoUrl}
              posterUrl={currentShort.thumbnailUrl ?? undefined}
              title={currentShort.title}
              status={currentShort.status}
              aspectRatio="9:16"
            />
          </div>

          {/* Mobile: Title, stats, and share */}
          <div className="lg:hidden space-y-4">
            <h1 className="text-2xl font-bold">{currentShort.title}</h1>

            {/* Stats row + Super Like */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {currentShort.stats?.views ?? 0} {t.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {currentShort.stats?.likes ?? 0} {t.likes}
                </span>
              </div>
              {!isArchived && (
                <SuperLikeButton
                  shortId={currentShort.id}
                  isAuthenticated={isAuthenticated}
                  isOwnShort={currentUserId === currentShort.company.userId}
                  translations={{
                    superLike: t.superLike,
                    sent: t.superLikeSent,
                    loginRequired: t.superLikeLogin,
                    ownShort: t.superLikeOwn,
                    insufficientCredits: t.superLikeInsufficient,
                    failed: t.superLikeFailed,
                  }}
                />
              )}
            </div>

            {/* Share button */}
            <ShortShareButton
              shortId={currentShort.id}
              title={currentShort.title}
              label={t.share}
              translations={{
                copied: t.copied,
                copyLink: t.copyLink,
                openNewTab: t.openNewTab,
                linkCopiedTitle: t.linkCopiedTitle,
                linkCopiedDescription: t.linkCopiedDescription,
                copyFailedTitle: t.copyFailedTitle,
                copyFailedDescription: t.copyFailedDescription
              }}
            />
          </div>
        </div>

        {/* Info column */}
        <div className="space-y-6">
          {/* Desktop: Title and stats */}
          <div className="hidden lg:block space-y-4">
            <h1 className="text-2xl font-bold">{currentShort.title}</h1>

            {/* Stats row + Super Like */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {currentShort.stats?.views ?? 0} {t.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {currentShort.stats?.likes ?? 0} {t.likes}
                </span>
              </div>
              {!isArchived && (
                <SuperLikeButton
                  shortId={currentShort.id}
                  isAuthenticated={isAuthenticated}
                  isOwnShort={currentUserId === currentShort.company.userId}
                  translations={{
                    superLike: t.superLike,
                    sent: t.superLikeSent,
                    loginRequired: t.superLikeLogin,
                    ownShort: t.superLikeOwn,
                    insufficientCredits: t.superLikeInsufficient,
                    failed: t.superLikeFailed,
                  }}
                />
              )}
            </div>
          </div>

          {/* Description */}
          {currentShort.description && (
            <p className="text-muted-foreground">{currentShort.description}</p>
          )}

          {/* Category badge */}
          <div>
            <Badge variant="secondary">{currentShort.category.name}</Badge>
          </div>

          {/* Tags */}
          {currentShort.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentShort.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* CTA button */}
          {currentShort.ctaLink && (
            <ShortCtaButton
              shortId={currentShort.id}
              ctaLink={currentShort.ctaLink}
              label={t.visitWebsite}
            />
          )}

          {/* Company card */}
          <ShortCompanyCard
            company={currentShort.company}
            locale={locale}
            viewProfileLabel={t.viewCompany}
          />

          {/* Location map */}
          {currentShort.latitude && currentShort.longitude && (
            <ShortLocationMap
              latitude={currentShort.latitude}
              longitude={currentShort.longitude}
              address={currentShort.address ?? undefined}
              openInMapsLabel={t.openInMaps}
            />
          )}

          {/* Desktop: Share button */}
          <div className="hidden lg:block">
            <ShortShareButton
              shortId={currentShort.id}
              title={currentShort.title}
              label={t.share}
              translations={{
                copied: t.copied,
                copyLink: t.copyLink,
                openNewTab: t.openNewTab,
                linkCopiedTitle: t.linkCopiedTitle,
                linkCopiedDescription: t.linkCopiedDescription,
                copyFailedTitle: t.copyFailedTitle,
                copyFailedDescription: t.copyFailedDescription
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
