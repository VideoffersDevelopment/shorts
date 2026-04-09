"use client"

import { useState, useCallback } from "react"
import type { LikeType } from "@prisma/client"
import type { LikeResponse } from "@/lib/types/interactions"

interface UseReactionOptions {
  shortId: string
  initialLiked?: boolean
  initialType?: LikeType | null
  initialCounts?: Partial<Record<LikeType, number>>
  initialTotalLikes?: number
}

interface UseReactionReturn {
  liked: boolean
  currentType: LikeType | null
  counts: Partial<Record<LikeType, number>>
  totalLikes: number
  toggle: (type: LikeType) => Promise<void>
  isLoading: boolean
}

export function useReaction({
  shortId,
  initialLiked = false,
  initialType = null,
  initialCounts = {},
  initialTotalLikes = 0,
}: UseReactionOptions): UseReactionReturn {
  const [liked, setLiked] = useState(initialLiked)
  const [currentType, setCurrentType] = useState<LikeType | null>(initialType)
  const [counts, setCounts] = useState<Partial<Record<LikeType, number>>>(initialCounts)
  const [totalLikes, setTotalLikes] = useState(initialTotalLikes)
  const [isLoading, setIsLoading] = useState(false)

  const toggle = useCallback(async (type: LikeType) => {
    // Save previous state for rollback
    const prevLiked = liked
    const prevType = currentType
    const prevCounts = { ...counts }
    const prevTotalLikes = totalLikes

    // Optimistic update
    if (liked && currentType === type) {
      // Toggle off - same type clicked again
      setLiked(false)
      setCurrentType(null)
      setCounts((prev) => ({
        ...prev,
        [type]: Math.max((prev[type] ?? 0) - 1, 0),
      }))
      setTotalLikes((prev) => Math.max(prev - 1, 0))
    } else if (liked && currentType !== type) {
      // Switch type
      setCurrentType(type)
      setCounts((prev) => ({
        ...prev,
        [currentType!]: Math.max((prev[currentType!] ?? 0) - 1, 0),
        [type]: (prev[type] ?? 0) + 1,
      }))
    } else {
      // Turn on
      setLiked(true)
      setCurrentType(type)
      setCounts((prev) => ({
        ...prev,
        [type]: (prev[type] ?? 0) + 1,
      }))
      setTotalLikes((prev) => prev + 1)
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/shorts/${shortId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        // Rollback on error
        setLiked(prevLiked)
        setCurrentType(prevType)
        setCounts(prevCounts)
        setTotalLikes(prevTotalLikes)
        return
      }

      const data: LikeResponse = await response.json()
      setLiked(data.liked)
      setCurrentType(data.type)
      setCounts(data.counts)
      setTotalLikes(data.totalLikes)
    } catch {
      // Rollback on error
      setLiked(prevLiked)
      setCurrentType(prevType)
      setCounts(prevCounts)
      setTotalLikes(prevTotalLikes)
    } finally {
      setIsLoading(false)
    }
  }, [shortId, liked, currentType, counts, totalLikes])

  return {
    liked,
    currentType,
    counts,
    totalLikes,
    toggle,
    isLoading,
  }
}
