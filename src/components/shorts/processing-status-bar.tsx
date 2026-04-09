"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/lib/i18n/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ShortStatus } from "@prisma/client"

interface ProcessingStatusBarProps {
  shortId: string
  initialStatus: ShortStatus
  processingError?: string | null
  className?: string
}

interface StatusResponse {
  status: ShortStatus
  hlsPlaylistUrl?: string | null
  processingError?: string | null
  estimatedTimeRemaining?: number
}

interface CheckTranscodingResponse {
  success: boolean
  status: string
  message: string
  percent?: number
  qencodeStatus?: string
  hlsPlaylistUrl?: string
  error?: string
}

/**
 * ProcessingStatusBar - Compact status indicator for processing shorts
 *
 * Features:
 * - Auto-polling every 5 seconds during PROCESSING
 * - Manual "Check Status" button (useful for localhost)
 * - Progress indicator with percentage
 * - Error display with retry option
 * - Auto-refresh page when status changes to PUBLISHED
 */
export function ProcessingStatusBar({
  shortId,
  initialStatus,
  processingError: initialError,
  className
}: ProcessingStatusBarProps) {
  const { t } = useTranslations("shorts")
  const router = useRouter()

  const [status, setStatus] = useState<ShortStatus>(initialStatus)
  const [error, setError] = useState<string | null>(initialError || null)
  const [percent, setPercent] = useState<number>(0)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Auto-polling for status updates
  useEffect(() => {
    if (status !== "PROCESSING") return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/shorts/${shortId}/status`)
        if (response.ok) {
          const data: StatusResponse = await response.json()

          if (data.status === "PUBLISHED") {
            setStatus("PUBLISHED")
            // Refresh the page to show updated content
            router.refresh()
          } else if (data.status === "DRAFT" && data.processingError) {
            setStatus("DRAFT")
            setError(data.processingError)
          }
        }
      } catch {
        // Silently fail - we'll try again
      }
    }

    // Initial check
    checkStatus()

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [shortId, status, router])

  // Manual check via Qencode API (for localhost)
  const handleManualCheck = useCallback(async () => {
    setIsChecking(true)
    setError(null)

    try {
      const response = await fetch(`/api/shorts/${shortId}/check-transcoding`, {
        method: "POST"
      })

      const data: CheckTranscodingResponse = await response.json()
      setLastChecked(new Date())

      if (!response.ok) {
        setError(data.error || data.message || "Failed to check status")
        return
      }

      if (data.percent !== undefined) {
        setPercent(data.percent)
      }

      if (data.status === "PUBLISHED") {
        setStatus("PUBLISHED")
        // Refresh the page
        router.refresh()
      } else if (data.status === "ERROR") {
        setError(data.message)
      }
    } catch {
      setError("Failed to check transcoding status")
    } finally {
      setIsChecking(false)
    }
  }, [shortId, router])

  // Don't render if not processing or published
  if (status !== "PROCESSING" && status !== "PUBLISHED" && !error) {
    return null
  }

  // Published state
  if (status === "PUBLISHED") {
    return (
      <Alert className={cn("border-green-500 bg-green-50 dark:bg-green-950/20", className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700 dark:text-green-400">
          {t("publishing.success.title")}
        </AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-500">
          {t("publishing.success.description")}
        </AlertDescription>
      </Alert>
    )
  }

  // Error state
  if (error && status === "DRAFT") {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("publishing.error.title")}</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => router.refresh()}
          >
            {t("publishing.error.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Processing state
  return (
    <Alert className={cn("border-blue-500 bg-blue-50 dark:bg-blue-950/20", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      <AlertTitle className="text-blue-700 dark:text-blue-400 flex items-center justify-between">
        <span>{t("publishing.processing.title")}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualCheck}
          disabled={isChecking}
          className="h-7 text-xs"
        >
          {isChecking ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-3 w-3" />
          )}
          {t("publishing.checkStatus") || "Sprawdz status"}
        </Button>
      </AlertTitle>
      <AlertDescription className="space-y-3 text-blue-600 dark:text-blue-500">
        <p>{t("publishing.processing.description")}</p>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span>{percent}%</span>
            {lastChecked && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Error during check */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </AlertDescription>
    </Alert>
  )
}
