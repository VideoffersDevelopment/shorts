import { type ReactNode } from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FooterWrapper } from "@/components/layout/footer-wrapper"
import { MainSidebar } from "@/components/layout/main-sidebar"
import { SidebarProvider } from "@/components/layout/sidebar-provider"
import { MainContent } from "@/components/layout/main-content"
import { getMainCategories } from "@/app/actions/categories/get-categories"

interface MainLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function MainLayout({
  children,
  params,
}: MainLayoutProps) {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const session = await auth()
  const categories = await getMainCategories()

  const isAuthenticated = !!session?.user

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {isAuthenticated ? (
        <SidebarProvider>
          <div className="flex min-h-screen flex-col">
            <Header locale={locale} />
            <div className="flex flex-1">
              <MainSidebar
                locale={locale}
                categories={categories}
                user={session?.user ? {
                  id: session.user.id,
                  role: session.user.role
                } : null}
              />
              <MainContent>{children}</MainContent>
            </div>
            <FooterWrapper>
              <Footer locale={locale} />
            </FooterWrapper>
          </div>
        </SidebarProvider>
      ) : (
        // Non-authenticated: children handle their own layout (Header/Footer)
        children
      )}
    </NextIntlClientProvider>
  )
}
