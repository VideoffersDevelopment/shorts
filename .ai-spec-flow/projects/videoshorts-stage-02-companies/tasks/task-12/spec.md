# Task 12: Implement BusinessHoursPicker Component

## Overview
**Priority:** MEDIUM
**Dependencies:** task-01 (Database), task-05 (Company Profile Edit)
**Complexity:** Medium (9 files, ~9k tokens)
**Status:** pending

## Problem Description

The database schema supports business hours (JSON field), but there's no visual UI component to edit them in the company profile form.

**Current State:**
- ✅ `CompanyProfile.businessHours` field exists in Prisma schema (JSON)
- ✅ Validation allows time format (HH:MM)
- ❌ No visual time picker UI in `company-profile-form.tsx`

**Impact:** Companies cannot set business hours via UI (must edit JSON directly)

## What to Build

### 1. BusinessHoursPicker Component

Create `src/components/companies/business-hours-picker.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Clock, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  const t = useTranslations('companies')

  const handleDayToggle = (day: Day, isOpen: boolean) => {
    if (isOpen) {
      // Set default hours when opening
      onChange({
        ...value,
        [day]: { open: '09:00', close: '17:00' },
      })
    } else {
      // Set to null when closing
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
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('businessHours.title')}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            {t('businessHours.clearAll')}
          </Button>
        </div>

        <div className="space-y-3">
          {DAYS.map(day => {
            const dayHours = value[day]
            const isOpen = dayHours !== null && dayHours !== undefined

            return (
              <div
                key={day}
                className={cn(
                  'flex items-center gap-4 p-2 rounded-md transition-colors',
                  isOpen ? 'bg-accent/50' : 'bg-muted/30'
                )}
              >
                {/* Day name + toggle */}
                <div className="flex items-center gap-3 w-32">
                  <Switch
                    id={`${day}-toggle`}
                    checked={isOpen}
                    onCheckedChange={(checked) => handleDayToggle(day, checked)}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`${day}-toggle`}
                    className={cn(
                      'text-sm cursor-pointer',
                      !isOpen && 'text-muted-foreground'
                    )}
                  >
                    {t(`businessHours.days.${day}`)}
                  </Label>
                </div>

                {/* Time inputs or "Closed" */}
                {isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={dayHours.open}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      disabled={disabled}
                      className="w-28"
                      aria-label={t('businessHours.openTime')}
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={dayHours.close}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      disabled={disabled}
                      className="w-28"
                      aria-label={t('businessHours.closeTime')}
                    />

                    {/* Copy to all button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToAll(day)}
                      disabled={disabled}
                      className="ml-2 text-xs"
                      title={t('businessHours.copyToAll')}
                    >
                      {t('businessHours.copyToAll')}
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    {t('businessHours.closed')}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          {t('businessHours.hint')}
        </p>
      </CardContent>
    </Card>
  )
}
```

### 2. Integrate into Company Profile Form

Update `src/components/companies/company-profile-form.tsx`:

```tsx
// Add import
import { BusinessHoursPicker, BusinessHours } from './business-hours-picker'

// In form state
const [businessHours, setBusinessHours] = useState<BusinessHours>(
  company?.businessHours ?? {}
)

// In form JSX (after social links section)
<div className="space-y-2">
  <Label>{t('profile.businessHours')}</Label>
  <BusinessHoursPicker
    value={businessHours}
    onChange={setBusinessHours}
    disabled={isSubmitting}
  />
</div>

// Include in form submission
const data = {
  // ... existing fields
  businessHours,
}
```

### 3. Update Validation Schema

Update `src/lib/validation.ts`:

```typescript
const dayHoursSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
}).nullable()

export const businessHoursSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
})

export const companyProfileSchema = z.object({
  // ... existing fields
  businessHours: businessHoursSchema.optional(),
})
```

### 4. Update Server Action

Update `src/app/actions/companies/update.ts`:

```typescript
// In updateCompanyProfile function
await prisma.companyProfile.update({
  where: { userId: session.user.id },
  data: {
    // ... existing fields
    businessHours: data.businessHours ?? Prisma.JsonNull,
  },
})
```

### 5. Display on Public Profile

Update `src/app/(main)/[locale]/companies/[slug]/page.tsx`:

```tsx
// Add component import
import { BusinessHoursDisplay } from '@/components/companies/business-hours-display'

// In page JSX
{company.businessHours && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2">{t('profile.businessHours')}</h3>
    <BusinessHoursDisplay hours={company.businessHours} locale={locale} />
  </div>
)}
```

