# Changelog

All notable changes to the VideoShorts project.

---

## [Unreleased]

---

## [0.4.0] - 2026-01-03

### Added - Stage 04: Feed & Discovery

**Overview:**
Complete public feed and discovery system with algorithmic sorting, full-text search, location-based filtering, and short detail pages. 8 tasks completed with 361 new tests (1,422 cumulative for stage, 100% passing).

### Features

**Feed System:**
- Public shorts feed with infinite scroll
- Algorithmic feed scoring (engagement + freshness + distance)
- Multiple sort options (For You, Newest, Popular, Trending, Following)
- Cursor-based pagination for stable scrolling
- Responsive grid layout (1-5 columns)
- Loading skeletons and empty states

**Feed Filtering:**
- Category multi-select filter (max 5)
- Location-based filtering with radius options (1-50 km)
- "Detect location" with browser Geolocation API
- Verified companies toggle
- URL state sync for shareable filter views

**Search System:**
- Full-text search with PostgreSQL `tsvector`
- Fuzzy matching with `pg_trgm` extension
- Polish language dictionary support
- Search results for shorts and companies
- Type filtering (All/Shorts/Companies)
- Relevance-based ranking

**Autocomplete:**
- Command-based search bar (Ctrl+K shortcut)
- Debounced suggestions (300ms)
- Recent searches (localStorage, client-side only)
- Popular searches from tags
- Short suggestions with thumbnails
- Company suggestions with logos

**Short Detail Page:**
- Public short viewing at `/shorts/[id]`
- Video player with custom controls
- Play/pause, mute, progress bar, fullscreen
- Auto-play on page load (muted)
- View count increment
- Company info card
- Related shorts section
- CTA button with external link
- Tags linking to search
- SEO metadata (OpenGraph, Twitter cards)

**Internationalization:**
- ~600 new translation keys
- feed.json namespace (sort, filters, empty states, cards)
- search.json namespace (bar, suggestions, tabs, results)
- All 6 languages: pl, en, de, es, ru, uk
- Proper diacritics for Polish, German, Spanish
- Cyrillic for Russian and Ukrainian

### Database Changes

**Indexes Created:**
- `Short_status_categoryId_publishedAt_idx` - Feed query optimization
- `Short_latitude_longitude_idx` - Geo filtering
- `Short_title_trgm_idx` - Fuzzy search
- `CompanyProfile_companyName_trgm_idx` - Company search

**PostgreSQL Extensions:**
- `pg_trgm` - Trigram similarity for fuzzy matching

