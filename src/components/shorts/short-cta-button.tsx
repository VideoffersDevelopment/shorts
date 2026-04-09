"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface ShortCtaButtonProps {
  shortId: string
  ctaLink: string
  label?: string
}

/**
 * CTA button for public short view
 *
 * Features:
 * - Opens link in new tab
 * - Tracks click via API (fire-and-forget)
 * - Adds UTM parameters automatically
 * - Validates URL before opening
 */
export function ShortCtaButton({
  shortId,
  ctaLink,
  label = "Visit Website"
}: ShortCtaButtonProps) {
  const handleClick = useCallback(() => {
    // Validate URL first
    try {
      const url = new URL(ctaLink)
      // Check it's http/https
      if (!["http:", "https:"].includes(url.protocol)) {
        console.error("Invalid CTA link protocol:", ctaLink)
        return
      }

      // Track CTA click (fire-and-forget)
      fetch(`/api/shorts/${shortId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "cta_click" })
      }).catch(console.error)

      // Add UTM parameters
      url.searchParams.set("utm_source", "videoshorts")
      url.searchParams.set("utm_medium", "short")
      url.searchParams.set("utm_campaign", shortId)

      // Open in new tab
      window.open(url.toString(), "_blank", "noopener,noreferrer")
    } catch {
      console.error("Invalid CTA link:", ctaLink)
    }
  }, [shortId, ctaLink])

  return (
    <Button
      onClick={handleClick}
      className="cta-button w-full"
      size="lg"
    >
      {label}
      <ExternalLink className="ml-2 h-4 w-4" />
    </Button>
  )
}
