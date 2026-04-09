# Project Modification Report

**Project:** videoshorts
**Change:** Replace Stripe with flexible payment gateway system
**Date:** 2025-12-14
**Agent:** project-modifier

---

## Summary

| Metric                      | Value |
| --------------------------- | ----- |
| Files Modified              | 4     |
| Sections Updated            | 15+   |
| Occurrences Replaced        | 50+   |
| Implemented Stages Affected | 0     |

---

## Change Analysis

**What is changing:**
- FROM: Stripe (single payment provider)
- TO: Multi-provider payment gateway system (Przelewy24, Tpay, with extensibility)

**Scope:**
- Payment processing architecture
- Webhooks per provider
- Checkout flow
- Database schema (provider field)
- API routes per provider
- Environment variables

**Keywords to search and replace:**
- "Stripe" → "Payment Gateway" / "Payment Provider" (context-dependent)
- "stripe" → provider-specific naming
- Specific implementations → abstraction patterns

---

## Implementation Status

| Stage | Name              | Status         | Affected by Change?         |
| ----- | ----------------- | -------------- | --------------------------- |
| 01    | Core Auth         | ✅ Completed   | ❌ No                       |
| 02    | Companies         | ⏳ Not started | ❌ No                       |
| 03    | Shorts + Payments | ⏳ Not started | ✅ YES - main payment logic |
| 04    | Feed              | ⏳ Not started | ❌ No                       |
| 05    | Interactions      | ⏳ Not started | ❌ No                       |
| 06    | Moderation        | ⏳ Not started | ❌ No                       |
| 07    | Analytics         | ⏳ Not started | ❌ No                       |
| 08    | Notifications     | ⏳ Not started | ❌ No                       |

**Stage 03 (Shorts + Payments) is NOT YET implemented.**
✅ Safe to modify - no code changes needed.

---

## Modification Plan

### File 1: project-spec.md

**Section 1.1 Executive Summary:**
- Line 11: Replace "przez Stripe" → "przez elastyczny system płatności z wieloma providerami (obecnie: Przelewy24, Tpay, z możliwością dodawania kolejnych)"

**Section 3.2 Company:**
- Line 67: Replace "Płatność przez Stripe" → "Płatność przez system płatności (Przelewy24, Tpay)"

**Section 4.3 Moduł: Shorts (Content):**
- Line 168: Replace "Stripe checkout" → "Payment gateway checkout"
- Add: "Obsługiwane bramy: Przelewy24, Tpay (możliwość dodawania kolejnych)"

**Section 4.7 Moduł: Payments:**
- Line 276-284: Complete rewrite:
  - F-PAY-002: "Stripe Integration" → "Payment Gateway Integration"
  - Add multi-provider architecture description
  - Add provider abstraction layer
  - Add provider selection logic

**Section 7 Model Danych:**
- Line 546-558: Update Payment model:
  - Add `provider` field (PRZELEWY24 | TPAY | OTHER)
  - Replace `stripePaymentIntentId` → `providerPaymentId`
  - Replace `stripeCheckoutSessionId` → `providerSessionId`
  - Add `metadata` JSON field for provider-specific data

**Section 8.2 Payment Gateways:**
- Lines 605-632: Complete rewrite:
  - Remove Stripe-specific content
  - Add Przelewy24 (Primary)
  - Add Tpay (Secondary)
  - Add Payment Gateway Architecture subsection

**Section 9.1 Ograniczenia Biznesowe:**
- Line 676: Keep "Single payment per short" - no change needed

**Section 10 Ryzyka:**
- Line 701: Replace "RISK-TECH-002: Stripe webhook delivery failures" → "Payment provider webhook delivery failures"
- Line 721: Replace "RISK-LEGAL-002: VAT invoicing errors" → Update mitigation strategy (remove "Stripe Invoicing")

**Section 11 Architektura Etapowania:**
- Line 746: Replace "Stripe checkout" → "Payment gateway checkout"
- Line 747: Replace "Payment webhooks" → "Multi-provider payment webhooks"

