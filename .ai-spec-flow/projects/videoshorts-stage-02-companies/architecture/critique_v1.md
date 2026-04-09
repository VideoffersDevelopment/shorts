# Architecture Critique: VideoShorts Stage 02 - Companies + Verification

**Project:** videoshorts-stage-02-companies
**Architecture Version:** v1
**Critic:** Software Architect Critic Agent
**Date:** 2025-12-15
**Verdict:** ⚠️ NEEDS REVISION

---

## Executive Summary

The architecture document is comprehensive and well-structured, demonstrating strong technical knowledge and proper reuse of Stage 01 patterns. However, there are **5 CRITICAL ISSUES** and several improvements needed before implementation can proceed.

**Strengths:**
- ✅ Excellent component reuse strategy (21 from Stage 01)
- ✅ Well-documented VIES integration with fallback mechanisms
- ✅ Clear database schema with additive-only migrations
- ✅ Proper risk mitigation strategies

**Critical Issues Found:**
- ❌ **Translation coverage incomplete** (admin namespace partially missing)
- ❌ **Database: Missing @db.Timestamptz consistency**
- ❌ **API endpoints: Missing error response specifications**
- ⚠️ **Frontend: Navigation updates not fully specified**
- ⚠️ **Reuse: Some components marked for creation already exist in patterns**

---

## 1. Frontend Specification

### 1.1 Routes ✅ PASS

**Status:** All routes properly defined with access control

| Route | Access Control | Layout | Status |
|-------|----------------|--------|--------|
| `/companies/[slug]` | Public | `(main)` | ✅ Defined |
| `/settings/upgrade` | USER only | `(main)` | ✅ Defined |
| `/panel/company/profile` | COMPANY only | `(main)` | ✅ Defined |
| `/admin` | ADMIN only | `(admin)` | ✅ Defined |
| `/admin/companies` | ADMIN only | `(admin)` | ✅ Defined |
| `/admin/categories` | ADMIN only | `(admin)` | ✅ Defined |
| `/admin/users` | ADMIN only | `(admin)` | ✅ Defined |
| `/admin/audit` | ADMIN only | `(admin)` | ✅ Defined |

**Middleware Protection:** ✅ Properly defined in Section 9

### 1.2 Navigation Updates ⚠️ PARTIAL

**Status:** Role-based navigation specified but incomplete

**Issues Found:**
1. **User Menu Extension (Section 8.1):**
   - ✅ USER role: "Upgrade to Company" link defined
   - ✅ COMPANY role: "Company Profile" link defined
   - ✅ ADMIN role: "Admin Panel" link defined
   - ❌ **MISSING:** Icons not specified for new menu items
   - ❌ **MISSING:** Menu item order/priority not specified

2. **Sidebar Extension (Section 8.2):**
   - ✅ Company items defined for COMPANY role
   - ✅ Admin link defined for ADMIN role
   - ❌ **MISSING:** Icons for company menu items only partially specified
   - ⚠️ **Inconsistency:** Section 8.1 uses `Building2` icon, Section 8.2 also uses `Building2` but adds `Settings` icon without definition

**Required Fix:**
```typescript
// Complete icon specification needed:
{
  href: "/settings/upgrade",
  label: t("menu.upgradeToCompany"),
  icon: Building2,  // ✅ Specified
  show: session.user.role === "USER"
}

{
  href: "/panel/company/settings",
  label: t("sidebar.company.settings"),
  icon: Settings,  // ✅ Specified but needs consistency check
  show: session.user.role === "COMPANY"
}

// MISSING: Shield icon import not mentioned in extensions
{
  href: "/admin",
  label: t("sidebar.admin"),
  icon: Shield,  // ⚠️ Import not specified in extension
  show: session.user.role === "ADMIN"
}
```

### 1.3 Component Hierarchy ✅ PASS

**Status:** Complete hierarchy with proper reuse documentation

