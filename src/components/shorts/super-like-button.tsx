"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Heart, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SuperLikeButtonProps {
  shortId: string
  isAuthenticated: boolean
  isOwnShort: boolean
  translations: {
    superLike: string
    sent: string
    loginRequired: string
    ownShort: string
    insufficientCredits: string
    failed: string
  }
  className?: string
}

export function SuperLikeButton({
  shortId,
  isAuthenticated,
  isOwnShort,
  translations: t,
  className
}: SuperLikeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleClick = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error(t.loginRequired)
      return
    }

    if (isOwnShort) {
      toast.error(t.ownShort)
      return
    }

    if (isSent) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/shorts/${shortId}/super-like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 402) {
          toast.error(t.insufficientCredits)
        } else {
          toast.error(data.error || t.failed)
        }
        return
      }

      setIsSent(true)
      setAnimating(true)
      toast.success(t.sent)

      setTimeout(() => setAnimating(false), 1000)
    } catch {
      toast.error(t.failed)
    } finally {
      setIsLoading(false)
    }
  }, [shortId, isAuthenticated, isOwnShort, isSent, t])

  const disabled = isLoading || isSent || isOwnShort

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isSent ? "default" : "outline"}
            size="sm"
            onClick={handleClick}
            disabled={disabled}
            className={cn(
              "gap-2 transition-all",
              isSent && "bg-pink-500 hover:bg-pink-600 text-white border-pink-500",
              animating && "scale-110",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={cn(
                  "h-4 w-4 transition-all",
                  isSent && "fill-current",
                  animating && "animate-pulse"
                )}
              />
            )}
            {isSent ? t.sent : t.superLike}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isOwnShort ? t.ownShort : t.superLike}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
