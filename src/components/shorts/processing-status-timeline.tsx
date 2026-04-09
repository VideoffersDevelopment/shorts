"use client"

import { useTranslations } from "@/lib/i18n/client"
import { Check, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ShortStatus, PaymentStatus } from "@prisma/client"

interface ProcessingStatusTimelineProps {
  status: ShortStatus
  paymentStatus?: PaymentStatus
  processingError?: string
  estimatedTimeRemaining?: number
  className?: string
}

type TimelineStep = "draft" | "payment" | "processing" | "published"

interface Step {
  id: TimelineStep
  labelKey: string
  descriptionKey?: string
}

const STEPS: Step[] = [
  { id: "draft", labelKey: "timeline.draft" },
  { id: "payment", labelKey: "timeline.payment" },
  { id: "processing", labelKey: "timeline.processing" },
  { id: "published", labelKey: "timeline.published" }
]

function getActiveStep(status: ShortStatus): TimelineStep {
  switch (status) {
    case "DRAFT":
      return "draft"
    case "PENDING_PAYMENT":
      return "payment"
    case "PROCESSING":
      return "processing"
    case "PUBLISHED":
      return "published"
    case "ARCHIVED":
    case "DELETED":
      return "published"
    default:
      return "draft"
  }
}

function isStepComplete(stepId: TimelineStep, activeStep: TimelineStep): boolean {
  const stepOrder: TimelineStep[] = ["draft", "payment", "processing", "published"]
  const stepIndex = stepOrder.indexOf(stepId)
  const activeIndex = stepOrder.indexOf(activeStep)
  return stepIndex < activeIndex
}

function isStepActive(stepId: TimelineStep, activeStep: TimelineStep): boolean {
  return stepId === activeStep
}

export function ProcessingStatusTimeline({
  status,
  paymentStatus,
  processingError,
  estimatedTimeRemaining,
  className
}: ProcessingStatusTimelineProps) {
  const { t } = useTranslations("shorts")
  const activeStep = getActiveStep(status)

  // Skip payment step if not applicable
  // Cast to string to avoid TypeScript narrowing issues
  const statusStr = status as string
  const steps = STEPS.filter((step) => {
    // Always show payment step if status is PENDING_PAYMENT
    if (statusStr === "PENDING_PAYMENT") return true
    // Skip payment step for direct credit usage
    if (step.id === "payment" && statusStr !== "PENDING_PAYMENT") return false
    return true
  })

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        {steps.map((step, index) => {
          const isComplete = isStepComplete(step.id, activeStep)
          const isActive = isStepActive(step.id, activeStep)
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isActive && "border-primary bg-background",
                    !isComplete && !isActive && "border-muted-foreground/30 bg-background"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : isActive ? (
                    statusStr === "PROCESSING" || statusStr === "PENDING_PAYMENT" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-primary" />
                    )
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      "h-12 w-0.5 transition-colors",
                      isComplete ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-8">
                <p
                  className={cn(
                    "font-medium leading-10",
                    isComplete && "text-primary",
                    isActive && "text-foreground",
                    !isComplete && !isActive && "text-muted-foreground"
                  )}
                >
                  {t(step.labelKey)}
                </p>

                {/* Show estimated time for processing step */}
                {isActive && step.id === "processing" && estimatedTimeRemaining !== undefined && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("timeline.estimatedTime", {
                      minutes: Math.ceil(estimatedTimeRemaining / 60)
                    })}
                  </p>
                )}

                {/* Show error if any */}
                {isActive && processingError && (
                  <p className="text-sm text-destructive mt-1">{processingError}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
