"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  ThumbsUp,
  ThumbsDown,
  Flame,
  Heart,
  Laugh,
  Star,
  HandMetal,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useReaction } from "@/hooks/use-reaction"
import type { LikeType } from "@prisma/client"
import type { ComponentType } from "react"

interface IconProps {
  className?: string
}

interface ReactionButtonProps {
  shortId: string
  initialLiked?: boolean
  initialType?: LikeType | null
  initialCounts?: Partial<Record<LikeType, number>>
  initialTotalLikes?: number
  isAuthenticated: boolean
  translations: {
    like: string
    dislike: string
    fire: string
    heart: string
    laugh: string
    wow: string
    clap: string
    loginRequired: string
    rateLimited: string
  }
  className?: string
}

const reactionIcons: Record<
  string,
  { icon: ComponentType<IconProps>; key: keyof ReactionButtonProps["translations"] }
> = {
  LIKE: { icon: ThumbsUp, key: "like" },
  FIRE: { icon: Flame, key: "fire" },
  HEART: { icon: Heart, key: "heart" },
  LAUGH: { icon: Laugh, key: "laugh" },
  WOW: { icon: Star, key: "wow" },
  CLAP: { icon: HandMetal, key: "clap" },
}

const emojiTypes: LikeType[] = ["FIRE", "HEART", "LAUGH", "WOW", "CLAP"]

export function ReactionButton({
  shortId,
  initialLiked = false,
  initialType = null,
  initialCounts = {},
  initialTotalLikes = 0,
  isAuthenticated,
  translations: t,
  className,
}: ReactionButtonProps) {
  const {
    liked,
    currentType,
    totalLikes,
    toggle,
    isLoading,
  } = useReaction({
    shortId,
    initialLiked,
    initialType,
    initialCounts,
    initialTotalLikes,
  })

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleReaction = useCallback(
    async (type: LikeType) => {
      if (!isAuthenticated) {
        toast.error(t.loginRequired)
        return
      }

      setAnimating(true)
      setTimeout(() => setAnimating(false), 300)

      await toggle(type)
      setPopoverOpen(false)
    },
    [isAuthenticated, t, toggle]
  )

  const handleMainClick = useCallback(() => {
    handleReaction("LIKE" as LikeType)
  }, [handleReaction])

  const handleDislike = useCallback(() => {
    handleReaction("DISLIKE" as LikeType)
  }, [handleReaction])

  // Determine which icon to show on the main button
  const isEmojiType =
    liked && currentType && currentType !== "LIKE" && currentType !== "DISLIKE"
  const mainReaction = isEmojiType
    ? reactionIcons[currentType as string]
    : reactionIcons.LIKE
  const MainIcon = mainReaction?.icon ?? ThumbsUp

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Main like button */}
      <Button
        variant={liked && currentType !== "DISLIKE" ? "default" : "outline"}
        size="sm"
        onClick={handleMainClick}
        disabled={isLoading}
        className={cn(
          "gap-1.5 transition-all duration-200",
          liked &&
            currentType !== "DISLIKE" &&
            "bg-primary text-primary-foreground",
          animating && "scale-110"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MainIcon
            className={cn(
              "h-4 w-4 transition-all",
              liked && currentType !== "DISLIKE" && "fill-current"
            )}
          />
        )}
        <span className="text-xs tabular-nums">{totalLikes}</span>
      </Button>

      {/* Emoji reactions popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isLoading}
          >
            <span className="text-xs">+</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-auto p-1"
        >
          <div className="flex items-center gap-0.5">
            {emojiTypes.map((type) => {
              const reaction = reactionIcons[type]
              if (!reaction) return null
              const Icon = reaction.icon
              const isActive = liked && currentType === type
              return (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(type)}
                  disabled={isLoading}
                  className={cn(
                    "h-8 w-8 p-0 transition-all duration-200 hover:scale-125",
                    isActive && "bg-accent text-accent-foreground scale-110"
                  )}
                  title={t[reaction.key]}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive && "fill-current"
                    )}
                  />
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Dislike button */}
      <Button
        variant={liked && currentType === "DISLIKE" ? "default" : "ghost"}
        size="sm"
        onClick={handleDislike}
        disabled={isLoading}
        className={cn(
          "h-8 w-8 p-0 transition-all duration-200",
          liked &&
            currentType === "DISLIKE" &&
            "bg-destructive text-destructive-foreground",
          animating && currentType === "DISLIKE" && "scale-110"
        )}
        title={t.dislike}
      >
        {isLoading && currentType === "DISLIKE" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown
            className={cn(
              "h-4 w-4",
              liked && currentType === "DISLIKE" && "fill-current"
            )}
          />
        )}
      </Button>
    </div>
  )
}