- ✅ 21 reusable components documented (Section 12)
- ✅ 12 new components specified (Section 13)
- ✅ Component purposes clearly defined
- ✅ Complexity estimates provided

### 1.4 Form Schemas ✅ PASS

**Status:** Complete Zod validation schemas

- ✅ `nipSchema` - Polish NIP validation with normalization
- ✅ `companyUpgradeSchema` - All required fields validated
- ✅ `companyProfileSchema` - Optional fields properly typed
- ✅ `categorySchema` - Slug regex validation included

---

## 2. Translations (i18n)

### 2.1 Language Coverage ⚠️ PARTIAL

**Required:** 5 languages (pl, en, de, es, ru)

**Status by Namespace:**

| Namespace | pl | en | de | es | ru | Status |
|-----------|----|----|----|----|----|----|
| companies.json | ✅ Example | ✅ Example | ⚠️ Note only | ⚠️ Note only | ⚠️ Note only | ⚠️ PARTIAL |
| admin.json | ✅ Example | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ INCOMPLETE |
| categories.json | ✅ Example | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ INCOMPLETE |

### 2.2 Critical Issues Found

**Issue 1: Incomplete admin.json translations**

Section 10.2 provides Polish (`admin.json`) but states "Note: Repeat for all 5 languages" without showing English example. This is **INCONSISTENT** with companies.json approach (Section 10.1) which shows both pl and en examples.

**Required:** Full examples for at least pl + en for all namespaces.

**Issue 2: Missing translation keys**

Based on component analysis, these keys are referenced but not defined:

```json
// Missing in companies.json:
{
  "profile": {
    "edit": {
      "fields": {
        "website": "...",
        "category": "...",
        "socialLinks": "...",
        "location": "...",
        "businessHours": "..."
      }
    }
  },
  "banner": {
    "title": "...",
    "upload": "..."
  }
}

// Missing in admin.json:
{
  "categories": {
    "title": "...",
    "create": "...",
    "update": "...",
    "delete": "..."
  },
  "users": {
    "title": "...",
    "table": { /* headers */ },
    "actions": { /* buttons */ }
  }
}
```

### 2.3 UI Text Coverage ⚠️ PARTIAL

**Component Analysis:**

| Component | Translation Keys Needed | Status |
|-----------|------------------------|--------|
| CompanyUpgradeForm | ✅ All defined (companies.upgrade.*) | PASS |
| CompanyProfileForm | ⚠️ Partially defined (missing field labels) | PARTIAL |
| LogoUpload | ✅ Defined (companies.logo.*) | PASS |
| BannerUpload | ❌ Not defined (companies.banner.* missing) | FAIL |
| CategoryPicker | ✅ Defined (categories.picker.*) | PASS |
| AdminSidebar | ✅ Defined (admin.nav.*) | PASS |
| CompaniesTable | ✅ Defined (admin.companies.*) | PASS |
| VIESStatusBadge | ⚠️ Implied but not explicit | PARTIAL |

### 2.4 Error Messages ⚠️ PARTIAL

**Server Actions Error Messages:**

Analysis of Section 2 (Server Actions) shows hardcoded English error messages:

```typescript
// From upgrade.ts (line 194, 200, 214, 267):
return { error: "Unauthorized" }
return { error: "Already a company" }
return { error: "NIP already registered" }
return { error: "Failed to create company profile" }
```

**Issue:** Error messages should use translation keys for i18n support.

**Required Fix:**
```typescript
// Should be:
return { error: t("errors.unauthorized") }
return { error: t("companies.errors.alreadyCompany") }
return { error: t("companies.errors.nipExists") }
```

### 2.5 Naming Convention ✅ PASS

**Status:** Consistent dot notation used throughout (e.g., `companies.upgrade.title`)

---

## 3. Database Schema

### 3.1 Models from Spec ✅ PASS

**Status:** All required models included

