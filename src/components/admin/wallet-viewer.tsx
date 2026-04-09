"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Gift, Wallet, Snowflake } from "lucide-react"
import { cn } from "@/lib/utils"

interface Batch {
  id: string
  wallet: string
  type: string
  initialAmount: number
  currentBalance: number
  expiresAt: string
  isFrozen: boolean
  createdAt: string
}

interface Transaction {
  id: string
  amount: number
  actionType: string
  wallet: string
  createdAt: string
  short: { id: string; title: string } | null
}

interface WalletViewerProps {
  userId: string
  userName: string | null
  promoBalance: number
  mainBalance: number
  totalBalance: number
  batches: Batch[]
  transactions: Transaction[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function WalletViewer({
  userId,
  userName,
  promoBalance,
  mainBalance,
  totalBalance,
  batches,
  transactions
}: WalletViewerProps) {
  return (
    <div className="space-y-6">
      {/* User info + balances */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{totalBalance.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{promoBalance.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">PROMO</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{mainBalance.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">MAIN</p>
          </CardContent>
        </Card>
      </div>

      {/* Batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credit Batches ({batches.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Initial</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-xs">Batch ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id} className={cn(batch.isFrozen && "opacity-60")}>
                  <TableCell>
                    <Badge variant={batch.wallet === "PROMO" ? "secondary" : "default"}>
                      {batch.wallet}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{batch.type}</TableCell>
                  <TableCell className="text-right font-bold">
                    {batch.currentBalance.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {batch.initialAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(batch.expiresAt)}
                  </TableCell>
                  <TableCell>
                    {batch.isFrozen ? (
                      <Badge variant="destructive" className="gap-1">
                        <Snowflake className="h-3 w-3" />
                        Frozen
                      </Badge>
                    ) : batch.currentBalance > 0 ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Depleted</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                    {batch.id}
                  </TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No credit batches found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Related Short</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{tx.actionType}</TableCell>
                  <TableCell>
                    <Badge variant={tx.wallet === "PROMO" ? "secondary" : "default"} className="text-xs">
                      {tx.wallet}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-medium",
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tx.short ? (
                      <span className="text-sm line-clamp-1">{tx.short.title}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
