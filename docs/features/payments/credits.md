# Credits System

**Status:** Implemented (Stage 03)
**Components:** CreditsDisplay, CreditsHistory, CreditsPurchaseModal

---

## Overview

Publication credits are the currency for publishing shorts. One credit allows publishing one short for 30 days.

---

## Credit Economics

| Package | Credits | Price (PLN) | Per Credit | Discount |
|---------|---------|-------------|------------|----------|
| Single | 1 | 5.00 | 5.00 | - |
| Starter | 5 | 22.50 | 4.50 | 10% |
| Business | 20 | 80.00 | 4.00 | 20% |
| Pro | 50 | 175.00 | 3.50 | 30% |

---

## Credit Sources

| Source | Amount | Description |
|--------|--------|-------------|
| `PACKAGE` | +N | Purchased via payment |
| `GIFT` | +N | Admin gift (promotions) |
| `PROMO` | +N | Promotional code |
| `REFUND` | +1 | Failed transcoding refund |
| `ADMIN` | +/- N | Manual admin adjustment |
| `PUBLICATION` | -1 | Used for publishing |

---

## Database Schema

### User Model (credits field)

```prisma
model User {
  publicationCredits Int @default(0)
}
```

### CreditTransaction Model

```prisma
model CreditTransaction {
  id        String       @id @default(cuid())
  userId    String
  amount    Int          // positive for add, negative for deduct
  source    CreditSource
  shortId   String?      // if related to a short
  paymentId String?      // if from payment
  metadata  Json?
  createdAt DateTime     @default(now())
}
```

---

## Publication Controller

**File:** `src/lib/publication/publication-controller.ts`

### Functions

```typescript
/**
 * Check credits and initiate publication
 */
export async function initiatePublication(
  userId: string,
  shortId: string,
  companyId: string
): Promise<PublicationResult>

/**
 * Add credits to user account
 */
export async function addCredits(
  userId: string,
  amount: number,
  source: CreditSource,
  metadata?: Record<string, unknown>
): Promise<void>

/**
 * Add credits from successful payment
 */
export async function addCreditsFromPayment(
  userId: string,
  amount: number,
  paymentId: string,
  shortId?: string
): Promise<void>

/**
 * Deduct 1 credit for publication
 */
export async function deductCredit(
  userId: string,
  shortId: string
): Promise<boolean>

/**
 * Get current credit balance
 */
export async function getCreditBalance(userId: string): Promise<number>

/**
 * Refund credit for failed transcoding
 */
export async function refundCredit(
  userId: string,
  shortId: string,
  reason: string
): Promise<void>
```

---

## Components

### CreditsDisplay

Shows current credit balance.

```typescript
interface CreditsDisplayProps {
  credits: number
  showPurchaseButton?: boolean
  onPurchase?: () => void
}
```

**Usage:**
```tsx
<CreditsDisplay
  credits={user.publicationCredits}
  showPurchaseButton
  onPurchase={() => setShowModal(true)}
/>
```

**Rendered:**
```
+---------------------------+
| [coin] 5 Credits  [+ Buy] |
+---------------------------+
```

### CreditsHistory

Transaction history table.

```typescript
interface CreditsHistoryProps {
  transactions: CreditTransaction[]
}
```

**Columns:**
| Column | Description |
|--------|-------------|
| Date | Transaction timestamp |
| Type | Source with icon |
| Amount | +/- credits |
| Related Short | Link if shortId present |

**Usage:**
```tsx
<CreditsHistory transactions={creditTransactions} />
```

### CreditsPurchaseModal

Package selection and payment initiation.

```typescript
interface CreditsPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (credits: number) => void
}
```

**UI:**
```
+-------------------------------------------+
| Purchase Credits                          |
|                                           |
| Select a package:                         |
|                                           |
| +-------+  +-------+  +-------+  +------+ |
| | 1     |  | 5     |  | 20    |  | 50   | |
| | 5 PLN |  | 22.50 |  | 80    |  | 175  | |
| | -     |  | -10%  |  | -20%  |  | -30% | |
| +-------+  +-------+  +-------+  +------+ |
|            [selected]                     |
|                                           |
| Payment provider:                         |
| (o) Przelewy24   ( ) Tpay                 |
|                                           |
|         [Cancel]  [Pay 22.50 PLN]         |
+-------------------------------------------+
```

---

## Credits Page

**Route:** `/panel/credits`

**Features:**
- Large credit balance display
- Purchase button
- Transaction history
- Package comparison

---

## API Endpoint

### GET /api/credits

Get user's credit balance and history.

**Response:**
```typescript
{
  balance: number
  transactions: Array<{
    id: string
    amount: number
    source: CreditSource
    shortId: string | null
    paymentId: string | null
    createdAt: string
    metadata: Record<string, unknown> | null
  }>
}
```

---

## Integration with Publishing

When publishing a short:

1. Check `user.publicationCredits > 0`
2. If yes: deduct credit and start transcoding
3. If no: redirect to payment checkout

```typescript
const result = await initiatePublication(userId, shortId, companyId)

if (result.requiresPayment) {
  // Redirect to payment
  router.push(`/panel/checkout?shortId=${shortId}`)
} else if (result.processing) {
  // Redirect to processing status
  router.push(result.redirectUrl)
}
```

---

## Transaction Metadata

Examples of metadata stored:

**Publication:**
```json
{
  "action": "publish",
  "shortTitle": "Summer Sale Promo"
}
```

**Package Purchase:**
```json
{
  "action": "purchase",
  "paymentId": "pay_123abc",
  "package": 20,
  "provider": "PRZELEWY24"
}
```

**Refund:**
```json
{
  "reason": "Transcoding failed after 3 retries",
  "errorCode": "QENCODE_TIMEOUT"
}
```

**Admin Adjustment:**
```json
{
  "adminId": "usr_admin123",
  "reason": "Customer compensation",
  "ticket": "SUP-12345"
}
```

---

## Related Documentation

- [Payment Flow](./checkout.md)
- [Publishing Workflow](../shorts/publishing.md)
- [Payment Providers](../../guides/payment-providers.md)

---

**Implemented:** 2025-12-31
**Last Updated:** 2026-01-01
