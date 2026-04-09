# VideoShorts Documentation

> Auto-generated documentation maintained by AI Spec Flow

**Project:** VideoShorts - Stage 04 (Feed & Discovery)
**Last Updated:** 2026-01-11
**Status:** In Development

---

## Quick Links

- [Getting Started](./guides/getting-started.md)
- [API Reference](./api/README.md)
- [Components](./components/README.md)
- [Database Schema](./database/README.md)
- [Features](./features/README.md)

---

## Project Overview

VideoShorts is a platform for short-form video content with social features. This documentation covers all implemented stages:

- **Stage 01:** Core Authentication & Profile
- **Stage 02:** Companies & Admin Panel
- **Stage 03:** Shorts Upload & Payments
- **Stage 04:** Feed & Discovery (NEW)

### Tech Stack

- **Framework:** Next.js 14.2+ (App Router)
- **Language:** TypeScript 5.3+
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Authentication:** NextAuth.js v5 (Auth.js)
- **Styling:** Tailwind CSS + shadcn/ui
- **i18n:** next-intl (6 languages: pl, en, de, es, ru, uk)
- **Storage:** Cloudflare R2 (avatars, videos)
- **Video:** Qencode (transcoding), @vidstack/react (player)
- **Payments:** Przelewy24, Tpay
- **Background Jobs:** Inngest
- **Email:** Resend with React Email

---

## Features Implemented

### Stage 01: Authentication & Profile
- Email/password registration and login
- OAuth integration (Google, Facebook)
- Email verification and password reset
- User profiles with avatar upload/cropping
- Settings and preferences
- Responsive layout with dark mode

### Stage 02: Companies & Admin
- Company account upgrade (USER -> COMPANY)
- VIES VAT verification (EU API)
- Public company profiles (`/firma/[slug]`)
- Company profile management (logo, banner, categories)
- Hierarchical category system (2 levels)
- Admin panel (companies & categories management)
- Audit log tracking

### Stage 03: Shorts Upload & Payments
- Video upload wizard with drag & drop
- Direct-to-R2 video upload (presigned URLs)
- Qencode video transcoding (HLS adaptive streaming)
- Publication credits system
- Multi-provider payments (Przelewy24, Tpay)
- Shorts CRUD operations (create, update, archive, delete, duplicate)
- Public short viewing with HLS player
- 30-day lifecycle with auto-archive and renewal
- Background jobs (Inngest)
- Email notifications (processing complete, expiry reminders)

### Stage 04: Feed & Discovery (NEW)
- Public shorts feed with infinite scroll
- Algorithmic feed scoring (engagement + freshness + distance)
- Multiple sort options (For You, Newest, Popular, Trending)
- Category and location filtering
- Full-text search with PostgreSQL
- Fuzzy matching with trigram similarity
- Search autocomplete with suggestions
- Short detail page with video player
- ~600 new translation keys (6 languages)

---

## Documentation Sections

### [Features](./features/README.md)
Feature-level documentation organized by functional area:
- [Profile Management](./features/profile/README.md)
- [Companies](./features/companies/README.md)
- [Admin Panel](./features/admin/README.md)
- [Shorts Upload](./features/shorts/upload.md)
- [Shorts Management](./features/shorts/management.md)
- [Publishing Workflow](./features/shorts/publishing.md)
- [Public Short View](./features/shorts/public-view.md)
- [Credits System](./features/payments/credits.md)
- [Payment Checkout](./features/payments/checkout.md)
- [Feed Overview](./features/feed/overview.md) (NEW)
- [Feed Filtering](./features/feed/filtering.md) (NEW)
- [Search Feature](./features/feed/search.md) (NEW)

### [API Reference](./api/README.md)
Server Actions and API routes documentation:
- [Profile Actions](./api/server-actions/profile.md)
- [Companies Actions](./api/server-actions/companies.md)
- [Admin Actions](./api/server-actions/admin-companies.md)
- [Shorts Actions](./api/server-actions/shorts.md)
- [Shorts API Routes](./api/routes/shorts.md)
- [Payments API Routes](./api/routes/payments.md)
- [Feed API](./api/routes/feed.md) (NEW)
- [Search API](./api/routes/search.md) (NEW)
- [Webhooks](./api/webhooks/README.md)

