import { describe, it, expect } from "vitest"
import {
  checkoutSchema,
  przelewy24WebhookSchema,
  tpayWebhookSchema,
  PACKAGE_IDS,
  type CheckoutInput,
  type Przelewy24WebhookInput,
  type TpayWebhookInput,
  type PackageId
} from "./payments"

describe("payments validation schemas", () => {
  // ===========================================================================
  // PACKAGE_IDS constant
  // ===========================================================================

  describe("PACKAGE_IDS", () => {
    it("contains correct package IDs", () => {
      expect(PACKAGE_IDS).toEqual(["starter", "standard", "premium", "business"])
    })

    it("is readonly", () => {
      // TypeScript ensures this at compile time
      // Runtime check that it's an array with expected length
      expect(PACKAGE_IDS.length).toBe(4)
    })
  })

  // ===========================================================================
  // checkoutSchema - VALID DATA
  // ===========================================================================

  describe("checkoutSchema", () => {
    describe("valid data", () => {
      it("accepts complete valid checkout with PRZELEWY24", () => {
        const validData: CheckoutInput = {
          provider: "PRZELEWY24",
          packageId: "standard",
          returnUrl: "https://example.com/success",
          locale: "pl"
        }

        const result = checkoutSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it("accepts complete valid checkout with TPAY", () => {
        const validData: CheckoutInput = {
          provider: "TPAY",
          packageId: "premium",
          returnUrl: "https://example.com/success",
          locale: "en"
        }

        const result = checkoutSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.provider).toBe("TPAY")
        }
      })

      it("accepts checkout without returnUrl", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "starter"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.returnUrl).toBeUndefined()
        }
      })

      it("defaults locale to pl", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "starter"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.locale).toBe("pl")
        }
      })

      it("accepts all valid package IDs", () => {
        const packages: PackageId[] = ["starter", "standard", "premium", "business"]

        packages.forEach((packageId) => {
          const data = {
            provider: "PRZELEWY24",
            packageId
          }

          const result = checkoutSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })
    })

    // ===========================================================================
    // checkoutSchema - PROVIDER VALIDATION
    // ===========================================================================

    describe("provider validation", () => {
      it("rejects invalid provider", () => {
        const data = {
          provider: "STRIPE",
          packageId: "standard"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid payment provider"
          )
        }
      })

      it("rejects empty provider", () => {
        const data = {
          provider: "",
          packageId: "standard"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects missing provider", () => {
        const data = {
          packageId: "standard"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("is case sensitive for provider", () => {
        const data = {
          provider: "przelewy24", // lowercase
          packageId: "standard"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
      })
    })

    // ===========================================================================
    // checkoutSchema - PACKAGE_ID VALIDATION
    // ===========================================================================

    describe("packageId validation", () => {
      it("rejects invalid package ID", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "invalid"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid point package")
        }
      })

      it("rejects numeric package ID", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: 10
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects empty packageId", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: ""
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects missing packageId", () => {
        const data = {
          provider: "PRZELEWY24"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("is case sensitive for packageId", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "STARTER" // uppercase
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
      })
    })

    // ===========================================================================
    // checkoutSchema - URL VALIDATION
    // ===========================================================================

    describe("URL validation", () => {
      it("rejects invalid returnUrl", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "standard",
          returnUrl: "not-a-url"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid return URL")
        }
      })

      it("accepts localhost URLs", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "standard",
          returnUrl: "http://localhost:3000/success"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(true)
      })
    })

    // ===========================================================================
    // checkoutSchema - LOCALE VALIDATION
    // ===========================================================================

    describe("locale validation", () => {
      it("accepts custom locale", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "starter",
          locale: "en"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.locale).toBe("en")
        }
      })

      it("accepts any string as locale", () => {
        const data = {
          provider: "PRZELEWY24",
          packageId: "starter",
          locale: "de"
        }

        const result = checkoutSchema.safeParse(data)

        expect(result.success).toBe(true)
      })
    })
  })

  // ===========================================================================
  // przelewy24WebhookSchema - VALID DATA
  // ===========================================================================

  describe("przelewy24WebhookSchema", () => {
    describe("valid data", () => {
      it("accepts complete valid webhook data", () => {
        const validData: Przelewy24WebhookInput = {
          merchantId: 12345,
          posId: 12345,
          sessionId: "session_123abc",
          amount: 1999,
          originAmount: 1999,
          currency: "PLN",
          orderId: 987654,
          methodId: 25,
          statement: "Payment for credits",
          sign: "abc123def456"
        }

        const result = przelewy24WebhookSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })
    })

    // ===========================================================================
    // przelewy24WebhookSchema - REQUIRED FIELDS
    // ===========================================================================

    describe("required fields", () => {
      const baseData = {
        merchantId: 12345,
        posId: 12345,
        sessionId: "session_123",
        amount: 1999,
        originAmount: 1999,
        currency: "PLN",
        orderId: 987654,
        methodId: 25,
        statement: "Payment",
        sign: "abc123"
      }

      it("rejects missing merchantId", () => {
        const { merchantId, ...data } = baseData
        const result = przelewy24WebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it("rejects missing posId", () => {
        const { posId, ...data } = baseData
        const result = przelewy24WebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it("rejects missing sessionId", () => {
        const { sessionId, ...data } = baseData
        const result = przelewy24WebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it("rejects missing amount", () => {
        const { amount, ...data } = baseData
        const result = przelewy24WebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it("rejects missing sign", () => {
        const { sign, ...data } = baseData
        const result = przelewy24WebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    // ===========================================================================
    // przelewy24WebhookSchema - TYPE VALIDATION
    // ===========================================================================

    describe("type validation", () => {
      it("rejects non-integer merchantId", () => {
        const data = {
          merchantId: 123.45,
          posId: 12345,
          sessionId: "session_123",
          amount: 1999,
          originAmount: 1999,
          currency: "PLN",
          orderId: 987654,
          methodId: 25,
          statement: "Payment",
          sign: "abc123"
        }

        const result = przelewy24WebhookSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects string for amount", () => {
        const data = {
          merchantId: 12345,
          posId: 12345,
          sessionId: "session_123",
          amount: "1999",
          originAmount: 1999,
          currency: "PLN",
          orderId: 987654,
          methodId: 25,
          statement: "Payment",
          sign: "abc123"
        }

        const result = przelewy24WebhookSchema.safeParse(data)

        expect(result.success).toBe(false)
      })
    })
  })

  // ===========================================================================
  // tpayWebhookSchema - VALID DATA
  // ===========================================================================

  describe("tpayWebhookSchema", () => {
    describe("valid data", () => {
      it("accepts complete valid webhook data with TRUE status", () => {
        const validData: TpayWebhookInput = {
          id: "trans_123",
          tr_id: "tr_abc456",
          tr_date: "2025-01-15 10:30:00",
          tr_crc: "order_789",
          tr_amount: "19.99",
          tr_paid: "19.99",
          tr_desc: "Credits purchase",
          tr_status: "TRUE",
          tr_error: "none",
          tr_email: "user@example.com",
          md5sum: "d41d8cd98f00b204e9800998ecf8427e"
        }

        const result = tpayWebhookSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(validData)
        }
      })

      it("accepts complete valid webhook data with FALSE status", () => {
        const validData: TpayWebhookInput = {
          id: "trans_123",
          tr_id: "tr_abc456",
          tr_date: "2025-01-15 10:30:00",
          tr_crc: "order_789",
          tr_amount: "19.99",
          tr_paid: "0.00",
          tr_desc: "Credits purchase",
          tr_status: "FALSE",
          tr_error: "insufficient_funds",
          tr_email: "user@example.com",
          md5sum: "d41d8cd98f00b204e9800998ecf8427e"
        }

        const result = tpayWebhookSchema.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.tr_status).toBe("FALSE")
        }
      })
    })

    // ===========================================================================
    // tpayWebhookSchema - STATUS VALIDATION
    // ===========================================================================

    describe("status validation", () => {
      it("rejects invalid tr_status", () => {
        const data = {
          id: "trans_123",
          tr_id: "tr_abc456",
          tr_date: "2025-01-15 10:30:00",
          tr_crc: "order_789",
          tr_amount: "19.99",
          tr_paid: "19.99",
          tr_desc: "Credits purchase",
          tr_status: "PENDING",
          tr_error: "none",
          tr_email: "user@example.com",
          md5sum: "abc123"
        }

        const result = tpayWebhookSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("rejects lowercase status", () => {
        const data = {
          id: "trans_123",
          tr_id: "tr_abc456",
          tr_date: "2025-01-15 10:30:00",
          tr_crc: "order_789",
          tr_amount: "19.99",
          tr_paid: "19.99",
          tr_desc: "Credits purchase",
          tr_status: "true",
          tr_error: "none",
          tr_email: "user@example.com",
          md5sum: "abc123"
        }

        const result = tpayWebhookSchema.safeParse(data)

        expect(result.success).toBe(false)
      })
    })

    // ===========================================================================
    // tpayWebhookSchema - EMAIL VALIDATION
    // ===========================================================================

    describe("email validation", () => {
      it("rejects invalid email format", () => {
        const data = {
          id: "trans_123",
          tr_id: "tr_abc456",
          tr_date: "2025-01-15 10:30:00",
          tr_crc: "order_789",
          tr_amount: "19.99",
          tr_paid: "19.99",
          tr_desc: "Credits purchase",
          tr_status: "TRUE",
          tr_error: "none",
          tr_email: "not-an-email",
          md5sum: "abc123"
        }

        const result = tpayWebhookSchema.safeParse(data)

        expect(result.success).toBe(false)
      })

      it("accepts valid email with subdomain", () => {
        const data = {
          id: "trans_123",
          tr_id: "tr_abc456",
          tr_date: "2025-01-15 10:30:00",
          tr_crc: "order_789",
          tr_amount: "19.99",
          tr_paid: "19.99",
          tr_desc: "Credits purchase",
          tr_status: "TRUE",
          tr_error: "none",
          tr_email: "user@mail.example.com",
          md5sum: "abc123"
        }

        const result = tpayWebhookSchema.safeParse(data)

        expect(result.success).toBe(true)
      })
    })

    // ===========================================================================
    // tpayWebhookSchema - REQUIRED FIELDS
    // ===========================================================================

    describe("required fields", () => {
      const baseData = {
        id: "trans_123",
        tr_id: "tr_abc456",
        tr_date: "2025-01-15 10:30:00",
        tr_crc: "order_789",
        tr_amount: "19.99",
        tr_paid: "19.99",
        tr_desc: "Credits purchase",
        tr_status: "TRUE" as const,
        tr_error: "none",
        tr_email: "user@example.com",
        md5sum: "abc123"
      }

      it("rejects missing id", () => {
        const { id, ...data } = baseData
        const result = tpayWebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it("rejects missing tr_id", () => {
        const { tr_id, ...data } = baseData
        const result = tpayWebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it("rejects missing md5sum", () => {
        const { md5sum, ...data } = baseData
        const result = tpayWebhookSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })
  })

  // ===========================================================================
  // TYPE INFERENCE
  // ===========================================================================

  describe("type inference", () => {
    it("PackageId type is correctly narrowed", () => {
      const pkg: PackageId = "standard"
      expect(PACKAGE_IDS.includes(pkg)).toBe(true)
    })

    it("CheckoutInput requires provider and packageId", () => {
      const input: CheckoutInput = {
        provider: "PRZELEWY24",
        packageId: "starter"
      }

      expect(input.provider).toBe("PRZELEWY24")
      expect(input.packageId).toBe("starter")
    })

    it("Przelewy24WebhookInput has correct structure", () => {
      const input: Przelewy24WebhookInput = {
        merchantId: 12345,
        posId: 12345,
        sessionId: "session",
        amount: 1999,
        originAmount: 1999,
        currency: "PLN",
        orderId: 123,
        methodId: 25,
        statement: "payment",
        sign: "abc"
      }

      expect(input.merchantId).toBe(12345)
    })

    it("TpayWebhookInput has correct structure", () => {
      const input: TpayWebhookInput = {
        id: "id",
        tr_id: "tr_id",
        tr_date: "date",
        tr_crc: "crc",
        tr_amount: "19.99",
        tr_paid: "19.99",
        tr_desc: "desc",
        tr_status: "TRUE",
        tr_error: "none",
        tr_email: "test@example.com",
        md5sum: "hash"
      }

      expect(input.tr_status).toBe("TRUE")
    })
  })
})
