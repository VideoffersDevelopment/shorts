import Link from "next/link"
import { Play, Search } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UserMenu } from "./user-menu"
import { MobileDrawer } from "./mobile-drawer"
import { LanguageThemeSwitcher } from "./language-theme-switcher"
import { AddShortButton } from "@/components/shorts/add-short-button"
import { HeaderFilterControls } from "@/components/feed/header-filter-controls"
import { SearchBar } from "@/components/search/search-bar"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

interface HeaderProps {
  locale: string
}

export async function Header({ locale }: HeaderProps) {
  const session = await auth()
  const t = await getTranslations("common")

  // Fetch company status for COMPANY users
  let companyStatus = null
  if (session?.user?.id && session.user.role === "COMPANY") {
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id },
      select: { status: true }
    })
    companyStatus = companyProfile?.status ?? null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 md:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          <MobileDrawer />
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 text-foreground shrink-0"
          >
            <div className="size-8 flex items-center justify-center bg-primary rounded-lg text-primary-foreground">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <span className="hidden md:block text-lg font-bold tracking-tight">
              Videoffers
            </span>
          </Link>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <SearchBar className="w-full" />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile: Search icon linking to search page */}
          <Link href={`/${locale}/search`} className="md:hidden">
            <Button variant="ghost" size="icon" aria-label={t("search.open")}>
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          {/* Filter controls */}
          <HeaderFilterControls />
          {session?.user ? (
            // Logged in: Add Short button + UserMenu
            <>
              <AddShortButton
                userRole={session.user.role}
                companyStatus={companyStatus}
                locale={locale}
              />
              <UserMenu user={session.user} locale={locale} />
            </>
          ) : (
            // Not logged in: Language/Theme + Login + Get Started
            <>
              <LanguageThemeSwitcher locale={locale} variant="header" />
              <Button
                variant="secondary"
                size="sm"
                className="hidden sm:flex"
                asChild
              >
                <Link href={`/${locale}/login`}>{t("auth.login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${locale}/signup`}>{t("auth.getStarted")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
