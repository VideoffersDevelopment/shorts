# Task 07: Layout & Navigation

## Overview

**Priority:** HIGH
**Dependencies:** task-03, task-04, task-05, task-06
**Complexity:** Medium (16 files, ~16k tokens)
**Status:** pending

## What to Build

Complete application layout with responsive sidebar navigation, header with user menu, footer, mobile drawer, and error boundary. Integrates all previous tasks. Includes layout components, navigation, and sidebar translations for 5 languages. This is the final integration task.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| **Pages** |
| `src/app/(main)/[locale]/panel/page.tsx` | Create | Dashboard page (landing after login) |
| **Layouts** |
| `src/app/(main)/[locale]/panel/layout.tsx` | Create | Panel layout with sidebar |
| `src/app/(auth)/[locale]/layout.tsx` | Create | Auth layout (centered forms) |
| **Components** |
| `src/components/layout/header.tsx` | Create | Header with logo + user menu |
| `src/components/layout/app-sidebar.tsx` | Create | Sidebar navigation |
| `src/components/layout/footer.tsx` | Create | Footer with links |
| `src/components/layout/user-menu.tsx` | Create | User dropdown menu |
| `src/components/layout/mobile-drawer.tsx` | Create | Mobile navigation drawer |
| `src/components/shared/error-boundary.tsx` | Create | Error boundary component |
| **UI Components (shadcn)** |
| `src/components/ui/sheet.tsx` | Create | shadcn Sheet component (for drawer) |
| `src/components/ui/separator.tsx` | Create | shadcn Separator component |
| **Translations (5 files)** |
| `src/lib/locales/pl/sidebar.json` | Create | Polish sidebar translations |
| `src/lib/locales/en/sidebar.json` | Create | English sidebar translations |
| `src/lib/locales/de/sidebar.json` | Create | German sidebar translations |
| `src/lib/locales/es/sidebar.json` | Create | Spanish sidebar translations |
| `src/lib/locales/ru/sidebar.json` | Create | Russian sidebar translations |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Add error boundary wrapper |

## Acceptance Criteria

- [ ] Dashboard page displays after login
- [ ] Sidebar shows navigation links (Home, Profile, Settings)
- [ ] Sidebar highlights active route
- [ ] Header shows user avatar + name
- [ ] User menu has Preferences, Logout options
- [ ] Mobile drawer opens on hamburger click
- [ ] Mobile drawer shows same navigation as sidebar
- [ ] Footer displays on all pages
- [ ] Error boundary catches component errors
- [ ] All navigation links work
- [ ] Logout redirects to login page
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Translations load for all 5 languages
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Layout Structure

```
/(main)/[locale]/panel/layout.tsx
├── Header
│   ├── Logo
│   ├── ThemeToggle (from task-06)
│   ├── LocaleSwitcher (from task-06)
│   └── UserMenu
│       ├── Profile link
│       ├── Settings link
│       ├── Preferences link
│       └── Logout button
├── AppSidebar (desktop)
│   ├── Home → /panel
│   ├── Profile → /panel/profile
│   └── Settings → /panel/settings
├── MobileDrawer (mobile)
│   └── Same links as AppSidebar
├── Main Content Area
│   └── {children}
└── Footer
    ├── About link
    ├── Privacy link
    └── Terms link
```

## Component Implementation

### AppSidebar (src/components/layout/app-sidebar.tsx)

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, Settings, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  locale: string
}

export function AppSidebar({ locale }: AppSidebarProps) {
  const t = useTranslations("sidebar")
  const pathname = usePathname()

  const menuItems = [
    { href: `/${locale}/panel`, icon: Home, label: t("home") },
    { href: `/${locale}/panel/profile`, icon: User, label: t("profile") },
    { href: `/${locale}/panel/settings`, icon: Settings, label: t("settings") }
  ]

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r">
      <div className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
      <Separator />
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t("logout")}
        </Button>
      </div>
    </aside>
  )
}
```

### Header (src/components/layout/header.tsx)

```typescript
import { auth } from "@/lib/auth"
import { UserMenu } from "./user-menu"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  locale: string
  onMenuClick?: () => void
}