### 6. BusinessHoursDisplay Component (Read-only)

Create `src/components/companies/business-hours-display.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import { BusinessHours } from './business-hours-picker'
import { cn } from '@/lib/utils'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

interface BusinessHoursDisplayProps {
  hours: BusinessHours
  locale: string
}

export function BusinessHoursDisplay({ hours, locale }: BusinessHoursDisplayProps) {
  const t = useTranslations('companies')

  // Check if any day is open
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
```

### 7. Translations

Add to all 5 language files (`src/lib/locales/{pl,en,de,es,ru}/companies.json`):

```json
{
  "businessHours": {
    "title": "Business Hours",
    "days": {
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday"
    },
    "openTime": "Opening time",
    "closeTime": "Closing time",
    "closed": "Closed",
    "copyToAll": "Copy to all",
    "clearAll": "Clear all",
    "hint": "Set your business hours. Toggle off days when you're closed."
  }
}
```

**Polish (pl):**
```json
{
  "businessHours": {
    "title": "Godziny otwarcia",
    "days": {
      "monday": "Poniedziałek",
      "tuesday": "Wtorek",
      "wednesday": "Środa",
      "thursday": "Czwartek",
      "friday": "Piątek",
      "saturday": "Sobota",
      "sunday": "Niedziela"
    },
    "openTime": "Godzina otwarcia",
    "closeTime": "Godzina zamknięcia",
    "closed": "Zamknięte",
    "copyToAll": "Skopiuj do wszystkich",
    "clearAll": "Wyczyść wszystko",
    "hint": "Ustaw godziny otwarcia. Wyłącz dni, w których jesteś zamknięty."
  }
}
```

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/companies/business-hours-picker.tsx` | Create | Visual business hours editor |
| `src/components/companies/business-hours-display.tsx` | Create | Read-only display for public profile |
| `src/components/companies/__tests__/business-hours-picker.test.tsx` | Create | Component tests |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/companies/company-profile-form.tsx` | Add BusinessHoursPicker integration |
| `src/components/companies/index.ts` | Export new components |
| `src/lib/validation.ts` | Add businessHours schema |
| `src/app/actions/companies/update.ts` | Handle businessHours in update |
| `src/app/(main)/[locale]/companies/[slug]/page.tsx` | Display business hours |
| `src/lib/locales/pl/companies.json` | Add businessHours translations |
| `src/lib/locales/en/companies.json` | Add businessHours translations |
| `src/lib/locales/de/companies.json` | Add businessHours translations |
| `src/lib/locales/es/companies.json` | Add businessHours translations |
| `src/lib/locales/ru/companies.json` | Add businessHours translations |

## Acceptance Criteria

- [ ] BusinessHoursPicker renders with 7 day rows
- [ ] Each day can be toggled open/closed via Switch
- [ ] Time inputs use native `type="time"` for UX
- [ ] "Copy to all" copies current day's hours to all days
- [ ] "Clear all" sets all days to closed
- [ ] Business hours are saved to database
- [ ] Business hours display on public profile
- [ ] All 5 languages have translations
- [ ] Component tests pass
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user: $TEST_USER_EMAIL / $TEST_USER_PASSWORD
- Test company profile exists

### Steps
| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to company edit | Edit page loads | `/panel/business/settings` |
| 2 | Find Business Hours section | Card with days visible | BusinessHoursPicker |
| 3 | Toggle Monday on | Time inputs appear | Switch toggle |
| 4 | Set hours 09:00 - 18:00 | Times set | Time inputs |
| 5 | Click "Copy to all" | All days set to same hours | Button |
| 6 | Toggle Sunday off | Sunday shows "Closed" | Switch toggle |
| 7 | Save form | Success toast | Submit button |
| 8 | Visit public profile | Business hours displayed | `/companies/[slug]` |

### Screenshot Checkpoints
- `01-business-hours-empty.png` - Empty state (all closed)
- `02-business-hours-filled.png` - With hours set
- `03-business-hours-public.png` - Public profile display

## Notes

- Uses native `<input type="time">` for better mobile UX
- JSON storage matches existing schema design
- "Copy to all" is a common UX pattern for hours editing
- Display component is separate for reuse (search results, etc.)
- Time format is 24h (HH:MM) for consistency
- Validation uses regex for HH:MM format
