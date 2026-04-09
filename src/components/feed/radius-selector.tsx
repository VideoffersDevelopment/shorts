"use client"

import { useTranslations } from '@/lib/i18n/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RadiusSelectorProps {
  value: number | undefined
  onChange: (radius: number | undefined) => void
  disabled?: boolean
}

const RADIUS_OPTIONS = [1, 5, 10, 25, 50] as const

export function RadiusSelector({ value, onChange, disabled }: RadiusSelectorProps) {
  const { t } = useTranslations('feed')

  return (
    <Select
      value={value?.toString() ?? 'all'}
      onValueChange={(v) => onChange(v === 'all' ? undefined : parseInt(v))}
      disabled={disabled}
    >
      <SelectTrigger className="w-32">
        <SelectValue placeholder={t('filters.location.radius')} />
      </SelectTrigger>
      <SelectContent>
        {RADIUS_OPTIONS.map((radius) => (
          <SelectItem key={radius} value={radius.toString()}>
            {radius} km
          </SelectItem>
        ))}
        <SelectItem value="all">
          {t('filters.location.radiusOptions.all')}
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
