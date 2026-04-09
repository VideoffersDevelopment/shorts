"use client"

import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTranslations } from '@/lib/i18n/client'
import { BusinessHoursDisplay } from './business-hours-display'
import { type BusinessHours } from './business-hours-picker'

interface BusinessHoursModalProps {
  hours: BusinessHours
  variant?: 'banner' | 'default'
  className?: string
}

export function BusinessHoursModal({ hours, variant = 'default', className }: BusinessHoursModalProps) {
  const { t } = useTranslations('companies')

  const hasAnyHours = Object.values(hours).some(h => h !== null && h !== undefined)
  if (!hasAnyHours) return null

  if (variant === 'banner') {
    return (
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <span className="text-xs">{t('businessHours.title')}</span>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('businessHours.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <BusinessHoursDisplay hours={hours} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Clock className="h-4 w-4 mr-2" />
          {t('businessHours.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('businessHours.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <BusinessHoursDisplay hours={hours} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
