import Link from "next/link"
import { Play } from "lucide-react"
import { getTranslations } from "next-intl/server"

interface FooterProps {
  locale: string
}

export async function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const t = await getTranslations("home")

  return (
    <footer className="border-t border-border py-8 bg-background">
      <div className="w-full px-4 md:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo & Copyright */}
        <div className="flex items-center gap-2 text-foreground">
          <div className="size-6 flex items-center justify-center bg-primary rounded-md text-primary-foreground">
            <Play className="h-3 w-3 fill-current" />
          </div>
          <span className="text-sm font-bold">
            Videoffers © {currentYear}
          </span>
        </div>

        {/* Links */}
        <nav className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link
            href={`/${locale}/for-business`}
            className="hover:text-primary transition-colors"
          >
            {t("footer.forBusiness")}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="hover:text-primary transition-colors"
          >
            {t("footer.about")}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="hover:text-primary transition-colors"
          >
            {t("footer.privacy")}
          </Link>
          <Link
            href={`/${locale}/terms`}
            className="hover:text-primary transition-colors"
          >
            {t("footer.terms")}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
