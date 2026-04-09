"use client"

import { useCallback, useMemo } from "react"
import "@vidstack/react/player/styles/default/theme.css"
import "@vidstack/react/player/styles/default/layouts/video.css"
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react"
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import type { ShortStatus } from "@prisma/client"

interface ShortPlayerProps {
  hlsUrl?: string | null
  rawVideoUrl?: string | null
  posterUrl?: string
  title: string
  status?: ShortStatus
  autoPlay?: boolean
  muted?: boolean
  aspectRatio?: "9:16" | "16:9"
  onPlay?: () => void
  onEnded?: () => void
  className?: string
}

/**
 * ShortPlayer - HLS Video Player using @vidstack/react
 *
 * Features:
 * - HLS streaming support with raw video fallback during processing
 * - Poster/thumbnail display
 * - Responsive aspect ratios (9:16 for vertical, 16:9 for horizontal)
 * - Play/ended callbacks for analytics
 * - Smooth transition from raw to HLS when transcoding completes
 */
export function ShortPlayer({
  hlsUrl,
  rawVideoUrl,
  posterUrl,
  title,
  status,
  autoPlay = false,
  muted = false,
  aspectRatio = "9:16",
  onPlay,
  onEnded,
  className
}: ShortPlayerProps) {

  const handlePlay = useCallback(() => {
    onPlay?.()
  }, [onPlay])

  const handleEnded = useCallback(() => {
    onEnded?.()
  }, [onEnded])

  // Determine video source priority: HLS > Raw > None
  // Returns vidstack-compatible source object with explicit type
  const videoSource = useMemo(() => {
    // Priority 1: HLS (best quality, processed)
    if (hlsUrl) {
      return {
        src: hlsUrl,
        type: 'application/x-mpegurl' as const, // HLS MIME type
        sourceType: 'hls' as const
      }
    }

    // Priority 2: Raw video (fallback for DRAFT, PENDING_PAYMENT, PROCESSING)
    // Show raw video when HLS is not yet available
    const rawVideoStatuses = ['DRAFT', 'PENDING_PAYMENT', 'PROCESSING']
    if (rawVideoUrl && status && rawVideoStatuses.includes(status)) {
      // Use video/mp4 as default - browsers handle most formats with this MIME type
      // Vidstack will auto-detect if needed via content sniffing
      return {
        src: rawVideoUrl,
        type: 'video/mp4' as const,
        sourceType: 'raw' as const
      }
    }

    // No video available
    return null
  }, [hlsUrl, rawVideoUrl, status])


  // Calculate aspect ratio class
  const aspectClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"

  // Show placeholder if no video source
  if (!videoSource) {
    return (
      <div className={cn("relative w-full bg-muted flex items-center justify-center", aspectClass, className)}>
        <p className="text-muted-foreground text-sm">Video nie jest dostępne</p>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full", aspectClass, className)}>
      <MediaPlayer
        src={{ src: videoSource.src, type: videoSource.type }}
        viewType="video"
        streamType="on-demand"
        logLevel="warn"
        crossOrigin
        playsInline
        title={title}
        autoPlay={autoPlay}
        muted={muted}
        onPlay={handlePlay}
        onEnded={handleEnded}
        aspectRatio={aspectRatio === "9:16" ? "9/16" : "16/9"}
        className="h-full w-full overflow-hidden rounded-lg [&_video]:object-contain"
      >
        <MediaProvider>
          {posterUrl && (
            <Poster
              className="absolute inset-0 block h-full w-full rounded-lg object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
              src={posterUrl}
              alt={title}
            />
          )}
        </MediaProvider>

        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          thumbnails={posterUrl}
        />
      </MediaPlayer>

      {/* Processing badge when playing raw video */}
      {status === 'PROCESSING' && videoSource.sourceType === 'raw' && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-md bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Przetwarzanie w tle...
        </div>
      )}
    </div>
  )
}
