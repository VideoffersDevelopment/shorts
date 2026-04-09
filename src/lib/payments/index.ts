/**
 * Payment Abstraction Layer
 *
 * Multi-provider payment system supporting Przelewy24 and Tpay
 * Used for purchasing point packages (wallet top-up)
 */

import { POINT_PACKAGES, type PointPackageId } from "@/lib/wallet/wallet-constants"

// Re-export point packages for backward compatibility
export { POINT_PACKAGES, type PointPackageId }

/**
 * Find a point package by its ID
 */
export function getPointPackage(packageId: string) {
  return POINT_PACKAGES.find(p => p.id === packageId) ?? null
}

/**
 * Validate that a string is a valid package ID
 */
export function isValidPackageId(id: string): id is PointPackageId {
  return POINT_PACKAGES.some(p => p.id === id)
}

/**
 * Checkout options for creating a payment session
 */
export interface CheckoutOptions {
  sessionId: string
  amount: number // in grosze (cents)
  currency: string
  description: string
  email: string
  returnUrl: string
  notifyUrl: string
}

/**
 * Payment provider interface
 */
export interface PaymentProvider {
  createCheckout(options: CheckoutOptions): Promise<string>
  verifyWebhook(data: unknown): boolean
}

/**
 * Payment providers enum matching Prisma schema
 */
export type PaymentProviderType = "PRZELEWY24" | "TPAY" | "OTHER"

/**
 * Format amount from grosze to PLN display
 */
export function formatAmount(grosze: number): string {
  return (grosze / 100).toFixed(2)
}

// Re-export provider functions
export {
  createPrzelewy24Checkout,
  verifyPrzelewy24Signature,
  type Przelewy24WebhookData
} from "./przelewy24"

export {
  createTpayCheckout,
  verifyTpaySignature,
  type TpayWebhookData
} from "./tpay"
