'use client'

import { useTranslations } from '@/lib/i18n/client'
import { Copy, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type Day = (typeof DAYS)[number]

interface DayHours {
  open: string // HH:MM format
  close: string // HH:MM format
}

export interface BusinessHours {
  monday?: DayHours | null
  tuesday?: DayHours | null
  wednesday?: DayHours | null
  thursday?: DayHours | null
  friday?: DayHours | null
  saturday?: DayHours | null
  sunday?: DayHours | null
}

interface BusinessHoursPickerProps {
  value: BusinessHours
  onChange: (hours: BusinessHours) => void
  disabled?: boolean
}

export function BusinessHoursPicker({
  value,
  onChange,
  disabled = false,
}: BusinessHoursPickerProps) {
  const { t } = useTranslations('companies')

  const handleDayToggle = (day: Day, isOpen: boolean) => {
    if (isOpen) {
      onChange({
        ...value,
        [day]: { open: '09:00', close: '17:00' },
      })
    } else {
      onChange({
        ...value,
        [day]: null,
      })
    }
  }

  const handleTimeChange = (day: Day, field: 'open' | 'close', time: string) => {
    const dayHours = value[day]
    if (!dayHours) return

    onChange({
      ...value,
      [day]: {
        ...dayHours,
        [field]: time,
      },
    })
  }

  const handleCopyToAll = (sourceDay: Day) => {
    const sourceHours = value[sourceDay]
    if (!sourceHours) return

    const newHours: BusinessHours = {}
    DAYS.forEach(day => {
      newHours[day] = { ...sourceHours }
    })
    onChange(newHours)
  }

  const handleClearAll = () => {
    const emptyHours: BusinessHours = {}
    DAYS.forEach(day => {
      emptyHours[day] = null
    })
    onChange(emptyHours)
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-end pb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          disabled={disabled}
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3 mr-1" />
          {t('businessHours.clearAll')}
        </Button>
      </div>

      {/* Days list */}
      <div className="space-y-1">
        {DAYS.map(day => {
          const dayHours = value[day]
          const isOpen = dayHours !== null && dayHours !== undefined

          return (
            <div
              key={day}
              className={cn(
                'flex items-center justify-between py-2 px-3 rounded-md transition-colors',
                isOpen ? 'bg-accent/30' : 'bg-transparent'
              )}
            >
              {/* Left: Switch + Day name */}
              <div className="flex items-center gap-3">
                <Switch
                  id={`${day}-toggle`}
                  checked={isOpen}
                  onCheckedChange={(checked) => handleDayToggle(day, checked)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`${day}-toggle`}
                  className={cn(
                    'text-sm cursor-pointer min-w-[90px]',
                    !isOpen && 'text-muted-foreground'
                  )}
                >
                  {t(`businessHours.days.${day}`)}
                </Label>
              </div>

              {/* Right: Hours or Closed */}
              {isOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={dayHours.open}
                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                    disabled={disabled}
                    className="w-24 h-8 text-sm"
                    aria-label={t('businessHours.openTime')}
                  />
                  <span className="text-muted-foreground text-sm">-</span>
                  <Input
                    type="time"
                    value={dayHours.close}
                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                    disabled={disabled}
                    className="w-24 h-8 text-sm"
                    aria-label={t('businessHours.closeTime')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyToAll(day)}
                    disabled={disabled}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title={t('businessHours.copyToAll')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('businessHours.closed')}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground pt-2">
        {t('businessHours.hint')}
      </p>
    </div>
  )
}