**Utility Functions:**
- `haversineDistance()` - Calculate distance between coordinates
- `calculateFeedScore()` - Algorithmic feed scoring
- `getTimeDecay()` - Time-based relevance decay

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/feed` | GET | Paginated feed with filters |
| `/api/search` | GET | Full-text search results |
| `/api/search/suggestions` | GET | Autocomplete suggestions |

### Server Actions

| Action | File | Purpose |
|--------|------|---------|
| `getPublicShort` | `src/app/actions/shorts/get-public.ts` | Fetch public short with related |

### Components Created (14)

**Feed Components:**
- `FeedGrid` - Responsive grid layout
- `FeedCard` - Short thumbnail card
- `FeedSkeleton` - Loading placeholder
- `FeedGridSkeleton` - Grid loading state
- `EmptyState` - No results display

**Filter Components:**
- `CategoryFilter` - Category multi-select
- `DistanceFilter` - Location radius picker
- `SortSelect` - Sort dropdown
- `FilterPanel` - Combined filter panel

**Search Components:**
- `SearchBar` - Command-based search
- `SearchSuggestions` - Autocomplete dropdown
- `SearchResults` - Results grid
- `SearchTabs` - Type filter tabs

**Detail Components:**
- `ShortDetailView` - Full video player view

### Pages

| Route | File | Purpose |
|-------|------|---------|
| `/[locale]` | `src/app/(main)/[locale]/page.tsx` | Home feed |
| `/[locale]/search` | `src/app/(main)/[locale]/search/page.tsx` | Search results |
| `/[locale]/shorts/[id]` | `src/app/(main)/[locale]/shorts/[id]/page.tsx` | Short detail |

### Custom Hooks

- `useDebounce` - Debounce values
- `useIntersectionObserver` - Infinite scroll trigger
- `useFeedFilters` - URL state sync

### Testing

**Statistics:**
- New tests: 361
- Stage cumulative: 1,422
- Pass rate: 100%
- Test files: 31

**Test Coverage:**
| Area | Tests |
|------|-------|
| Haversine utility | 12 |
| Feed scoring | 18 |
| Feed API | 45 |
| Feed components | 67 |
| Filter components | 52 |
| Search API | 38 |
| Search components | 61 |
| Short detail | 44 |
| Translations | 24 |

### Architecture Decisions

**AD-1: PostgreSQL Full-Text Search**
- Use native PostgreSQL search instead of external service
- Polish dictionary support
- Trigram fuzzy matching for typos

**AD-2: Cursor-Based Pagination**
- Stable results during infinite scroll
- Combines timestamp + ID for uniqueness
- Better than offset for real-time data

**AD-3: Client-Side Recent Searches**
- Privacy-first approach (no server storage)
- localStorage for persistence
- Works for anonymous users

**AD-4: URL State Synchronization**
- Shareable filter configurations
- Browser back/forward support
- Deep linking capability

### Tasks Completed

| Task | Name | Files | Tests |
|------|------|-------|-------|
| task-01 | Database Setup | 2 | 30 |
| task-02 | Feed API | 5 | 45 |
| task-03 | Core Feed Components | 6 | 67 |
| task-04 | Filter Components | 4 | 52 |
| task-05 | Search API | 3 | 38 |
| task-06 | Search Components | 5 | 61 |
| task-07 | Translations & i18n | 12 | 24 |
| task-08 | Short Detail Page | 3 | 44 |

### Key Commits

```
097ca0e - feat(task-01): add database indexes and feed utilities
5155d10 - feat(task-02): implement feed API with filtering and sorting
3d491ee - feat(task-03): implement core feed components with infinite scroll
a0562de - feat(task-04): implement filter components with URL state sync
6ed927d - feat(task-05): implement search API with full-text search
bf566cd - feat(task-06): implement search components with autocomplete
301c29c - feat(task-07): complete translations for feed and search
831f63e - feat(task-08): implement short detail page
358c601 - chore: update progress.json for task-06 testing complete - Stage 4 COMPLETE
```

### Breaking Changes

None (backward compatible with Stage 01 + 02 + 03)

### Known Issues

**Resolved:**
- Polish diacritics in translations (fixed in iteration v2)
- i18n namespace registration (fixed in iteration v2)
- Accessibility issues in search (fixed in iteration v2)

**Remaining:**
- Rate limiting recommended for search API
- Consider caching for popular feed queries
- Search result highlighting not implemented

---

## [0.3.0] - 2026-01-01

### Added - Stage 03: Shorts Upload + Payments

**Overview:**
Complete video shorts system with upload wizard, Qencode transcoding, multi-provider payments, publication credits, and 30-day lifecycle management. 7 tasks completed with 1633 new tests (3009 cumulative, 100% passing).

### Features

**Video Upload:**
- Multi-step upload wizard (Video -> Metadata -> Thumbnail -> Review)
- Drag & drop video upload with progress bar
- Direct-to-R2 upload using presigned URLs
- Client-side video validation (format, size, duration)
- Aspect ratio detection with 9:16 recommendation
- Tags autocomplete with API search
- Custom thumbnail upload option

**Video Processing:**
- Qencode integration for HLS transcoding
- Adaptive bitrate streaming (1080p/720p/480p)
- Auto-generated thumbnails
- Processing status tracking with timeline
- Background jobs via Inngest
- Raw video cleanup after transcoding

**Payments & Credits:**
- Publication credits system (1 credit = 1 publication)
- Multi-provider payments (Przelewy24 primary, Tpay fallback)
- Credit packages with bulk discounts (1, 5, 20, 50)
- Credit transaction history
- Webhook-based payment confirmation
- Automatic credit refund on transcoding failure

**Shorts Management:**
- Shorts dashboard with table/grid views
- Status filtering (Draft, Published, Archived)
- Search functionality
- Edit metadata (title, description, tags, CTA)
- Archive published shorts
- Delete draft shorts
- Duplicate shorts as new drafts

**Public Viewing:**
- Public short pages at `/shorts/[id]`
- HLS video player (@vidstack/react)
- Company info card with profile link
- CTA button with click tracking
- Location map display
- Share functionality
- SEO optimization (meta tags, OpenGraph, structured data)

**Lifecycle Management:**
- 30-day publication period
- Auto-archive via daily cron job
- 7-day expiry reminder emails
- Renewal flow for archived shorts
- Direct link access for archived content

### Database Models

**New Tables:**
- `Short` - Video short entity (25 fields)
- `ShortStats` - View and engagement tracking
- `Tag` - Reusable content tags
- `ShortTag` - Many-to-many junction
- `Payment` - Payment transaction records
- `CreditTransaction` - Credit audit trail

**Enums Added:**
- `ShortStatus` - DRAFT, PENDING_PAYMENT, PROCESSING, PUBLISHED, ARCHIVED, DELETED
- `PaymentProvider` - PRZELEWY24, TPAY, OTHER
- `PaymentStatus` - PENDING, SUCCEEDED, FAILED, REFUNDED
- `CreditSource` - PACKAGE, GIFT, PROMO, REFUND, ADMIN, PUBLICATION, OTHER

**User Model Changes:**
- Added `publicationCredits` field (Int, default 0)

### API & Server Actions

**Shorts Actions (7):**
- `createShortAction` - Create draft with video
- `updateShortMetadataAction` - Update title/description/tags
- `publishShortAction` - Initiate publication (credits or payment)
- `archiveShortAction` - Archive published short
- `deleteShortAction` - Delete draft
- `duplicateShortAction` - Duplicate as new draft
- `renewShortAction` - Renew archived short

**API Routes (13):**
- `POST /api/shorts/upload-url` - Video upload presigned URL
- `POST /api/shorts/thumbnail-url` - Thumbnail upload URL
- `GET /api/shorts` - List shorts
- `GET/PATCH/DELETE /api/shorts/[id]` - CRUD single short
- `GET /api/shorts/[id]/status` - Processing status
- `POST /api/shorts/[id]/track` - Stats tracking
- `GET /api/tags/search` - Tag autocomplete
- `POST /api/payments/checkout` - Create payment session
- `GET /api/payments/status/[id]` - Check payment status
- `GET /api/credits` - Credits balance and history

**Webhooks (3):**
- `POST /api/webhooks/qencode` - Transcoding callbacks
- `POST /api/webhooks/przelewy24` - Payment confirmation
- `POST /api/webhooks/tpay` - Payment confirmation

### Components

**Shorts Components (23):**
- VideoDropzone, VideoPreview, ShortMetadataForm
- TagsAutocomplete, ThumbnailSelector, StepIndicator
- VideoUploadWizard, ShortPlayer, ProcessingStatusTimeline
- PublishDialog, ShortsTable, ShortsFilters, ShortCard
- EditShortDialog, ArchiveDialog, DeleteDialog, RenewDialog
- PublicShortView, ShortCompanyCard, ShortCtaButton
- ShortLocationMap, ShortShareButton, ShortsManagement

**Payment Components (5):**
- PaymentForm, CreditsDisplay, CreditsHistory
- CreditsPurchaseModal, CreditsManagement

### Background Jobs

**Inngest Functions (4):**
- `startTranscoding` - Trigger: shorts/transcode.started
- `cleanupRawVideo` - Trigger: shorts/transcode.completed
- `archiveExpiredShorts` - Cron: 0 3 * * * (daily 3 AM)
- `sendExpiryReminders` - Cron: 0 9 * * * (daily 9 AM)

### Pages

**Protected (COMPANY role):**
- `/panel/shorts` - Shorts dashboard
- `/panel/shorts/new` - Upload wizard
- `/panel/shorts/[id]` - Short detail
- `/panel/shorts/[id]/publishing` - Processing status
- `/panel/credits` - Credits management

**Public:**
- `/shorts/[id]` - Public short view

### Translations

**New Namespaces (2):**
- `shorts.json` - ~200 keys (wizard, status, actions, errors)
- `payments.json` - ~100 keys (credits, packages, checkout)

**Total:** ~400 new translations (6 languages: pl, en, de, es, ru, uk)

### External Service Integrations

| Service | Purpose |
|---------|---------|
| Cloudflare R2 | Video storage (raw + HLS buckets) |
| Qencode | Video transcoding to HLS |
| Przelewy24 | Payment provider (primary) |
| Tpay | Payment provider (fallback) |
| Inngest | Background job execution |
| @vidstack/react | HLS video player |

### Testing

**Statistics:**
- New tests: 1633
- Cumulative tests: 3009
- Pass rate: 100%
- Test files: 81
- Coverage: ~95%

**Test Categories:**
- Server actions: 7 suites
- API routes: 13 suites
- Components: 28 suites
- Webhooks: 3 suites
- Inngest functions: 4 suites

### Architecture Decisions

**AD-1: Serverless Video Pipeline (R2 + Qencode)**
- Direct browser-to-R2 upload via presigned URLs
- Pay-per-use transcoding with Qencode
- HLS adaptive streaming for optimal playback

**AD-2: Multi-Provider Payment Gateway**
- Przelewy24 (primary) + Tpay (fallback)
- Provider abstraction layer
- Webhook-based confirmation

**AD-3: Credit-Based Publication**
- Prepaid credits model
- Bulk purchase discounts
- Full transaction audit trail

**AD-4: 30-Day Lifecycle**
- Auto-archive after expiry
- Renewal option for continued visibility
- Archived content accessible via direct link

### Commits

```
e67407d - feat(task-01): add shorts and payments database schema
55e36e3 - feat(task-02): add R2 video module and upload APIs
3c2ea42 - feat(task-03): add upload wizard UI and create short action
77bc3fa - feat(task-04): add Qencode integration and Inngest jobs
b7b6583 - feat(task-05): add payment providers and credits system
bb760e0 - feat(task-06): add shorts management UI and CRUD actions
3baa784 - feat(task-07): add lifecycle management and public view
d2cd54b - test(task-07): comprehensive test suite for lifecycle
```

### Known Issues

**Resolved:**
- All test failures fixed during iterations
- i18n translations completed for all 6 locales

**Remaining:**
- Rate limiting for public tracking endpoint (recommended)
- OpenGraph image caching configuration

### Breaking Changes

None (backward compatible with Stage 01 + 02)

---

## [0.2.0] - 2025-12-16

### Added - Stage 02: Companies + Verification

**Overview:**
Complete company profiles system with VAT verification, public pages, and admin panel. 12 tasks completed with 1217 tests (99% passing).

### Features

**Company System:**
- Company account upgrade flow (USER → COMPANY)
- VIES VAT verification integration (EU API)
- Public company profiles at `/firma/[slug]`
- Company profile editing with logo/banner upload
- Subcategory selection (max 3)
- Business hours editor (7-day picker)
- Geolocation support (latitude/longitude)

**Admin Panel:**
- Admin dashboard foundation
- Companies management (list, filter, search, status update)
- Categories management (hierarchical CRUD)
- Audit log tracking (all admin actions)

**Categories:**
- Hierarchical category system (2 levels max)
- Multi-language support (5 languages)
- Icon support (Lucide React)
- Slug-based routing

### Database Models

**New Tables:**
- `CompanyProfile` - Company data (21 fields)
- `Category` - Hierarchical categories with i18n names
- `AuditLog` - Admin action tracking

**Fields Added:**
- CompanyProfile.subcategoryIds (Array, task-11)
- CompanyProfile.businessHours (JSON, task-12)

### API & Server Actions

**Companies Module (4 actions):**
- `upgrade` - USER → COMPANY conversion with VIES
- `update` - Profile updates
- `uploadLogo` - Logo presigned URL (R2)
- `uploadBanner` - Banner presigned URL (R2)

**Admin Companies (2 actions):**
- `listCompanies` - Pagination + filters
- `updateCompanyStatus` - Status changes + audit log

**Admin Categories (4 actions):**
- `listCategories` - Hierarchical tree
- `createCategory` - Main/sub category creation
- `updateCategory` - Name + icon updates
- `deleteCategory` - With validation

**API Routes (1 new):**
- `POST /api/vies` - VAT verification endpoint
  - Rate limiting: 10 req/min per user
  - Retry logic: 3x exponential backoff
  - Timeout: 10s

### Components

**Companies (8 components):**
- UpgradeForm, CompanyProfileDisplay, CompanyProfileEditForm
- SubcategoryPicker, BusinessHoursPicker
- LogoUpload, BannerUpload, ViesStatusBadge

**Admin (8 components):**
- AdminLayout, AdminSidebar
- CompaniesTable, CompanyStatusBadge
- CategoriesManager, CategoryFormDialog
- CategoryTreeItem, DeleteCategoryDialog

### Pages

**Public:**
- `/firma/[slug]` - SEO-optimized company profiles

**Protected (COMPANY):**
- `/panel/firma` - Company dashboard
- `/panel/firma/edit` - Profile editor

**Admin (ADMIN only):**
- `/admin` - Dashboard
- `/admin/companies` - Companies management
- `/admin/categories` - Categories management

### Translations

**New Namespaces (4):**
- `companies.json` - 87 keys (upgrade, profile, validation)
- `admin.json` - 53 keys (panel, management)
- `categories.json` - 41 keys (CRUD, hierarchy)
- `errors.json` - 28 keys (VIES, validation)

**Total:** ~1100 new translations (5 languages)

### Testing

**Statistics:**
- Total tests: 1217 (1204 passing, 99%)
- Test suites: 53 (50 passing, 94%)
- Coverage: ~95%
- New tests: 862 (main tasks) + 342 (follow-ups)

**Test Improvements:**
- Fixed Next.js module resolution in Vitest (task-10)
- Comprehensive component tests (RTL patterns)
- Server action tests (happy + error paths)
- VIES API mocking and retry logic tests

### Architecture Decisions

**AD-1:** VIES API Integration
- SOAP API with retry logic (3x exponential backoff)
- Negative caching (5 min) for failed requests
- Timeout: 10s

**AD-2:** Hierarchical Categories (Max 2 Levels)
- Parent → Child structure only
- Simpler UI/UX and faster queries

**AD-3:** subcategoryIds as Array
- Max 3 limit justifies array over junction table
- Simpler queries, no JOIN needed

**AD-4:** businessHours as JSON
- Fixed 7-day structure
- Always queried together
- Simpler than separate table

**AD-5:** Audit Log (No UI in Stage 02)
- Foundation for compliance
- UI planned for Stage 03+

### Challenges & Solutions

**Challenge 1: VIES API Instability**
- Problem: Frequent timeouts (>30s)
- Solution: Retry logic + 10s timeout + negative cache

**Challenge 2: Next.js Module Resolution**
- Problem: `Cannot find module 'next/server'` in tests
- Solution: Vitest alias + mock (task-10)

**Challenge 3: Partial Implementations**
- Problem: DB fields without UI (subcategoryIds, businessHours)
- Solution: Follow-up tasks (task-11, task-12)

**Challenge 4: Slug Collisions**
- Problem: Case-insensitive duplicates
- Solution: Unique constraint + pre-create validation

### Tasks Completed

| Task | Name | Files | Tests | Status |
|------|------|-------|-------|--------|
| task-01 | Database Schema & Infrastructure | 8 | 53 | ✅ |
| task-02 | VIES Integration & Utilities | 6 | 115 | ✅ |
| task-03 | Company Upgrade Flow | 12 | 66 | ✅ |
| task-04 | Public Company Profile | 10 | 101 | ✅ |
| task-05 | Company Profile Edit | 15 | 126 | ✅ |
| task-06 | Admin Panel Foundation | 11 | 35 | ✅ |
| task-07 | Admin Companies Management | 9 | 74 | ✅ |
| task-08 | Admin Categories Management | 10 | 145 | ✅ |
| task-09 | Navigation & Translations | 18 | 72 | ✅ |
| task-10 | Fix Test Environment Issue | 3 | 75 | ✅ |
| task-11 | Implement SubcategoryPicker | 8 | - | ✅ |
| task-12 | Implement BusinessHoursPicker | 9 | - | ✅ |

### Key Commits

```
e95aef8 - feat(task-01): database schema for Stage 02
5a7455d - feat(task-02): VIES integration and utilities
6a51117 - fix(task-03): remove contactEmail field (schema sync)
b9638b9 - fix(task-04): URL sanitization and security
b1f5a30 - feat(task-05): company profile edit
cd1fc5a - feat(task-06): admin panel foundation
41de91c - fix(task-07): input validation and checks
620ec9d - fix(task-08): missing i18n translations
63f68f4 - feat(task-09): navigation and translations
3e95d9b - fix(task-10): next/server module in tests
0cacd25 - feat(task-11): SubcategoryPicker component
1921476 - feat(task-12): BusinessHoursPicker component
```

### Documentation

**New Documentation:**
- Features: Companies, Admin Panel
- API: Companies actions, Admin actions, VIES route
- Database: CompanyProfile, Category, AuditLog models
- Stage Summary: Comprehensive Stage 02 overview
- Components: Companies and Admin components

**Coverage:** 0% → 100% (full documentation)

### Performance Optimizations

**Database Indexes:**
- CompanyProfile: userId, nip, viesVerified, location (composite)
- Category: slug (unique), parentId
- AuditLog: adminId, targetType+targetId, createdAt

**Query Optimizations:**
- Server-side pagination (limit 20)
- Single-query category tree building (O(n))
- Geo queries ready (latitude/longitude composite index)

### Migration Files

```sql
-- 2025-12-15: Initial schema (task-01)
CREATE TABLE CompanyProfile, Category, AuditLog

