"use client"

import { useState, useCallback } from "react"
import type { FollowResponse } from "@/lib/types/interactions"

interface UseFollowOptions {
  companyId: string
  initialFollowing?: boolean
  initialFollowersCount?: number
}

interface UseFollowReturn {
  following: boolean
  followersCount: number
  toggle: () => Promise<void>
  isLoading: boolean
}

export function useFollow({
  companyId,
  initialFollowing = false,
  initialFollowersCount = 0,
}: UseFollowOptions): UseFollowReturn {
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [isLoading, setIsLoading] = useState(false)

  const toggle = useCallback(async () => {
    // Save previous state for rollback
    const prevFollowing = following
    const prevFollowersCount = followersCount

    // Optimistic update
    const nowFollowing = !following
    setFollowing(nowFollowing)
    setFollowersCount((prev) => nowFollowing ? prev + 1 : Math.max(prev - 1, 0))

    setIsLoading(true)

    try {
      const response = await fetch(`/api/companies/${companyId}/follow`, {
        method: nowFollowing ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        // Rollback on error
        setFollowing(prevFollowing)
        setFollowersCount(prevFollowersCount)
        return
      }

      const data: FollowResponse = await response.json()
      setFollowing(data.following)
      setFollowersCount(data.followersCount)
    } catch {
      // Rollback on error
      setFollowing(prevFollowing)
      setFollowersCount(prevFollowersCount)
    } finally {
      setIsLoading(false)
    }
  }, [companyId, following, followersCount])

  return {
    following,
    followersCount,
    toggle,
    isLoading,
  }
}