export async function Header({ locale, onMenuClick }: HeaderProps) {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">VideoShorts</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LocaleSwitcher locale={locale} />
          {session?.user && <UserMenu user={session.user} locale={locale} />}
        </div>
      </div>
    </header>
  )
}
```

### UserMenu (src/components/layout/user-menu.tsx)

```typescript
"use client"

import { User, Settings, LogOut, Palette } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface UserMenuProps {
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
  locale: string
}

export function UserMenu({ user, locale }: UserMenuProps) {
  const t = useTranslations("sidebar")
  const router = useRouter()

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/${locale}/panel/profile`)}>
          <User className="mr-2 h-4 w-4" />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/${locale}/panel/settings`)}>
          <Settings className="mr-2 h-4 w-4" />
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/${locale}/panel/preferences`)}>
          <Palette className="mr-2 h-4 w-4" />
          Preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### MobileDrawer (src/components/layout/mobile-drawer.tsx)

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, Settings, LogOut, Menu } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

export function MobileDrawer({ locale }: { locale: string }) {
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const menuItems = [
    { href: `/${locale}/panel`, icon: Home, label: t("home") },
    { href: `/${locale}/panel/profile`, icon: User, label: t("profile") },
    { href: `/${locale}/panel/settings`, icon: Settings, label: t("settings") }
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              setOpen(false)
              signOut({ callbackUrl: `/${locale}/login` })
            }}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {t("logout")}
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

### Panel Layout (src/app/(main)/[locale]/panel/layout.tsx)

```typescript
import { Header } from "@/components/layout/header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Footer } from "@/components/layout/footer"

export default function PanelLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={params.locale} />
      <div className="flex flex-1">
        <AppSidebar locale={params.locale} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
```

## Translation Files

### pl/sidebar.json
```json
{
  "home": "Strona główna",
  "profile": "Profil",
  "settings": "Ustawienia",
  "logout": "Wyloguj"
}
```

### en/sidebar.json
```json
{
  "home": "Home",
  "profile": "Profile",
  "settings": "Settings",
  "logout": "Logout"
}
```

### de/sidebar.json
```json
{
  "home": "Startseite",
  "profile": "Profil",
  "settings": "Einstellungen",
  "logout": "Abmelden"
}
```

### es/sidebar.json
```json
{
  "home": "Inicio",
  "profile": "Perfil",
  "settings": "Configuración",
  "logout": "Cerrar sesión"
}
```

### ru/sidebar.json
```json
{
  "home": "Главная",
  "profile": "Профиль",
  "settings": "Настройки",
  "logout": "Выйти"
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
| 1 | Login and redirect | Dashboard loads | `/pl/panel` |
| 2 | Verify sidebar | Sidebar visible on left | `.app-sidebar` |
| 3 | Verify header | Header with logo + user menu | `header` |
| 4 | Click Profile link | Navigate to profile | `a[href*="/panel/profile"]` |
| 5 | Verify active state | Profile link highlighted | `.bg-primary` |
| 6 | Click user avatar | Dropdown menu opens | `.user-menu` |
| 7 | Verify menu items | Profile, Settings, Preferences, Logout | `[role="menuitem"]` |
| 8 | Resize to mobile | Sidebar hides, hamburger shows | Resize viewport < 768px |
| 9 | Click hamburger | Mobile drawer opens | `button:has(svg.menu)` |
| 10 | Verify drawer links | Same links as sidebar | `.sheet-content` |
| 11 | Click Logout | Redirect to login | `button:has-text("Wyloguj")` |

### Screenshot Checkpoints
- `01-dashboard.png` - Dashboard with sidebar + header
- `02-sidebar-highlight.png` - Active link highlighted
- `03-user-menu.png` - User dropdown menu open
- `04-mobile-view.png` - Mobile layout with hamburger
- `05-mobile-drawer.png` - Mobile drawer open

## Notes

1. Use `app-sidebar.tsx` pattern from architecture
2. Sidebar hidden on mobile (<768px), replaced with drawer
3. Header is sticky (stays at top on scroll)
4. Active route detected with `usePathname()`
5. Logout uses `signOut()` from `next-auth/react`
6. User avatar shows initials if no image
7. All navigation uses Next.js `<Link>` for client-side routing
8. Error boundary wraps entire app in root layout
9. Footer should be minimal (About, Privacy, Terms links)
10. This task integrates all previous tasks (auth, profile, settings, preferences)
