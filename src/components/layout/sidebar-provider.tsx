"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { useBreakpoints } from "@/hooks/use-media-query"

type SidebarState = "expanded" | "collapsed" | "hidden"

interface SidebarContextValue {
  /** Current sidebar state based on screen size and user preference */
  state: SidebarState
  /** Whether the mobile overlay is open */
  isOpen: boolean
  /** Breakpoint flags */
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  /** Toggle sidebar (expand/collapse on desktop, open/close on mobile) */
  toggle: () => void
  /** Open mobile overlay */
  open: () => void
  /** Close mobile overlay */
  close: () => void
  /** Set collapsed preference (persisted to localStorage) */
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

const STORAGE_KEY = "sidebar-collapsed"

interface SidebarProviderProps {
  children: ReactNode
  /** Default collapsed state for desktop */
  defaultCollapsed?: boolean
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const { isMobile, isTablet, isDesktop } = useBreakpoints()

  // User preference for collapsed state (desktop only)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  // Mobile overlay state
  const [isOpen, setIsOpen] = useState(false)

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(stored === "true")
    }
  }, [])

  // Persist preference to localStorage
  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed)
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [])

  // Close mobile overlay when screen size changes to tablet/desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      setIsOpen(false)
    }
  }, [isMobile, isOpen])

  // Determine current state based on screen size and preferences
  const state: SidebarState = isMobile
    ? "hidden" // Mobile: sidebar hidden, uses overlay
    : isTablet
      ? "collapsed" // Tablet: always collapsed (icons only)
      : isCollapsed
        ? "collapsed" // Desktop with user preference
        : "expanded" // Desktop default

  // Toggle behavior
  const toggle = useCallback(() => {
    if (isMobile) {
      // Mobile: toggle overlay
      setIsOpen((prev) => !prev)
    } else {
      // Desktop/Tablet: toggle collapsed state
      setCollapsed(!isCollapsed)
    }
  }, [isMobile, isCollapsed, setCollapsed])

  // Open mobile overlay
  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Close mobile overlay
  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const value: SidebarContextValue = {
    state,
    isOpen,
    isMobile,
    isTablet,
    isDesktop,
    toggle,
    open,
    close,
    setCollapsed,
  }

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

/**
 * Hook to access sidebar context.
 * Must be used within a SidebarProvider.
 */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

/**
 * Optional hook that returns null if not within provider.
 * Useful for components that may or may not be in sidebar context.
 */
export function useSidebarOptional(): SidebarContextValue | null {
  return useContext(SidebarContext)
}
