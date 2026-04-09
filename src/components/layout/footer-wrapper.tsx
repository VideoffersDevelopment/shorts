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
        "transition-[margin-left] duration-200 ease-in-out",
        // Base: reserve sidebar space via CSS (matches MainContent)
        "lg:ml-60",
        // JS-driven overrides after hydration
        isDesktop && state === "collapsed" && "!ml-16",
        isTablet && "!ml-16",
        isMobile && "!ml-0"
      )}
    >
      {children}
    </div>
  )
}
