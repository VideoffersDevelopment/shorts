/**
 * Przelewy24 Payment Integration
 *
 * API documentation: https://developers.przelewy24.pl/
 * Sandbox URL: https://sandbox.przelewy24.pl
 * Production URL: https://secure.przelewy24.pl
 */

import crypto from "crypto"
import type { CheckoutOptions } from "./index"

// Configuration
const P24_SANDBOX = process.env.NODE_ENV !== "production"
const P24_BASE_URL = P24_SANDBOX
  ? "https://sandbox.przelewy24.pl"
  : "https://secure.przelewy24.pl"

// Environment variables
const P24_MERCHANT_ID = process.env.PRZELEWY24_MERCHANT_ID || ""
const P24_CRC = process.env.PRZELEWY24_CRC || ""
const P24_API_KEY = process.env.PRZELEWY24_API_KEY || ""

/**
 * Przelewy24 webhook data structure
 */
export interface Przelewy24WebhookData {
  merchantId: number
  posId: number
  sessionId: string
  amount: number
  originAmount: number
  currency: string
  orderId: number
  methodId: number
  statement: string
  sign: string
}

/**
 * Generate SHA384 signature for Przelewy24
 */
function generateSignature(data: Record<string, string | number>): string {
  // Order matters! Follow P24 documentation
  const signString = JSON.stringify(data)
  return crypto.createHash("sha384").update(signString).digest("hex")
}

/**
 * Generate registration signature
 */
function generateRegistrationSignature(
  sessionId: string,
  merchantId: number,
  amount: number,
  currency: string,
  crc: string
): string {
  const data = { sessionId, merchantId, amount, currency, crc }
  return generateSignature(data)
}

/**
 * Generate verification signature for webhook
 */
function generateVerificationSignature(
  sessionId: string,
  orderId: number,
  amount: number,
  currency: string,
  crc: string
): string {
  const data = { sessionId, orderId, amount, currency, crc }
  return generateSignature(data)
}

/**
 * Create Przelewy24 checkout session
 *
 * @returns Checkout URL for redirecting user
 */
export async function createPrzelewy24Checkout(
  options: CheckoutOptions
): Promise<string> {
  const merchantId = parseInt(P24_MERCHANT_ID, 10)
  const posId = merchantId // Usually same as merchantId

  // Generate signature for registration
  const sign = generateRegistrationSignature(
    options.sessionId,
    merchantId,
    options.amount,
    options.currency,
    P24_CRC
  )

  const requestBody = {
    merchantId,
    posId,
    sessionId: options.sessionId,
    amount: options.amount,
    currency: options.currency,
    description: options.description,
    email: options.email,
    country: "PL",
    language: "pl",
    urlReturn: options.returnUrl,
    urlStatus: options.notifyUrl,
    sign
  }

  const response = await fetch(`${P24_BASE_URL}/api/v1/transaction/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${merchantId}:${P24_API_KEY}`).toString("base64")}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error("Przelewy24 registration error:", errorData)
    throw new Error(`Przelewy24 registration failed: ${response.status}`)
  }

  const responseData = await response.json() as { data: { token: string } }
  const token = responseData.data.token

  // Return checkout URL with token
  return `${P24_BASE_URL}/trnRequest/${token}`
}

/**
 * Verify Przelewy24 webhook signature
 *
 * @returns true if signature is valid
 */
export function verifyPrzelewy24Signature(data: Przelewy24WebhookData): boolean {
  const expectedSign = generateVerificationSignature(
    data.sessionId,
    data.orderId,
    data.amount,
    data.currency,
    P24_CRC
  )

  return data.sign === expectedSign
}

/**
 * Verify transaction with Przelewy24
 *
 * After receiving webhook, we should verify the transaction
 */
export async function verifyPrzelewy24Transaction(
  sessionId: string,
  orderId: number,
  amount: number,
  currency: string
): Promise<boolean> {
  const merchantId = parseInt(P24_MERCHANT_ID, 10)

  const sign = generateVerificationSignature(
    sessionId,
    orderId,
    amount,
    currency,
    P24_CRC
  )

  const requestBody = {
    merchantId,
    posId: merchantId,
    sessionId,
    amount,
    currency,
    orderId,
    sign
  }

  try {
    const response = await fetch(`${P24_BASE_URL}/api/v1/transaction/verify`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${merchantId}:${P24_API_KEY}`).toString("base64")}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.error("Przelewy24 verification failed:", await response.text())
      return false
    }

    const responseData = await response.json() as { data: { status: string } }
    return responseData.data.status === "success"
  } catch (error) {
    console.error("Przelewy24 verification error:", error)
    return false
  }
}
