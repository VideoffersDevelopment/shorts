# Code Analysis: VideoShorts Stage 02 - Companies + Verification

**Project:** videoshorts-stage-02-companies
**Date:** 2025-12-15
**Iteration:** v1

---

## 1. Component Inventory

### 1.1 Existing Stage 01 Components - Reusable for Stage 02

| Component | Path | Status | Reusable for Stage 02? | Notes |
|-----------|------|--------|------------------------|-------|
| **Button** | `src/components/ui/button.tsx` | ✅ EXISTS | ✅ YES | Standard button - reusable for all forms |
| **Input** | `src/components/ui/input.tsx` | ✅ EXISTS | ✅ YES | Text inputs for company name, NIP, address |
| **Textarea** | `src/components/ui/textarea.tsx` | ✅ EXISTS | ✅ YES | Company description (markdown) |
| **Label** | `src/components/ui/label.tsx` | ✅ EXISTS | ✅ YES | Form labels |
| **Card** | `src/components/ui/card.tsx` | ✅ EXISTS | ✅ YES | Company profile cards, admin panels |
| **Alert** | `src/components/ui/alert.tsx` | ✅ EXISTS | ✅ YES | Verification status messages |
| **Dialog** | `src/components/ui/dialog.tsx` | ✅ EXISTS | ✅ YES | Crop tools for logo/banner, admin actions |
| **Avatar** | `src/components/ui/avatar.tsx` | ✅ EXISTS | ✅ YES | Company logo display (circular) |
| **Dropdown Menu** | `src/components/ui/dropdown-menu.tsx` | ✅ EXISTS | ✅ YES | Category picker, admin actions |
| **Separator** | `src/components/ui/separator.tsx` | ✅ EXISTS | ✅ YES | Section dividers |
| **Sheet** | `src/components/ui/sheet.tsx` | ✅ EXISTS | ✅ YES | Mobile admin panel |
| **Loading Spinner** | `src/components/shared/loading-spinner.tsx` | ✅ EXISTS | ✅ YES | Upload states, VIES verification |
| **Error Boundary** | `src/components/shared/error-boundary.tsx` | ✅ EXISTS | ✅ YES | Error handling |
| **Locale Switcher** | `src/components/shared/locale-switcher.tsx` | ✅ EXISTS | ✅ YES | Language switching (5 langs) |
| **Theme Toggle** | `src/components/theme/theme-toggle.tsx` | ✅ EXISTS | ✅ YES | Dark mode |
| **App Sidebar** | `src/components/layout/app-sidebar.tsx` | ✅ EXISTS | ⚠️ EXTEND | Needs company/admin menu items |
| **Header** | `src/components/layout/header.tsx` | ✅ EXISTS | ✅ YES | Top navigation |
| **Footer** | `src/components/layout/footer.tsx` | ✅ EXISTS | ✅ YES | Footer links |
| **User Menu** | `src/components/layout/user-menu.tsx` | ✅ EXISTS | ⚠️ EXTEND | Add "Upgrade to Company" link |
| **Mobile Drawer** | `src/components/layout/mobile-drawer.tsx` | ✅ EXISTS | ⚠️ EXTEND | Mobile navigation for admin |
| **Avatar Upload** | `src/components/profile/avatar-upload.tsx` | ✅ EXISTS | ✅ YES | Pattern reusable for logo/banner upload |

### 1.2 Components to CREATE for Stage 02

