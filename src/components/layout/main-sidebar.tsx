"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Home,
  TrendingUp,
  Users,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Building2,
  Video,
  Coins,
} from "lucide-react"
import type { Role } from "@prisma/client"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"
import { SidebarCategories } from "./sidebar-categories"
import type { CategoryWithChildren } from "@/app/actions/categories/get-categories"

interface MainSidebarProps {
  locale: string
  categories: CategoryWithChildren[]
  user?: {
    id: string
    role?: Role
  } | null
}

interface NavItem {
  href: string
  icon: typeof Home
  label: string
}

export function MainSidebar({ locale, categories, user: initialUser }: MainSidebarProps) {
  const { t } = useTranslations("sidebar")
  const pathname = usePathname()
  const { state, isOpen, isMobile, toggle, close } = useSidebar()

  // Get reactive session for role updates (e.g., upgrade to COMPANY)
  const { data: session } = useSession()
  const user = session?.user ?? initialUser

  // Main navigation items (app navigation, not user panel)
  const navItems: NavItem[] = [
    { href: `/${locale}`, icon: Home, label: t("home") },
    { href: `/${locale}/trending`, icon: TrendingUp, label: t("trending") },
    { href: `/${locale}/following`, icon: Users, label: t("following") },
    { href: `/${locale}/saved`, icon: Bookmark, label: t("saved") },
  ]

  const isCollapsed = state === "collapsed"

  // Check if a nav item is active
  const isNavItemActive = (href: string) => {
    // Exact match for home
    if (href === `/${locale}`) {
      return pathname === href || pathname === `/${locale}/`
    }
    // Prefix match for other routes
    return pathname.startsWith(href)
  }

  // Render navigation items
  const NavItems = () => (
    <TooltipProvider delayDuration={0}>
      <nav className="flex-1 p-2 pt-3">
        {/* Group 1: Main navigation links */}
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isNavItemActive(item.href)

            const linkContent = (
              <Link
                href={item.href}
                onClick={() => isMobile && close()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed && !isMobile && "justify-center px-2"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!isCollapsed || isMobile) && <span>{item.label}</span>}
              </Link>
            )

            // Show tooltip in collapsed mode (desktop/tablet only)
            if (isCollapsed && !isMobile) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </div>

        {/* Group 2: Separator + Categories header */}
        {categories.length > 0 && (
          <>
            <div className="space-y-4 my-4">
              <Separator />
              {(!isCollapsed || isMobile) && (
                <span className="px-3 pt-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("categories")}
                </span>
              )}
            </div>

            {/* Group 3: Category links */}
            <div className="space-y-2">
              <SidebarCategories locale={locale} categories={categories} />
            </div>
          </>
        )}
      </nav>
    </TooltipProvider>
  )

  // Render role-based links (bottom section, above toggle)
  const RoleBasedLinks = () => {
    // Only show for COMPANY role
    if (user?.role !== "COMPANY") return null

    const companyNavItems: NavItem[] = [
      { href: `/${locale}/panel/shorts`, icon: Video, label: t("menu.myShorts") },
      { href: `/${locale}/panel/credits`, icon: Coins, label: t("menu.credits") },
      { href: `/${locale}/panel/company/overview`, icon: Building2, label: t("menu.companyProfile") },
    ]

    const renderLink = (item: NavItem) => {
      const Icon = item.icon
      const isActive = pathname.startsWith(item.href)

      return (
        <Link
          href={item.href}
          onClick={() => isMobile && close()}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            isCollapsed && !isMobile && "justify-center px-2"
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {(!isCollapsed || isMobile) && <span>{item.label}</span>}
        </Link>
      )
    }

    // Tooltip in collapsed mode (desktop/tablet)
    if (isCollapsed && !isMobile) {
      return (
        <TooltipProvider delayDuration={0}>
          <nav aria-label={t("accessibility.companyNavigation")} className="border-t p-2 space-y-1">
            {companyNavItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{renderLink(item)}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>
      )
    }

    return (
      <nav aria-label={t("accessibility.companyNavigation")} className="border-t p-2 space-y-1">
        {companyNavItems.map((item) => (
          <div key={item.href}>{renderLink(item)}</div>
        ))}
      </nav>
    )
  }

  // Render toggle button (desktop only) - inside sidebar at bottom
  const ToggleButton = () => {
    if (isMobile) return null

    return (
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-center gap-2",
            !isCollapsed && "justify-start px-3"
          )}
          onClick={toggle}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">{t("collapse")}</span>
            </>
          )}
        </Button>
      </div>
    )
  }

  // Mobile: Render as Sheet overlay
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent side="left" className="w-64 p-0">
          {/* Visually hidden title for accessibility (required by Radix Dialog) */}
          <SheetTitle className="sr-only">{t("accessibility.navigationMenu")}</SheetTitle>
          <div className="flex h-full flex-col pt-6 overflow-y-auto">
            <NavItems />
            <div className="mt-auto">
              <RoleBasedLinks />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop/Tablet: Render as fixed sidebar
  return (
    <aside
      data-state={state}
      className={cn(
        "fixed left-0 top-16 bottom-[53px] z-40 flex flex-col border-r bg-background transition-[width] duration-200 ease-in-out overflow-x-hidden",
        state === "expanded" ? "w-60" : "w-16"
      )}
    >
      <div className="flex-1 overflow-y-auto">
        <NavItems />
      </div>
      <RoleBasedLinks />
      <ToggleButton />
    </aside>
  )
}
