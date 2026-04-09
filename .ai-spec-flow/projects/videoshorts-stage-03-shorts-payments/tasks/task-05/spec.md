# Task 05: Payment Providers + Credits System

## Overview

**Priority:** HIGH
**Dependencies:** Task 01
**Complexity:** Medium (18 files, ~18k tokens)
**Status:** pending

## What to Build

Multi-provider payment system and publication credits:
1. Payment abstraction layer
2. Przelewy24 integration
3. Tpay integration
4. Publication controller (credit management)
5. Payment checkout API
6. Payment status API
7. Payment webhooks (both providers)
8. Payment form component
9. Credits display component
10. Publish dialog with payment option
11. Credits page (basic)
12. Translation files (payments.json for all 6 locales)

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/payments/index.ts` | Create | Payment abstraction and exports |
| `src/lib/payments/przelewy24.ts` | Create | Przelewy24 API integration |
| `src/lib/payments/tpay.ts` | Create | Tpay API integration |
| `src/lib/publication/publication-controller.ts` | Create | Credit management logic |
| `src/app/api/payments/checkout/route.ts` | Create | Create payment checkout session |
| `src/app/api/payments/status/[id]/route.ts` | Create | Check payment status |
| `src/app/api/webhooks/przelewy24/route.ts` | Create | Przelewy24 webhook handler |
| `src/app/api/webhooks/tpay/route.ts` | Create | Tpay webhook handler |
| `src/components/payments/payment-form.tsx` | Create | Provider selection form |
| `src/components/payments/credits-display.tsx` | Create | Credits balance display |
| `src/components/shorts/publish-dialog.tsx` | Create | Publish with credits or payment |
| `src/app/(main)/[locale]/panel/credits/page.tsx` | Create | Credits management page |
| `src/lib/locales/en/payments.json` | Create | English payment translations |
| `src/lib/locales/pl/payments.json` | Create | Polish payment translations |
| `src/lib/locales/de/payments.json` | Create | German payment translations |
| `src/lib/locales/es/payments.json` | Create | Spanish payment translations |
| `src/lib/locales/ru/payments.json` | Create | Russian payment translations |
| `src/lib/locales/uk/payments.json` | Create | Ukrainian payment translations |

## Implementation Details

### 1. Payment Abstraction Layer

**File:** `src/lib/payments/index.ts`

```typescript
export interface CheckoutOptions {
  sessionId: string
  amount: number  // in cents (grosze)
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

export { createPrzelewy24Checkout, verifyPrzelewy24Signature } from "./przelewy24"
export { createTpayCheckout, verifyTpaySignature } from "./tpay"
```

### 2. Przelewy24 Integration

**File:** `src/lib/payments/przelewy24.ts`

```typescript
// Configuration
const P24_SANDBOX = process.env.NODE_ENV !== "production"
const P24_BASE_URL = P24_SANDBOX
  ? "https://sandbox.przelewy24.pl"
  : "https://secure.przelewy24.pl"

export async function createPrzelewy24Checkout(options: CheckoutOptions): Promise<string>
// 1. Generate SHA384 signature
// 2. Register transaction via API
// 3. Return checkout URL with token

export function verifyPrzelewy24Signature(data: Record<string, unknown>): boolean
// Verify SHA384 hash of callback data
```

### 3. Tpay Integration

**File:** `src/lib/payments/tpay.ts`

```typescript
export async function createTpayCheckout(options: CheckoutOptions): Promise<string>
// 1. Generate MD5 checksum
// 2. Create transaction via API
// 3. Return checkout URL

export function verifyTpaySignature(data: Record<string, unknown>): boolean
// Verify MD5 hash of callback data
```

### 4. Publication Controller

**File:** `src/lib/publication/publication-controller.ts`

```typescript
export interface PublicationResult {
  success: boolean
  requiresPayment: boolean
  processing?: boolean
  redirectUrl?: string
  error?: string
}

export async function initiatePublication(
  userId: string,
  shortId: string,
  companyId: string
): Promise<PublicationResult>
// 1. Check company verification status
// 2. Check available credits
// 3. If credits available: deduct and return { processing: true }
// 4. If no credits: return { requiresPayment: true }

export async function addCredits(
  userId: string,
  amount: number,
  source: CreditSource,
  metadata?: Record<string, unknown>
): Promise<void>
// Add credits with transaction record

export async function deductCredit(
  userId: string,
  shortId: string
): Promise<boolean>
// Deduct 1 credit with transaction record
```

### 5. Payment Checkout API

**File:** `src/app/api/payments/checkout/route.ts`

```typescript
// POST /api/payments/checkout
// Request: {
//   provider: "PRZELEWY24" | "TPAY",
//   credits: number,
//   shortId?: string,
//   returnUrl: string,
//   cancelUrl: string
// }
// Response: { checkoutUrl: string, paymentId: string }

// Steps:
// 1. Validate input
// 2. Calculate amount (credits * PRICE_PER_CREDIT)
// 3. Create Payment record (status: PENDING)
// 4. If shortId provided, update Short status -> PENDING_PAYMENT
// 5. Create checkout with selected provider
// 6. Update Payment with providerSessionId
// 7. Return checkout URL
```

### 6. Payment Status API

**File:** `src/app/api/payments/status/[id]/route.ts`

```typescript
// GET /api/payments/status/[id]
// Returns payment status for polling during checkout flow
//
// Response: {
//   status: PaymentStatus,  // PENDING | PROCESSING | SUCCEEDED | FAILED | CANCELLED
//   credits?: number,       // Credits purchased (if SUCCEEDED)
//   shortId?: string,       // Linked short ID (if any)
//   error?: string          // Error message (if FAILED)
// }
//
// Auth: Payment owner only (verify userId matches payment.userId)
//
// Implementation:
// 1. Parse payment ID from params
// 2. Fetch payment from DB with related short
// 3. Verify ownership (payment.userId === session.userId)
// 4. Return payment status and related data
// 5. If SUCCEEDED and shortId: include processing status
```

### 7. Payment Webhooks

**Przelewy24 Webhook:**
```typescript
// POST /api/webhooks/przelewy24
// 1. Parse form data
// 2. Verify signature
// 3. Find payment by sessionId
// 4. Update payment status
// 5. If SUCCEEDED:
//    - Add credits to user
//    - Create CreditTransaction (source: PACKAGE)
//    - If linked to short: trigger publication
// 6. Return 200 OK
```

**Tpay Webhook:**
```typescript
// POST /api/webhooks/tpay
// Similar to Przelewy24 but with Tpay-specific signature verification
```

### 8. PublishDialog Component

```typescript
interface PublishDialogProps {
  shortId: string
  shortTitle: string
  companyVerified: boolean  // Pass company.viesVerified status
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Features:
// - **Company verification check:**
//   - If !companyVerified: show verification required message
//   - Display link to company verification page: /panel/company/verify
//   - Disable publish/payment buttons
// - Show current credits balance
// - If credits > 0: "Use Credits" button
// - If no credits: Provider selection + "Pay X PLN" button
// - Loading state during processing
```

### 9. CreditsDisplay Component

```typescript
interface CreditsDisplayProps {
  credits: number
  showPurchaseButton?: boolean
  onPurchase?: () => void
}

// Simple badge showing credit count
// Optional button to purchase more
```

### 10. Credits Page (Basic)

```typescript
// Server component showing:
// - Current credit balance (large display)
// - Purchase credits button (links to modal)
// - Basic info about credits
// Full history/purchase added in Task 06
```

## Acceptance Criteria

- [ ] Payment abstraction layer works for both providers
- [ ] Przelewy24 sandbox checkout creates successfully
- [ ] Tpay sandbox checkout creates successfully
- [ ] Webhook handlers verify signatures correctly
- [ ] Credits added on successful payment
- [ ] CreditTransaction records created correctly
- [ ] PublishDialog shows correct state based on credits
- [ ] CreditsDisplay shows accurate balance
- [ ] Credits page loads and displays balance
- [ ] Short status updates to PENDING_PAYMENT when payment initiated
- [ ] Short auto-publishes after payment (triggers transcoding)
- [ ] All 6 translation files created
- [ ] `npm run build` passes

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test user with COMPANY role
- Test user with 0 credits (to test payment flow)
- Przelewy24/Tpay sandbox credentials configured

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Login as test company user | Panel loads | |
| 2 | Navigate to Credits page | Credits page loads | `/panel/credits` |
| 3 | Verify credits display | Shows "0 credits" | `.credits-balance` |
| 4 | Navigate to draft short | Short detail loads | `/panel/shorts/[id]` |
| 5 | Click Publish | Publish dialog opens | `button:has-text("Publish")` |
| 6 | Verify no credits message | Shows payment required | `.no-credits-message` |
| 7 | Select Przelewy24 | Provider selected | `input[value="PRZELEWY24"]` |
| 8 | Click Pay | Redirect to P24 sandbox | |
| 9 | Complete sandbox payment | Redirect to success URL | |
| 10 | Verify credits added | Balance increased | `/panel/credits` |
| 11 | Verify short processing | Status = PROCESSING | `/panel/shorts/[id]` |

### Webhook Testing

```bash
# Przelewy24 sandbox sends real webhooks
# Ensure NEXT_PUBLIC_APP_URL is set to ngrok URL for testing

# Verify webhook received in server logs
# Check database for updated Payment status
```

### Screenshot Checkpoints

- `01-credits-page-empty.png` - Credits page with 0 balance
- `02-publish-dialog-no-credits.png` - Dialog showing payment required
- `03-provider-selection.png` - Payment provider options
- `04-p24-checkout.png` - Przelewy24 checkout page
- `05-payment-success.png` - After successful payment
- `06-credits-page-updated.png` - Credits page with new balance

## Notes

- Use sandbox credentials for both providers during development
- Przelewy24 sandbox: https://sandbox.przelewy24.pl
- Tpay sandbox: Use test credentials from Tpay panel
- Price per credit: 5.00 PLN (configurable)
- Valid credit packages: 1, 5, 20, 50
- Webhook URLs must be HTTPS in production (use ngrok for local)
