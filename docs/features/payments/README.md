# Payments Feature Documentation

Publication credits and payment processing.

---

## Overview

The Payments feature enables companies to purchase publication credits through multiple payment providers (Przelewy24, Tpay). Credits are used to publish shorts for 30-day periods.

---

## Feature Sections

### [Credits System](./credits.md)

Publication credits management:
- Credit balance tracking
- Transaction history
- Bulk purchase discounts
- Credit deduction on publish
- Automatic refund on failure

### [Payment Checkout](./checkout.md)

Multi-provider payment flow:
- Przelewy24 integration (primary)
- Tpay integration (fallback)
- Webhook-based confirmation
- Payment status tracking

---

## Credit Economics

| Package | Credits | Price (PLN) | Per Credit | Discount |
|---------|---------|-------------|------------|----------|
| Single | 1 | 5.00 | 5.00 | - |
| Starter | 5 | 22.50 | 4.50 | 10% |
| Business | 20 | 80.00 | 4.00 | 20% |
| Pro | 50 | 175.00 | 3.50 | 30% |

---

## Payment Flow

```
+-------------+     +---------------+     +------------------+
| Select      | --> | Create        | --> | Provider         |
| Package     |     | Checkout      |     | Checkout Page    |
+-------------+     +---------------+     +------------------+
                                                    |
                                                    v
+-------------+     +---------------+     +------------------+
| Credits     | <-- | Process       | <-- | Webhook          |
| Added       |     | Payment       |     | Callback         |
+-------------+     +---------------+     +------------------+
```

---

## Components

| Component | Purpose | File |
|-----------|---------|------|
| CreditsDisplay | Balance badge | `credits-display.tsx` |
| CreditsHistory | Transaction table | `credits-history.tsx` |
| CreditsPurchaseModal | Package selection | `credits-purchase-modal.tsx` |
| PaymentForm | Provider selection | `payment-form.tsx` |
| CreditsManagement | Page wrapper | `credits-management.tsx` |

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/checkout` | POST | Create session |
| `/api/payments/status/[id]` | GET | Check status |
| `/api/credits` | GET | Balance/history |
| `/api/webhooks/przelewy24` | POST | P24 callback |
| `/api/webhooks/tpay` | POST | Tpay callback |

---

## Database

| Model | Purpose |
|-------|---------|
| Payment | Transaction records |
| CreditTransaction | Credit audit trail |
| User.publicationCredits | Balance field |

---

## External Services

| Service | Purpose |
|---------|---------|
| Przelewy24 | Primary payment provider |
| Tpay | Fallback payment provider |

---

## Related Documentation

- [Shorts Publishing](../shorts/publishing.md)
- [Webhooks](../../api/webhooks/README.md)
- [Database Models](../../database/models/payment.md)
- [Payment Providers Guide](../../guides/payment-providers.md)

---

**Implemented:** Stage 03 (2026-01-01)
**Last Updated:** 2026-01-01
