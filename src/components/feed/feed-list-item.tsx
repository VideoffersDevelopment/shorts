"use client"

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useTranslations } from '@/lib/i18n/client'
import {
  ExternalLink,
  BadgeCheck,
  MapPin,
  Share2,
  MessageCircle,
  X,
  TextIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShortPlayer } from '@/components/shorts/short-player'
import { ReactionButton } from '@/components/shorts/reaction-button'
import { CommentsSection } from '@/components/shorts/comments-section'
import { FollowButton } from '@/components/companies/follow-button'
import { cn } from '@/lib/utils'
import type { FeedShort } from '@/lib/types/feed'
import type { LikeType } from '@prisma/client'

type SlideState = 'active' | 'adjacent' | 'idle'

interface FeedListItemProps {
  short: FeedShort
  /** 'active' = playing + panel, 'adjacent' = preloaded player, 'idle' = thumbnail only */
  state: SlideState
}

export function FeedListItem({ short, state }: FeedListItemProps) {
  const locale = useLocale()
  const { data: session } = useSession()
  const { t } = useTranslations('shorts')
  const { t: tCompanies } = useTranslations('companies')

  const isAuthenticated = !!session?.user
  const currentUserId = session?.user?.id ?? null
  const isAdmin = session?.user?.role === 'ADMIN'

  const commentsSectionRef = useRef<HTMLDivElement>(null)
  const [panelOpen, setPanelOpen] = useState(true)

  const formatCount = useCallback((count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }, [])

  const scrollToComments = useCallback(() => {
    if (!panelOpen) setPanelOpen(true)
    setTimeout(() => {
      commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 150)
  }, [panelOpen])

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
  const renderPlayer = state === 'active' || state === 'adjacent'

  const videoPlayer = renderPlayer ? (
    <div className="relative h-full overflow-hidden rounded-2xl" style={{ aspectRatio: '9/16' }}>
      <ShortPlayer
        hlsUrl={short.hlsPlaylistUrl}
        posterUrl={short.thumbnailUrl ?? undefined}
        title={short.title}
        autoPlay={state === 'active'}
        muted={state === 'adjacent'}
        loop
        className="h-full w-full"
      />
    </div>
  ) : (
    // idle — thumbnail only
    <Link
      href={`/${locale}/shorts/${short.id}`}
      className="relative block h-full overflow-hidden rounded-2xl bg-muted"
      style={{ aspectRatio: '9/16' }}
    >
      {short.thumbnailUrl ? (
        <Image
          src={short.thumbnailUrl}
          alt={short.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 400px"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Video</span>
        </div>
      )}
    </Link>
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
        initialLiked={false}
        initialType={null}
        initialTotalLikes={short.likes}
        initialCounts={{ LIKE: short.likes } as Partial<Record<LikeType, number>>}
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
          initialFollowing={false}
          initialFollowersCount={0}
          isAuthenticated={isAuthenticated}
          showCount={false}
          translations={{
            follow: tCompanies('follow.follow'),
            following: tCompanies('follow.following'),
            unfollow: tCompanies('follow.unfollow'),
            loginRequired: tCompanies('follow.loginRequired'),
          }}
        />
      </div>

      {/* Title */}
      <div>
        <h2 className="text-lg font-bold leading-tight">{short.title}</h2>
      </div>

      {/* Category badge */}
      <div className="flex flex-wrap gap-1.5">
        <Link href={`/${locale}/category/${short.category.slug}`}>
          <Badge variant="outline" className="cursor-pointer text-xs">{short.category.name}</Badge>
        </Link>
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

      {/* Comments — only render when active to avoid fetching for all slides */}
      {state === 'active' && (
        <div ref={commentsSectionRef}>
          <CommentsSection
            shortId={short.id}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            translations={commentTranslations}
          />
        </div>
      )}
    </div>
  )

  // ─── LAYOUT ──────────────────────────────────────────────
  return (
    <div className="h-full w-full">
      {/* ─── DESKTOP (lg+) ──────────────────────────────── */}
      <div className="hidden lg:flex h-full overflow-hidden">
        {/* Video area — top-aligned, fills remaining space */}
        <div className="flex-1 flex items-start justify-center gap-3 min-w-0 py-2">
          <div className="h-full flex items-start gap-3">
            {videoPlayer}
            <div className="h-full flex items-end">
              {sideActions}
            </div>
          </div>
        </div>

        {/* Panel toggle */}
        <div className="flex-shrink-0 flex items-start pt-3">
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={cn(
              "flex items-center justify-center rounded-l-lg border border-r-0 border-border",
              "bg-muted/50 hover:bg-muted transition-colors",
              "h-10 w-7"
            )}
          >
            {panelOpen ? (
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <TextIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Right panel — full height, top-aligned, collapsible */}
        <div
          className={cn(
            "flex-shrink-0 border-l border-border overflow-y-auto transition-all duration-300 ease-in-out scrollbar-thin",
            panelOpen ? "w-[380px] opacity-100" : "w-0 opacity-0 overflow-hidden border-l-0"
          )}
        >
          {panelContent}
        </div>
      </div>

      {/* ─── MOBILE (< lg) ──────────────────────────────── */}
      <div className="lg:hidden h-full flex flex-col">
        {/* Video + side actions */}
        <div className="flex-1 flex justify-center gap-1 px-2 min-h-0">
          <div className="flex-1 min-h-0">
            {videoPlayer}
          </div>
          <div className="flex-shrink-0 flex items-end pb-4">
            {sideActions}
          </div>
        </div>

        {/* Bottom info — scrollable overflow */}
        <div className="flex-shrink-0 max-h-[30%] overflow-y-auto border-t border-border">
          {panelContent}
        </div>
      </div>
    </div>
  )
}
