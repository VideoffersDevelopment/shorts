"use client"

import { useState, useEffect, useCallback } from "react"
import { ShortPlayer } from "./short-player"
import type { ShortStatus } from "@prisma/client"

interface ShortDetailPlayerProps {
  shortId: string
  hlsPlaylistUrl: string | null
  thumbnailUrl: string | null
  title: string
  status: ShortStatus
  aspectRatio?: "9:16" | "16:9"
  processingText: string
  processingDescription: string
}

/**
 * ShortDetailPlayer - Client component for displaying video in short detail page
 * Handles raw video fallback during PROCESSING with status polling
 */
export function ShortDetailPlayer({
  shortId,
  hlsPlaylistUrl: initialHlsUrl,
  thumbnailUrl,
  title,
  status: initialStatus,
  aspectRatio = "9:16",
  processingText,
  processingDescription
}: ShortDetailPlayerProps) {
  const [status, setStatus] = useState(initialStatus)
  const [hlsPlaylistUrl, setHlsPlaylistUrl] = useState(initialHlsUrl)
  const [rawVideoUrl, setRawVideoUrl] = useState<string | null>(null)

  // Fetch raw video URL for DRAFT, PENDING_PAYMENT, and PROCESSING status
  // (when HLS is not yet available)
  const fetchRawVideoUrl = useCallback(async () => {
    // Only fetch raw video when HLS is not available
    if (hlsPlaylistUrl) {
      setRawVideoUrl(null)
      return
    }

    // Only fetch for statuses where raw video should be available
    const rawVideoStatuses = ['DRAFT', 'PENDING_PAYMENT', 'PROCESSING']
    if (!rawVideoStatuses.includes(status)) {
      setRawVideoUrl(null)
      return
    }

    try {
      const response = await fetch(`/api/shorts/${shortId}/raw-video-url`)
      if (response.ok) {
        const data = await response.json()
        setRawVideoUrl(data.rawVideoUrl)
      } else {
        setRawVideoUrl(null)
      }
    } catch {
      setRawVideoUrl(null)
    }
  }, [shortId, status, hlsPlaylistUrl])

  // Poll for status updates during PROCESSING
  useEffect(() => {
    if (status !== 'PROCESSING') return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/shorts/${shortId}/status`)
        if (response.ok) {
          const statusData = await response.json()

          // If status changed to PUBLISHED, update state
          if (statusData.status === 'PUBLISHED' && statusData.hlsPlaylistUrl) {
            setStatus(statusData.status)
            setHlsPlaylistUrl(statusData.hlsPlaylistUrl)
            setRawVideoUrl(null) // Clear raw URL
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [shortId, status])

  // Fetch raw video URL on mount if PROCESSING
  useEffect(() => {
    fetchRawVideoUrl()
  }, [fetchRawVideoUrl])

  // Show player if any video source is available
  const hasVideo = hlsPlaylistUrl || rawVideoUrl

  if (hasVideo) {
    return (
      <ShortPlayer
        hlsUrl={hlsPlaylistUrl}
        rawVideoUrl={rawVideoUrl}
        posterUrl={thumbnailUrl ?? undefined}
        title={title}
        status={status}
        aspectRatio={aspectRatio}
      />
    )
  }

  // Processing state without raw video yet
  if (status === 'PROCESSING' || status === 'PENDING_PAYMENT') {
    return (
      <div className="aspect-[9/16] bg-muted flex flex-col items-center justify-center rounded-lg">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 mb-4" />
          <p className="text-sm font-medium">{processingText}</p>
          <p className="text-xs text-muted-foreground mt-1 text-center px-4">
            {processingDescription}
          </p>
        </div>
      </div>
    )
  }

  // Fallback: show thumbnail or placeholder
  return (
    <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Brak miniatury
        </div>
      )}
    </div>
  )
}
