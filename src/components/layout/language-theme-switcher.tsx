"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Moon, Sun, Globe, Monitor, Languages } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslations } from "@/lib/i18n/client"

const languages = [
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
]

interface LanguageThemeSwitcherProps {
  locale: string
  variant?: "header" | "menu"
}

/**
 * Combined Language and Theme switcher component.
 *
 * - `variant="header"`: Compact dropdown for header placement (non-auth users)
 * - `variant="menu"`: Inline items for user dropdown menu (auth users)
 */
export function LanguageThemeSwitcher({
  locale,
  variant = "header"
}: LanguageThemeSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { t } = useTranslations("preferences")

  const switchLocale = React.useCallback(
    (newLocale: string) => {
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
      router.push(newPathname)
    },
    [pathname, locale, router]
  )

  const currentLanguage = languages.find((lang) => lang.code === locale)

  // For header variant - compact dropdown with both language and theme
  if (variant === "header") {
    return (
      <div className="flex items-center gap-1">
        {/* Language Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 px-2.5 gap-1.5">
              <span className="text-base">{currentLanguage?.flag}</span>
              <span className="hidden sm:inline text-sm">{currentLanguage?.code.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("language.label")}
            </DropdownMenuLabel>
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => switchLocale(lang.code)}
                className={locale === lang.code ? "bg-accent" : ""}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("accessibility.toggleTheme")}</span>
        </Button>
      </div>
    )
  }

  // For menu variant - items to be placed inside user dropdown
  return (
    <>
      {/* Language Sub-menu */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Languages className="mr-2 h-4 w-4" />
          <span>{t("language.label")}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {currentLanguage?.flag} {currentLanguage?.code.toUpperCase()}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={locale === lang.code ? "bg-accent" : ""}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {/* Theme Sub-menu */}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sun className="mr-2 h-4 w-4 dark:hidden" />
          <Moon className="mr-2 h-4 w-4 hidden dark:block" />
          <span>{t("theme.label")}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            {t("theme.light")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            {t("theme.dark")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            {t("theme.system")}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  )
}
