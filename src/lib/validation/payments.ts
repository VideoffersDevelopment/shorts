import { z } from "zod"

/**
 * Valid point package IDs
 */
export const PACKAGE_IDS = ["starter", "standard", "premium", "business"] as const
export type PackageId = (typeof PACKAGE_IDS)[number]

/**
 * Schema for payment checkout (point package purchase)
 */
export const checkoutSchema = z.object({
  provider: z.enum(["PRZELEWY24", "TPAY"], {
    errorMap: () => ({ message: "Invalid payment provider" })
  }),
  packageId: z.enum(PACKAGE_IDS, {
    errorMap: () => ({ message: "Invalid point package" })
  }),
  returnUrl: z.string().url("Invalid return URL").optional(),
  locale: z.string().default("pl")
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

/**
 * Schema for webhook verification (Przelewy24)
 */
export const przelewy24WebhookSchema = z.object({
  merchantId: z.number().int(),
  posId: z.number().int(),
  sessionId: z.string(),
  amount: z.number().int(),
  originAmount: z.number().int(),
  currency: z.string(),
  orderId: z.number().int(),
  methodId: z.number().int(),
  statement: z.string(),
  sign: z.string()
})

export type Przelewy24WebhookInput = z.infer<typeof przelewy24WebhookSchema>

/**
 * Schema for webhook verification (Tpay)
 */
export const tpayWebhookSchema = z.object({
  id: z.string(),
  tr_id: z.string(),
  tr_date: z.string(),
  tr_crc: z.string(),
  tr_amount: z.string(),
  tr_paid: z.string(),
  tr_desc: z.string(),
  tr_status: z.enum(["TRUE", "FALSE"]),
  tr_error: z.string(),
  tr_email: z.string().email(),
  md5sum: z.string()
})

export type TpayWebhookInput = z.infer<typeof tpayWebhookSchema>
