"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Snowflake, RotateCcw, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface WalletActionsProps {
  userId: string
}

export function WalletActions({ userId }: WalletActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <GrantDialog userId={userId} />
      <FreezeDialog />
      <UnfreezeDialog />
      <RefundDialog userId={userId} />
    </div>
  )
}

function GrantDialog({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [wallet, setWallet] = useState<string>("MAIN")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    const amountNum = parseInt(amount)
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than 0")
      return
    }
    if (!reason.trim()) {
      setError("Reason is required")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/wallet/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, wallet, amount: amountNum, reason })
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Grant failed")
        return
      }
      toast.success(`Granted ${amountNum} pts to ${wallet}`)
      setOpen(false)
      setAmount("")
      setReason("")
      router.refresh()
    } catch {
      setError("Grant failed")
    } finally {
      setIsLoading(false)
    }
  }, [userId, wallet, amount, reason, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          Grant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant Credits</DialogTitle>
          <DialogDescription>Add bonus credits to user wallet</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Wallet</Label>
            <Select value={wallet} onValueChange={setWallet}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAIN">MAIN</SelectItem>
                <SelectItem value="PROMO">PROMO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount (points)</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Compensation for service issue"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Grant Credits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FreezeDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [batchId, setBatchId] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!batchId.trim()) {
      setError("Batch ID is required")
      return
    }
    if (!reason.trim()) {
      setError("Reason is required")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/wallet/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, reason })
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Freeze failed")
        return
      }
      toast.success("Batch frozen")
      setOpen(false)
      setBatchId("")
      setReason("")
      router.refresh()
    } catch {
      setError("Freeze failed")
    } finally {
      setIsLoading(false)
    }
  }, [batchId, reason, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Snowflake className="mr-1 h-4 w-4" />
          Freeze
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Freeze Batch</DialogTitle>
          <DialogDescription>Freeze a credit batch to prevent spending</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Batch ID</Label>
            <Input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Paste batch ID from the table above"
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Fraud investigation"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} variant="destructive" className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Freeze Batch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UnfreezeDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [batchId, setBatchId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!batchId.trim()) {
      setError("Batch ID is required")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/wallet/unfreeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId })
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Unfreeze failed")
        return
      }
      toast.success("Batch unfrozen")
      setOpen(false)
      setBatchId("")
      router.refresh()
    } catch {
      setError("Unfreeze failed")
    } finally {
      setIsLoading(false)
    }
  }, [batchId, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Snowflake className="mr-1 h-4 w-4" />
          Unfreeze
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unfreeze Batch</DialogTitle>
          <DialogDescription>Remove freeze from a credit batch</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Batch ID</Label>
            <Input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Paste batch ID"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unfreeze Batch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RefundDialog({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [batchId, setBatchId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    const amountNum = parseInt(amount)
    if (!batchId.trim()) {
      setError("Batch ID is required")
      return
    }
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than 0")
      return
    }
    if (!reason.trim()) {
      setError("Reason is required")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/wallet/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, batchId, amount: amountNum, reason })
      })
      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Refund failed")
        return
      }
      toast.success(`Refunded ${amountNum} pts`)
      setOpen(false)
      setBatchId("")
      setAmount("")
      setReason("")
      router.refresh()
    } catch {
      setError("Refund failed")
    } finally {
      setIsLoading(false)
    }
  }, [userId, batchId, amount, reason, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <RotateCcw className="mr-1 h-4 w-4" />
          Refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund to Batch</DialogTitle>
          <DialogDescription>Refund points back to a specific batch</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Batch ID</Label>
            <Input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Paste batch ID from the table above"
            />
          </div>
          <div className="space-y-2">
            <Label>Amount (points)</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Service error refund"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refund Credits
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
