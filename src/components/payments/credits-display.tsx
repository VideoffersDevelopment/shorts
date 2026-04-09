"use client"

import { useCallback } from "react"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreditsDisplayProps {
  credits: number
  showPurchaseButton?: boolean
  onPurchase?: () => void
  size?: "sm" | "default" | "lg"
  className?: string
}

/**
 * CreditsDisplay - Shows current credit balance
 *
 * Features:
 * - Credit count badge
 * - Optional purchase button
 * - Multiple size variants
 */
export function CreditsDisplay({
  credits,
  showPurchaseButton = false,
  onPurchase,
  size = "default",
  className
}: CreditsDisplayProps) {
  const { t } = useTranslations("payments")

  const handlePurchase = useCallback(() => {
    onPurchase?.()
  }, [onPurchase])

  const sizeClasses = {
    sm: "text-sm",
    default: "text-base",
    lg: "text-lg"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  }

  const badgeVariant = credits > 0 ? "default" : "secondary"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={badgeVariant} className={cn("flex items-center gap-1.5", sizeClasses[size])}>
        <Coins className={iconSizes[size]} />
        <span className="font-semibold">{credits}</span>
        <span>{credits === 1 ? t("credits.credit") : t("credits.plural")}</span>
      </Badge>

      {showPurchaseButton && onPurchase && (
        <Button
          variant="outline"
          size={size === "lg" ? "default" : "sm"}
          onClick={handlePurchase}
          className="gap-1"
        >
          <Plus className={iconSizes[size]} />
          {t("credits.buy")}
        </Button>
      )}
    </div>
  )
}

/**
 * CreditsBalance - Large credit balance display for credits page
 */
interface CreditsBalanceProps {
  credits: number
  className?: string
}

export function CreditsBalance({ credits, className }: CreditsBalanceProps) {
  const { t } = useTranslations("payments")

  return (
    <div className={cn("text-center", className)}>
      <div className="flex items-center justify-center gap-3 mb-2">
        <Coins className="h-10 w-10 text-primary" />
        <span className="text-5xl font-bold">{credits}</span>
      </div>
      <p className="text-muted-foreground">
        {credits === 1 ? t("credits.creditAvailable") : t("credits.pluralAvailable")}
      </p>
    </div>
  )
}
