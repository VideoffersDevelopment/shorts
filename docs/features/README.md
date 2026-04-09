# Features Documentation

Feature-level documentation organized by functional area.

---

## Implemented Features

### Stage 01: Core & Auth

#### [Profile Management](./profile/README.md)
Complete user profile management including avatar upload with cropping, profile editing, and avatar deletion.

**Key Functionality:**
- Avatar upload with image cropping
- Avatar deletion with R2 cleanup
- Profile data editing (display name, bio, location)
- Multi-language support

**Status:** Complete (task-04, 08)

---

### Stage 02: Companies & Admin

#### [Companies](./companies/README.md)
Comprehensive company profiles system with VAT verification and public pages.

**Key Functionality:**
- Company upgrade flow (USER -> COMPANY)
- VIES VAT verification integration
- Public company profiles (`/firma/[slug]`)
- Profile editing (logo, banner, categories, hours)
- Subcategory selection (max 3)
- Business hours picker (7-day editor)
- Geolocation support

**Status:** Complete (task-01 to task-05, task-11, task-12)

#### [Admin Panel](./admin/README.md)
Administrative tools for managing companies and categories.

**Key Functionality:**
- Companies management (list, filter, search, status updates)
- Categories management (hierarchical CRUD)
- Audit log tracking (all admin actions)
- Role-based access control (ADMIN only)

**Status:** Complete (task-06 to task-09)

---

### Stage 03: Shorts & Payments

#### [Shorts Upload](./shorts/upload.md)
Multi-step video upload wizard with direct-to-R2 uploads.

**Key Functionality:**
- Drag & drop video upload
- Direct-to-R2 presigned URLs
- Client-side validation (format, size, duration)
- Thumbnail selection/upload
- Tags autocomplete

**Status:** Complete (task-03)

#### [Shorts Management](./shorts/management.md)
CRUD operations for managing shorts.

**Key Functionality:**
- Shorts dashboard (table/grid views)
- Status filtering (Draft, Published, Archived)
- Edit metadata (title, description, tags, CTA)
- Archive, delete, duplicate operations

**Status:** Complete (task-06)

#### [Publishing Workflow](./shorts/publishing.md)
Publication flow with credit deduction and transcoding.

**Key Functionality:**
- Credit-based publication
- Qencode HLS transcoding
- Processing status tracking
- Auto-archive after 30 days

**Status:** Complete (task-04, task-07)

#### [Public Short View](./shorts/public-view.md)
Public short viewing page.

**Key Functionality:**
- HLS video player (@vidstack/react)
- Company info card
- CTA button with tracking
- SEO metadata

**Status:** Complete (task-07)

#### [Credits System](./payments/credits.md)
Publication credits management.

**Key Functionality:**
- Credits balance display
- Transaction history
- Credit packages (1, 5, 20, 50)

**Status:** Complete (task-05)

#### [Payment Checkout](./payments/checkout.md)
Payment flow for purchasing credits.

**Key Functionality:**
- Multi-provider payments (Przelewy24, Tpay)
- Webhook confirmation
- Automatic credit delivery

**Status:** Complete (task-05)

---

### Stage 04: Feed & Discovery

#### [Feed Overview](./feed/overview.md)
Public shorts feed with infinite scroll and algorithmic sorting.

**Key Functionality:**
- Infinite scroll grid layout
- Algorithmic feed scoring
- Multiple sort options (For You, Newest, Popular, Trending)
- Cursor-based pagination

**Status:** Complete (task-02, task-03)

#### [Feed Filtering](./feed/filtering.md)
Filter system for the feed.

**Key Functionality:**
- Category multi-select (max 5)
- Location-based filtering with radius
- Verified companies toggle
- URL state synchronization

**Status:** Complete (task-04)

#### [Search Feature](./feed/search.md)
Full-text search with autocomplete.

**Key Functionality:**
- PostgreSQL full-text search
- Fuzzy matching (pg_trgm)
- Autocomplete suggestions
- Recent searches (client-side)
- Type filtering (All/Shorts/Companies)

**Status:** Complete (task-05, task-06)

---

## Feature Status

### Stage 01: Core & Auth

| Feature | Status | Tasks | Documentation |
|---------|--------|-------|---------------|
| Profile Management | Complete | task-04, 08 | [Link](./profile/README.md) |
| Authentication | Complete | task-03 | Coming soon |
| Settings & Account | Complete | task-05 | Coming soon |
| Theme & Preferences | Complete | task-06 | Coming soon |
| Layout & Navigation | Complete | task-07 | Coming soon |

### Stage 02: Companies & Verification

| Feature | Status | Tasks | Documentation |
|---------|--------|-------|---------------|
| Company Upgrade | Complete | task-03 | [Link](./companies/README.md) |
| VIES Integration | Complete | task-02 | [Link](./companies/README.md) |
| Public Profiles | Complete | task-04 | [Link](./companies/README.md) |
| Profile Management | Complete | task-05,11,12 | [Link](./companies/README.md) |
| Admin Panel | Complete | task-06 | [Link](./admin/README.md) |
| Admin Companies | Complete | task-07 | [Link](./admin/README.md) |
| Admin Categories | Complete | task-08 | [Link](./admin/README.md) |
| Navigation & i18n | Complete | task-09 | [Link](./admin/README.md) |

### Stage 03: Shorts & Payments

| Feature | Status | Tasks | Documentation |
|---------|--------|-------|---------------|
| Shorts Upload | Complete | task-02, 03 | [Link](./shorts/upload.md) |
| Video Processing | Complete | task-04 | [Link](./shorts/publishing.md) |
| Payment System | Complete | task-05 | [Link](./payments/checkout.md) |
| Shorts Management | Complete | task-06 | [Link](./shorts/management.md) |
| Lifecycle & Public | Complete | task-07 | [Link](./shorts/public-view.md) |

### Stage 04: Feed & Discovery

| Feature | Status | Tasks | Documentation |
|---------|--------|-------|---------------|
| Database Setup | Complete | task-01 | [Link](./feed/overview.md) |
| Feed API | Complete | task-02 | [Link](./feed/overview.md) |
| Feed Components | Complete | task-03 | [Link](./feed/overview.md) |
| Filter Components | Complete | task-04 | [Link](./feed/filtering.md) |
| Search API | Complete | task-05 | [Link](./feed/search.md) |
| Search Components | Complete | task-06 | [Link](./feed/search.md) |
| Translations | Complete | task-07 | [Link](./feed/overview.md) |
| Short Detail Page | Complete | task-08 | [Link](./shorts/public-view.md) |

---

## Planned Features

### Stage 05: Social Features
- Likes and comments
- Follow system
- Notifications
- Sharing

### Stage 06: Analytics & Advanced
- Company analytics dashboard
- View/engagement statistics
- Conversion tracking
- Moderation tools

---

**Last Updated:** 2026-01-11
**Generator:** exec-doc-generator (AI Spec Flow)
