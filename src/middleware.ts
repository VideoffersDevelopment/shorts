import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Initialize NextAuth with edge-compatible config (no Prisma)
const { auth } = NextAuth(authConfig)

const locales = ["pl", "en", "de", "es", "ru", "uk"]
const defaultLocale = "pl"

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always"
})

const authPages = ["/login", "/signup", "/signup/company", "/verify-email", "/forgot-password", "/reset-password"]
const protectedPrefix = "/panel"

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Skip static files and api routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Apply intl middleware first
  const response = intlMiddleware(req)

  // Extract locale from pathname
  const pathLocale = pathname.split("/")[1]
  const locale = locales.includes(pathLocale) ? pathLocale : defaultLocale

  // Get path without locale
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/"

  // Check auth status using edge-compatible auth
  const session = await auth()
  const isAuthenticated = !!session?.user

  // Immediately logout blocked users
  if (isAuthenticated && session.user.isBlocked) {
    // Clear session by redirecting to signout, then to login with blocked message
    const signOutUrl = new URL(`/api/auth/signout`, req.url)
    signOutUrl.searchParams.set("callbackUrl", `/${locale}/login?error=blocked`)
    return NextResponse.redirect(signOutUrl)
  }

  // Check if current page is auth page
  // Note: /signup/company/complete requires auth (for OAuth flow completion) so it's excluded
  const isCompanySignupComplete = pathWithoutLocale === "/signup/company/complete"
  const isAuthPage = !isCompanySignupComplete && authPages.some(page => pathWithoutLocale.startsWith(page))

  // Check if current page is protected
  const isProtectedPage = pathWithoutLocale.startsWith(protectedPrefix)
  const isAdminPage = pathWithoutLocale.startsWith("/admin")
  const isCompanyPanelPage = pathWithoutLocale.startsWith("/panel/company")

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/panel`, req.url))
  }

  // Redirect unauthenticated users to login
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL(`/${locale}/login`, req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Block non-ADMIN users from admin routes
  if (isAdminPage) {
    if (!isAuthenticated) {
      const loginUrl = new URL(`/${locale}/login`, req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }
  }

  // Note: Company panel authorization is handled by the pages themselves
  // checking the database directly. This avoids race conditions when
  // user role is updated (JWT cookie may have stale role until next full reload).
  // The pages check companyProfile existence in DB which is always current.

  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]
}
