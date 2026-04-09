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
import { ShortPlayer } from '@/components/shorts/short-player'
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
  const videoPlayer = (
    <div className="relative h-full w-auto overflow-hidden rounded-2xl" style={{ aspectRatio: '9/16' }}>
      <ShortPlayer
        hlsUrl={short.hlsPlaylistUrl}
        posterUrl={short.thumbnailUrl ?? undefined}
        title={short.title}
        autoPlay
        loop
        className="h-full w-full"
      />
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

  // Header = h-16 = 4rem, Footer = fixed 53px
  return (
    <div data-full-bleed className="h-full">
      {/* ─── DESKTOP LAYOUT (lg+) ───────────────────────────── */}
      <div className="hidden lg:flex h-full overflow-hidden">

        {/* Video area — height-constrained, video width from aspect-ratio */}
        <div className="flex-1 flex items-start justify-center gap-3 min-w-0 p-2 h-full relative">
          {/* Back button — top-left corner */}
          <div className="absolute top-2 left-3 z-10">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToFeed')}
              </Link>
            </Button>
          </div>

          {/* Video + Side actions — height fills available space */}
          <div className="h-full flex items-start gap-3">
            <div className="h-full w-auto">
              {videoPlayer}
            </div>
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