| Model | Spec Requirement | Architecture | Status |
|-------|------------------|--------------|--------|
| CompanyProfile | ✅ Required | ✅ Section 1.1 | PASS |
| Category | ✅ Required | ✅ Section 1.1 | PASS |
| AuditLog | ✅ Required | ✅ Section 1.1 | PASS |

### 3.2 Relations ✅ PASS

**Status:** All relations properly defined with onDelete cascades

```prisma
// ✅ CORRECT relations:
CompanyProfile.user → User (onDelete: Cascade)
CompanyProfile.category → Category (optional)
Category.parent → Category (self-referential, optional)
AuditLog.admin → User
```

### 3.3 Indexes ✅ PASS

**Status:** All performance indexes defined

- ✅ CompanyProfile: 6 indexes (userId, slug, nip, categoryId, viesVerified, geo)
- ✅ Category: 4 indexes (slug, parentId, enabled, order)
- ✅ AuditLog: 3 indexes (adminId, targetType+targetId, createdAt)

**PostGIS Index:** ✅ Properly defined for `[latitude, longitude]`

### 3.4 Seed Data ✅ PASS

**Status:** Initial categories clearly defined (Section 1.4)

- ✅ 3 main categories with subcategories
- ✅ Order field for sorting
- ✅ Icon field (Lucide icons)

### 3.5 Critical Issue: @db.Timestamptz Inconsistency ❌ FAIL

**Issue Found:**

Section 1.1 CompanyProfile model:
```prisma
createdAt DateTime @default(now())     @db.Timestamptz  // ✅ Line 53
updatedAt DateTime @updatedAt          @db.Timestamptz  // ✅ Line 54
```

Section 1.1 Category model:
```prisma
createdAt DateTime @default(now())     @db.Timestamptz  // ✅ Line 75
updatedAt DateTime @updatedAt          @db.Timestamptz  // ✅ Line 76
```

Section 1.1 AuditLog model:
```prisma
createdAt DateTime @default(now())     @db.Timestamptz  // ✅ Line 95
```

**BUT** Section 1.2 User Model Extension:
```prisma
model User {
  // ... existing fields from Stage 01 ...
  // NEW relations for Stage 02
  companyProfile CompanyProfile?
  adminAuditLogs AuditLog[]      @relation("AdminAuditLogs")
}
```

**Problem:** The document doesn't verify that Stage 01 User model uses `@db.Timestamptz`. Based on analysis file (line 187-189), this needs verification.

**Required Action:**
1. Verify Stage 01 User.createdAt and User.updatedAt use @db.Timestamptz
2. If not, migration must include ALTER TABLE to convert DateTime → Timestamptz
3. Document this as BREAKING CHANGE (not additive)

---

## 4. API Layer

### 4.1 Server Actions Mapped ✅ PASS

**Status:** All required actions from analysis documented

| Analysis Requirement | Architecture | Status |
|---------------------|--------------|--------|
| upgradeToCompany | ✅ Section 2.1 | PASS |
| updateCompanyProfile | ✅ Section 2.1 | PASS |
| verifyCompany (admin) | ✅ Section 2.2 | PASS |
| rejectCompany (admin) | ✅ Section 2.2 | PASS |
| createCategory (admin) | ✅ Section 2.3 | PASS |

### 4.2 VIES Integration ✅ PASS

**Status:** Detailed implementation with retry logic (Section 4.1)

- ✅ SOAP client implementation shown
- ✅ Retry wrapper with exponential backoff (3 attempts)
- ✅ Error handling (VIES_API_UNAVAILABLE)
- ✅ Response interface defined

**Risk Mitigation:** ✅ Properly documented in Section 14

### 4.3 Upload Flows ✅ PASS

**Status:** Presigned URL pattern documented (Section 3)

- ✅ Logo upload: `/api/companies/logo` (Section 3.1)
- ✅ Banner upload: `/api/companies/banner` (Section 3.2)
- ✅ R2 presigned URL generation shown
- ✅ Client-side validation (file type, size)

