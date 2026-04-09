"use client"

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface FeedVideoPreviewProps {
  src: string
  className?: string
  onError?: () => void
}

export function FeedVideoPreview({ src, className, onError }: FeedVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Autoplay muted
    video.muted = true
    video.loop = true
    video.playsInline = true

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented
        onError?.()
      })
    }

    return () => {
      video.pause()
    }
  }, [src, onError])

  return (
    <video
      ref={videoRef}
      src={src}
      className={cn('w-full h-full object-cover', className)}
      muted
      loop
      playsInline
    />
  )
}
