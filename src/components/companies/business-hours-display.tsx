import { useTranslations } from '@/lib/i18n/client'
import type { BusinessHours } from './business-hours-picker'
import { cn } from '@/lib/utils'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

interface BusinessHoursDisplayProps {
  hours: BusinessHours
}

export function BusinessHoursDisplay({ hours }: BusinessHoursDisplayProps) {
  const { t } = useTranslations('companies')

  const hasAnyHours = Object.values(hours).some(h => h !== null && h !== undefined)
  if (!hasAnyHours) return null

  return (
    <div className="text-sm space-y-1">
      {DAYS.map(day => {
        const dayHours = hours[day]

        return (
          <div key={day} className="flex justify-between py-1">
            <span className="text-muted-foreground">
              {t(`businessHours.days.${day}`)}
            </span>
            <span className={cn(!dayHours && 'text-muted-foreground italic')}>
              {dayHours ? `${dayHours.open} - ${dayHours.close}` : t('businessHours.closed')}
            </span>
          </div>
        )
      })}
    </div>
  )
}
