import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { Coins, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletBalanceDisplay } from "@/components/payments/wallet-balance-display"
import { CreditsManagement } from "@/components/payments/credits-management"
import { CreditsPackages } from "@/components/payments/credits-packages"
import { getWalletBalance } from "@/lib/wallet/wallet-service"

interface CreditsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ paymentId?: string; status?: string }>
}

export default async function CreditsPage({ params, searchParams }: CreditsPageProps) {
  const { locale } = await params
  const { paymentId, status } = await searchParams

  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  // Check if user is a company
  if (session.user.role !== "COMPANY") {
    redirect(`/${locale}/panel`)
  }

  const t = await getTranslations("payments")

  // Get user's credit balance
  const wallet = await getWalletBalance(session.user.id)
  const credits = wallet.total

  // Get all transactions
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      short: {
        select: { id: true, title: true }
      }
    }
  })

  // Calculate running balance for each transaction
  let runningBalance = wallet.total
  const transactionsWithBalance = transactions.map((tx) => {
    const balanceAfter = runningBalance
    runningBalance -= tx.amount
    return {
      ...tx,
      balanceAfter
    }
  })

  // Check if there's a successful payment to show
  const paymentSuccess = status === "completed" && paymentId

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("page.title")}</h1>
        <p className="text-muted-foreground">{t("page.description")}</p>
      </div>

      {/* Payment Success Alert */}
      {paymentSuccess && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-green-500 p-2">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {t("page.paymentSuccess")}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t("page.creditsAdded")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("page.balance")}</CardTitle>
          <CardDescription>{t("page.balanceDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <WalletBalanceDisplay
            promo={{
              balance: wallet.promo.balance,
              expiresAt: wallet.promo.expiresAt?.toISOString() ?? null,
              daysRemaining: wallet.promo.daysRemaining,
            }}
            main={{
              balance: wallet.main.balance,
              expiresAt: wallet.main.expiresAt?.toISOString() ?? null,
              isMaintenanceFeeActive: wallet.main.isMaintenanceFeeActive,
            }}
            total={wallet.total}
          />
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("packages.title")}
          </CardTitle>
          <CardDescription>{t("packages.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreditsPackages />
        </CardContent>
      </Card>

      {/* Credits Management (History + Purchase Modal) */}
      <CreditsManagement transactions={transactionsWithBalance} />

      {/* Info Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{t("info.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("info.description")}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>{t("info.point1")}</li>
                <li>{t("info.point2")}</li>
                <li>{t("info.point3")}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
