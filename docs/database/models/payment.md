# Payment Model

Payment transaction record for credit purchases.

---

## Schema

```prisma
model Payment {
  id                 String              @id @default(cuid())
  userId             String
  shortId            String?             @unique
  provider           PaymentProvider     @default(PRZELEWY24)
  providerPaymentId  String              @unique
  providerSessionId  String?             @unique
  amount             Decimal             @db.Decimal(10, 2)
  currency           String              @default("PLN")
  status             PaymentStatus       @default(PENDING)
  invoiceUrl         String?
  metadata           Json?
  creditsGranted     Int                 @default(0)
  createdAt          DateTime            @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime            @updatedAt @db.Timestamptz(6)

  // Relations
  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  short              Short?              @relation(fields: [shortId], references: [id], onDelete: Cascade)
  creditTransactions CreditTransaction[]

  @@index([userId])
  @@index([shortId])
  @@index([status])
  @@index([provider])
  @@index([providerPaymentId])
}
```

---

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `userId` | String | Foreign key to User |
| `shortId` | String? | Foreign key to Short (if linked) |
| `provider` | PaymentProvider | Payment provider used |
| `providerPaymentId` | String | External payment ID |
| `providerSessionId` | String? | External session ID |
| `amount` | Decimal | Payment amount (10,2 precision) |
| `currency` | String | Currency code (default: PLN) |
| `status` | PaymentStatus | Current payment status |
| `invoiceUrl` | String? | Invoice download URL |
| `metadata` | Json? | Additional payment data |
| `creditsGranted` | Int | Number of credits granted |
| `createdAt` | DateTime | Record creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

---

## Enums

### PaymentProvider

```prisma
enum PaymentProvider {
  PRZELEWY24   // Primary provider
  TPAY         // Fallback provider
  OTHER        // Future providers
}
```

### PaymentStatus

```prisma
enum PaymentStatus {
  PENDING      // Awaiting payment
  SUCCEEDED    // Payment completed
  FAILED       // Payment failed
  REFUNDED     // Payment refunded
}
```

---

## Relations

### User (many-to-one)

```typescript
// Get payment with user
const payment = await prisma.payment.findUnique({
  where: { id },
  include: { user: true }
})
```

### Short (one-to-one, optional)

```typescript
// Get payment with linked short
const payment = await prisma.payment.findUnique({
  where: { id },
  include: { short: true }
})
```

### Credit Transactions (one-to-many)

```typescript
// Get payment with credit transactions
const payment = await prisma.payment.findUnique({
  where: { id },
  include: { creditTransactions: true }
})
```

---

## Common Queries

### Find by Provider Session ID

```typescript
const payment = await prisma.payment.findUnique({
  where: { providerSessionId: sessionId }
})
```

### User Payment History

```typescript
const payments = await prisma.payment.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' }
})
```

### Pending Payments

```typescript
const pendingPayments = await prisma.payment.findMany({
  where: {
    status: 'PENDING',
    createdAt: { gt: subHours(new Date(), 24) }
  }
})
```

---

## Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| Primary | `id` | Record lookup |
| Unique | `shortId` | One payment per short |
| Unique | `providerPaymentId` | External lookup |
| Unique | `providerSessionId` | Session lookup |
| Index | `userId` | User history |
| Index | `status` | Status filtering |
| Index | `provider` | Provider stats |

---

## Metadata Examples

### Przelewy24

```json
{
  "orderId": 12345678,
  "statement": "VideoShorts - 5 credits",
  "method": "BLIK"
}
```

### Tpay

```json
{
  "tr_id": "TR-123456",
  "tr_desc": "VideoShorts - 5 credits",
  "tr_channel": 64
}
```

---

## Related Models

- [User](./user.md)
- [Short](./short.md)
- [CreditTransaction](./credit-transaction.md)

---

**Last Updated:** 2026-01-01
