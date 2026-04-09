/**
 * Tpay Payment Integration
 *
 * API documentation: https://docs.tpay.com/
 * Sandbox: Use test credentials from Tpay panel
 */

import crypto from "crypto"
import type { CheckoutOptions } from "./index"

// Configuration
const TPAY_SANDBOX = process.env.NODE_ENV !== "production"
const TPAY_BASE_URL = TPAY_SANDBOX
  ? "https://secure.sandbox.tpay.com"
  : "https://secure.tpay.com"

// Environment variables
const TPAY_MERCHANT_ID = process.env.TPAY_MERCHANT_ID || ""
const TPAY_SECURITY_CODE = process.env.TPAY_SECURITY_CODE || ""
const TPAY_API_KEY = process.env.TPAY_API_KEY || ""

/**
 * Tpay webhook data structure
 */
export interface TpayWebhookData {
  id: string
  tr_id: string
  tr_date: string
  tr_crc: string
  tr_amount: string
  tr_paid: string
  tr_desc: string
  tr_status: string
  tr_error: string
  tr_email: string
  md5sum: string
  test_mode?: string
}

/**
 * Generate MD5 signature for Tpay
 */
function generateMd5Signature(data: string): string {
  return crypto.createHash("md5").update(data).digest("hex")
}

/**
 * Generate transaction signature for registration
 */
function generateTransactionSignature(
  merchantId: string,
  amount: string,
  crc: string,
  securityCode: string
): string {
  const signString = `${merchantId}${amount}${crc}${securityCode}`
  return generateMd5Signature(signString)
}

/**
 * Generate verification signature for webhook
 */
function generateWebhookSignature(
  merchantId: string,
  trId: string,
  trAmount: string,
  trCrc: string,
  securityCode: string
): string {
  const signString = `${merchantId}${trId}${trAmount}${trCrc}${securityCode}`
  return generateMd5Signature(signString)
}

/**
 * Create Tpay checkout session
 *
 * @returns Checkout URL for redirecting user
 */
export async function createTpayCheckout(
  options: CheckoutOptions
): Promise<string> {
  // Convert amount from grosze to PLN
  const amountPln = (options.amount / 100).toFixed(2)

  // Generate signature
  const sign = generateTransactionSignature(
    TPAY_MERCHANT_ID,
    amountPln,
    options.sessionId,
    TPAY_SECURITY_CODE
  )

  const requestBody = {
    id: TPAY_MERCHANT_ID,
    amount: amountPln,
    description: options.description,
    crc: options.sessionId,
    md5sum: sign,
    result_url: options.notifyUrl,
    return_url: options.returnUrl,
    return_error_url: options.returnUrl,
    email: options.email,
    name: "", // Optional
    language: "pl",
    api_password: TPAY_API_KEY
  }

  const formData = new URLSearchParams()
  Object.entries(requestBody).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const response = await fetch(`${TPAY_BASE_URL}/api/gw/${TPAY_API_KEY}/transaction/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error("Tpay registration error:", errorData)
    throw new Error(`Tpay registration failed: ${response.status}`)
  }

  const responseData = await response.json() as {
    result: number
    url?: string
    title?: string
    err?: string
  }

  if (responseData.result !== 1 || !responseData.url) {
    console.error("Tpay error:", responseData.err || "Unknown error")
    throw new Error(`Tpay registration failed: ${responseData.err || "Unknown error"}`)
  }

  return responseData.url
}

/**
 * Verify Tpay webhook signature
 *
 * @returns true if signature is valid
 */
export function verifyTpaySignature(data: TpayWebhookData): boolean {
  const expectedSign = generateWebhookSignature(
    TPAY_MERCHANT_ID,
    data.tr_id,
    data.tr_amount,
    data.tr_crc,
    TPAY_SECURITY_CODE
  )

  return data.md5sum === expectedSign
}

/**
 * Parse Tpay webhook status
 *
 * @returns Payment status
 */
export function parseTpayStatus(
  status: string
): "SUCCEEDED" | "FAILED" | "PENDING" {
  switch (status) {
    case "TRUE":
    case "PAID":
      return "SUCCEEDED"
    case "FALSE":
    case "ERROR":
      return "FAILED"
    default:
      return "PENDING"
  }
}
