"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"

interface MainContentProps {
  children: ReactNode
  className?: string
}

/**
 * Main content wrapper that adjusts margin based on sidebar state.
 * Must be used within a SidebarProvider.
 *
 * Uses CSS-based margin that matches sidebar width to avoid layout shift.
 * JS-based state is used only for transition class toggling.
 */
export function MainContent({ children, className }: MainContentProps) {
  const { state, isMobile, isTablet, isDesktop } = useSidebar()

  return (
    <main
      data-sidebar={state}
      className={cn(
        // Base: reserve sidebar space via CSS to avoid layout shift on hydration
        // lg = 1024px matches useIsDesktop breakpoint
        "flex-1 lg:ml-60",
        // JS-driven overrides after hydration (with transition)
        isDesktop && state === "collapsed" && "!ml-16",
        isTablet && "!ml-16",
        isMobile && "!ml-0",
        // Smooth transition only after initial render
        "transition-[margin-left] duration-200 ease-in-out",
        className
      )}
    >
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 has-[[data-full-bleed]]:!p-0">
        {children}
      </div>
    </main>
  )
}
