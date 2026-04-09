import type { CreditBatch, CreditActionType, WalletType, CreditBatchType } from "@prisma/client"

// Result of getWalletBalance()
export interface WalletBalanceResult {
  promo: {
    balance: number
    expiresAt: Date | null    // earliest expiration from PROMO batches
    daysRemaining: number | null
  }
  main: {
    balance: number
    expiresAt: Date | null
    isMaintenanceFeeActive: boolean  // true if lastActivityAt < NOW - 12 months
  }
  total: number
  batches: CreditBatch[]  // active batches sorted by expiresAt ASC
}

// Result of spendCredits()
export interface SpendResult {
  success: boolean
  totalSpent: number
  transactionIds: string[]
  batchesAffected: { batchId: string; amountDeducted: number; wallet: WalletType }[]
}

// Result of transferTip()
export interface TransferTipResult {
  success: boolean
  cost: number
  senderTransactionIds: string[]
  receiverTransactionId: string
  receiverBatchId: string
}

// Options for addCredits()
export interface AddCreditsOptions {
  expiresAt?: Date           // custom expiration (for PROMO grants)
  paymentId?: string         // link to payment record
  metadata?: Record<string, unknown>
}

// Error types
export class InsufficientCreditsError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number
  ) {
    super(`Insufficient credits: required ${required}, available ${available}`)
    this.name = "InsufficientCreditsError"
  }
}

export class BatchFrozenError extends Error {
  constructor(public readonly batchId: string) {
    super(`Batch ${batchId} is frozen`)
    this.name = "BatchFrozenError"
  }
}

// Pricing config key type
export type PricingKey =
  | "PUBLICATION"
  | "BOOST_STD"
  | "EXTENSION_30D"
  | "EXTENSION_3M"
  | "EXTENSION_6M"
  | "EXTENSION_12M"
  | "SUPER_LIKE"
  | "MAINTENANCE_FEE"
  | "WATERMARK_RM"
  | "UPLOAD_4K"
  | "LINK_BIO"

// Re-export Prisma types for convenience
export type { CreditBatch, CreditActionType, WalletType, CreditBatchType }