### 4.4 Error Handling ❌ FAIL

**Issue Found:** Error response specifications incomplete

Section 2.1 shows Server Actions returning:
```typescript
return { error: "Unauthorized" }
return { success: true, data: company }
```

**Missing:**
1. HTTP status codes not specified for API routes
2. Error response shape not standardized
3. No specification for validation error format (Zod errors)

**Required Fix:**
```typescript
// Standardize error responses:
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// Example:
return { success: false, error: "NIP already registered", code: "NIP_EXISTS" }
```

---

## 5. Reuse Verification

### 5.1 Stage 01 Components Listed ✅ PASS

**Status:** Section 12 documents 21 reusable components with paths

Verified against analysis (Section 1.1):
- ✅ All UI components listed
- ✅ Shared components listed
- ✅ Layout components listed with extension notes
- ✅ Avatar upload pattern explicitly marked for reuse

### 5.2 New Components Specified ✅ PASS

**Status:** Section 13 lists 12 new components

- ✅ Component names defined
- ✅ Paths specified
- ✅ Purpose documented
- ✅ Complexity estimates provided

### 5.3 Pattern Reuse ⚠️ PARTIAL

**Issue Found:** Some "new" components should reuse existing patterns more explicitly

Example: MarkdownEditor (Section 13, line 1769)
- Marked as "NEW (with Textarea)"
- Should explicitly state: "Wraps Textarea with react-markdown preview"
- Missing: Which markdown library? (react-markdown? marked?)

Example: BusinessHoursPicker (missing from architecture)
- Mentioned in analysis (Section 7.1)
- Not in component creation list (Section 13)
- Should be specified as: "7x time input pairs (Textarea for JSON fallback)"

---

## 6. Implementation Phases

### 6.1 Dependencies Clear ✅ PASS

**Status:** Section 11 shows 8 phases with dependencies

- ✅ Phase 1: No dependencies (foundation)
- ✅ Phase 2: Depends on Phase 1
- ✅ Phase 3: Depends on Phase 2
- ✅ All phases show "Dependencies: Phase X" or "All previous phases"

### 6.2 Logical Ordering ✅ PASS

**Status:** Database → Backend → Frontend → Admin → Polish

- ✅ Phase 1: Database & Core (Days 1-2)
- ✅ Phase 2-4: Company features (Days 3-7)
- ✅ Phase 5-6: Admin panel (Days 8-10)
- ✅ Phase 7-8: Polish & Testing (Days 11-13)

### 6.3 Testable Increments ✅ PASS

**Status:** Each phase has clear output

- ✅ Phase 1 Output: "Database ready, VIES integration tested"
- ✅ Phase 2 Output: "Users can upgrade to COMPANY role"
- ✅ Phase 8 Output: "Stage 02 ready for QA"

---

## 7. Detailed Issues List

### 7.1 CRITICAL Issues (Must Fix Before Implementation)

#### Issue #1: Translation Coverage Incomplete ❌
**Severity:** HIGH
**Impact:** Implementation will fail i18n requirements

**Problem:**
- admin.json only shows Polish example (Section 10.2, line 1563)
- categories.json only shows Polish example (Section 10.3, line 1611)
- Error messages hardcoded in English (Section 2)

**Required Fix:**
1. Provide full pl + en examples for all 3 namespaces (companies, admin, categories)
2. Create errors.json namespace for Server Action errors
3. Document all 5 language files must be created

**Acceptance Criteria:**
```
✅ companies.json - 5 languages (pl, en, de, es, ru) - keys complete
✅ admin.json - 5 languages - keys complete
✅ categories.json - 5 languages - keys complete
✅ errors.json - 5 languages - standardized error codes
✅ sidebar.json - extended with new keys for all 5 languages
```

