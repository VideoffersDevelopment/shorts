# Task 06: Theme & Preferences

## Overview

**Priority:** MEDIUM
**Dependencies:** task-02
**Complexity:** Simple (9 files, ~9k tokens)
**Status:** pending

## What to Build

User preferences page with dark mode toggle (using next-themes) and language switcher (5 languages). Includes 1 page, 4 components, and translation files for 5 languages. Theme preference persists in UserProfile.darkMode.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| **Pages** |
| `src/app/(main)/[locale]/panel/preferences/page.tsx` | Create | Preferences page (server component) |
| **Components** |
| `src/components/profile/preferences-form.tsx` | Create | Preferences form (theme + language) |
| `src/components/theme/theme-provider.tsx` | Create | next-themes provider |
| `src/components/theme/theme-toggle.tsx` | Create | Theme toggle button |
| `src/components/shared/locale-switcher.tsx` | Create | Language dropdown |
| **UI Components (shadcn)** |
| `src/components/ui/dropdown-menu.tsx` | Create | shadcn DropdownMenu component |
| **Translations (5 files)** |
| `src/lib/locales/pl/preferences.json` | Create | Polish preferences translations |
| `src/lib/locales/en/preferences.json` | Create | English preferences translations |
| `src/lib/locales/de/preferences.json` | Create | German preferences translations |
| `src/lib/locales/es/preferences.json` | Create | Spanish preferences translations |
| `src/lib/locales/ru/preferences.json` | Create | Russian preferences translations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Wrap with ThemeProvider |

## Acceptance Criteria

- [ ] User can toggle dark mode
- [ ] Dark mode persists across sessions
- [ ] Dark mode updates UserProfile.darkMode
- [ ] User can switch language (5 options: pl, en, de, es, ru)
- [ ] Language switch redirects to new locale path
- [ ] Locale cookie updated on switch
- [ ] Theme applies immediately (no flash)
- [ ] Theme toggle shows current mode
- [ ] All UI components support dark mode
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Key User Flows

### Dark Mode Toggle Flow
1. User navigates to `/pl/panel/preferences`
2. Sees current theme (Light/Dark/System)
3. Clicks theme toggle button
4. Theme updates immediately (next-themes)
5. Preference saved to UserProfile.darkMode
6. Theme persists on page reload

### Language Switch Flow
1. User clicks language dropdown
2. Sees 5 language options (Polski, English, Deutsch, Español, Русский)
3. Selects new language (e.g., English)
4. Middleware detects locale change
5. Redirects to `/en/panel/preferences`
6. Locale cookie updated
7. All translations switch to English

## Component Implementation

### ThemeProvider (src/components/theme/theme-provider.tsx)

```typescript
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### ThemeToggle (src/components/theme/theme-toggle.tsx)

```typescript
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useTranslations } from "next-intl"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const t = useTranslations("preferences")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t("theme.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t("theme.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t("theme.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### LocaleSwitcher (src/components/shared/locale-switcher.tsx)

```typescript
"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

const languages = [
  { code: "pl", name: "Polski" },
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "ru", name: "Русский" }
]

export function LocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const switchLocale = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPathname)
  }

  const currentLanguage = languages.find((lang) => lang.code === locale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="mr-2 h-4 w-4" />
          {currentLanguage?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLocale(lang.code)}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### PreferencesForm (src/components/profile/preferences-form.tsx)

```typescript
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { Button } from "@/components/ui/button"
import { updateProfileAction } from "@/app/actions/profile/update"
import { useTheme } from "next-themes"

export function PreferencesForm({ locale }: { locale: string }) {
  const t = useTranslations("preferences")
  const { theme } = useTheme()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const darkMode = theme === "dark"
    await updateProfileAction({ darkMode })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("theme.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("theme.description")}
        </p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">{t("language.title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("language.description")}
        </p>
        <div className="mt-4">
          <LocaleSwitcher locale={locale} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : t("save")}
      </Button>
    </div>
  )
}
```

## Layout Update (src/app/layout.tsx)

```typescript
import { ThemeProvider } from "@/components/theme/theme-provider"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## Translation Files

### pl/preferences.json
```json
{
  "title": "Preferencje",
  "theme": {
    "title": "Wygląd",
    "description": "Wybierz motyw aplikacji",
    "light": "Jasny",
    "dark": "Ciemny",
    "system": "Systemowy"
  },
  "language": {
    "title": "Język",
    "description": "Wybierz język interfejsu",
    "pl": "Polski",
    "en": "English",
    "de": "Deutsch",
    "es": "Español",
    "ru": "Русский"
  },
  "save": "Zapisz",
  "success": "Preferencje zaktualizowane"
}
```

### en/preferences.json
```json
{
  "title": "Preferences",
  "theme": {
    "title": "Appearance",
    "description": "Select app theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  },
  "language": {
    "title": "Language",
    "description": "Select interface language",
    "pl": "Polski",
    "en": "English",
    "de": "Deutsch",
    "es": "Español",
    "ru": "Русский"
  },
  "save": "Save",
  "success": "Preferences updated"
}
```

## Visual Verification Steps (for Chrome DevTools MCP)

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user: Use $TEST_USER_EMAIL / $TEST_USER_PASSWORD from .env.local
- Logged in session

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to preferences | Preferences page loads | `/pl/panel/preferences` |
| 2 | Verify theme toggle | Button shows current theme | `.theme-toggle` |
| 3 | Click theme toggle | Dropdown opens | `button:has-text("Toggle theme")` |
| 4 | Select Dark | Dark theme applies | `[role="menuitem"]:has-text("Dark")` |
| 5 | Verify dark mode | Background dark, text light | `html.dark` |
| 6 | Reload page | Dark theme persists | - |
| 7 | Click language switcher | Dropdown opens | `button:has-text("Polski")` |
| 8 | Select English | Redirects to /en/panel/preferences | `[role="menuitem"]:has-text("English")` |
| 9 | Verify English UI | All text in English | - |
| 10 | Switch back to Polish | Redirects to /pl/panel/preferences | `button:has-text("English")` |

### Screenshot Checkpoints
- `01-preferences-page.png` - Preferences page overview
- `02-theme-toggle.png` - Theme dropdown open
- `03-dark-mode.png` - Dark mode applied
- `04-language-switcher.png` - Language dropdown open
- `05-english-ui.png` - UI in English after switch

## Notes

1. Use `next-themes` for theme management (v0.2.1+)
2. Theme stored in localStorage AND UserProfile.darkMode
3. `suppressHydrationWarning` required on `<html>` tag
4. Theme toggle uses Lucide icons: `Sun`, `Moon`
5. Language switcher uses ISO 639-1 codes: pl, en, de, es, ru
6. Locale switch updates cookie via middleware
7. Theme changes apply immediately (no page reload)
8. System theme respects OS preference
9. Dark mode CSS variables defined in `globals.css`
10. All shadcn/ui components support dark mode out of the box
