"use client"

import { CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"
import type { NipValidationResult } from "@/app/actions/companies/validate-nip"
import type { ValidationStatus } from "@/hooks/use-nip-validation"

interface NipValidationStatusProps {
  status: ValidationStatus
  validationResult: NipValidationResult | null
  className?: string
}

export function NipValidationStatus({
  status,
  validationResult,
  className
}: NipValidationStatusProps) {
  const { t } = useTranslations("companies")

  // Validating state - show spinner
  if (status === "validating") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground mt-2",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t("nipValidation.validating")}</span>
      </div>
    )
  }

  // Idle state or no result - no feedback
  if (status === "idle" || !validationResult) {
    return null
  }

  // Error states (invalid format, already exists, VIES invalid)
  if (status === "error" || !validationResult.isValid || !validationResult.isUnique) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-destructive mt-2",
          className
        )}
        role="alert"
      >
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          {validationResult.error
            ? t(validationResult.error)
            : t("nipValidation.errors.unknown")}
        </span>
      </div>
    )
  }

  // Success with VIES verified
  if (validationResult.viesStatus === "verified") {
    return (
      <div
        className={cn(
          "flex items-start gap-2 text-sm text-green-600 dark:text-green-400 mt-2",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-medium">{t("nipValidation.success.verified")}</div>
          {validationResult.companyName && (
            <div className="text-muted-foreground">
              {validationResult.companyName}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Warning: VIES unavailable (still valid, but needs manual verification)
  if (validationResult.viesStatus === "unavailable") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 mt-2",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{t("nipValidation.warning.viesUnavailable")}</span>
      </div>
    )
  }

  return null
}