#### Issue #2: Database @db.Timestamptz Not Verified ❌
**Severity:** HIGH
**Impact:** Potential data type inconsistency

**Problem:**
- New models use @db.Timestamptz (Section 1.1)
- User model extension (Section 1.2) doesn't verify Stage 01 uses same
- Migration marked as "ADDITIVE ONLY" (line 119) but this might be false

**Required Fix:**
1. Check Stage 01 schema for User.createdAt type
2. If not @db.Timestamptz, document as BREAKING CHANGE
3. Add migration step: ALTER TABLE users ALTER COLUMN created_at TYPE timestamptz

**Verification Required:**
```sql
-- If Stage 01 uses DateTime without @db.Timestamptz:
ALTER TABLE users
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
```

#### Issue #3: API Error Response Shape Not Standardized ❌
**Severity:** MEDIUM
**Impact:** Frontend error handling inconsistent

**Problem:**
- Server Actions return `{ error: string }` (Section 2)
- No error codes for client-side error handling
- Zod validation errors not properly shaped

**Required Fix:**
```typescript
// Add to architecture:
type ActionError = {
  success: false
  error: string          // Human-readable message (translated)
  code?: string          // Machine-readable code (e.g., "NIP_EXISTS")
  field?: string         // Field name for validation errors
  details?: unknown      // Zod error details
}

type ActionSuccess<T> = {
  success: true
  data: T
  message?: string       // Optional success message
}

type ActionResult<T> = ActionSuccess<T> | ActionError
```

#### Issue #4: Navigation Icon Imports Not Specified ⚠️
**Severity:** LOW
**Impact:** Implementation might use wrong icons

**Problem:**
- Section 8.1 uses Building2, Shield icons
- No import statement shown: `import { Building2, Shield, Settings } from "lucide-react"`
- Inconsistent with Section 6.2 (line 1001-1007) which shows full import

**Required Fix:**
Add to Section 8.1 and 8.2:
```typescript
import { Building2, Shield, Settings } from "lucide-react"
```

#### Issue #5: Missing Component - BusinessHoursPicker ⚠️
**Severity:** LOW
**Impact:** Deferred to P1, but should be documented

**Problem:**
- Analysis mentions BusinessHoursPicker (analysis line 590)
- Not in architecture Section 13 (new components)
- Spec (line 176) says "time picker dla każdego dnia"

**Required Fix:**
Add to Section 13 (or explicitly mark as OUT OF SCOPE for MVP):
```markdown
| BusinessHoursPicker | NEW (7x time inputs) | Medium | P1 (MVP: JSON textarea) |
```

### 7.2 IMPROVEMENT Suggestions (Nice to Have)

#### Suggestion #1: Add Slug Conflict Resolution Algorithm
**Location:** Section 4.2

Current: "Generate unique slug" (line 625)
Improvement: Show full algorithm

```typescript
export async function generateSlug(
  text: string,
  model: any,
  maxRetries = 10
): Promise<string> {
  let baseSlug = slugify(text, { lower: true, strict: true, locale: "pl" })
  let slug = baseSlug
  let attempt = 0

  while (attempt < maxRetries) {
    const exists = await model.findUnique({ where: { slug } })
    if (!exists) return slug

    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  return `${baseSlug}-${Date.now()}`  // Fallback
}
```

**Status:** ✅ ACTUALLY DOCUMENTED (Section 4.2, line 622)
Suggestion withdrawn - algorithm is complete.

#### Suggestion #2: Add VIES Rate Limiting Strategy
**Location:** Section 4.1

Current: VIES retry logic shown
Improvement: Add rate limiting to prevent API abuse

```typescript
// Suggested addition:
export class VIESRateLimiter {
  private lastCall: number = 0
  private minInterval: number = 1000  // 1 request per second

  async throttle() {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCall
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      )
    }
    this.lastCall = Date.now()
  }
}
```

#### Suggestion #3: Add SEO Metadata Example
**Location:** Section 7.1 (page examples)