| Component | Purpose | Base Pattern | Priority |
|-----------|---------|--------------|----------|
| **CompanyUpgradeForm** | Upgrade USER → COMPANY | `profile-form.tsx` | P0 |
| **CompanyProfileForm** | Edit company profile | `profile-form.tsx` | P0 |
| **LogoUpload** | Logo upload with crop | `avatar-upload.tsx` | P0 |
| **BannerUpload** | Banner upload with crop | `avatar-upload.tsx` | P0 |
| **CategoryPicker** | Hierarchical dropdown | `dropdown-menu.tsx` | P0 |
| **MarkdownEditor** | Description editor with preview | NEW (with Textarea) | P0 |
| **VIESStatusBadge** | Verification status display | `alert.tsx` | P0 |
| **CompanyProfileCard** | Public profile display | `card.tsx` | P0 |
| **AdminSidebar** | Admin navigation | `app-sidebar.tsx` | P0 |
| **CompaniesDataTable** | Admin company list | NEW (with table primitives) | P0 |
| **CategoriesTreeView** | Category management | NEW (drag-drop) | P0 |
| **AuditLogViewer** | Admin action history | NEW | P1 |

---

## 2. API Inventory

### 2.1 Existing Stage 01 Endpoints - Pattern Analysis

| Endpoint | Path | Status | Response Format | Pattern |
|----------|------|--------|-----------------|---------|
| **Avatar Upload** | `src/app/api/users/me/avatar/route.ts` | ✅ EXISTS | `{uploadUrl, publicUrl}` | R2 presigned URL pattern |
| **Auth Routes** | `src/app/api/auth/[...nextauth]/route.ts` | ✅ EXISTS | NextAuth handlers | NextAuth.js v5 |

**Pattern Identified:**
```typescript
// API Route Pattern from avatar upload
export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2. Validate input
  const body = await req.json()

  // 3. Business logic (R2 presigned URL)
  const uploadUrl = await getUploadUrl({ key, contentType })

  // 4. Return response
  return NextResponse.json({ uploadUrl, publicUrl })
}
```

### 2.2 Server Actions Pattern (Stage 01)

| Action | Path | Status | Pattern |
|--------|------|--------|---------|
| **Update Profile** | `src/app/actions/profile/update.ts` | ✅ EXISTS | Auth → Validate → Upsert → Revalidate |
| **Delete Avatar** | `src/app/actions/profile/delete-avatar.ts` | ✅ EXISTS | Auth → Delete R2 → Update DB |
| **Change Password** | `src/app/actions/profile/change-password.ts` | ✅ EXISTS | Auth → Validate → Bcrypt → Update |

**Server Action Pattern:**
```typescript
// Pattern from update-profile action
export async function updateProfileAction(data: unknown) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  // 2. Zod validation
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  // 3. Database operation
  await prisma.userProfile.upsert({ where: { userId }, create: {...}, update: {...} })

  // 4. Revalidate cache
  revalidatePath('/panel/profile')

  // 5. Return result
  return { success: true }
}
```

### 2.3 APIs to CREATE for Stage 02

#### Company Endpoints (Server Actions - Preferred)

| Action | Path (new) | Pattern Base | Purpose |
|--------|------------|--------------|---------|
| **upgradeToCompany** | `src/app/actions/companies/upgrade.ts` | `update.ts` | Create CompanyProfile + VIES check |
| **updateCompanyProfile** | `src/app/actions/companies/update.ts` | `update.ts` | Update company data |
| **uploadCompanyLogo** | `src/app/actions/companies/upload-logo.ts` | `delete-avatar.ts` | Logo upload to R2 |
| **uploadCompanyBanner** | `src/app/actions/companies/upload-banner.ts` | `delete-avatar.ts` | Banner upload to R2 |
| **requestViesVerification** | `src/app/actions/companies/verify-vies.ts` | NEW | Trigger VIES API check |

#### API Routes (for R2 presigned URLs)

| Endpoint | Path (new) | Pattern Base | Purpose |
|----------|------------|--------------|---------|
| **POST /api/companies/logo** | `src/app/api/companies/logo/route.ts` | `avatar/route.ts` | Get presigned URL for logo |
| **POST /api/companies/banner** | `src/app/api/companies/banner/route.ts` | `avatar/route.ts` | Get presigned URL for banner |
| **GET /api/companies/[slug]** | `src/app/api/companies/[slug]/route.ts` | NEW | Public company profile (SSR) |

#### Admin Endpoints (Server Actions)

