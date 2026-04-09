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
  MessageCircle,
  X,
  TextIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FeedCard } from '@/components/feed/feed-card'
import { ReactionButton } from '@/components/shorts/reaction-button'
import { CommentsSection } from '@/components/shorts/comments-section'
import { FollowButton } from '@/components/companies/follow-button'
import { cn } from '@/lib/utils'
import type { PublicShortDetail } from '@/app/actions/shorts/get-public'
import type { LikeType } from '@prisma/client'

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
  const commentsSectionRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [panelOpen, setPanelOpen] = useState(true)

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

  const scrollToComments = useCallback(() => {
    if (!panelOpen) setPanelOpen(true)
    setTimeout(() => {
      commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }, [panelOpen])

  useEffect(() => {
    if (videoRef.current && short.hlsPlaylistUrl) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [short.hlsPlaylistUrl])

  const reactionTranslations = {
    like: t('reactions.like'),
    dislike: t('reactions.dislike'),
    fire: t('reactions.fire'),
    heart: t('reactions.heart'),
    laugh: t('reactions.laugh'),
    wow: t('reactions.wow'),
    clap: t('reactions.clap'),
    loginRequired: t('reactions.loginRequired'),
    rateLimited: t('reactions.rateLimited'),
  }

  const commentTranslations = {
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
  }

  // ─── VIDEO PLAYER ────────────────────────────────────────
  const videoPlayer = (
    <div className="relative bg-black rounded-2xl overflow-hidden h-full" style={{ aspectRatio: '9/16' }}>
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
          {/* Play/Pause center overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 fill-white" />}
            </Button>
          </div>
          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div
              className="h-1 bg-white/30 rounded-full cursor-pointer mb-3"
              onClick={handleSeek}
              role="slider"
              aria-label="Video progress"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
            >
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 w-8 p-0" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <span className="text-white/70 text-xs flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {formatCount(short.views)}
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 w-8 p-0" onClick={toggleFullscreen}>
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : short.thumbnailUrl ? (
        <Image src={short.thumbnailUrl} alt={short.title} fill className="object-contain" />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Play className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
    </div>
  )

  // ─── SIDE ACTIONS (TikTok-style) ─────────────────────────
  const sideActions = (
    <div className="flex flex-col items-center gap-4 flex-shrink-0">
      {/* Company avatar */}
      <Link href={`/${locale}/companies/${short.company.slug}`}>
        {short.company.logo ? (
          <Image
            src={short.company.logo}
            alt={short.company.name}
            width={44}
            height={44}
            className="rounded-full object-cover border-2 border-primary"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary border-2 border-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">
              {short.company.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Link>

      {/* Reactions */}
      <ReactionButton
        shortId={short.id}
        initialLiked={short.userInteraction?.reaction.liked ?? false}
        initialType={(short.userInteraction?.reaction.type as LikeType) ?? null}
        initialTotalLikes={short.userInteraction?.reaction.totalLikes ?? short.likes}
        initialCounts={(short.userInteraction?.reaction.counts ?? { LIKE: short.likes }) as Partial<Record<LikeType, number>>}
        isAuthenticated={isAuthenticated}
        translations={reactionTranslations}
        className="flex-col"
      />

      {/* Comment shortcut */}
      <button
        onClick={scrollToComments}
        className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <MessageCircle className="h-5 w-5" />
        </div>
        <span className="text-xs">{formatCount(short.comments ?? 0)}</span>
      </button>

      {/* Share */}
      <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Share2 className="h-5 w-5" />
        </div>
        <span className="text-xs">{t('public.share')}</span>
      </button>
    </div>
  )

  // ─── RIGHT PANEL CONTENT ─────────────────────────────────
  const panelContent = (
    <div className="space-y-4 px-4 py-4">
      {/* Company + Follow */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/companies/${short.company.slug}`}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          {short.company.logo ? (
            <Image
              src={short.company.logo}
              alt={short.company.name}
              width={40}
              height={40}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">{short.company.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate">{short.company.name}</span>
              {short.company.verified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
            </div>
            {short.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{short.location}</span>
              </div>
            )}
          </div>
        </Link>
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

      {/* Title & Description */}
      <div>
        <h1 className="text-lg font-bold leading-tight">{short.title}</h1>
        {short.description && (
          <p className="text-sm text-muted-foreground mt-1">{short.description}</p>
        )}
      </div>

      {/* Tags + Category */}
      <div className="flex flex-wrap gap-1.5">
        <Link href={`/${locale}?categoryIds=${short.category.id}`}>
          <Badge variant="outline" className="cursor-pointer text-xs">{short.category.name}</Badge>
        </Link>
        {short.tags.map((tag) => (
          <Link key={tag.slug} href={`/${locale}/search?q=${encodeURIComponent(tag.name)}`}>
            <Badge variant="secondary" className="cursor-pointer hover:bg-accent text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* CTA */}
      {short.ctaLink && (
        <Button className="w-full" asChild>
          <a href={short.ctaLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('viewOffer')}
          </a>
        </Button>
      )}

      <div className="border-t" />

      {/* Comments */}
      <div ref={commentsSectionRef}>
        <CommentsSection
          shortId={short.id}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          translations={commentTranslations}
        />
      </div>
    </div>
  )

  // Header = h-16 = 4rem
  return (
    <div data-full-bleed>
      {/* ─── DESKTOP LAYOUT (lg+) ───────────────────────────── */}
      <div className="hidden lg:flex h-[calc(100vh-4rem)] overflow-hidden">

        {/* Video area — fills remaining space, centers video */}
        <div className="flex-1 flex items-center justify-center gap-3 min-w-0 relative">
          {/* Back button — top-left corner */}
          <div className="absolute top-2 left-3 z-10">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToFeed')}
              </Link>
            </Button>
          </div>

          {/* Video + Side actions — grouped so actions align to video bottom */}
          <div className="h-full py-2 flex items-center gap-3" style={{ maxHeight: '720px' }}>
            {videoPlayer}
            <div className="h-full flex items-end">
              {sideActions}
            </div>
          </div>
        </div>

        {/* Panel toggle — visible pill button */}
        <div className="flex-shrink-0 flex items-start pt-3">
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={cn(
              "flex items-center justify-center rounded-l-lg border border-r-0 border-border",
              "bg-muted/50 hover:bg-muted transition-colors",
              "h-10 w-7"
            )}
            title={panelOpen ? 'Zwiń panel' : 'Rozwiń panel'}
          >
            {panelOpen ? (
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <TextIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Right panel — collapsible, flush to right edge */}
        <div
          className={cn(
            "flex-shrink-0 border-l border-border overflow-y-auto transition-all duration-300 ease-in-out scrollbar-thin",
            panelOpen ? "w-[380px] opacity-100" : "w-0 opacity-0 overflow-hidden border-l-0"
          )}
        >
          {panelContent}
        </div>
      </div>

      {/* ─── MOBILE LAYOUT (< lg) ───────────────────────────── */}
      <div className="lg:hidden">
        {/* Back */}
        <div className="px-4 pt-2 pb-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('backToFeed')}
            </Link>
          </Button>
        </div>

        {/* Video + side actions — full width */}
        <div className="flex justify-center gap-1 px-2">
          <div className="flex-1" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
            {videoPlayer}
          </div>
          <div className="flex-shrink-0">
            {sideActions}
          </div>
        </div>

        {/* Info panel below */}
        {panelContent}

        {/* Related Shorts */}
        {short.relatedShorts.length > 0 && (
          <section className="px-4 py-6 border-t border-border">
            <h2 className="text-lg font-semibold mb-4">{t('relatedShorts')}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              {short.relatedShorts.map((related) => (
                <div key={related.id} className="w-36 flex-shrink-0 snap-start">
                  <FeedCard short={related} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── Related Shorts (Desktop only) ───────────────────── */}
      {short.relatedShorts.length > 0 && (
        <section className="hidden lg:block border-t border-border px-4 py-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">{t('relatedShorts')}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              {short.relatedShorts.map((related) => (
                <div key={related.id} className="w-36 flex-shrink-0 snap-start">
                  <FeedCard short={related} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
