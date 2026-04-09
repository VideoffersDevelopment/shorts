"use client"

import { Check } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

export type WizardStep = "video" | "metadata" | "thumbnail" | "review"

const STEPS: WizardStep[] = ["video", "metadata", "thumbnail", "review"]

interface StepIndicatorProps {
  currentStep: WizardStep
  completedSteps: WizardStep[]
  onStepClick?: (step: WizardStep) => void
}

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick
}: StepIndicatorProps) {
  const { t } = useTranslations("shorts")

  const getStepIndex = (step: WizardStep): number => {
    return STEPS.indexOf(step)
  }

  const isStepComplete = (step: WizardStep): boolean => {
    return completedSteps.includes(step)
  }

  const isStepActive = (step: WizardStep): boolean => {
    return step === currentStep
  }

  const isStepClickable = (step: WizardStep): boolean => {
    // Can click on completed steps or the step immediately after the last completed step
    if (isStepComplete(step)) return true

    const stepIndex = getStepIndex(step)
    const currentIndex = getStepIndex(currentStep)

    // Can only go back or stay
    return stepIndex <= currentIndex
  }

  const handleStepClick = (step: WizardStep) => {
    if (isStepClickable(step) && onStepClick) {
      onStepClick(step)
    }
  }

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isComplete = isStepComplete(step)
          const isActive = isStepActive(step)
          const isClickable = isStepClickable(step)
          const isLast = index === STEPS.length - 1

          return (
            <li
              key={step}
              className={cn(
                "relative flex items-center",
                !isLast && "flex-1"
              )}
            >
              {/* Step circle */}
              <button
                type="button"
                onClick={() => handleStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isActive && !isComplete && "border-primary bg-background text-primary",
                  !isActive && !isComplete && "border-muted-foreground/25 bg-background text-muted-foreground",
                  isClickable && !isActive && "hover:border-primary/50 cursor-pointer",
                  !isClickable && "cursor-default"
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>

              {/* Step label */}
              <span
                className={cn(
                  "ml-3 text-sm font-medium hidden sm:block",
                  isActive && "text-foreground",
                  !isActive && "text-muted-foreground"
                )}
              >
                {t(`wizard.steps.${step}`)}
              </span>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "hidden flex-1 mx-4 h-0.5 sm:block",
                    isComplete ? "bg-primary" : "bg-muted-foreground/25"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile step label */}
      <p className="mt-4 text-center text-sm font-medium sm:hidden">
        {t(`wizard.steps.${currentStep}`)} ({getStepIndex(currentStep) + 1}/{STEPS.length})
      </p>
    </nav>
  )
}
