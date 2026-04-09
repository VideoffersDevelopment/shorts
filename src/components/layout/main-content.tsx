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
 */
export function MainContent({ children, className }: MainContentProps) {
  const { state, isMobile, isTablet, isDesktop } = useSidebar()

  return (
    <main
      data-sidebar={state}
      className={cn(
        "flex-1 transition-[margin-left] duration-200 ease-in-out",
        // Desktop: margin based on sidebar state
        isDesktop && state === "expanded" && "ml-60",
        isDesktop && state === "collapsed" && "ml-16",
        // Tablet: always collapsed width
        isTablet && "ml-16",
        // Mobile: no margin (sidebar is overlay)
        isMobile && "ml-0",
        className
      )}
    >
      <div className="w-full px-4 md:px-6 lg:px-8 py-6">
        {children}
      </div>
    </main>
  )
}
