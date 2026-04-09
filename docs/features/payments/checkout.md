# Payment Checkout Flow

**Status:** Implemented (Stage 03)
**Components:** PaymentForm, CreditsPurchaseModal

---

## Overview

Multi-provider payment system supporting Przelewy24 (primary) and Tpay (fallback) for purchasing publication credits.

---

## Payment Flow

```
+-------------+     +---------------+     +------------------+
| Select      | --> | Create        | --> | Provider         |
| Package &   |     | Checkout      |     | Checkout Page    |
| Provider    |     | Session       |     | (P24 or Tpay)    |
+-------------+     +---------------+     +------------------+
                                                    |
                                                    v
+-------------+     +---------------+     +------------------+
| Credits     | <-- | Process       | <-- | Webhook          |
| Added       |     | Payment       |     | Callback         |
+-------------+     +---------------+     +------------------+
```

---

## Payment Providers

### Przelewy24 (Primary)

**Coverage:**
- BLIK
- Bank transfers (all Polish banks)
- Credit/debit cards
- Google Pay
- Apple Pay

**Configuration:**
```env
PRZELEWY24_MERCHANT_ID=123456
PRZELEWY24_CRC=abc123def456
PRZELEWY24_API_KEY=...
```

**Sandbox:** `https://sandbox.przelewy24.pl`
**Production:** `https://secure.przelewy24.pl`

### Tpay (Fallback)

**Coverage:**
- BLIK
- Bank transfers
- Credit/debit cards

**Configuration:**
```env
TPAY_MERCHANT_ID=123456
TPAY_SECURITY_CODE=...
TPAY_API_KEY=...
```

---

## API Endpoints

### POST /api/payments/checkout

Create payment checkout session.

**Request:**
```typescript
{
  provider: "PRZELEWY24" | "TPAY"
  credits: 1 | 5 | 20 | 50
  shortId?: string          // Optional: link to specific short
  returnUrl: string         // Success redirect URL
  cancelUrl: string         // Cancel redirect URL
}
```

**Response:**
```typescript
{
  checkoutUrl: string       // Redirect user here
  paymentId: string         // Internal payment ID
}
```

**Flow:**
1. Validate input (Zod schema)
2. Calculate amount (credits * PRICE_PER_CREDIT)
3. Create Payment record (status: PENDING)
4. If shortId provided: update Short status -> PENDING_PAYMENT
5. Create checkout with selected provider
6. Update Payment with providerSessionId
7. Return checkout URL

### GET /api/payments/status/[id]

Check payment status (for polling during checkout).

**Response:**
```typescript
{
  status: "PENDING" | "SUCCEEDED" | "FAILED"
  credits?: number          // If SUCCEEDED
  shortId?: string          // If linked to short
  error?: string            // If FAILED
}
```

---

## Webhook Handlers

### POST /api/webhooks/przelewy24

**Signature Verification:**
```typescript
// SHA384 hash verification
const signature = createHash('sha384')
  .update(`${data.sessionId}|${data.orderId}|${data.amount}|${data.currency}|${CRC}`)
  .digest('hex')
```

**Processing:**
1. Parse form data
2. Verify signature
3. Find payment by sessionId
4. Update payment status
5. If SUCCEEDED:
   - Add credits to user
   - Create CreditTransaction
   - If linked to short: trigger publication
6. Return 200 OK

### POST /api/webhooks/tpay

**Signature Verification:**
```typescript
// MD5 checksum verification
const checksum = createHash('md5')
  .update(`${data.id}|${data.tr_id}|${data.tr_amount}|${data.tr_crc}|${SECURITY_CODE}`)
  .digest('hex')
```

**Processing:**
Similar to Przelewy24 webhook.

---

## Payment Abstraction Layer

**File:** `src/lib/payments/index.ts`

