"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebarOptional } from "./sidebar-provider"
import { useTranslations } from "@/lib/i18n/client"

/**
 * Mobile Drawer Toggle Button
 *
 * This component now only renders the hamburger button that triggers
 * the sidebar overlay. The actual sidebar content is rendered by
 * MainSidebar component when in mobile mode.
 *
 * Uses useSidebarOptional() so it works both with and without
 * SidebarProvider context (for non-authenticated pages).
 */
export function MobileDrawer() {
  const { t } = useTranslations("sidebar")
  const sidebar = useSidebarOptional()

  // If no sidebar context (non-authenticated user), don't render
  if (!sidebar) {
    return null
  }

  const { open, isMobile } = sidebar

  // Only show hamburger button on mobile
  if (!isMobile) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={open}
      aria-label={t("accessibility.openMenu")}
    >
      <Menu className="h-6 w-6" />
    </Button>
  )
}
