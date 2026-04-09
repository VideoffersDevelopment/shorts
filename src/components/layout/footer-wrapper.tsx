"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"

interface FooterWrapperProps {
  children: ReactNode
}

export function FooterWrapper({ children }: FooterWrapperProps) {
  const { state, isMobile, isTablet, isDesktop } = useSidebar()

  return (
    <div
      className={cn(
        "transition-[padding] duration-200 ease-in-out",
        // Desktop: padding based on sidebar state
        isDesktop && state === "expanded" && "pl-60",
        isDesktop && state === "collapsed" && "pl-16",
        // Tablet: always collapsed width
        isTablet && "pl-16",
        // Mobile: no padding (sidebar is overlay)
        isMobile && "pl-0"
      )}
    >
      {children}
    </div>
  )
}
