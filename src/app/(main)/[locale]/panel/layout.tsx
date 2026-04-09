/**
 * Panel Layout - Simplified
 *
 * Header, Sidebar, and Footer are now handled by the parent layout
 * at (main)/[locale]/layout.tsx for all authenticated users.
 *
 * This layout is now just a pass-through for panel pages.
 */

interface PanelLayoutProps {
  children: React.ReactNode
}

export default function PanelLayout({ children }: PanelLayoutProps) {
  // Parent layout already provides Header/MainSidebar/Footer/MainContent
  // Just pass children through
  return <>{children}</>
}
