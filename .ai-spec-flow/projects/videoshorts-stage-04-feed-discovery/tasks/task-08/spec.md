# Task 08: Short Detail Page

## Overview

**Priority:** MEDIUM
**Dependencies:** task-02, task-03
**Complexity:** Simple (9 files, ~9k tokens)
**Status:** pending

## What to Build

Create the public short detail page:
1. /shorts/[id] route for public viewing
2. ShortDetailView component with full video player
3. Company info section with CTA
4. Server action to fetch public short

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/(main)/[locale]/shorts/[id]/page.tsx` | Create | Public short detail page |
| `src/components/shorts/short-detail-view.tsx` | Create | Full short player view |
| `src/app/actions/shorts/get-public.ts` | Create | Fetch public short action |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/locales/pl/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/en/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/de/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/es/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/ru/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |
| `src/lib/locales/uk/shorts.json` | Add backToFeed, viewOffer, viewCompany, relatedShorts keys |

## Implementation Details

### 1. Get Public Short Action

```typescript
// src/app/actions/shorts/get-public.ts
"use server"

import { prisma } from '@/lib/prisma'
import type { FeedShort } from '@/lib/types/feed'

export interface PublicShortDetail extends FeedShort {
  description: string | null
  tags: Array<{ name: string; slug: string }>
  relatedShorts: FeedShort[]
}

