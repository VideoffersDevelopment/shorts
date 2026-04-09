"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useTranslations } from '@/lib/i18n/client'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Eye,
  ExternalLink,
  BadgeCheck,
  MapPin,
  Tag,
  ArrowLeft,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FeedCard } from '@/components/feed/feed-card'
import { ReactionButton } from '@/components/shorts/reaction-button'
import { CommentsSection } from '@/components/shorts/comments-section'
import { FollowButton } from '@/components/companies/follow-button'
import type { PublicShortDetail } from '@/app/actions/shorts/get-public'

interface ShortDetailViewProps {
  short: PublicShortDetail
}

export function ShortDetailView({ short }: ShortDetailViewProps) {
  const locale = useLocale()
  const { data: session } = useSession()
  const { t } = useTranslations('shorts')
  const { t: tCompanies } = useTranslations('companies')

  const isAuthenticated = !!session?.user
  const currentUserId = session?.user?.id ?? null
  const isAdmin = session?.user?.role === 'ADMIN'

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)

  const formatCount = useCallback((count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }, [])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(currentProgress)
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * videoRef.current.duration
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }, [])

  // Autoplay on mount
  useEffect(() => {
    if (videoRef.current && short.hlsPlaylistUrl) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Autoplay blocked, user needs to interact
      })
    }
  }, [short.hlsPlaylistUrl])

  return (
    <div className="container py-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToFeed')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Section */}
        <div className="lg:col-span-2">
          <div className="relative aspect-[9/16] max-h-[80vh] bg-black rounded-2xl overflow-hidden mx-auto">
            {short.hlsPlaylistUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={short.hlsPlaylistUrl}
                  poster={short.thumbnailUrl ?? undefined}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onClick={togglePlay}
                />

                {/* Video controls overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="rounded-full bg-black/50 text-white hover:bg-black/70"
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 fill-white" />
                    )}
                  </Button>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  {/* Progress bar */}
                  <div
                    className="h-1 bg-white/30 rounded-full cursor-pointer mb-4"
                    onClick={handleSeek}
                    role="slider"
                    aria-label="Video progress"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    tabIndex={0}
                  >
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={toggleMute}
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={toggleFullscreen}
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : short.thumbnailUrl ? (
              <Image
                src={short.thumbnailUrl}
                alt={short.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Play className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-5 w-5" />
              <span>{formatCount(short.views)}</span>
            </div>
            <ReactionButton
              shortId={short.id}
              initialLiked={short.userInteraction?.reaction.liked ?? false}
              initialType={(short.userInteraction?.reaction.type as import('@prisma/client').LikeType) ?? null}
              initialTotalLikes={short.userInteraction?.reaction.totalLikes ?? short.likes}
              initialCounts={(short.userInteraction?.reaction.counts ?? { LIKE: short.likes }) as Partial<Record<import('@prisma/client').LikeType, number>>}
              isAuthenticated={isAuthenticated}
              translations={{
                like: t('reactions.like'),
                dislike: t('reactions.dislike'),
                fire: t('reactions.fire'),
                heart: t('reactions.heart'),
                laugh: t('reactions.laugh'),
                wow: t('reactions.wow'),
                clap: t('reactions.clap'),
                loginRequired: t('reactions.loginRequired'),
                rateLimited: t('reactions.rateLimited'),
              }}
            />
            <Button variant="ghost" size="sm">
              <Share2 className="h-5 w-5 mr-2" />
              {t('public.share')}
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Title & Description */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{short.title}</h1>
            {short.description && (
              <p className="text-muted-foreground">{short.description}</p>
            )}
          </div>

          {/* Tags */}
          {short.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {short.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/${locale}/search?q=${encodeURIComponent(tag.name)}`}
                >
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* CTA Button */}
          {short.ctaLink && (
            <Button className="w-full" size="lg" asChild>
              <a href={short.ctaLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-5 w-5 mr-2" />
                {t('viewOffer')}
              </a>
            </Button>
          )}

          {/* Company Card */}
          <Card>
            <CardContent className="p-4">
              <Link
                href={`/${locale}/companies/${short.company.slug}`}
                className="flex items-center gap-4 hover:opacity-80 transition-opacity"
              >
                {short.company.logo ? (
                  <Image
                    src={short.company.logo}
                    alt={short.company.name}
                    width={56}
                    height={56}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {short.company.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{short.company.name}</h3>
                    {short.company.verified && (
                      <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  {short.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{short.location}</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/${locale}/companies/${short.company.slug}`}>
                    {t('viewCompany')}
                  </Link>
                </Button>
                <FollowButton
                  companyId={short.company.id}
                  initialFollowing={short.userInteraction?.following ?? false}
                  initialFollowersCount={short.userInteraction?.followersCount ?? 0}
                  isAuthenticated={isAuthenticated}
                  showCount
                  translations={{
                    follow: tCompanies('follow.follow'),
                    following: tCompanies('follow.following'),
                    unfollow: tCompanies('follow.unfollow'),
                    loginRequired: tCompanies('follow.loginRequired'),
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <div>
            <Link href={`/${locale}?categoryIds=${short.category.id}`}>
              <Badge variant="outline" className="cursor-pointer">
                {short.category.name}
              </Badge>
            </Link>
          </div>

          {/* Comments */}
          <CommentsSection
            shortId={short.id}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            translations={{
              title: t('comments.title'),
              count: t('comments.count'),
              placeholder: t('comments.placeholder'),
              submit: t('comments.submit'),
              edit: t('comments.edit'),
              reply: t('comments.reply'),
              delete: t('comments.delete'),
              deleted: t('comments.deleted'),
              edited: t('comments.edited'),
              editExpired: t('comments.editExpired'),
              loginRequired: t('comments.loginRequired'),
              pending: t('comments.pending'),
              empty: t('comments.empty'),
              sortNewest: t('comments.sortNewest'),
              sortOldest: t('comments.sortOldest'),
              sortMostLiked: t('comments.sortMostLiked'),
              charLimit: t('comments.charLimit'),
              loadMore: t('comments.loadMore'),
              confirmDelete: t('comments.confirmDelete'),
              deleteSuccess: t('comments.deleteSuccess'),
              deleteFailed: t('comments.deleteFailed'),
              createFailed: t('comments.createFailed'),
              editFailed: t('comments.editFailed'),
            }}
          />
        </div>
      </div>

      {/* Related Shorts */}
      {short.relatedShorts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-6">{t('relatedShorts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {short.relatedShorts.map((related) => (
              <FeedCard key={related.id} short={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