| Action | Path (new) | Pattern Base | Purpose |
|--------|------------|--------------|---------|
| **verifyCompany** | `src/app/actions/admin/companies/verify.ts` | `update.ts` | Manual verification |
| **rejectCompany** | `src/app/actions/admin/companies/reject.ts` | `update.ts` | Reject verification |
| **createCategory** | `src/app/actions/admin/categories/create.ts` | `update.ts` | Create category |
| **updateCategory** | `src/app/actions/admin/categories/update.ts` | `update.ts` | Update category |
| **deleteCategory** | `src/app/actions/admin/categories/delete.ts` | `delete-account.ts` | Delete category (with checks) |
| **reorderCategories** | `src/app/actions/admin/categories/reorder.ts` | NEW | Bulk update order field |

#### External Service Integration

| Service | Client Path (new) | Purpose |
|---------|-------------------|---------|
| **VIES API** | `src/lib/vies.ts` | NIP verification (SOAP/REST) |

---

## 3. Database Analysis

### 3.1 Current Schema (Stage 01)

```prisma
// Existing models
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  role          Role      @default(USER)  // ✅ Already has Role enum
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile  UserProfile?
  accounts Account[]
  sessions Session[]
}

enum Role {
  USER
  COMPANY  // ✅ Already defined
  ADMIN    // ✅ Already defined
}

model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  displayName String?
  avatar      String?   // R2 URL pattern
  bio         String?   @db.Text
  location    String?
  latitude    Float?    // ✅ Geolocation already supported
  longitude   Float?
  preferences Json?
  darkMode    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([latitude, longitude])  // ✅ PostGIS index pattern exists
}
```

### 3.2 Validation Issues Found

| Issue | Location | Problem | Fix Required |
|-------|----------|---------|--------------|
| **CUID Consistency** | `schema.prisma:17` | User.id uses `@default(cuid())` | ✅ CORRECT - Use cuid() for new models |
| **No validation issues** | All schemas | Stage 01 uses consistent cuid() | ✅ Continue pattern |

**Note:** Architecture spec mentions uuid(), but Stage 01 implementation uses cuid(). Stage 02 should **continue using cuid()** for consistency.

### 3.3 Required Schema Changes for Stage 02

#### New Models to Add