### File 2: architecture-plan.md

**Section 1 Architektura Wysokiego Poziomu:**
- Line 34: Replace "/api/webhooks/* - Stripe, Mux" → "/api/webhooks/* - Payment Providers, Mux"
- Line 59: Replace "Stripe (Payments)" → "Payment Gateways (Payments)"
- Line 60-62: Replace Stripe-specific items:
  - "Checkout" → "Multi-provider checkout"
  - "Webhooks" → "Per-provider webhooks"
  - "Invoicing" → "Invoice generation"
- Line 83: Replace "payment.succeeded (Stripe webhook" → "payment.succeeded (Payment webhook"

**Section 2.5 External APIs:**
- Line 146: Replace "@stripe/stripe-js, stripe (Node)" → "Provider-specific SDKs (Przelewy24, Tpay)"
- Update table entry for payment providers

**Section 3 Struktura Bazy Danych:**
- Lines 212-217: Update PaymentStatus and add PaymentProvider enum
- Lines 573-595: Update Payment model:
  - Replace `stripePaymentIntentId` → `providerPaymentId`
  - Replace `stripeCheckoutSessionId` → `providerSessionId`
  - Add `provider` field
  - Add `metadata` JSON field
- Line 551: Update field description

**Section 4.8 Payments API:**
- Lines 750-756: Update payment endpoints:
  - POST /api/payments/checkout → Support provider selection
  - Add /api/payments/przelewy24/*
  - Add /api/payments/tpay/*

**Section 4.10 Webhooks:**
- Line 775: Replace "POST /api/webhooks/stripe" → Add multiple provider endpoints:
  - POST /api/webhooks/przelewy24
  - POST /api/webhooks/tpay

**Section 5 Struktura Projektu:**
- Line 870: Replace "stripe.ts" → "payment-providers/" directory
- Line 889: Replace "stripe.ts" → payment provider integration files

**Section 6 Przepływy Danych:**
- Lines 964-1003: Complete rewrite of payment flow:
  - Replace "Stripe Checkout Session" → "Payment Provider Checkout"
  - Update webhook references
  - Update provider selection logic

**Section 7.8 Secrets Management:**
- Lines 1247-1248: Replace Stripe env vars:
  - Remove: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
  - Add: PRZELEWY24_*, TPAY_*

### File 3: stages/index.md

**Section 3 (Stage 3 description):**
- Line 74: Replace "Integracja Stripe (płatności)" → "Integracja systemów płatności (Przelewy24, Tpay)"
- Line 202: Replace "Stripe webhook delivery failures" → "Payment provider webhook delivery failures"

**Section 6 (External Services Docs):**
- Line 247: Remove Stripe docs link, add Przelewy24 and Tpay docs

### File 4: stages/stage-03-shorts-payments/spec.md

**Section 2.2 Publish Flow:**
- Lines 60-102: Complete rewrite:
  - Replace all "Stripe Checkout" → "Payment Gateway Checkout"
  - Add provider selection logic
  - Update webhook handling to be provider-agnostic
  - Update status workflow

**Section 3 User Stories:**
- US-03-02 (lines 222-238): Update payment flow:
  - Replace "Stripe Checkout Session" → "Payment Gateway Checkout"
  - Add provider selection
  - Update payment methods per provider

**Section 5.1 Database Schema:**
- Lines 336-490: Update schema:
  - Add PaymentProvider enum
  - Update Payment model with provider field
  - Update field names to be provider-agnostic

**Section 5.4 Publication Controller:**
- Lines 584-751: Update controller:
  - Add provider selection logic
  - Abstract away Stripe-specific calls
  - Add provider factory pattern

**Section 5.5 Payment Client:**
- Lines 753-764: Replace with:
  - Payment Provider Factory
  - Provider abstraction interface
  - Przelewy24 client
  - Tpay client

**Section 5.5 Background Jobs:**
- Lines 767-876: Update webhook handlers:
  - Replace "stripe/payment.succeeded" → provider-agnostic events
  - Add provider-specific webhook validation

**Section 8 External Services:**
- Lines 960-966: Replace Stripe with:
  - Przelewy24 (Primary)
  - Tpay (Secondary)
  - Add API documentation links

---

## Implementation Impact

**Stage 03 (Shorts + Payments) is NOT YET implemented.**
✅ Safe to modify - no code changes needed.

---

## New Architecture Components

### 1. Payment Provider Enum

```prisma
enum PaymentProvider {
  PRZELEWY24
  TPAY
  OTHER
}
```

### 2. Payment Provider Abstraction

```typescript
// src/lib/payment-providers/base-provider.ts
interface PaymentProvider {
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>;
  verifyWebhook(signature: string, body: string): boolean;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

// src/lib/payment-providers/przelewy24.ts
class Przelewy24Provider implements PaymentProvider {
  // Implementation
}

// src/lib/payment-providers/tpay.ts
class TpayProvider implements PaymentProvider {
  // Implementation
}

// src/lib/payment-providers/factory.ts
class PaymentProviderFactory {
  static getProvider(type: PaymentProvider): PaymentProvider {
    switch (type) {
      case 'PRZELEWY24': return new Przelewy24Provider();
      case 'TPAY': return new TpayProvider();
      default: throw new Error('Unknown provider');
    }
  }
}
```

### 3. Environment Variables

```env
# Remove:
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Add:
PRZELEWY24_MERCHANT_ID=
PRZELEWY24_POS_ID=
PRZELEWY24_CRC=
PRZELEWY24_API_KEY=
PRZELEWY24_WEBHOOK_SECRET=

TPAY_MERCHANT_ID=
TPAY_SECURITY_CODE=
TPAY_API_KEY=
TPAY_API_PASSWORD=
TPAY_WEBHOOK_SECRET=

# Configuration
DEFAULT_PAYMENT_PROVIDER=PRZELEWY24
FALLBACK_PAYMENT_PROVIDER=TPAY
```

### 4. API Routes

```
POST   /api/payments/checkout (with provider selection)
POST   /api/webhooks/przelewy24
POST   /api/webhooks/tpay
GET    /api/payments/:id (provider-agnostic)
```

### 5. Database Updates

```prisma
model Payment {
  id                  String          @id @default(cuid())
  userId              String
  shortId             String?         @unique
  provider            PaymentProvider @default(PRZELEWY24)
  providerPaymentId   String          @unique
  providerSessionId   String?         @unique
  amount              Decimal         @db.Decimal(10, 2)
  currency            String          @default("PLN")
  status              PaymentStatus   @default(PENDING)
  invoiceUrl          String?
  metadata            Json?           // Provider-specific data
  creditsGranted      Int?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([provider])
  @@index([providerPaymentId])
}
```

---

## Next Steps

1. ✅ Project documentation updated
2. ⏳ When implementing Stage 03, use multi-provider payment architecture
3. ⏳ Update `.env.example` with new variables
4. ⏳ Obtain Przelewy24 and Tpay credentials (sandbox + production)
5. ⏳ Implement provider abstraction layer
6. ⏳ Test webhook handling for both providers
7. ⏳ Implement provider selection UI (admin configurable)
8. ⏳ Add fallback logic (if Przelewy24 fails, try Tpay)

---

## Benefits of This Change

1. **Flexibility:** Easy to add new payment providers (Stripe, PayPal, etc.)
2. **Redundancy:** If one provider fails, fallback to another
3. **Market-specific:** Przelewy24 and Tpay are optimized for Polish market
4. **Cost optimization:** Can negotiate better rates with multiple providers
5. **Future-proof:** Architecture supports international expansion

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Provider integration complexity | Medium | Well-documented APIs, sandbox testing |
| Webhook inconsistencies between providers | Medium | Abstraction layer handles differences |
| Multiple API credentials to manage | Low | Secure environment variable management |
| Different payment methods per provider | Low | Document supported methods clearly |

---

**Generated:** 2025-12-14
**Agent:** project-modifier
**Status:** ✅ Documentation modifications complete
