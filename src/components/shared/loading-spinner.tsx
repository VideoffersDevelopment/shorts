"use client"

import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n/client'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const { t } = useTranslations('common')

  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={t("accessibility.loading")}
    >
      <span className="sr-only">{t("accessibility.loading")}...</span>
    </div>
  )
}
