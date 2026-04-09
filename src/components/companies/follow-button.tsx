"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useFollow } from "@/hooks/use-follow"

interface FollowButtonTranslations {
  follow: string
  following: string
  unfollow: string
  loginRequired: string
}

interface FollowButtonProps {
  companyId: string
  initialFollowing?: boolean
  initialFollowersCount?: number
  isAuthenticated: boolean
  translations: FollowButtonTranslations
  className?: string
  showCount?: boolean
}

export function FollowButton({
  companyId,
  initialFollowing = false,
  initialFollowersCount = 0,
  isAuthenticated,
  translations: t,
  className,
  showCount = false,
}: FollowButtonProps) {
  const { following, followersCount, toggle, isLoading } = useFollow({
    companyId,
    initialFollowing,
    initialFollowersCount,
  })

  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error(t.loginRequired)
      return
    }

    await toggle()
  }, [isAuthenticated, t.loginRequired, toggle])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const showUnfollow = following && isHovered

  const variant = following
    ? showUnfollow
      ? "destructive"
      : "default"
    : "outline"

  const label = following
    ? showUnfollow
      ? t.unfollow
      : t.following
    : t.follow

  const Icon = following ? UserCheck : UserPlus

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={isLoading}
      className={cn("gap-2 transition-all", className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
      {showCount && (
        <span className="text-xs opacity-70">({followersCount})</span>
      )}
    </Button>
  )
}
