"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, FolderTree, Users, FileText, ArrowLeft, LogOut, DollarSign } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTranslations } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface AdminSidebarProps {
  locale: string
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const { t } = useTranslations("admin")
  const pathname = usePathname()

  const menuItems = [
    {
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
      label: t("nav.dashboard")
    },
    {
      href: `/${locale}/admin/companies`,
      icon: Building2,
      label: t("nav.companies")
    },
    {
      href: `/${locale}/admin/categories`,
      icon: FolderTree,
      label: t("nav.categories")
    },
    {
      href: `/${locale}/admin/users`,
      icon: Users,
      label: t("nav.users")
    },
    {
      href: `/${locale}/admin/pricing`,
      icon: DollarSign,
      label: t("nav.pricing")
    },
    {
      href: `/${locale}/admin/audit`,
      icon: FileText,
      label: t("nav.audit")
    }
  ]

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r">
      <div className="flex flex-1 flex-col">
        {/* Main navigation */}
        <div className="flex-1 space-y-1 p-4">
          <div className="mb-4 px-3 py-2">
            <h2 className="text-lg font-semibold">{t("title")}</h2>
          </div>
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

        {/* Bottom actions */}
        <div className="border-t p-4 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            asChild
          >
            <Link href={`/${locale}`}>
              <ArrowLeft className="h-4 w-4" />
              {t("nav.exitAdmin")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </Button>
        </div>
      </div>
    </aside>
  )
}
