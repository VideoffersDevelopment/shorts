import { redirect } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { type ReactNode } from "react"

interface AdminLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params
  const session = await auth()

  // Redirect non-admin users to home
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${locale}`)
  }

  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex h-screen">
        <AdminSidebar locale={locale} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  )
}