```typescript
// Constants
export const PRICE_PER_CREDIT = 500  // 5.00 PLN in grosze
export const CREDIT_PACKAGES = [1, 5, 20, 50] as const

// Interface
export interface CheckoutOptions {
  sessionId: string
  amount: number      // in grosze
  currency: string
  description: string
  email: string
  returnUrl: string
  notifyUrl: string
}

export interface PaymentProvider {
  createCheckout(options: CheckoutOptions): Promise<string>
  verifyWebhook(data: unknown): boolean
}

// Helpers
export function calculateAmount(credits: number): number
export function isValidCreditPackage(credits: number): boolean
export function formatAmount(grosze: number): string
```

---

## Provider Implementations

### Przelewy24

**File:** `src/lib/payments/przelewy24.ts`

```typescript
export async function createPrzelewy24Checkout(
  options: CheckoutOptions
): Promise<string>

export function verifyPrzelewy24Signature(
  data: Record<string, unknown>
): boolean
```

### Tpay

**File:** `src/lib/payments/tpay.ts`

```typescript
export async function createTpayCheckout(
  options: CheckoutOptions
): Promise<string>

export function verifyTpaySignature(
  data: Record<string, unknown>
): boolean
```

---

## Database Schema

### Payment Model

```prisma
model Payment {
  id                 String          @id @default(cuid())
  userId             String
  shortId            String?         @unique
  provider           PaymentProvider @default(PRZELEWY24)
  providerPaymentId  String          @unique
  providerSessionId  String?         @unique
  amount             Decimal         @db.Decimal(10, 2)
  currency           String          @default("PLN")
  status             PaymentStatus   @default(PENDING)
  invoiceUrl         String?
  metadata           Json?
  creditsGranted     Int             @default(0)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
}
```

### Enums

```prisma
enum PaymentProvider {
  PRZELEWY24
  TPAY
  OTHER
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

---

## Component: PaymentForm

Provider selection form.

```typescript
interface PaymentFormProps {
  amount: number
  onSubmit: (provider: PaymentProviderType) => void
  loading?: boolean
}
```

**UI:**
```
+-------------------------------------------+
| Select Payment Method                     |
|                                           |
| +---------------------------------------+ |
| | [BLIK] [Bank Transfer] [Card]         | |
| |                                       | |
| | (o) Przelewy24                        | |
| |     Fastest, most popular             | |
| |                                       | |
| | ( ) Tpay                              | |
| |     Alternative provider              | |
| +---------------------------------------+ |
|                                           |
| Total: 22.50 PLN                          |
|                                           |
|              [Pay Now]                    |
+-------------------------------------------+
```

---

## Success/Cancel Handling

### Success URL

`/panel/payment-success?paymentId=pay_123`

1. Poll `/api/payments/status/pay_123`
2. Wait for SUCCEEDED status
3. Show success message
4. If shortId linked: redirect to publishing page

### Cancel URL

`/panel/credits?cancelled=true`

1. Show cancellation message
2. Option to retry

---

## Error Handling

| Error | Code | Handling |
|-------|------|----------|
| Invalid package | `INVALID_PACKAGE` | 400 response |
| Payment creation failed | `PROVIDER_ERROR` | 500 + log |
| Invalid signature | `INVALID_SIGNATURE` | 401 response |
| Payment not found | `PAYMENT_NOT_FOUND` | 404 response |
| Already processed | `DUPLICATE_WEBHOOK` | 200 (ignore) |

---

## Testing

### Sandbox Credentials

Both providers offer sandbox environments for testing:

**Przelewy24:**
- Use test merchant ID
- Successful: use test card numbers
- Failed: specific test amounts trigger failures

**Tpay:**
- Use test API credentials
- Sandbox transactions auto-complete

### Webhook Testing

Use ngrok for local development:

```bash
ngrok http 3000
# Use ngrok URL as webhook URL
```

---

## Related Documentation

- [Credits System](./credits.md)
- [Publishing Workflow](../shorts/publishing.md)
- [Payment Providers Guide](../../guides/payment-providers.md)

---

**Implemented:** 2025-12-31
**Last Updated:** 2026-01-01
