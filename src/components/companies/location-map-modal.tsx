"use client"

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
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

// Dynamic import for map to avoid SSR issues
const StaticLocationMap = dynamic(
  () => import('./static-location-map').then(mod => mod.StaticLocationMap),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-lg bg-muted animate-pulse" /> }
)

interface LocationMapModalProps {
  latitude: number
  longitude: number
  companyName: string
  address?: string | null
  variant?: 'banner' | 'default'
  className?: string
}

export function LocationMapModal({
  latitude,
  longitude,
  companyName,
  address,
  variant = 'default',
  className
}: LocationMapModalProps) {
  const { t } = useTranslations('companies')

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
                <MapPin className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <span className="text-xs">{t('header.showLocation')}</span>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {companyName}
            </DialogTitle>
            {address && (
              <p className="text-sm text-muted-foreground">{address}</p>
            )}
          </DialogHeader>
          <div className="py-4">
            <StaticLocationMap
              latitude={latitude}
              longitude={longitude}
              className="h-80"
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <MapPin className="h-4 w-4 mr-2" />
          {t('header.showLocation')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {companyName}
          </DialogTitle>
          {address && (
            <p className="text-sm text-muted-foreground">{address}</p>
          )}
        </DialogHeader>
        <div className="py-4">
          <StaticLocationMap
            latitude={latitude}
            longitude={longitude}
            className="h-80"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
