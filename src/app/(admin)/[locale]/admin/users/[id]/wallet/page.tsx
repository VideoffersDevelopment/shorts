import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { WalletViewer } from "@/components/admin/wallet-viewer"
import { WalletActions } from "@/components/admin/wallet-actions"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Wallet } from "lucide-react"
import Link from "next/link"

interface AdminWalletPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function AdminUserWalletPage({ params }: AdminWalletPageProps) {
  const { locale, id: userId } = await params

  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${locale}/login`)
  }

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true }
  })

  if (!user) {
    redirect(`/${locale}/admin/users`)
  }

  // Fetch wallet data via API (reuses existing logic)
  const batches = await prisma.creditBatch.findMany({
    where: { userId },
    orderBy: { expiresAt: "asc" },
  })

  const transactions = await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      short: { select: { id: true, title: true } },
      batch: { select: { wallet: true } }
    }
  })

  // Calculate balances
  const now = new Date()
  const activeBatches = batches.filter(
    b => b.currentBalance > 0 && b.expiresAt > now && !b.isFrozen
  )
  const promoBalance = activeBatches
    .filter(b => b.wallet === "PROMO")
    .reduce((sum, b) => sum + b.currentBalance, 0)
  const mainBalance = activeBatches
    .filter(b => b.wallet === "MAIN")
    .reduce((sum, b) => sum + b.currentBalance, 0)

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/${locale}/admin/users`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">User Wallet</h1>
              <p className="text-muted-foreground">
                {user.email} ({user.id})
              </p>
            </div>
          </div>
          <WalletActions userId={userId} />
        </div>
      </div>

      <WalletViewer
        userId={userId}
        userName={user.email}
        promoBalance={promoBalance}
        mainBalance={mainBalance}
        totalBalance={promoBalance + mainBalance}
        batches={batches.map(b => ({
          id: b.id,
          wallet: b.wallet,
          type: b.type,
          initialAmount: b.initialAmount,
          currentBalance: b.currentBalance,
          expiresAt: b.expiresAt.toISOString(),
          isFrozen: b.isFrozen,
          createdAt: b.createdAt.toISOString(),
        }))}
        transactions={transactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          actionType: tx.actionType,
          wallet: tx.batch?.wallet ?? "MAIN",
          createdAt: tx.createdAt.toISOString(),
          short: tx.short,
        }))}
      />
    </div>
  )
}
