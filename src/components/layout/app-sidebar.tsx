"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, Settings, LogOut, Building2, Shield, Video, CreditCard } from "lucide-react"
import { useTranslations } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import type { Role } from "@prisma/client"

interface AppSidebarProps {
  locale: string
  userRole?: Role
}

export function AppSidebar({ locale, userRole }: AppSidebarProps) {
  const { t } = useTranslations("sidebar")
  const pathname = usePathname()

  const baseItems = [
    { href: `/${locale}/panel`, icon: Home, label: t("home") },
    { href: `/${locale}/panel/profile`, icon: User, label: t("profile") },
    { href: `/${locale}/panel/settings`, icon: Settings, label: t("settings") }
  ]

  // Company items (show only if COMPANY role)
  const companyItems = userRole === "COMPANY" ? [
    { href: `/${locale}/panel/company/profile`, icon: Building2, label: t("company.profile") },
    { href: `/${locale}/panel/shorts`, icon: Video, label: t("company.shorts") },
    { href: `/${locale}/panel/credits`, icon: CreditCard, label: t("company.credits") }
  ] : []

  // Admin link (show only if ADMIN role)
  const adminItems = userRole === "ADMIN" ? [
    { href: `/${locale}/admin`, icon: Shield, label: t("admin") }
  ] : []

  const menuItems = [...baseItems, ...companyItems, ...adminItems]

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
