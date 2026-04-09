"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Share2, Copy, Check, Link2 } from "lucide-react"
import { toast } from "sonner"

interface ShortShareButtonTranslations {
  copied: string
  copyLink: string
  openNewTab: string
  linkCopiedTitle: string
  linkCopiedDescription: string
  copyFailedTitle: string
  copyFailedDescription: string
}

interface ShortShareButtonProps {
  shortId: string
  title: string
  label?: string
  translations?: Partial<ShortShareButtonTranslations>
}

/**
 * Share button for public short view
 *
 * Features:
 * - Copy link to clipboard
 * - Native share API (if available)
 * - Tracks share event via API
 */
const defaultTranslations: ShortShareButtonTranslations = {
  copied: "Copied!",
  copyLink: "Copy link",
  openNewTab: "Open in new tab",
  linkCopiedTitle: "Link copied!",
  linkCopiedDescription: "The link has been copied to your clipboard.",
  copyFailedTitle: "Failed to copy",
  copyFailedDescription: "Please copy the link manually."
}

export function ShortShareButton({
  shortId,
  title,
  label = "Share",
  translations
}: ShortShareButtonProps) {
  const t = { ...defaultTranslations, ...translations }
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = `${appUrl}/shorts/${shortId}`

  // Track share event (fire-and-forget)
  const trackShare = useCallback(() => {
    fetch(`/api/shorts/${shortId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "share" })
    }).catch(console.error)
  }, [shortId])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      trackShare()

      toast.success(t.linkCopiedTitle, {
        description: t.linkCopiedDescription
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t.copyFailedTitle, {
        description: t.copyFailedDescription
      })
    }
  }, [shareUrl, trackShare, t.linkCopiedTitle, t.linkCopiedDescription, t.copyFailedTitle, t.copyFailedDescription])

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl
        })
        trackShare()
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error)
        }
      }
    }
  }, [title, shareUrl, trackShare])

  // Check if native share is available
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share

  if (hasNativeShare) {
    // On mobile, use native share
    return (
      <Button
        onClick={handleNativeShare}
        variant="outline"
        className="w-full"
      >
        <Share2 className="mr-2 h-4 w-4" />
        {label}
      </Button>
    )
  }

  // On desktop, show dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Share2 className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? t.copied : t.copyLink}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            window.open(shareUrl, "_blank")
            trackShare()
          }}
        >
          <Link2 className="mr-2 h-4 w-4" />
          {t.openNewTab}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