export async function getPublicShort(id: string): Promise<PublicShortDetail | null> {
  try {
    const short = await prisma.short.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        hlsPlaylistUrl: true,
        duration: true,
        publishedAt: true,
        ctaLink: true,
        latitude: true,
        longitude: true,
        stats: {
          select: {
            views: true,
            likes: true,
            ctaClicks: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            logo: true,
            viesVerified: true,
            city: true,
            description: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!short) return null

    // Increment view count (fire and forget)
    incrementViewCount(id).catch(console.error)

    // Fetch related shorts (same category, excluding current)
    const relatedShorts = await prisma.short.findMany({
      where: {
        status: 'PUBLISHED',
        categoryId: short.category?.id,
        id: { not: id },
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        hlsPlaylistUrl: true,
        duration: true,
        publishedAt: true,
        ctaLink: true,
        stats: {
          select: {
            views: true,
            likes: true,
            ctaClicks: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            logo: true,
            viesVerified: true,
            city: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    })

    return {
      id: short.id,
      title: short.title,
      description: short.description,
      thumbnailUrl: short.thumbnailUrl,
      hlsPlaylistUrl: short.hlsPlaylistUrl,
      duration: short.duration,
      publishedAt: short.publishedAt.toISOString(),
      views: short.stats?.views ?? 0,
      likes: short.stats?.likes ?? 0,
      ctaClicks: short.stats?.ctaClicks ?? 0,
      location: short.company?.city ?? null,
      distance: null,
      company: {
        id: short.company!.id,
        name: short.company!.companyName,
        slug: short.company!.slug,
        logo: short.company!.logo,
        verified: short.company!.viesVerified,
      },
      category: {
        id: short.category!.id,
        name: short.category!.name,
        slug: short.category!.slug,
      },
      ctaLink: short.ctaLink,
      tags: short.tags.map((t) => ({
        name: t.tag.name,
        slug: t.tag.slug,
      })),
      relatedShorts: relatedShorts.map((rs) => ({
        id: rs.id,
        title: rs.title,
        thumbnailUrl: rs.thumbnailUrl,
        hlsPlaylistUrl: rs.hlsPlaylistUrl,
        duration: rs.duration,
        publishedAt: rs.publishedAt.toISOString(),
        views: rs.stats?.views ?? 0,
        likes: rs.stats?.likes ?? 0,
        ctaClicks: rs.stats?.ctaClicks ?? 0,
        location: rs.company?.city ?? null,
        distance: null,
        company: {
          id: rs.company!.id,
          name: rs.company!.companyName,
          slug: rs.company!.slug,
          logo: rs.company!.logo,
          verified: rs.company!.viesVerified,
        },
        category: {
          id: rs.category!.id,
          name: rs.category!.name,
          slug: rs.category!.slug,
        },
        ctaLink: rs.ctaLink,
      })),
    }
  } catch (error) {
    console.error('Error fetching public short:', error)
    return null
  }
}

async function incrementViewCount(shortId: string): Promise<void> {
  await prisma.shortStats.update({
    where: { shortId },
    data: {
      views: { increment: 1 },
    },
  })
}
```

### 2. ShortDetailView Component

```typescript
// src/components/shorts/short-detail-view.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Eye,
  Heart,
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
import type { PublicShortDetail } from '@/app/actions/shorts/get-public'

interface ShortDetailViewProps {
  short: PublicShortDetail
}

export function ShortDetailView({ short }: ShortDetailViewProps) {
  const locale = useLocale()
  const t = useTranslations('shorts')
  const tFeed = useTranslations('feed')

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(progress)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * videoRef.current.duration
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }

  // Autoplay on mount
  useEffect(() => {
    if (videoRef.current && short.hlsPlaylistUrl) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
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
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-5 w-5" />
              <span>{formatCount(short.likes)}</span>
            </div>
            <Button variant="ghost" size="sm">
              <Share2 className="h-5 w-5 mr-2" />
              Share
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
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href={`/${locale}/companies/${short.company.slug}`}>
                  {t('viewCompany')}
                </Link>
              </Button>
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
```

### 3. Short Detail Page

```typescript
// src/app/(main)/[locale]/shorts/[id]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ShortDetailView } from '@/components/shorts/short-detail-view'
import { getPublicShort } from '@/app/actions/shorts/get-public'

interface ShortDetailPageProps {
  params: Promise<{
    locale: string
    id: string
  }>
}

export async function generateMetadata({
  params,
}: ShortDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const short = await getPublicShort(id)

  if (!short) {
    return {
      title: 'Short not found',
    }
  }

  return {
    title: short.title,
    description: short.description ?? `Watch ${short.title} by ${short.company.name}`,
    openGraph: {
      title: short.title,
      description: short.description ?? undefined,
      images: short.thumbnailUrl ? [short.thumbnailUrl] : undefined,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: short.title,
      description: short.description ?? undefined,
      images: short.thumbnailUrl ? [short.thumbnailUrl] : undefined,
    },
  }
}

export default async function ShortDetailPage({ params }: ShortDetailPageProps) {
  const { id, locale } = await params
  const short = await getPublicShort(id)

  if (!short) {
    notFound()
  }

  return <ShortDetailView short={short} />
}
```

### 4. Add Translations (to shorts.json)

Add these keys to each language's shorts.json file:

**English (en):**
```json
{
  "backToFeed": "Back to feed",
  "viewOffer": "View offer",
  "viewCompany": "View company",
  "relatedShorts": "Related shorts"
}
```

**Polish (pl):**
```json
{
  "backToFeed": "Wróć do feedu",
  "viewOffer": "Zobacz ofertę",
  "viewCompany": "Zobacz firmę",
  "relatedShorts": "Podobne shorty"
}
```

**German (de):**
```json
{
  "backToFeed": "Zurück zum Feed",
  "viewOffer": "Angebot ansehen",
  "viewCompany": "Unternehmen ansehen",
  "relatedShorts": "Ähnliche Shorts"
}
```

**Spanish (es):**
```json
{
  "backToFeed": "Volver al feed",
  "viewOffer": "Ver oferta",
  "viewCompany": "Ver empresa",
  "relatedShorts": "Shorts relacionados"
}
```

**Russian (ru):**
```json
{
  "backToFeed": "Вернуться к ленте",
  "viewOffer": "Посмотреть предложение",
  "viewCompany": "Посмотреть компанию",
  "relatedShorts": "Похожие shorts"
}
```

**Ukrainian (uk):**
```json
{
  "backToFeed": "Повернутися до стрічки",
  "viewOffer": "Переглянути пропозицію",
  "viewCompany": "Переглянути компанію",
  "relatedShorts": "Схожі shorts"
}
```

## Acceptance Criteria

- [ ] /shorts/[id] page loads for published shorts
- [ ] 404 returned for non-existent or non-published shorts
- [ ] Video autoplays (muted) on page load
- [ ] Play/pause controls work
- [ ] Mute/unmute works
- [ ] Progress bar shows video progress
- [ ] Fullscreen works
- [ ] View count increments on page load
- [ ] Title and description displayed
- [ ] Tags are clickable (link to search)
- [ ] CTA button links to external URL
- [ ] Company card shows with link to company page
- [ ] Related shorts section shows similar shorts
- [ ] Back button returns to feed
- [ ] OG/Twitter meta tags generated
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- At least one published short in database

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to /shorts/{id} | Page loads | `/pl/shorts/{id}` |
| 2 | Check video | Autoplays muted | `<video>` element |
| 3 | Click video | Toggles play/pause | Video element |
| 4 | Click mute button | Sound toggles | Volume icon button |
| 5 | Check title | Displayed correctly | `<h1>` |
| 6 | Check company card | Shows company info | Card with logo |
| 7 | Click company link | Navigates to company | `/companies/{slug}` |
| 8 | Check related shorts | Grid of similar shorts | Related section |
| 9 | Check CTA button | Links externally | External link button |
| 10 | Click back button | Returns to feed | `/` |

### Screenshot Checkpoints
- `01-short-detail.png` - Full page view
- `02-video-playing.png` - Video playing
- `03-company-card.png` - Company information
- `04-related-shorts.png` - Related shorts grid

## Notes

1. **View Counting:** Views are incremented asynchronously to not block page load.

2. **Video Player:** Uses native HTML5 video for simplicity. Consider HLS.js for advanced streaming support if needed.

3. **Related Shorts:** Fetches shorts from the same category, ordered by newest.

4. **SEO:** OpenGraph and Twitter card metadata generated for social sharing.

5. **Translation Keys:** New keys added to existing shorts.json namespace to avoid creating a new file.
