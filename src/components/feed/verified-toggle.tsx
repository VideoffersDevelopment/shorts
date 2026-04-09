"use client"

import { useTranslations } from '@/lib/i18n/client'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { BadgeCheck } from 'lucide-react'

interface VerifiedToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function VerifiedToggle({ checked, onChange }: VerifiedToggleProps) {
  const { t } = useTranslations('feed')

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-blue-500" />
        <div className="space-y-0.5">
          <Label htmlFor="verified-toggle" className="text-sm font-medium">
            {t('filters.verifiedOnly.label')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('filters.verifiedOnly.description')}
          </p>
        </div>
      </div>
      <Switch
        id="verified-toggle"
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  )
}