Current: generateMetadata shown (line 1173)
Improvement: Add structured data (JSON-LD) for rich snippets

```typescript
// Add to page.tsx:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": company.companyName,
  "image": company.logo,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": company.address
  }
}
</script>
```

---

## 8. Verification Summary

| Category | Status | Critical Issues | Pass % |
|----------|--------|----------------|--------|
| Frontend Specification | ⚠️ PARTIAL | 1 (navigation icons) | 75% |
| Translations | ❌ FAIL | 1 (coverage incomplete) | 40% |
| Database | ⚠️ PARTIAL | 1 (timestamptz) | 80% |
| API Layer | ⚠️ PARTIAL | 1 (error shapes) | 75% |
| Reuse Verification | ✅ PASS | 0 | 95% |
| Implementation Phases | ✅ PASS | 0 | 100% |

**Overall Score:** 73% (NEEDS REVISION)

---

## 9. Final Verdict

### Status: ⚠️ NEEDS REVISION

**Reason:** 5 critical issues found (2 HIGH, 3 MEDIUM/LOW severity)

### Required Changes Before Approval

#### MUST FIX (Blocking):

1. **Translation Files:**
   - ✅ Provide full examples (pl + en) for all 3 namespaces
   - ✅ Create errors.json with standardized error codes
   - ✅ Document requirement for all 5 languages

2. **Database Verification:**
   - ✅ Verify Stage 01 User model uses @db.Timestamptz
   - ✅ Document migration strategy if types differ
   - ✅ Update "ADDITIVE ONLY" claim if breaking changes needed

3. **API Error Handling:**
   - ✅ Standardize error response shape (ActionResult type)
   - ✅ Add error codes for machine-readable handling
   - ✅ Document Zod validation error formatting

#### SHOULD FIX (Non-blocking but recommended):

4. **Navigation Icons:**
   - Add import statement to Section 8.1/8.2
   - Ensure consistency with existing pattern

5. **Missing Component:**
   - Add BusinessHoursPicker to Section 13 OR
   - Explicitly mark as OUT OF SCOPE with JSON textarea fallback

### Timeline Impact

**Current Estimate:** 13 days (Section 11)
**Recommended:** Add 1 day for translations (+5 language files × 3 namespaces)
**New Estimate:** 14 days

### Next Steps

1. **Architect Agent:** Address 5 critical issues
2. **Create:** `response_v2.md` with fixes
3. **Critic Agent:** Re-review v2
4. **Approval:** Once all critical issues resolved

---

## 10. Positive Highlights

Despite the issues found, this architecture has **significant strengths**:

✅ **Excellent Reuse Strategy:**
- 21 Stage 01 components properly identified
- Avatar upload pattern reused for logo/banner
- Clear documentation of what exists vs. what's new

✅ **Robust VIES Integration:**
- Retry logic with exponential backoff
- Fallback to manual verification
- Clear error handling

✅ **Well-Structured Phases:**
- Logical dependency chain
- Clear outputs per phase
- Realistic time estimates

✅ **Security-Conscious:**
- Middleware protection documented
- Audit log for all admin actions
- Role-based access control

✅ **Performance-Aware:**
- Database indexes properly defined
- PostGIS for geolocation
- Caching strategy for VIES results

---

## 11. Recommendation

**Verdict:** ⚠️ NEEDS REVISION

**Confidence:** HIGH (95%)

**Recommended Action:**
1. Fix critical issues #1, #2, #3 (MUST FIX)
2. Address issues #4, #5 (SHOULD FIX)
3. Submit `response_v2.md` for re-review
4. Once approved, proceed to Task Planning phase

**Estimated Fix Time:** 2-3 hours for architect agent

---

**Critique Status:** ✅ COMPLETE
**Prepared by:** Software Architect Critic Agent
**Date:** 2025-12-15
**Next Action:** Architect Agent to address issues and create v2