-- 2025-12-16: Array fields (task-11, task-12)
ALTER TABLE CompanyProfile
  ADD COLUMN subcategoryIds TEXT[],
  ADD COLUMN businessHours JSONB;
```

### Breaking Changes

None (backward compatible with Stage 01)

### Known Issues

**Resolved:**
- ✅ Test environment (task-10 fixed)
- ✅ Partial implementations (task-11, task-12 completed)

**Remaining:**
- ⚠️ 11 E2E tests skipped (Playwright setup needed)
- ⚠️ 2 VIES timeout tests occasionally fail (API instability)

### Deprecations

None

### Security

- Role-based access control (ADMIN vs COMPANY vs USER)
- Input validation (Zod schemas)
- URL sanitization (XSS prevention)
- Rate limiting (VIES API: 10 req/min)
- Audit logging (all admin actions tracked)

---

## [0.1.0] - 2025-11-29

### Added - Avatar Upload Enhancements (Task-08)

**Profile Features:**
- Avatar cropping with react-image-crop library
- Circular crop preview with 1:1 aspect ratio
- Avatar deletion with confirmation
- Automatic cleanup of old avatars from R2 storage
- File validation (type, size up to 5MB)
- Loading states for upload and delete operations

**Implementation:**
- `deleteAvatarAction` server action for avatar deletion
- `deleteObject` utility function in R2 library
- DELETE endpoint in avatar API route
- Enhanced AvatarUpload component with cropping modal
- Translation updates for 5 languages (pl, en, de, es, ru)

**Testing:**
- Comprehensive test suite: 36 tests (23 component, 13 server action)
- Coverage: cropping flow, deletion, file validation, error handling
- 6 tests skipped due to jsdom canvas/blob limitations

**Commits:**
- d5e0f84: feat(task-08): implement avatar cropping and deletion
- 6455b92: fix(auth): wrap Prisma calls in try-catch for Edge Runtime
- 267baac: test(task-08): comprehensive test suite
- ef92cfd: test(task-08): fix avatar upload and delete-avatar test suites

---

### Added - Layout & Navigation (Task-07)

**UI Components:**
- AppSidebar with navigation links
- UserMenu dropdown with profile and settings
- Footer with links and locale switcher
- MobileDrawer for mobile navigation
- ErrorBoundary for error handling

**Testing:**
- 92 tests covering all layout components
- All tests passing

**Commits:**
- 50a4987: feat(task-07): implement layout and navigation
- 2f09304: test(task-07): comprehensive test suite

---

### Added - Theme & Preferences (Task-06)

**Features:**
- ThemeToggle component with dark mode support
- LocaleSwitcher for language selection
- PreferencesForm for user preferences
- ThemeProvider with next-themes integration

**Testing:**
- 73 tests covering theme and preferences
- All tests passing

**Commits:**
- 09701f5: fix(task-06): add i18n for saving state
- b358c01: test(task-06): comprehensive test suite

---

### Added - Settings & Account (Task-05)

**Features:**
- Change password functionality
- Account deletion with soft delete
- Security settings page
- GDPR compliance

**Testing:**
- 78 tests (33 server actions, 45 components)
- All tests passing

**Commits:**
- 0ef0a29: fix(task-05): correct i18n translation paths
- 9d237a2: test(task-05): comprehensive test suite

---

### Added - Profile Management (Task-04)

**Features:**
- User profile CRUD operations
- Avatar upload to Cloudflare R2
- Profile form with validation
- Profile display component

**Testing:**
- 74 tests (19 server actions, 55 components)
- 4 edge cases skipped (jsdom limitations)

**Commits:**
- 90312a0: feat(task-04): implement profile management
- 0eec894: test(task-04): comprehensive test suite

---

### Added - Authentication Flow (Task-03)

**Features:**
- Email/password authentication
- OAuth integration (Google, Facebook)
- Email verification
- Password reset flow
- Session management

**Testing:**
- 175 tests (59 server actions, 116 components)
- 6 edge cases skipped
- 94% coverage

**Commits:**
- 017e016: feat(task-03): add React email templates
- 8c9e5f5: test(task-03): authentication flow tests

---

### Added - Core Infrastructure (Task-02)

**Database:**
- Prisma schema with User, Account, Session, VerificationToken, UserProfile models
- Database migrations
- Prisma client setup

**Commits:**
- 7c1cfc0: feat(task-02): implement core infrastructure

---

### Added - Project Setup (Task-01)

**Initial Setup:**
- Next.js 14+ with App Router
- TypeScript configuration
- Tailwind CSS + shadcn/ui
- Prisma ORM setup
- Testing infrastructure (Vitest + React Testing Library)
- i18n setup (next-intl)

**Commits:**
- fc1b35f: fix(task-01): update packages for React 19 compatibility
- d8d0b24: chore(task-01): update package-lock.json

---

## Database Changes

### Models Added (Task-01 - Task-04)

| Model              | Purpose                    | Key Fields                       |
|--------------------|----------------------------|----------------------------------|
| User               | Core user entity           | email, passwordHash, role        |
| Account            | OAuth provider accounts    | provider, providerAccountId      |
| Session            | User sessions              | sessionToken, userId, expires    |
| VerificationToken  | Email verification tokens  | identifier, token, expires       |
| UserProfile        | Extended user data         | displayName, avatar, bio         |

---

## API Changes

### Server Actions Added

| Action              | File                                         | Purpose                  |
|---------------------|----------------------------------------------|--------------------------|
| signIn              | src/app/actions/auth/sign-in.ts              | User authentication      |
| signUp              | src/app/actions/auth/sign-up.ts              | User registration        |
| signOut             | src/app/actions/auth/sign-out.ts             | Session termination      |
| verifyEmail         | src/app/actions/auth/verify-email.ts         | Email verification       |
| resetPassword       | src/app/actions/auth/reset-password.ts       | Password reset           |
| updateProfile       | src/app/actions/profile/update-profile.ts    | Profile updates          |
| deleteAvatar        | src/app/actions/profile/delete-avatar.ts     | Avatar deletion          |
| changePassword      | src/app/actions/settings/change-password.ts  | Password change          |
| deleteAccount       | src/app/actions/settings/delete-account.ts   | Account deletion         |

---

## Breaking Changes

None (initial release)

---

## Known Issues

### jsdom Limitations
- Canvas/Blob API not fully supported in test environment
- 13 tests skipped due to these limitations
- Core functionality fully tested, only upload flow simulation skipped

---

**Maintained by:** AI Spec Flow Documentation Generator
**Last Updated:** 2025-11-29
