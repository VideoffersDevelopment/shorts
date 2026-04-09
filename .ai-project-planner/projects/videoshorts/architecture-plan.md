# VideoShorts - Plan Architektury

**Wersja:** 1.0
**Data:** 2025-11-28
**Status:** Draft

---

## 1. Architektura Wysokiego Poziomu

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 14+ App Router (React 19, TypeScript, Tailwind)        │
│  - Server Components (RSC) dla SEO + performance                │
│  - Client Components dla interakcji (video player, infinite     │
│    scroll, reactions)                                            │
│  - shadcn/ui component library                                   │
│  - Dark mode (next-themes)                                       │
│  - i18n ready (next-intl)                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                        API/BACKEND LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes + Server Actions                            │
│  ├─ /api/auth/* - NextAuth.js (email + OAuth)                   │
│  ├─ /api/shorts/* - CRUD, upload, stats                         │
│  ├─ /api/feed/* - feed, search, filters                         │
│  ├─ /api/companies/* - profiles, verification                   │
│  ├─ /api/interactions/* - likes, comments, follows              │
│  ├─ /api/moderation/* - reports, queue                          │
│  ├─ /api/webhooks/* - Payment Providers, Qencode                           │
│  └─ Server Actions - mutations (optimistic UI)                  │
│                                                                  │
│  Vercel Edge Functions (geolocation middleware)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Neon DB (PostgreSQL 15+)                                        │
│  ├─ Connection pooling (Prisma + PgBouncer)                     │
│  ├─ PostGIS extension (geolocation)                             │
│  ├─ Full-text search (tsvector + trigram)                       │
│  ├─ Row-level security (RLS)                                    │
│  └─ Auto-backup (daily, 7-day retention)                        │
│                                                                  │
│  Prisma ORM                                                      │
│  ├─ Type-safe queries                                           │
│  ├─ Migrations (schema versioning)                              │
│  └─ Seed scripts (categories, test data)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  Qencode (Video Processing)  Payment Gateways (Payments)         │
│  ├─ Transcode API            ├─ Multi-provider checkout          │
│  ├─ HLS output (1080p/720p/480p)  ├─ Per-provider webhooks       │
│  └─ Webhook callbacks        └─ Invoice generation               │
│                                                                  │
│  Cloudflare R2 (Storage + Video)  Mapbox (Geo)                   │
│  ├─ video-raw (private, 24h TTL)  ├─ Geocoding                   │
│  ├─ video-hls (public CDN)   ├─ Autocomplete                     │
│  └─ Images (avatars, logos)  └─ Heatmaps                         │
│                                                                  │
│  Resend (Email)              Perspective API (Moderation)        │
│  └─ React Email templates    └─ Toxicity scoring                 │
│                                                                  │
│  PostHog (Analytics)         VIES API (Verification)             │
│  ├─ Product analytics        └─ VAT validation                   │
│  └─ Feature flags                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND JOBS LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Inngest (Event-driven workflows)                                │
│  ├─ short.transcode.completed (Qencode webhook → publish)       │
│  ├─ payment.succeeded (Payment webhook → activate short)         │
│  ├─ short.expiring.soon (cron: 7 days before archivization)     │
│  ├─ short.archive (cron: 30 days after publish)                 │
│  ├─ company.reverify (cron: 6 months VIES re-check)             │
│  ├─ email.send (retry logic dla Resend)                         │
│  └─ analytics.aggregate (daily stats rollup)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Technologiczny (Szczegółowy)

### 2.1 Frontend

| Technologia | Wersja | Purpose |
|-------------|--------|---------|
| **Next.js** | 14.2+ | Framework (App Router, RSC, SSR) |
| **React** | 19+ | UI library |
| **TypeScript** | 5.3+ | Type safety |
| **Tailwind CSS** | 3.4+ | Styling framework |
| **shadcn/ui** | latest | Component library (Radix UI primitives) |
| **next-themes** | latest | Dark mode support |
| **next-intl** | latest | i18n (Polish + ready for expansion) |
| **react-hook-form** | 7.50+ | Form management |
| **zod** | 3.22+ | Schema validation |
| **@tanstack/react-query** | 5+ | Data fetching, caching, optimistic updates |
| **@vidstack/react** | latest | HLS video player (with hls.js fallback) |
| **mapbox-gl** | 3+ | Interactive maps |

### 2.2 Backend

| Technologia | Wersja | Purpose |
|-------------|--------|---------|
| **Next.js API Routes** | 14.2+ | REST API endpoints |
| **Server Actions** | Next.js 14+ | Mutations (type-safe, optimistic UI) |
| **NextAuth.js** | 5+ (Auth.js) | Authentication (email, OAuth) |
| **Prisma** | 5.8+ | ORM + migrations |
| **bcryptjs** | 2.4+ | Password hashing |
| **jose** | 5+ | JWT signing/verification |
| **Inngest** | 3+ | Background jobs, cron, webhooks processing |
| **Vercel Edge Runtime** | latest | Edge middleware (geolocation) |

### 2.3 Database

| Technologia | Wersja | Purpose |
|-------------|--------|---------|
| **Neon DB** | PostgreSQL 15+ | Serverless Postgres |
| **PostGIS** | 3.4+ | Geospatial queries |
| **pg_trgm** | - | Fuzzy text search (trigram) |

### 2.4 Storage & CDN

| Service | Purpose |
|---------|---------|
| **Cloudflare R2** | Object storage (images + video) |
| **Cloudflare CDN** | Image + video delivery (auto-optimized) |
| **Qencode** | Video transcoding service (HLS output) |

### 2.5 External APIs

| Service | SDK/Library | Purpose |
|---------|-------------|---------|
| **Payment Providers** | Provider-specific SDKs | Multi-provider payments (Przelewy24, Tpay) |
| **Qencode** | qencode-api-client | Video transcoding, HLS generation |
| **Vidstack** | @vidstack/react | HLS video player |
| **Mapbox** | mapbox-gl, @mapbox/mapbox-gl-geocoder | Geocoding, maps |
| **Resend** | resend | Email delivery |
| **React Email** | @react-email/* | Email templates (JSX) |
| **Perspective API** | @google-cloud/perspective | Comment moderation |
| **VIES API** | soap (Node SOAP client) | VAT validation |
| **PostHog** | posthog-js, posthog-node | Product analytics |

### 2.6 DevOps & Monitoring

| Tool | Purpose |
|------|---------|
| **Vercel** | Hosting, deployments, edge functions |
| **GitHub Actions** | CI/CD (tests, lint, type-check) |
| **Sentry** | Error tracking (post-MVP) |
| **Vercel Analytics** | Core Web Vitals monitoring |
| **PostHog** | Product analytics, session replay |

---

## 3. Struktura Bazy Danych (Prisma Schema)

```prisma
// schema.prisma

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Neon direct connection
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "fullTextSearch"]
}

enum Role {
  USER
  COMPANY
  ADMIN
}

enum ShortStatus {
  DRAFT
  PENDING_PAYMENT
  PROCESSING
  PUBLISHED
  ARCHIVED
  DELETED
}

enum ReportReason {
  SPAM
  INAPPROPRIATE
  MISLEADING
  COPYRIGHT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  RESOLVED
}

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

enum CreditSource {
  PACKAGE      // Pakiet zakupiony
  GIFT         // Otrzymany w prezencie
  PROMO        // Kod promocyjny
  REFUND       // Zwrot kredytów
  ADMIN        // Dodane przez admina
  OTHER        // Inne źródło
}

enum NotificationType {
  WELCOME
  VERIFY_EMAIL
  SHORT_PUBLISHED
  SHORT_EXPIRING
  PAYMENT_CONFIRMATION
  MODERATION_ACTION
  NEW_FOLLOWER
  COMMENT_REPLY
}

enum LikeType {
  LIKE
  DISLIKE
  FIRE      // 🔥
  HEART     // ❤️
  LAUGH     // 😂
  WOW       // 😮
  CLAP      // 👏
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  DELETED
}

// ============================================================================
// USER & AUTH
// ============================================================================

model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  passwordHash       String?   // nullable dla OAuth users
  role               Role      @default(USER)
  publicationCredits Int       @default(0) // Liczba dostępnych publikacji
  emailVerified      DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relations
  profile            UserProfile?
  companyProfile     CompanyProfile?
  shorts             Short[]
  likes              Like[]
  comments           Comment[]
  follows            Follow[]
  reportsCreated     Report[]            @relation("ReporterReports")
  payments           Payment[]
  creditTransactions CreditTransaction[]
  notifications      Notification[]
  auditLogs          AuditLog[]
  accounts           Account[]           // NextAuth OAuth accounts
  sessions           Session[]           // NextAuth sessions

  @@index([email])
  @@index([role])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  avatar      String?  // R2 URL
  bio         String?  @db.Text
  location    String?  // Address text
  latitude    Float?
  longitude   Float?
  preferences Json?    // {categories: [], notificationSettings: {}}
  darkMode    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  // PostGIS index dla geolocation
  @@index([latitude, longitude])
}

// ============================================================================
// COMPANY
// ============================================================================

model CompanyProfile {
  id           String    @id @default(cuid())
  userId       String    @unique
  companyName  String
  nip          String    @unique
  viesVerified Boolean   @default(false)
  verifiedAt   DateTime?
  logo         String?   // R2 URL
  banner       String?   // R2 URL
  description  String?   @db.Text // Markdown
  categoryId   String?
  website      String?
  socialLinks  Json?     // {facebook: "", instagram: ""}
  latitude     Float?
  longitude    Float?
  address      String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category  Category? @relation(fields: [categoryId], references: [id])
  shorts    Short[]
  followers Follow[]

  @@index([userId])
  @@index([categoryId])
  @@index([nip])
  @@index([viesVerified])
  @@index([latitude, longitude])
}

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  icon      String?  // SVG URL
  parentId  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent           Category?        @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children         Category[]       @relation("CategoryHierarchy")
  companyProfiles  CompanyProfile[]
  shorts           Short[]

  @@index([slug])
  @@index([parentId])
}

// ============================================================================
// SHORTS (CONTENT)
// ============================================================================

model Short {
  id             String      @id @default(cuid())
  companyId      String
  qencodeTaskId  String?     @unique    // Qencode transcoding task ID
  hlsPlaylistUrl String?                // R2 public URL to master.m3u8
  rawVideoKey    String?                // R2 key for raw video (video-raw bucket)
  title          String
  description    String?     @db.Text
  categoryId     String?
  latitude       Float?
  longitude      Float?
  address        String?
  ctaLink        String?
  status         ShortStatus @default(DRAFT)
  thumbnailUrl   String?
  duration       Int?        // seconds
  publishedAt    DateTime?
  archivedAt     DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  company  CompanyProfile @relation(fields: [companyId], references: [id], onDelete: Cascade)
  category Category?      @relation(fields: [categoryId], references: [id])
  stats    ShortStats?
  tags     ShortTag[]
  likes    Like[]
  comments Comment[]
  reports  Report[]
  payment  Payment?

  @@index([companyId])
  @@index([status])
  @@index([publishedAt])
  @@index([categoryId])
  @@index([latitude, longitude])
  @@index([qencodeTaskId])
}

model ShortStats {
  id            String   @id @default(cuid())
  shortId       String   @unique
  views         Int      @default(0)
  uniqueViews   Int      @default(0)
  likes         Int      @default(0)
  comments      Int      @default(0)
  avgWatchTime  Float?   // seconds
  updatedAt     DateTime @updatedAt

  short Short @relation(fields: [shortId], references: [id], onDelete: Cascade)

  @@index([shortId])
}

model Tag {
  id         String     @id @default(cuid())
  name       String
  slug       String     @unique
  usageCount Int        @default(0)
  createdAt  DateTime   @default(now())

  shorts ShortTag[]

  @@index([slug])
  @@index([usageCount])
}

model ShortTag {
  shortId String
  tagId   String

  short Short @relation(fields: [shortId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([shortId, tagId])
  @@index([shortId])
  @@index([tagId])
}

// ============================================================================
// INTERACTIONS
// ============================================================================

model Like {
  id        String   @id @default(cuid())
  userId    String
  shortId   String
  type      LikeType @default(LIKE)
  createdAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  short Short @relation(fields: [shortId], references: [id], onDelete: Cascade)

  @@unique([userId, shortId])
  @@index([userId])
  @@index([shortId])
  @@index([type])
}

model Comment {
  id            String        @id @default(cuid())
  userId        String
  shortId       String
  parentId      String?
  content       String        @db.Text
  status        CommentStatus @default(PENDING)
  toxicityScore Float?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  short   Short     @relation(fields: [shortId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentThread", fields: [parentId], references: [id])
  replies Comment[] @relation("CommentThread")
  reports Report[]

  @@index([userId])
  @@index([shortId])
  @@index([parentId])
  @@index([status])
  @@index([createdAt])
}

model Follow {
  id        String   @id @default(cuid())
  userId    String
  companyId String
  createdAt DateTime @default(now())

  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  company CompanyProfile @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
  @@index([userId])
  @@index([companyId])
}

// ============================================================================
// MODERATION
// ============================================================================

model Report {
  id          String       @id @default(cuid())
  reporterId  String
  shortId     String?
  commentId   String?
  reason      ReportReason
  description String?      @db.Text
  status      ReportStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  resolvedAt  DateTime?

  reporter User     @relation("ReporterReports", fields: [reporterId], references: [id], onDelete: Cascade)
  short    Short?   @relation(fields: [shortId], references: [id], onDelete: Cascade)
  comment  Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@index([reporterId])
  @@index([shortId])
  @@index([commentId])
  @@index([status])
  @@index([createdAt])
}

// ============================================================================
// PAYMENTS
// ============================================================================

model Payment {
  id                  String          @id @default(cuid())
  userId              String
  shortId             String?         @unique // Nullable - pakiety nie są linked z shortem
  provider            PaymentProvider @default(PRZELEWY24)
  providerPaymentId   String          @unique
  providerSessionId   String?         @unique
  amount              Decimal         @db.Decimal(10, 2)
  currency            String          @default("PLN")
  status              PaymentStatus   @default(PENDING)
  invoiceUrl          String?
  metadata            Json?           // Provider-specific data
  creditsGranted      Int?            // Ile kredytów dodano po płatności
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  user               User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  short              Short?              @relation(fields: [shortId], references: [id], onDelete: Cascade)
  creditTransactions CreditTransaction[]

  @@index([userId])
  @@index([shortId])
  @@index([status])
  @@index([provider])
  @@index([providerPaymentId])
}

model CreditTransaction {
  id        String       @id @default(cuid())
  userId    String
  amount    Int          // Może być ujemny (-1 przy publikacji)
  source    CreditSource
  shortId   String?      // Jeśli związane z publikacją shorta
  paymentId String?      // Jeśli zakupione przez payment
  metadata  Json?        // Dodatkowe info (package name, promo code, etc.)
  createdAt DateTime     @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  short   Short?   @relation(fields: [shortId], references: [id])
  payment Payment? @relation(fields: [paymentId], references: [id])

  @@index([userId])
  @@index([source])
  @@index([createdAt])
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String           @db.Text
  link      String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([read])
  @@index([createdAt])
}

// ============================================================================
// ADMIN & AUDIT
// ============================================================================

model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String   // "BAN_USER", "DELETE_SHORT", "APPROVE_COMMENT", etc.
  targetType String   // "USER", "SHORT", "COMMENT"
  targetId   String
  metadata   Json?    // {reason: "", previousStatus: "", etc.}
  createdAt  DateTime @default(now())

  admin User @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

---

## 4. Struktura API (Endpoints)

### 4.1 Authentication

```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/session
POST   /api/auth/verify-email
POST   /api/auth/reset-password
GET    /api/auth/providers (OAuth providers)
```

### 4.2 Users

```
GET    /api/users/me
PATCH  /api/users/me
DELETE /api/users/me
GET    /api/users/:id
PATCH  /api/users/:id/avatar (upload)
GET    /api/users/:id/stats
```

### 4.3 Companies

```
POST   /api/companies (upgrade to company)
GET    /api/companies/:id
PATCH  /api/companies/:id
POST   /api/companies/:id/logo (upload)
POST   /api/companies/:id/banner (upload)
POST   /api/companies/:id/verify (initiate VIES check)
GET    /api/companies/:id/shorts
GET    /api/companies/:id/stats
GET    /api/companies/:id/followers
```

### 4.4 Shorts

```
GET    /api/shorts (list/search)
POST   /api/shorts (create draft)
GET    /api/shorts/:id
PATCH  /api/shorts/:id
DELETE /api/shorts/:id
POST   /api/shorts/:id/upload-url (get R2 presigned PUT URL for video-raw bucket)
POST   /api/shorts/:id/publish (initiate payment)
POST   /api/shorts/:id/renew (extend archivization)
GET    /api/shorts/:id/stats
POST   /api/shorts/:id/view (increment view counter)
```

### 4.5 Feed

```
GET    /api/feed
  Query params:
    - page (int, default: 1)
    - limit (int, default: 20, max: 50)
    - sort (newest | popular | trending | following)
    - categoryId (uuid)
    - tags (comma-separated slugs)
    - lat, lng, radius (geolocation filter)
    - q (search query)
```

### 4.6 Interactions

```
POST   /api/shorts/:id/like
DELETE /api/shorts/:id/like
GET    /api/shorts/:id/comments
POST   /api/shorts/:id/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id
POST   /api/companies/:id/follow
DELETE /api/companies/:id/follow
GET    /api/users/me/following
```

### 4.7 Reports

```
POST   /api/reports
GET    /api/reports (admin only)
PATCH  /api/reports/:id (admin only - resolve)
```

### 4.8 Payments

```
POST   /api/payments/checkout (create payment session, with provider selection)
GET    /api/payments/:id
GET    /api/payments (user's payment history)
```

### 4.9 Admin

```
GET    /api/admin/stats
GET    /api/admin/moderation-queue
PATCH  /api/admin/shorts/:id/moderate
PATCH  /api/admin/comments/:id/moderate
PATCH  /api/admin/users/:id/ban
GET    /api/admin/audit-logs
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

### 4.10 Webhooks

```
POST   /api/webhooks/przelewy24 (Przelewy24 webhooks)
POST   /api/webhooks/tpay (Tpay webhooks)
POST   /api/webhooks/qencode (Qencode transcoding callbacks)
```

### 4.11 Notifications

```
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

---

## 5. Struktura Projektu Next.js

```
shorts/
├── .ai-project-planner/         # AI workflow files
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint, test, type-check
│       └── deploy.yml           # Deploy to Vercel
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   └── icons/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── verify-email/
│   │   ├── (main)/
│   │   │   ├── layout.tsx       # Main layout (header, footer)
│   │   │   ├── page.tsx         # Feed (home page)
│   │   │   ├── shorts/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Short detail page
│   │   │   ├── companies/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Company profile
│   │   │   ├── dashboard/       # Company dashboard
│   │   │   │   ├── page.tsx
│   │   │   │   ├── shorts/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   │   └── search/
│   │   │       └── page.tsx
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── moderation/
│   │   │       ├── users/
│   │   │       └── settings/
│   │   ├── api/
│   │   │   ├── auth/            # NextAuth routes
│   │   │   ├── shorts/
│   │   │   ├── companies/
│   │   │   ├── feed/
│   │   │   ├── webhooks/
│   │   │   └── ...
│   │   ├── globals.css
│   │   └── layout.tsx           # Root layout
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── shorts/
│   │   │   ├── ShortPlayer.tsx
│   │   │   ├── ShortCard.tsx
│   │   │   ├── ShortFeed.tsx
│   │   │   └── ShortUploader.tsx
│   │   ├── companies/
│   │   │   ├── CompanyProfile.tsx
│   │   │   └── CompanyCard.tsx
│   │   ├── interactions/
│   │   │   ├── LikeButton.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   └── FollowButton.tsx
│   │   ├── moderation/
│   │   │   └── ModerationQueue.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── InfiniteScroll.tsx
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── auth.ts              # NextAuth config
│   │   ├── payment-providers/  # Payment providers
│   │   │   ├── base-provider.ts
│   │   │   ├── przelewy24.ts
│   │   │   ├── tpay.ts
│   │   │   └── factory.ts
│   │   ├── video-pipeline/      # Video processing
│   │   │   ├── r2-upload.ts     # R2 presigned URL generation
│   │   │   ├── qencode.ts       # Qencode transcoding client
│   │   │   └── webhook.ts       # Qencode webhook handler
│   │   ├── mapbox.ts            # Mapbox client
│   │   ├── resend.ts            # Resend client
│   │   ├── perspective.ts       # Perspective API client
│   │   ├── vies.ts              # VIES API client
│   │   ├── posthog.ts           # PostHog client
│   │   ├── r2.ts                # Cloudflare R2 client
│   │   └── inngest/
│   │       ├── client.ts
│   │       └── functions/
│   │           ├── short-transcode.ts
│   │           ├── payment-succeeded.ts
│   │           ├── short-expiring.ts
│   │           └── ...
│   ├── lib/
│   │   ├── publication/         # Publication Controller
│   │   │   └── publication-controller.ts
│   │   ├── prisma.ts
│   │   ├── payments/
│   │   └── ...
│   ├── services/                # Business logic layer
│   │   ├── shorts/
│   │   │   ├── createShort.ts
│   │   │   ├── publishShort.ts
│   │   │   └── archiveShort.ts
│   │   ├── companies/
│   │   │   └── verifyCompany.ts
│   │   ├── payments/
│   │   │   └── processPayment.ts
│   │   └── moderation/
│   │       └── moderateContent.ts
│   ├── hooks/                   # React hooks
│   │   ├── useInfiniteScroll.ts
│   │   ├── useVideoPlayer.ts
│   │   ├── useGeolocation.ts
│   │   └── useDebounce.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── middleware.ts            # Edge middleware (auth, geolocation)
├── emails/                      # React Email templates
│   ├── Welcome.tsx
│   ├── VerifyEmail.tsx
│   ├── ShortPublished.tsx
│   └── ShortExpiring.tsx
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 6. Przepływy Danych (Data Flows)

### 6.1 Video Upload & Publish Flow (z Publication Controller)

```
1. Company creates short draft
   POST /api/shorts
   → Creates Short record (status: DRAFT)
   → Returns shortId

2. Company requests upload URL
   POST /api/shorts/:id/upload-url
   → Generates presigned PUT URL for R2 video-raw bucket
   → Returns {uploadUrl, rawVideoKey}
   → Saves rawVideoKey to Short record

3. Client uploads video directly to R2 (video-raw bucket)
   PUT https://<bucket>.r2.cloudflarestorage.com/...
   → Direct upload (client → R2, bypasses server)
   → video-raw bucket has 24h auto-delete policy

4. Company initiates publish
   POST /api/shorts/:id/publish
   → PublicationController.publish(userId, shortId)

   A. Jeśli firma MA kredyty (publicationCredits > 0):
      → PublicationController.publishWithCredits()
      → Zmniejsz publicationCredits o 1
      → Utwórz CreditTransaction (amount: -1)
      → Trigger Qencode transcoding job (krok 8)
      → Update Short status: PROCESSING
      → Return success: true

   B. Jeśli firma NIE MA kredytów (publicationCredits = 0):
      → PublicationController.createCheckoutSession()
      → Creates Payment Provider Checkout Session
      → Return success: false, needsPayment: true, checkoutUrl
      → Frontend redirects to Payment Provider Checkout

5. User completes payment (tylko jeśli B)
   → Payment provider redirect to success page
   → Provider sends webhook: payment.succeeded

6. Webhook handler (tylko jeśli B)
   POST /api/webhooks/[provider]
   → Verifies signature
   → Enqueues Inngest event: payment.succeeded

7. Inngest processes payment (tylko jeśli B)
   → Updates Payment (status: SUCCEEDED)
   → PublicationController.addCreditsFromPayment()
   → Dodaje kredyty (creditsGranted: 1)
   → Tworzy CreditTransaction (amount: +1)
   → Jeśli payment linked z shortem: trigger transcoding (krok 8)
   → Update Short status: PROCESSING

8. Trigger Qencode transcoding
   → Call Qencode API to start transcoding job:
     - Input: R2 video-raw presigned URL
     - Output: R2 video-hls bucket path
     - Profile: HLS, 4-6s segments, H.264 High/Main
     - Resolutions: 1080p (4500kbps), 720p (2500kbps), 480p (1000kbps)
     - Aspect ratio: 9:16
   → Save qencodeTaskId to Short record
   → Qencode processes video asynchronously

9. Qencode finishes transcoding
   → Sends webhook callback to our API
   POST /api/webhooks/qencode
   → Verify webhook authenticity
   → Update Short:
     - hlsPlaylistUrl: R2 public URL to master.m3u8
     - thumbnailUrl: extracted or generated thumbnail
     - duration: video duration in seconds
     - status: PUBLISHED
     - publishedAt: now()
   → Delete raw video from video-raw bucket (cleanup)
   → Enqueue Inngest event: short.published

10. Inngest finalizes publication
    → Sends notification email
    → Creates in-app notification
    → Schedules archivization job (30 days)

11. Short appears in feed
    → HLS streaming via Cloudflare CDN
    → Cache headers: .ts/.jpg → 1 year, .m3u8 → 1 hour
    → Indexed for search
    → Visible to users

FLOW SUMMARY:
- Z kredytami: DRAFT → PROCESSING (krok 4A+8) → PUBLISHED (krok 9-10)
- Bez kredytów: DRAFT → PENDING_PAYMENT (krok 4B) → payment → PROCESSING (krok 7+8) → PUBLISHED (krok 9-10)
```

### 6.2 Feed Generation Flow

```
1. User requests feed
   GET /api/feed?lat=52.23&lng=21.01&radius=10&sort=trending

2. Server-side logic
   a. Get user preferences (if authenticated)
      → Followed companies
      → Liked categories
      → Previous interactions

   b. Build Prisma query
      → Filter: status = PUBLISHED
      → Filter: geolocation within radius (PostGIS)
      → Filter: categoryId IN (...)
      → Sort: trending algorithm
        * Engagement rate (likes + comments) / views
        * Recency boost (published < 24h)
        * Personal preference boost

   c. Execute query (pagination: 20 items)
      → Prisma findMany with relations

   d. Enrich results
      → HLS playlist URLs (Cloudflare CDN)
      → Company info
      → Like/follow status (if authenticated)

3. Return JSON
   → Array of shorts + pagination metadata

4. Client renders
   → Infinite scroll container
   → Video autoplay on viewport intersection
   → Prefetch next page
```

### 6.3 Comment Moderation Flow

```
1. User submits comment
   POST /api/shorts/:id/comments
   { content: "This is awesome!" }

2. Server validation
   → Zod schema validation
   → Rate limit check (100/day)
   → Auth check

3. Perspective API check
   → Call Perspective.analyzeComment(content)
   → Returns toxicityScore (0-1)

4. Decision tree
   IF toxicityScore < 0.7:
     → Create Comment (status: APPROVED)
     → Return 201 Created
     → Comment visible immediately
   ELSE:
     → Create Comment (status: PENDING)
     → Create Report (auto-flagged)
     → Notify admin (email + in-app)
     → Return 201 Created (but comment hidden)
     → Display "Your comment is under review" to user

5. Admin moderation (for PENDING)
   GET /api/admin/moderation-queue
   → Lists pending comments with toxicityScore
   → Admin reviews context
   PATCH /api/admin/comments/:id/moderate
   { action: "approve" | "reject" | "ban_user" }

6. Moderation action
   → Update Comment status
   → Create AuditLog
   → Notify user (email)
   → If ban: update User (role: BANNED)
```

### 6.4 Archivization & Renewal Flow

```
1. Inngest cron job (daily at 3 AM)
   → Query: Shorts published 23 days ago (7 days before expiry)
   → For each short:
     → Enqueue short.expiring.soon event

2. Expiring notification handler
   → Get company email
   → Send email (Resend + React Email)
     * "Your short expires in 7 days"
     * CTA: Renew now (pay 5 PLN)
   → Create in-app notification

3. Company renews (optional)
   POST /api/shorts/:id/renew
   → Creates new Payment Provider Checkout Session
   → On payment success:
     → Extend publishedAt by 30 days
     → Cancel archivization job

4. If no renewal (30 days after publish)
   → Inngest cron job finds expired shorts
   → Enqueue short.archive event

5. Archive handler
   → Update Short (status: ARCHIVED, archivedAt: now)
   → Remove from feed index
   → Send notification email
   → Short still accessible via direct link + company profile
```

---

## 7. Bezpieczeństwo

### 7.1 Authentication & Authorization

**NextAuth.js (Auth.js v5):**
- JWT strategy (stateless)
- Session stored in secure HTTP-only cookie
- Email + password (bcrypt cost 12)
- OAuth providers: Google, Facebook

**Authorization Middleware:**
```typescript
// src/middleware.ts
export function middleware(req: NextRequest) {
  const token = await getToken({ req });

  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token || token.role !== 'COMPANY') {
      return NextResponse.redirect('/login');
    }
  }

  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect('/');
    }
  }
}
```

### 7.2 Input Validation

**Zod schemas dla wszystkich inputs:**
```typescript
// Example: Short creation schema
const createShortSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).max(10),
  ctaLink: z.string().url().optional(),
});
```

**Server-side validation:**
- Wszystkie API routes używają Zod
- Server Actions używają Zod
- NIGDY nie trustujemy client input

### 7.3 Rate Limiting

**Vercel Edge Config + Upstash Redis (post-MVP):**
```typescript
// src/lib/rate-limit.ts
export async function rateLimit(identifier: string, limit: number, window: number) {
  const key = `ratelimit:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, window);
  }

  if (count > limit) {
    throw new Error('Rate limit exceeded');
  }
}
```

**Limits:**
- Anonymous: 100 req/15min (by IP)
- Authenticated: 1000 req/15min (by userId)
- Comment POST: 100/day
- Like POST: 100/min
- Upload: 10/hour

### 7.4 SQL Injection Prevention

**Prisma ORM:**
- Parameterized queries (automatic)
- Type-safe API
- NO raw SQL w MVP (jeśli konieczne: Prisma.$queryRaw z tagged templates)

### 7.5 XSS Prevention

**React auto-escaping:**
- React automatycznie escape'uje wszystkie stringi
- Markdown rendering: DOMPurify + react-markdown

```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeMarkdown(content: string) {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}
```

### 7.6 CSRF Prevention

**NextAuth built-in CSRF protection:**
- CSRF token w session cookie
- Weryfikacja na wszystkich mutations

### 7.7 File Upload Security

**Video (R2 Direct Upload + Qencode):**
- Client uploads directly to R2 video-raw bucket (bypasses server)
- Presigned PUT URLs (15min expiry)
- Client-side validation: format, size, duration before upload
- Server-side validation after upload confirmation
- Qencode validates during transcoding (format, duration)
- Raw video auto-deleted after 24h (bucket lifecycle policy)

**Images (Cloudflare R2):**
- Presigned PUT URLs (15min expiry)
- Client-side validation: MIME type, size
- Server-side re-validation po upload
- Image optimization przez Cloudflare Images

### 7.8 Secrets Management

**Vercel Environment Variables:**
- Production secrets w Vercel dashboard
- Development: .env.local (gitignored)
- Rotation: manual (quarterly)

**Sensitive env vars:**
```
DATABASE_URL (Neon connection string)
PRZELEWY24_MERCHANT_ID
PRZELEWY24_POS_ID
PRZELEWY24_CRC
PRZELEWY24_API_KEY
PRZELEWY24_WEBHOOK_SECRET
TPAY_MERCHANT_ID
TPAY_SECURITY_CODE
TPAY_API_KEY
TPAY_API_PASSWORD
TPAY_WEBHOOK_SECRET
QENCODE_API_KEY
QENCODE_WEBHOOK_SECRET
R2_VIDEO_RAW_BUCKET
R2_VIDEO_HLS_BUCKET
R2_VIDEO_PUBLIC_URL
MAPBOX_SECRET_TOKEN
PERSPECTIVE_API_KEY
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
NEXTAUTH_SECRET
DEFAULT_PAYMENT_PROVIDER
```

---

## 8. Skalowalność

### 8.1 Database Scaling

**Neon DB features:**
- Connection pooling (PgBouncer built-in)
- Auto-scaling compute (scale to zero)
- Read replicas (post-MVP)

**Query optimization:**
- Indexes na wszystkich FK i często querowanych polach
- Prisma query optimization (select only needed fields)
- Pagination (cursor-based dla infinite scroll)

**Example optimized query:**
```typescript
const shorts = await prisma.short.findMany({
  where: { status: 'PUBLISHED' },
  select: {
    id: true,
    title: true,
    thumbnailUrl: true,
    hlsPlaylistUrl: true,
    company: {
      select: {
        companyName: true,
        logo: true,
      },
    },
    stats: {
      select: {
        views: true,
        likes: true,
      },
    },
  },
  take: 20,
  cursor: lastShortId ? { id: lastShortId } : undefined,
  orderBy: { publishedAt: 'desc' },
});
```

### 8.2 CDN & Caching

**Vercel Edge Network:**
- Static assets cached globally
- ISR (Incremental Static Regeneration) dla public pages
- Stale-while-revalidate strategy

**Example caching headers:**
```typescript
// Public short page (ISR)
export const revalidate = 60; // 1 minute

// Feed endpoint
export async function GET(req: Request) {
  const feed = await getFeed();

  return new Response(JSON.stringify(feed), {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
```

**Cloudflare R2 + CDN:**
- Images served through Cloudflare CDN
- Auto-optimization (WebP, AVIF)
- Geo-distributed

**Cloudflare CDN (Video):**
- HLS video streamed from R2 video-hls bucket
- Adaptive bitrate (Qencode generates 1080p/720p/480p)
- Cache headers:
  - .ts segments: max-age=31536000, immutable (1 rok)
  - .m3u8 playlists: max-age=3600 (1 godzina)
  - thumbnail.jpg: max-age=31536000, immutable
- Geo-distributed via Cloudflare edge network

### 8.3 Background Jobs

**Inngest advantages:**
- Automatic retries (exponential backoff)
- Idempotency (built-in)
- Horizontal scaling (Vercel handles)
- Observability (Inngest dashboard)

**Job examples:**
```typescript
// Long-running job: VIES verification
inngest.createFunction(
  { name: 'company.verify' },
  { event: 'company.created' },
  async ({ event }) => {
    const result = await viesClient.checkVat(event.data.nip);

    await prisma.companyProfile.update({
      where: { id: event.data.companyId },
      data: { viesVerified: result.valid },
    });
  }
);

// Scheduled job: daily archivization check
inngest.createFunction(
  { name: 'shorts.archive-expired' },
  { cron: '0 3 * * *' }, // 3 AM daily
  async () => {
    const expired = await prisma.short.findMany({
      where: {
        publishedAt: { lte: subDays(new Date(), 30) },
        status: 'PUBLISHED',
      },
    });

    for (const short of expired) {
      await inngest.send({
        name: 'short.archive',
        data: { shortId: short.id },
      });
    }
  }
);
```

### 8.4 API Performance

**React Query (TanStack Query):**
- Client-side caching
- Automatic refetch strategies
- Optimistic updates
- Prefetching

**Server Components (RSC):**
- Data fetching na serwerze (zero waterfalls)
- Streaming (Suspense boundaries)
- Reduced client bundle

---

## 9. Monitoring & Observability

### 9.1 Application Monitoring

**Vercel Analytics:**
- Core Web Vitals (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Function metrics (duration, invocations, errors)

**PostHog:**
- Product analytics (user flows, funnels)
- Session replay (debugging)
- Feature flags (gradual rollouts)

**Custom events:**
```typescript
posthog.capture('short_published', {
  shortId: short.id,
  companyId: company.id,
  categoryId: short.categoryId,
  duration: short.duration,
});

posthog.capture('short_viewed', {
  shortId: short.id,
  watchTime: player.currentTime,
  completed: player.currentTime >= player.duration * 0.9,
});
```

### 9.2 Error Tracking

**Sentry (post-MVP):**
- Client + server error tracking
- Source maps (Vercel integration)
- Performance monitoring
- Release tracking

### 9.3 Logs

**Vercel Logs:**
- Function logs (console.log → Vercel dashboard)
- Structured logging (JSON format)

```typescript
// src/lib/logger.ts
export function log(level: 'info' | 'warn' | 'error', message: string, metadata?: object) {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...metadata,
  }));
}
```

**Inngest Logs:**
- All background job executions
- Retry attempts
- Failures with stack traces

### 9.4 Uptime Monitoring

**Vercel Status Page:**
- Automatic status checks
- Incident history

**Custom healthcheck endpoint:**
```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

**External monitoring (post-MVP):**
- Uptime Robot / Pingdom
- Alerts: Slack, PagerDuty

---

## 10. Deployment Strategy

### 10.1 Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Development** | `develop` | localhost:3000 | Local development |
| **Preview** | `feature/*` | vercel-preview-*.vercel.app | PR previews |
| **Staging** | `staging` | staging.videoshorts.pl | QA testing |
| **Production** | `main` | videoshorts.pl | Live users |

### 10.2 CI/CD Pipeline

**GitHub Actions (.github/workflows/ci.yml):**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npx prisma validate
```

**Vercel Deployment:**
- Auto-deploy on push to `main` (production)
- Auto-deploy on push to `staging` (staging)
- Preview deploys dla PR (auto)

### 10.3 Database Migrations

**Prisma Migrate workflow:**
```bash
# Development
npx prisma migrate dev --name add_short_status

# Production (automated in CI/CD)
npx prisma migrate deploy
```

**Migration strategy:**
- Always backwards-compatible (no breaking schema changes w MVP)
- Migrations run automatically on Vercel build
- Rollback plan: revert migration + redeploy previous version

### 10.4 Feature Flags

**PostHog feature flags:**
```typescript
const isDarkModeEnabled = posthog.isFeatureEnabled('dark-mode');
const isNewFeedAlgorithm = posthog.isFeatureEnabled('new-feed-algorithm');
```

**Gradual rollouts:**
- 10% → 50% → 100% dla major features
- A/B testing dla UX experiments

---

## 11. Compliance & Legal

### 11.1 GDPR/RODO

**Data retention:**
- User data: indefinite (until user requests deletion)
- Deleted shorts: 30 days soft delete, then hard delete
- Audit logs: 2 years

**Right to be forgotten:**
```typescript
// POST /api/users/me/delete-account
async function deleteUserAccount(userId: string) {
  // 1. Anonymize shorts (replace companyId with NULL)
  await prisma.short.updateMany({
    where: { companyId: userId },
    data: { companyId: null },
  });

  // 2. Delete comments (cascade)
  await prisma.comment.deleteMany({ where: { userId } });

  // 3. Delete user record (cascades to profile, sessions, etc.)
  await prisma.user.delete({ where: { id: userId } });

  // 4. Schedule email confirmation
  await sendEmail({
    to: user.email,
    template: 'AccountDeleted',
  });
}
```

**Cookie consent:**
- Essential cookies: session, CSRF (no consent needed)
- Analytics (PostHog): opt-in consent banner

### 11.2 VAT Invoicing

**Payment Provider Tax Handling:**
- Automatic VAT calculation (PL: 23%)
- Invoice generation with company details from VIES
- Provider-specific tax configuration (Przelewy24/Tpay)
- PDF download

---

## 12. Performance Budget

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| LCP (Largest Contentful Paint) | < 2.0s | 2.5s |
| FID (First Input Delay) | < 100ms | 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.25 |
| Feed load time | < 2s | 3s |
| Video autoplay start | < 1s | 2s |
| API response time (p95) | < 1s | 2s |
| TTI (Time to Interactive) | < 3s | 5s |

**Optimization techniques:**
- Image optimization (Cloudflare Images, Next.js Image)
- Code splitting (dynamic imports)
- Tree shaking (automatic in Next.js)
- Lazy loading (react-intersection-observer)
- Prefetching (next/link, React Query)

---

## 13. Tech Debt & Future Improvements

### Post-MVP Enhancements

**Phase 2 (3-6 months):**
- Share functionality (social sharing, embed codes)
- Advanced analytics (heatmaps, demographics, attribution)
- Multi-language support (EN, DE)
- Push notifications (PWA)
- Mobile apps (React Native)

**Phase 3 (6-12 months):**
- Subscription model (unlimited shorts per month)
- Advanced moderation (AI-based, not just Perspective API)
- Live streaming (future consideration with dedicated service)
- Shorts duets/stitches (TikTok-style)
- Company tiers (verified badge, priority support)

**Technical debt to address:**
- Replace polling z SSE/WebSockets dla real-time notifications
- Migrate do Sentry dla error tracking
- Add read replicas (Neon) dla heavy analytics queries
- Implement Redis cache (Upstash) dla hot data
- GraphQL API (optional, jeśli potrzeba flexible queries)

---

**Zatwierdził:** [Placeholder - Tech Lead]
**Data zatwierdzenia:** [Placeholder]
