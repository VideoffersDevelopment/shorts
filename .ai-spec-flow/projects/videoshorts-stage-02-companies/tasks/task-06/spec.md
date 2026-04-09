# Task 06: Admin Panel Foundation

## Overview

**Priority:** HIGH
**Dependencies:** task-01
**Complexity:** Medium (11 files, ~11k tokens)
**Status:** pending

## What to Build

Create the admin panel foundation with layout, sidebar navigation, middleware protection, and dashboard placeholder. This establishes the infrastructure for admin features in tasks 07-08.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/(admin)/[locale]/layout.tsx` | Create | Admin layout with sidebar |
| `src/app/(admin)/[locale]/admin/page.tsx` | Create | Admin dashboard (placeholder) |
| `src/components/admin/admin-sidebar.tsx` | Create | Admin navigation sidebar |
| `src/middleware.ts` | Modify | Add admin route protection |

## Files to Modify

| File | Changes |
|------|---------|
| `src/middleware.ts` | Extend with admin route protection |

## Admin Layout

```typescript
// src/app/(admin)/[locale]/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar locale={params.locale} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

## Admin Sidebar Component

```typescript
// src/components/admin/admin-sidebar.tsx
"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Users,
  FileText
} from "lucide-react"

interface AdminSidebarProps {
  locale: string
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const t = useTranslations("admin")
  const pathname = usePathname()

  const menuItems = [
    { href: `/${locale}/admin`, label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/admin/companies`, label: t("nav.companies"), icon: Building2 },
    { href: `/${locale}/admin/categories`, label: t("nav.categories"), icon: FolderTree },
    { href: `/${locale}/admin/users`, label: t("nav.users"), icon: Users },
    { href: `/${locale}/admin/audit`, label: t("nav.audit"), icon: FileText }
  ]

  return (
    <aside className="w-64 border-r bg-card">
      <div className="p-6">
        <h2 className="text-xl font-bold">{t("title")}</h2>
      </div>

      <nav className="space-y-1 p-4">
        {menuItems.map(item => {
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
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

## Admin Dashboard Page

```typescript
// src/app/(admin)/[locale]/admin/page.tsx
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, FolderTree } from "lucide-react"

export default async function AdminDashboardPage() {
  const session = await auth()
  const t = await getTranslations("admin")

  // Fetch stats
  const [companiesCount, usersCount, categoriesCount, pendingCount] = await Promise.all([
    prisma.companyProfile.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.companyProfile.count({
      where: { viesVerified: false }
    })
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t("dashboard.title")}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.companies")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companiesCount}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} {t("dashboard.stats.pending")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.users")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.stats.categories")}
            </CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoriesCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## Middleware Protection

```typescript
// src/middleware.ts (EXTEND)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  // ... existing auth checks from Stage 01 ...

  // NEW: Company routes protection
  if (req.nextUrl.pathname.includes("/panel/company")) {
    if (!token || token.role !== "COMPANY") {
      return NextResponse.redirect(new URL("/settings/upgrade", req.url))
    }
  }

  // NEW: Admin routes protection
  if (req.nextUrl.pathname.match(/\/admin(?!\/api)/)) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*"
  ]
}
```

## Acceptance Criteria

- [ ] Admin layout renders with sidebar
- [ ] Sidebar shows all navigation items
- [ ] Active link highlighted
- [ ] Dashboard shows stats cards
- [ ] Stats counts accurate (companies, users, categories)
- [ ] Pending count shows unverified companies
- [ ] Middleware blocks non-ADMIN users from `/admin/*`
- [ ] Non-admin redirected to home page
- [ ] Icons from lucide-react imported correctly
- [ ] Mobile responsive (sidebar collapsible)
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test admin user: Create admin user in database (role: ADMIN)

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Login as ADMIN | Successful login | `/login` |
| 2 | Navigate to admin | Dashboard loads | `/admin` |
| 3 | Verify sidebar | Sidebar visible with 5 menu items | `aside.w-64` |
| 4 | Verify stats | Stats cards show counts | `.card` |
| 5 | Click Companies | Navigate to companies page | `a[href*="/admin/companies"]` |
| 6 | Click Dashboard | Active link highlighted | `a[href="/admin"]` |
| 7 | Logout and login as USER | Redirect to home | `/admin` |
| 8 | Attempt to access admin | Blocked, redirected to home | - |

### Screenshot Checkpoints
- `01-admin-dashboard.png` - Admin dashboard with stats
- `02-admin-sidebar.png` - Sidebar navigation
- `03-active-link.png` - Active link highlighted
- `04-mobile-sidebar.png` - Mobile responsive sidebar

## Notes

- **Role Check:** Middleware ensures ADMIN role required
- **Server-Side Auth:** Layout checks session server-side
- **Stats:** Real-time counts from database
- **Navigation:** Same pattern as app-sidebar.tsx from Stage 01
- **Icons:** Lucide React icons (consistent with Stage 01)
