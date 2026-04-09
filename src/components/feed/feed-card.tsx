"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useState, useCallback } from 'react'
import { Play, Heart, MessageCircle, Share2, BadgeCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useFollow } from '@/hooks/use-follow'
import { FeedVideoPreview } from './feed-video-preview'
import type { FeedShort } from '@/lib/types/feed'

interface FeedCardProps {
  short: FeedShort
}

export function FeedCard({ short }: FeedCardProps) {
  const locale = useLocale()
  const t = useTranslations('feed')
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  const [showPreview, setShowPreview] = useState(false)
  const [imageError, setImageError] = useState(false)

  const { following, toggle: toggleFollow, isLoading: isFollowLoading } = useFollow({
    companyId: short.company.id,
  })

  const handleMouseEnter = useCallback(() => {
    if (short.hlsPlaylistUrl) setShowPreview(true)
  }, [short.hlsPlaylistUrl])

  const handleMouseLeave = useCallback(() => {
    setShowPreview(false)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleVideoError = useCallback(() => {
    setShowPreview(false)
  }, [])

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
    return count.toString()
  }

  return (
    <Link
      href={`/${locale}/shorts/${short.id}`}
      className="group relative block"
    >
      <div
        className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-muted"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thumbnail */}
        {short.thumbnailUrl && !imageError ? (
          <Image
            src={short.thumbnailUrl}
            alt={short.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Video preview on hover */}
        {showPreview && short.hlsPlaylistUrl && (
          <div className="absolute inset-0 z-10">
            <FeedVideoPreview
              src={short.hlsPlaylistUrl}
              className="absolute inset-0"
              onError={handleVideoError}
            />
          </div>
        )}

        {/* Play icon overlay */}
        {!showPreview && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="rounded-full bg-black/50 p-4">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-10" />

        {/* Right side action buttons */}
        <div className="absolute right-2.5 bottom-36 flex flex-col items-center gap-3 z-20">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow">
              {formatCount(short.likes)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            {(short.comments ?? 0) > 0 && (
              <span className="text-white text-xs font-medium drop-shadow">
                {formatCount(short.comments!)}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Share2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 z-20 space-y-2">
          {/* Company row */}
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="flex-shrink-0">
              {short.company.logo ? (
                <Image
                  src={short.company.logo}
                  alt={short.company.name}
                  width={36}
                  height={36}
                  className="rounded-full border-2 border-white/40 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary border-2 border-white/40 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {short.company.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Name + location */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold text-sm leading-tight truncate">
                  {short.company.name}
                </span>
                {short.company.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-white/70 text-xs truncate leading-tight">
                {[short.location, short.category.name].filter(Boolean).join(' • ')}
              </p>
            </div>

            {/* Follow button */}
            <button
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                following
                  ? "bg-white/20 border border-white/60 text-white"
                  : "border border-white/60 text-white hover:bg-white/20"
              )}
              disabled={isFollowLoading}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (!isAuthenticated) {
                  toast.error(t('card.loginToFollow' as 'card.follow'))
                  return
                }
                toggleFollow()
              }}
            >
              {following ? t('card.following') : t('card.follow')}
            </button>
          </div>

          {/* Title */}
          <p className="text-white text-sm font-medium line-clamp-2 leading-snug pr-12">
            {short.title}
          </p>

          {/* CTA button */}
          {short.ctaLink && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                window.open(short.ctaLink!, '_blank', 'noopener,noreferrer')
              }}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl",
                "bg-primary text-primary-foreground text-sm font-semibold",
                "hover:bg-primary/90 transition-colors"
              )}
            >
              {t('card.cta')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
