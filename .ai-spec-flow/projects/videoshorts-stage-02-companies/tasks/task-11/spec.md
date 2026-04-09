# Task 11: Implement SubcategoryPicker Component

## Overview
**Priority:** MEDIUM
**Dependencies:** task-01 (Database), task-05 (Company Profile Edit)
**Complexity:** Medium (8 files, ~8k tokens)
**Status:** pending

## Problem Description

The database schema supports subcategories (JSON array of category IDs), but there's no UI component to select them in the company profile edit form.

**Current State:**
- ✅ `CompanyProfile.subcategories` field exists in Prisma schema (JSON)
- ✅ Validation schema allows array of category IDs
- ❌ No UI component in `company-profile-form.tsx`

**Impact:** Companies cannot select subcategories via UI (must edit JSON directly)

## What to Build

### 1. SubcategoryPicker Component

Create `src/components/companies/subcategory-picker.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Check, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Subcategory {
  id: string
  name: string
  slug: string
}

interface SubcategoryPickerProps {
  categoryId: string | null
  value: string[]
  onChange: (ids: string[]) => void
  max?: number
  disabled?: boolean
  locale: string
}

export function SubcategoryPicker({
  categoryId,
  value,
  onChange,
  max = 3,
  disabled = false,
  locale,
}: SubcategoryPickerProps) {
  const t = useTranslations('companies')
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch subcategories when categoryId changes
  useEffect(() => {
    if (!categoryId) {
      setSubcategories([])
      onChange([])
      return
    }

    setLoading(true)
    fetch(`/api/categories/${categoryId}/subcategories`)
      .then(res => res.json())
      .then(data => setSubcategories(data))
      .catch(() => setSubcategories([]))
      .finally(() => setLoading(false))
  }, [categoryId])

  const handleSelect = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id))
    } else if (value.length < max) {
      onChange([...value, id])
    }
  }

  const handleRemove = (id: string) => {
    onChange(value.filter(v => v !== id))
  }

  const selectedSubcategories = subcategories.filter(s => value.includes(s.id))

  if (!categoryId) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('subcategories.selectCategoryFirst')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {loading ? (
              t('subcategories.loading')
            ) : value.length === 0 ? (
              t('subcategories.placeholder')
            ) : (
              t('subcategories.selected', { count: value.length, max })
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="max-h-60 overflow-auto p-1">
            {subcategories.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                {t('subcategories.noSubcategories')}
              </div>
            ) : (
              subcategories.map(subcategory => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSelect(subcategory.id)}
                  disabled={!value.includes(subcategory.id) && value.length >= max}
                  className={cn(
                    'flex w-full items-center rounded-sm px-2 py-1.5 text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    value.includes(subcategory.id) && 'bg-accent'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.includes(subcategory.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {subcategory.name}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selectedSubcategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedSubcategories.map(subcategory => (
            <Badge key={subcategory.id} variant="secondary" className="pr-1">
              {subcategory.name}
              <button
                onClick={() => handleRemove(subcategory.id)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {t('subcategories.hint', { max })}
      </p>
    </div>
  )
}
```

### 2. API Route for Subcategories

Create `src/app/api/categories/[categoryId]/subcategories/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const subcategories = await prisma.category.findMany({
      where: {
        parentId: params.categoryId,
        enabled: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Failed to fetch subcategories:', error)
    return NextResponse.json([], { status: 500 })
  }
}
```

### 3. Integrate into Company Profile Form

Update `src/components/companies/company-profile-form.tsx` to include `SubcategoryPicker`:

```tsx
// Add import
import { SubcategoryPicker } from './subcategory-picker'

// In form state
const [subcategories, setSubcategories] = useState<string[]>(
  company?.subcategories ?? []
)

// In form JSX (after CategoryPicker)
<div className="space-y-2">
  <Label>{t('profile.subcategories')}</Label>
  <SubcategoryPicker
    categoryId={categoryId}
    value={subcategories}
    onChange={setSubcategories}
    max={3}
    locale={locale}
  />
</div>

// Include in form submission
const data = {
  // ... existing fields
  subcategories,
}
```

### 4. Update Validation Schema

Update `src/lib/validation.ts`:

```typescript
export const companyProfileSchema = z.object({
  // ... existing fields
  subcategories: z.array(z.string()).max(3).optional(),
})
```

### 5. Update Server Action

Update `src/app/actions/companies/update.ts` to handle subcategories:

```typescript
// In updateCompanyProfile function
await prisma.companyProfile.update({
  where: { userId: session.user.id },
  data: {
    // ... existing fields
    subcategories: data.subcategories ?? [],
  },
})
```

### 6. Translations

Add to all 5 language files (`src/lib/locales/{pl,en,de,es,ru}/companies.json`):

```json
{
  "subcategories": {
    "label": "Subcategories",
    "placeholder": "Select subcategories",
    "selected": "{count} of {max} selected",
    "selectCategoryFirst": "Select a main category first",
    "loading": "Loading subcategories...",
    "noSubcategories": "No subcategories available",
    "hint": "Select up to {max} subcategories to better describe your business"
  }
}
```

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/components/companies/subcategory-picker.tsx` | Create | Multi-select subcategory picker |
| `src/app/api/categories/[categoryId]/subcategories/route.ts` | Create | API route for fetching subcategories |
| `src/components/companies/__tests__/subcategory-picker.test.tsx` | Create | Component tests |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/companies/company-profile-form.tsx` | Add SubcategoryPicker integration |
| `src/lib/validation.ts` | Add subcategories field to schema |
| `src/app/actions/companies/update.ts` | Handle subcategories in update |
| `src/lib/locales/pl/companies.json` | Add subcategories translations |
| `src/lib/locales/en/companies.json` | Add subcategories translations |
| `src/lib/locales/de/companies.json` | Add subcategories translations |
| `src/lib/locales/es/companies.json` | Add subcategories translations |
| `src/lib/locales/ru/companies.json` | Add subcategories translations |

## Acceptance Criteria

- [ ] SubcategoryPicker component renders correctly
- [ ] Subcategories fetch dynamically based on selected category
- [ ] Max 3 subcategories can be selected
- [ ] Selected subcategories show as removable badges
- [ ] Subcategories are saved to database on form submit
- [ ] Subcategories clear when main category changes
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
| 2 | Select main category | Category selected | CategoryPicker |
| 3 | Click subcategory picker | Dropdown opens | SubcategoryPicker |
| 4 | Select 2 subcategories | 2 badges appear | Badge components |
| 5 | Try select 4th | Button disabled | max=3 limit |
| 6 | Remove one badge | Badge removed | X button |
| 7 | Save form | Success toast | Submit button |
| 8 | Reload page | Subcategories persist | Refresh |

### Screenshot Checkpoints
- `01-subcategory-picker-closed.png` - Picker in closed state
- `02-subcategory-picker-open.png` - Dropdown with options
- `03-subcategory-badges.png` - Selected badges

## Notes

- Component follows existing UI patterns (Popover, Badge)
- Uses same styling as CategoryPicker for consistency
- API route is simple (no auth needed - categories are public)
- Subcategories stored as JSON array in Prisma (matches existing schema)
- When main category changes, subcategories should be cleared (UX)
