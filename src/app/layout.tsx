import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VideoShorts',
  description: 'Platforma do publikacji krótkich filmów promocyjnych dla firm',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            <ErrorBoundary>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster richColors position="top-right" />
              </ThemeProvider>
            </ErrorBoundary>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