```prisma
model CompanyProfile {
  id           String    @id @default(cuid())  // ✅ Use cuid() like Stage 01
  userId       String    @unique
  companyName  String
  slug         String    @unique              // SEO-friendly URL
  nip          String    @unique              // Polish VAT number
  viesVerified Boolean   @default(false)
  verifiedAt   DateTime?
  verifiedBy   String?                        // Admin userId if manual
  logo         String?                        // R2 URL (pattern from avatar)
  banner       String?                        // R2 URL
  description  String?   @db.Text            // Markdown
  categoryId   String?
  website      String?
  socialLinks  Json?                          // {facebook, instagram, tiktok}
  latitude     Float?                         // ✅ Reuse pattern from UserProfile
  longitude    Float?
  address      String?
  phone        String?
  businessHours Json?                         // {monday: {open, close}, ...}
  createdAt    DateTime  @default(now())     @db.Timestamptz
  updatedAt    DateTime  @updatedAt          @db.Timestamptz

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id])

  @@index([userId])
  @@index([slug])
  @@index([nip])
  @@index([categoryId])
  @@index([viesVerified])
  @@index([latitude, longitude])  // ✅ PostGIS index like UserProfile
}

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  icon      String?                     // SVG URL or Lucide icon name
  parentId  String?
  order     Int      @default(0)
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())   @db.Timestamptz
  updatedAt DateTime @updatedAt        @db.Timestamptz

  parent          Category?        @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[]       @relation("CategoryHierarchy")
  companyProfiles CompanyProfile[]

  @@index([slug])
  @@index([parentId])
  @@index([enabled])
  @@index([order])
}

model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String                     // "VERIFY_COMPANY", "REJECT_COMPANY", etc.
  targetType String                     // "USER", "COMPANY", "CATEGORY"
  targetId   String
  metadata   Json?                      // {reason, previousStatus, etc.}
  createdAt  DateTime @default(now())  @db.Timestamptz

  admin User @relation("AdminAuditLogs", fields: [adminId], references: [id])

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

#### Required User Model Extension

```prisma
model User {
  // ... existing fields ...

  // NEW relations for Stage 02
  companyProfile   CompanyProfile?
  adminAuditLogs   AuditLog[]      @relation("AdminAuditLogs")
}
```

### 3.4 Migration Strategy

**Migration type:** ADDITIVE ONLY

- ✅ No breaking changes to existing User/UserProfile
- ✅ All new tables are optional relations
- ✅ Safe to deploy alongside Stage 01

**Seed Data Required:**
- Categories (10-15 initial categories with hierarchical structure)
- First admin user (if not exists)

---

## 4. Routing Analysis

### 4.1 Existing Stage 01 Routes

| Route | File | Status | Layout |
|-------|------|--------|--------|
| **Panel Home** | `src/app/(main)/[locale]/panel/page.tsx` | ✅ EXISTS | `panel/layout.tsx` |
| **Profile** | `src/app/(main)/[locale]/panel/profile/page.tsx` | ✅ EXISTS | `panel/layout.tsx` |
| **Settings** | `src/app/(main)/[locale]/panel/settings/page.tsx` | ✅ EXISTS | `panel/layout.tsx` |
| **Preferences** | `src/app/(main)/[locale]/panel/preferences/page.tsx` | ✅ EXISTS | `panel/layout.tsx` |
| **Auth (Login)** | `src/app/(auth)/[locale]/login/page.tsx` | ✅ EXISTS | `(auth)/layout.tsx` |
| **Auth (Signup)** | `src/app/(auth)/[locale]/signup/page.tsx` | ✅ EXISTS | `(auth)/layout.tsx` |

**Pattern:**
- Group routes: `(main)`, `(auth)`
- Locale prefix: `[locale]` for i18n
- Shared layouts per group

### 4.2 Routes to CREATE for Stage 02

#### Company Routes (extend `(main)` group)

| Route | File (new) | Purpose | Access |
|-------|------------|---------|--------|
| **/companies/[slug]** | `src/app/(main)/[locale]/companies/[slug]/page.tsx` | Public company profile | Public |
| **/panel/company/profile** | `src/app/(main)/[locale]/panel/company/profile/page.tsx` | Edit company profile | COMPANY only |
| **/panel/company/settings** | `src/app/(main)/[locale]/panel/company/settings/page.tsx` | Company settings | COMPANY only |
| **/settings/upgrade** | `src/app/(main)/[locale]/settings/upgrade/page.tsx` | Upgrade to company form | USER only |

#### Admin Routes (new `(admin)` group)

| Route | File (new) | Purpose | Access |
|-------|------------|---------|--------|
| **/admin** | `src/app/(admin)/[locale]/admin/page.tsx` | Admin dashboard | ADMIN only |
| **/admin/companies** | `src/app/(admin)/[locale]/admin/companies/page.tsx` | Companies management | ADMIN only |
| **/admin/categories** | `src/app/(admin)/[locale]/admin/categories/page.tsx` | Category management | ADMIN only |
| **/admin/users** | `src/app/(admin)/[locale]/admin/users/page.tsx` | Users management | ADMIN only |
| **/admin/audit** | `src/app/(admin)/[locale]/admin/audit/page.tsx` | Audit log viewer | ADMIN only |

**New Layout:**
- `src/app/(admin)/[locale]/layout.tsx` - Admin layout with AdminSidebar

### 4.3 Middleware Authorization

**Extend existing middleware:**
```typescript
// src/middleware.ts (current pattern from auth)
export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  // NEW: Company routes protection
  if (req.nextUrl.pathname.includes('/panel/company')) {
    if (!token || token.role !== 'COMPANY') {
      return NextResponse.redirect(new URL('/settings/upgrade', req.url))
    }
  }

  // NEW: Admin routes protection
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
}
```

---

## 5. Frontend Patterns (from Stage 01)

### 5.1 Form Pattern (React Hook Form + Zod)

**Example: `profile-form.tsx`**

```typescript
// Pattern identified:
1. Client component with "use client"
2. useState for form fields + loading + error states
3. useCallback for handlers (optimization)
4. Zod validation in Server Action
5. useTranslations for i18n
6. shadcn/ui components (Card, Input, Button, Alert)
7. Success/Error feedback with auto-dismiss (3s)
```

**Reusable for Stage 02:**
- ✅ CompanyUpgradeForm (same pattern)
- ✅ CompanyProfileForm (same pattern)
- ✅ CategoryForm (admin - same pattern)

### 5.2 File Upload Pattern (with Crop)

**Example: `avatar-upload.tsx`**

```typescript
// Pattern identified:
1. react-image-crop for cropping
2. Presigned URL flow: POST /api/users/me/avatar → uploadUrl
3. Client-side validation (type, size)
4. Canvas API for crop → Blob
5. Direct upload to R2 (PUT uploadUrl with blob)
6. Callback to parent: onAvatarChange(publicUrl)
7. Delete old file before uploading new
8. Loading states + error handling
```

**Reusable for Stage 02:**
- ✅ LogoUpload (same pattern, different aspect ratio)
- ✅ BannerUpload (same pattern, 1920x400 aspect)

### 5.3 Navigation Pattern

**Example: `app-sidebar.tsx`**

```typescript
// Pattern identified:
1. Client component with locale prop
2. usePathname for active link detection
3. lucide-react icons
4. cn() utility for conditional classes
5. signOut() from next-auth/react
6. Mobile: hidden (use Sheet/Drawer)
```

**Extension for Stage 02:**
- Extend menuItems array based on user.role
- Add company menu items (if COMPANY)
- Add admin link (if ADMIN)

### 5.4 Translation Pattern

**Files:** `src/lib/locales/{pl,en,de,es,ru}/*.json`

**Pattern:**
```typescript
// Client: useTranslations hook
const { t } = useTranslations('profile')
t('title') // → "Profil" (pl)

// Server: getText function (from i18n/server.ts)
const { t } = await getText('profile', locale)
```

**Required Translation Files for Stage 02:**
- `companies.json` (5 languages)
- `admin.json` (5 languages)
- `categories.json` (5 languages)
- Extend `sidebar.json` with company/admin items

---

## 6. Backend Patterns (from Stage 01)

### 6.1 Server Action Pattern

**Template from `update.ts`:**

```typescript
"use server"

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { companySchema } from '@/lib/validation'  // Zod schema
import { revalidatePath } from 'next/cache'

export async function updateCompanyAction(data: unknown) {
  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  // 2. AUTHORIZATION (ownership check)
  const company = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })
  if (!company) return { error: "Not a company" }

  // 3. VALIDATION
  const parsed = companySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  // 4. DATABASE
  try {
    await prisma.companyProfile.update({
      where: { id: company.id },
      data: parsed.data
    })
  } catch (error) {
    console.error('Update error:', error)
    return { error: 'Failed to update' }
  }

  // 5. REVALIDATE
  revalidatePath(`/companies/${company.slug}`)

  // 6. RETURN
  return { success: true }
}
```

**Pattern Summary:**
1. Auth check (session)
2. Authorization check (ownership)
3. Zod validation
4. Database operation (Prisma)
5. Cache revalidation
6. Return result { success, error }

### 6.2 R2 Upload Pattern

**From `avatar/route.ts` + `r2.ts`:**

```typescript
// API Route: Generate presigned URL
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { contentType } = await req.json()

  const key = `companies/${session.user.id}/logo-${Date.now()}.jpg`
  const uploadUrl = await getUploadUrl({ key, contentType })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({ uploadUrl, publicUrl })
}

// Client: Upload blob
const response = await fetch('/api/companies/logo', {
  method: 'POST',
  body: JSON.stringify({ contentType: 'image/jpeg' })
})
const { uploadUrl, publicUrl } = await response.json()

await fetch(uploadUrl, {
  method: 'PUT',
  body: croppedBlob,
  headers: { 'Content-Type': 'image/jpeg' }
})

// Update DB with publicUrl via Server Action
await updateCompanyAction({ logo: publicUrl })
```

### 6.3 Auth Pattern (NextAuth.js)

**From `auth.ts`:**

```typescript
// Pattern:
- Providers: Google, Facebook, Credentials
- JWT strategy (stateless)
- PrismaAdapter for User/Account/Session sync
- Custom callbacks for role in session
- Email verification check in authorize()
```

**Extension for Stage 02:**
- Add `companyProfile` to session (in jwt callback)
- Fetch company data on login (like avatar fetch)

---

## 7. Gap Analysis

### 7.1 Components to Create

| Component | Base Pattern | Complexity | Priority |
|-----------|--------------|------------|----------|
| **CompanyUpgradeForm** | `profile-form.tsx` | Medium | P0 |
| **CompanyProfileForm** | `profile-form.tsx` | Medium | P0 |
| **LogoUpload** | `avatar-upload.tsx` | Low | P0 |
| **BannerUpload** | `avatar-upload.tsx` | Low | P0 |
| **CategoryPicker** | `dropdown-menu.tsx` | Medium | P0 |
| **MarkdownEditor** | NEW (react-markdown + preview) | Medium | P0 |
| **VIESStatusBadge** | `alert.tsx` | Low | P0 |
| **CompanyProfileCard** | `card.tsx` | Low | P0 |
| **AdminSidebar** | `app-sidebar.tsx` | Low | P0 |
| **CompaniesDataTable** | NEW (shadcn table) | High | P0 |
| **CategoriesTreeView** | NEW (@dnd-kit) | High | P0 |
| **BusinessHoursPicker** | NEW (time inputs) | Medium | P1 |
| **MapboxAutocomplete** | NEW (mapbox-gl) | Medium | P1 |

### 7.2 Server Actions to Create

| Action | Pattern Base | Complexity |
|--------|--------------|------------|
| **upgradeToCompany** | `update.ts` + VIES call | High |
| **updateCompanyProfile** | `update.ts` | Low |
| **verifyCompanyVIES** | NEW (external API) | High |
| **adminVerifyCompany** | `update.ts` + audit log | Medium |
| **adminRejectCompany** | `update.ts` + audit log | Medium |
| **createCategory** | `update.ts` | Low |
| **updateCategory** | `update.ts` | Low |
| **deleteCategory** | `delete-account.ts` + check relations | Medium |
| **reorderCategories** | NEW (bulk update) | Medium |

### 7.3 External Service Integration

| Service | Client Path | Complexity | Risk |
|---------|-------------|------------|------|
| **VIES API** | `src/lib/vies.ts` | High | HIGH (EU public service, unstable) |

**VIES Implementation Notes:**
- Use SOAP client (node `soap` package) or REST fallback
- Retry logic (3 attempts, exponential backoff)
- Cache results (6 months)
- Fallback to manual admin verification
- Handle errors gracefully (VIES down = pending manual review)

### 7.4 Database Migrations

**Required migrations:**
1. Add `CompanyProfile` model
2. Add `Category` model
3. Add `AuditLog` model
4. Extend `User` with `companyProfile` relation
5. Seed initial categories (10-15 categories)
6. Create first admin user (if not exists)

**No Breaking Changes:**
- All additive (no ALTER on existing columns)
- Safe to deploy alongside Stage 01

### 7.5 Translation Files

**Required files (5 languages each):**
- `companies.json` (~50 keys)
- `admin.json` (~30 keys)
- `categories.json` (~20 keys)
- Extend `sidebar.json` (+5 keys)

---

## 8. Reusable Patterns Summary

### 8.1 From Stage 01 → Stage 02 Mapping

| Stage 01 Feature | Stage 02 Feature | Reusable Pattern |
|------------------|------------------|------------------|
| Avatar upload (crop) | Logo/Banner upload | ✅ Same: react-image-crop + R2 presigned URL |
| Profile form | Company profile form | ✅ Same: RHF + Zod + Server Action |
| User settings page | Company settings page | ✅ Same: Card layout + forms |
| User sidebar | Company/Admin sidebar | ✅ Extend: Add role-based menu items |
| Email verification | VIES verification | ⚠️ Similar: async verification with status |
| Dark mode toggle | Dark mode (admin) | ✅ Same: theme-provider pattern |
| 5-language support | 5-language support | ✅ Same: next-intl pattern |

### 8.2 Key Code Examples for Architect Phase

**1. R2 Upload (logo/banner):**
```typescript
// Reuse: src/app/api/users/me/avatar/route.ts
// Just change:
// - key: `companies/${userId}/logo-${Date.now()}.jpg`
// - validation: banner max 10MB, logo max 5MB
```

**2. Form with Server Action:**
```typescript
// Reuse: src/components/profile/profile-form.tsx
// Pattern: useState + handleSubmit + Server Action
// Change: fields (companyName, nip, description)
```

**3. Sidebar Extension:**
```typescript
// Extend: src/components/layout/app-sidebar.tsx
const menuItems = [
  ...baseItems,
  ...(role === 'COMPANY' ? companyItems : []),
  ...(role === 'ADMIN' ? adminItems : [])
]
```

---

## 9. Recommendations for Architecture Phase

### 9.1 Critical Path (P0)

1. **Database Schema First**
   - Create migrations for CompanyProfile, Category, AuditLog
   - Seed categories
   - Test on dev database

2. **VIES Integration Early**
   - Implement `src/lib/vies.ts` client
   - Test with real NIP numbers
   - Build fallback mechanism (manual admin verification)
   - **HIGH RISK** - allocate extra time for VIES instability

3. **Company Upgrade Flow**
   - Form → VIES check → CompanyProfile creation
   - Handle async VIES (loading state, webhook/polling pattern)
   - Email notifications (verification success/fail)

4. **Public Company Profile**
   - SEO-optimized page (`/companies/[slug]`)
   - Server-side rendering (RSC)
   - Slug generation (unique constraint)

5. **Admin Panel Foundation**
   - AdminSidebar + layout
   - Role-based middleware protection
   - Companies management (list, verify, reject)

### 9.2 Deferred to Post-Stage 02 (P1)

- Advanced admin features (ban user, detailed audit log viewer)
- Category drag-drop reordering (can use simple number input initially)
- Mapbox autocomplete (can use plain text input initially)
- Business hours picker (can use JSON text input initially)

### 9.3 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **VIES API unstable** | HIGH | MEDIUM | Fallback to manual verification, cache results, retry logic |
| **Slug conflicts** | MEDIUM | LOW | Auto-append suffix (company-name-2), allow manual override |
| **R2 CORS issues** | LOW | MEDIUM | Test CORS config early, document setup |
| **Admin role escalation** | LOW | HIGH | Strict middleware checks, audit log all admin actions |

### 9.4 Testing Strategy

**Unit Tests:**
- VIES client (mock SOAP responses)
- Slug generation (uniqueness)
- Zod schemas (NIP format validation)

**Integration Tests:**
- Company upgrade flow (E2E)
- Admin verification flow
- R2 upload (logo/banner)

**Manual Testing:**
- VIES with real NIP numbers (Polish companies)
- Category hierarchy (parent-child relations)
- Public profile SEO (meta tags, structured data)

---

## 10. File Structure Preview

```
src/
├── app/
│   ├── (admin)/
│   │   └── [locale]/
│   │       └── admin/
│   │           ├── layout.tsx          # NEW: Admin layout
│   │           ├── page.tsx            # NEW: Admin dashboard
│   │           ├── companies/
│   │           │   └── page.tsx        # NEW: Companies management
│   │           ├── categories/
│   │           │   └── page.tsx        # NEW: Category management
│   │           └── users/
│   │               └── page.tsx        # NEW: Users management
│   ├── (main)/
│   │   └── [locale]/
│   │       ├── companies/
│   │       │   └── [slug]/
│   │       │       └── page.tsx        # NEW: Public company profile
│   │       ├── panel/
│   │       │   ├── company/            # NEW: Company section
│   │       │   │   ├── profile/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── settings/
│   │       │   │       └── page.tsx
│   │       │   └── ... (existing)
│   │       └── settings/
│   │           └── upgrade/
│   │               └── page.tsx        # NEW: Upgrade to company
│   ├── actions/
│   │   ├── companies/                  # NEW
│   │   │   ├── upgrade.ts
│   │   │   ├── update.ts
│   │   │   └── verify-vies.ts
│   │   └── admin/                      # NEW
│   │       ├── companies/
│   │       │   ├── verify.ts
│   │       │   └── reject.ts
│   │       └── categories/
│   │           ├── create.ts
│   │           ├── update.ts
│   │           └── delete.ts
│   └── api/
│       └── companies/                  # NEW
│           ├── logo/route.ts
│           └── banner/route.ts
├── components/
│   ├── companies/                      # NEW
│   │   ├── company-upgrade-form.tsx
│   │   ├── company-profile-form.tsx
│   │   ├── logo-upload.tsx
│   │   ├── banner-upload.tsx
│   │   ├── category-picker.tsx
│   │   ├── markdown-editor.tsx
│   │   └── company-profile-card.tsx
│   └── admin/                          # NEW
│       ├── admin-sidebar.tsx
│       ├── companies-table.tsx
│       ├── categories-tree.tsx
│       └── audit-log-viewer.tsx
└── lib/
    ├── vies.ts                         # NEW: VIES API client
    └── validation.ts                   # EXTEND: Add company schemas
```

---

## 11. Validation Schemas to Add

```typescript
// src/lib/validation.ts (EXTEND)

export const nipSchema = z.string()
  .regex(/^\d{10}$|^\d{2}-\d{3}-\d{3}-\d{2}$/, "Invalid NIP format")
  .transform(nip => nip.replace(/-/g, ''))  // Normalize to 10 digits

export const companyUpgradeSchema = z.object({
  companyName: z.string().min(2).max(100),
  nip: nipSchema,
  address: z.string().min(5).max(200),
  contactEmail: z.string().email(),
  phone: z.string().optional()
})

export const companyProfileSchema = z.object({
  companyName: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional(),
  categoryId: z.string().cuid().optional(),
  socialLinks: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    tiktok: z.string().url().optional()
  }).optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(200).optional()
})

export const categorySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  icon: z.string().optional(),
  parentId: z.string().cuid().nullable().optional(),
  order: z.number().int().min(0).optional()
})
```

---

## 12. Next Steps for Architect Agent

1. **Review this analysis** - Ensure all Stage 01 patterns identified
2. **Design VIES integration** - Critical path, high risk
3. **Design database schema** - Finalize Prisma models
4. **Design API structure** - Server Actions vs API Routes
5. **Design component hierarchy** - Reuse vs new components
6. **Design admin authorization** - Middleware + role checks
7. **Design slug generation** - Uniqueness algorithm
8. **Design file upload flow** - Logo/banner (crop + R2)
9. **Create task breakdown** - Based on this analysis

---

**Analysis Complete:** ✅ All mandatory sections included
**Pattern Coverage:** ✅ Stage 01 patterns documented with file paths
**Gap Analysis:** ✅ Clear mapping of existing → needed
**Database Issues:** ✅ Validated (no cuid vs uuid issues)
**Frontend Awareness:** ✅ Navigation, routing, translations covered