### [Components](./components/README.md)
React component documentation with usage examples:
- [Profile Components](./components/profile/README.md)
- [Companies Components](./components/companies/README.md)
- [Admin Components](./components/admin/README.md)
- [Shorts Components](./components/shorts/README.md)
- [Payment Components](./components/payments/README.md)
- [Feed Components](./components/feed/feed-grid.md) (NEW)
- [Filter Components](./components/feed/filters.md) (NEW)
- [Search Components](./components/feed/search.md) (NEW)

### [Database](./database/README.md)
Database schema and model documentation:
- [Schema Overview](./database/schema.md)
- [Models](./database/models/README.md)
  - [Short](./database/models/short.md) (NEW)
  - [ShortStats](./database/models/short-stats.md) (NEW)
  - [Payment](./database/models/payment.md) (NEW)
  - [CreditTransaction](./database/models/credit-transaction.md) (NEW)

### [Guides](./guides/README.md)
Developer guides and best practices:
- [Getting Started](./guides/getting-started.md)
- [Testing Guide](./guides/testing.md)
- [Qencode Integration](./guides/qencode-integration.md) (NEW)
- [Inngest Jobs](./guides/inngest-jobs.md) (NEW)
- [Payment Providers](./guides/payment-providers.md) (NEW)

### [Stages](./stages/README.md)
Stage-by-stage implementation summaries:
- [Stage 01: Core Auth](./stages/stage-01-core-auth/README.md)
- [Stage 02: Companies](./stages/stage-02-companies/README.md)
- [Stage 03: Shorts + Payments](./stages/stage-03-shorts-payments/summary.md)
- [Stage 04: Feed & Discovery](./stages/stage-04-feed-discovery/summary.md) (NEW)

---

## Recent Changes

### 2026-01-03: Stage 04 Completed - Feed & Discovery
- Public shorts feed with infinite scroll
- Algorithmic, newest, popular, trending sorts
- Category and location filtering
- Full-text search with PostgreSQL
- Fuzzy matching with pg_trgm
- Search autocomplete suggestions
- Short detail page with video player
- ~600 new translation keys
- 8 tasks completed, 361 new tests

### 2026-01-01: Stage 03 Completed - Shorts Upload + Payments
- Video upload wizard with 4-step flow
- Qencode HLS transcoding (1080p/720p/480p)
- Multi-provider payments (Przelewy24, Tpay)
- Publication credits with transaction history
- Complete shorts CRUD with management UI
- Public short viewing with @vidstack player
- 30-day lifecycle with auto-archive
- Inngest background jobs
- 7 tasks completed, 1633 new tests

### 2025-12-16: Stage 02 Completed - Companies + Verification
- Company upgrade flow with VIES VAT verification
- Public company profiles at `/firma/[slug]`
- Full company profile management
- Admin panel for companies and categories
- 12 tasks completed, 1217 tests

### 2025-11-29: Stage 01 Completed - Core Auth
- Complete authentication flow
- Profile management with avatar
- Responsive layout

[Full Changelog](./CHANGELOG.md)

---

## Statistics

### Stage 04 (Current)
- **Tasks Completed:** 8
- **Files Created:** 45+
- **Tests:** 361 new (1,422 stage cumulative)
- **Test Pass Rate:** 100%
- **Database Indexes:** 4 new
- **Server Actions:** 1 new
- **Components:** 14 new
- **API Routes:** 3 new
- **Translation Keys:** ~600 new

### Cumulative (Stage 01 + 02 + 03 + 04)
- **Total Tasks:** 35
- **Total Files:** 370+
- **Total Tests:** 4,431 (100% passing)
- **Supported Languages:** 6 (pl, en, de, es, ru, uk)
- **Translations:** ~3,200+ keys
- **External Services:** 7 (R2, Qencode, Przelewy24, Tpay, Inngest, Resend, NextAuth)

---

**Generated by:** exec-doc-generator (AI Spec Flow)
**Generator Version:** 1.0
