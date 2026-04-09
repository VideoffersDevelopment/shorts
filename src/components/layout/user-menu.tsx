"use client"

import { User, Settings, LogOut, Palette, Building2, Shield } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "@/lib/i18n/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import type { Role } from "@prisma/client"
import { LanguageThemeSwitcher } from "./language-theme-switcher"

interface UserMenuProps {
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    role?: Role
  }
  locale: string
}

export function UserMenu({ user: initialUser, locale }: UserMenuProps) {
  const { t } = useTranslations("sidebar")
  const router = useRouter()

  // Użyj useSession dla reaktywnych aktualizacji (np. po upgrade do COMPANY)
  const { data: session } = useSession()

  // Preferuj dane z sesji (reaktywne), fallback na props (SSR)
  const user = session?.user ?? initialUser

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/${locale}/panel/profile`)}>
          <User className="mr-2 h-4 w-4" />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/${locale}/panel/settings`)}>
          <Settings className="mr-2 h-4 w-4" />
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/${locale}/panel/preferences`)}>
          <Palette className="mr-2 h-4 w-4" />
          {t("preferences")}
        </DropdownMenuItem>

        {/* Role-based menu items */}
        {user.role === "USER" && (
          <DropdownMenuItem onClick={() => router.push(`/${locale}/settings/upgrade`)}>
            <Building2 className="mr-2 h-4 w-4" />
            {t("menu.upgradeToCompany")}
          </DropdownMenuItem>
        )}

        {user.role === "COMPANY" && (
          <DropdownMenuItem onClick={() => router.push(`/${locale}/panel/company/profile`)}>
            <Building2 className="mr-2 h-4 w-4" />
            {t("menu.companyProfile")}
          </DropdownMenuItem>
        )}

        {user.role === "ADMIN" && (
          <DropdownMenuItem onClick={() => router.push(`/${locale}/admin`)}>
            <Shield className="mr-2 h-4 w-4" />
            {t("menu.adminPanel")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Language & Theme Switchers - ABOVE Logout */}
        <LanguageThemeSwitcher locale={locale} variant="menu" />

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
