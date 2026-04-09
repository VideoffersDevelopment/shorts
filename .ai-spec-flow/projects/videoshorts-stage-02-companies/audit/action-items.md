# Stage 02 - Action Items Checklist

**Project:** videoshorts-stage-02-companies
**Generated:** 2025-12-16
**Status:** Production-ready with outstanding tasks

---

## Critical (Before Production) 🔴

### 1. Update Documentation

**Priority:** CRITICAL
**Estimated Effort:** 4-8 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update `docs/README.md` (change "Stage 01" to include Stage 02)
- [ ] Add Stage 02 entries to `docs/CHANGELOG.md`
- [ ] Create `docs/features/companies/README.md`
- [ ] Create `docs/api/server-actions/companies.md`
- [ ] Create `docs/api/server-actions/admin.md`
- [ ] Create `docs/components/companies/README.md`
- [ ] Create `docs/components/admin/README.md`
- [ ] Create `docs/database/models/company-profile.md`
- [ ] Update statistics in main README (530 → 1204 tests)

**Automated Option:**
```bash
/ai-generate-docs videoshorts-stage-02-companies
```

**Impact:** Blocks team onboarding and future maintenance

---

## High Priority (This Week) 🟠

### 2. Fix Test Environment Issue

**Priority:** HIGH
**Estimated Effort:** 1 hour
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update `vitest.config.ts` to resolve Next.js server modules
- [ ] Add module aliases for `next/server`
- [ ] Re-run `npm run test:run` to verify 100% pass rate
- [ ] Document fix in `.claude/docs/testing-guide.md`

**Affected Files:**
- `src/app/actions/admin/categories/__tests__/create.test.ts`
- `src/app/actions/admin/categories/__tests__/delete.test.ts`
- `src/app/actions/admin/categories/__tests__/update.test.ts`

**Expected Outcome:** 53/53 test suites passing (100%)

**Impact:** Build confidence for deployment

---

### 3. Deploy to Staging

**Priority:** HIGH
**Estimated Effort:** 2 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Run `npm run build` and verify no errors
- [ ] Deploy to staging environment (Vercel/other)
- [ ] Run database migrations on staging DB
- [ ] Seed categories on staging DB
- [ ] Test VIES integration with real Polish NIPs
- [ ] Validate image uploads to R2 (logo, banner)
- [ ] Test company upgrade flow end-to-end
- [ ] Test admin panel (verify, reject, categories)
- [ ] Check SEO meta tags on public profiles
- [ ] Verify translations in all 5 languages

**Environment Variables to Check:**
- `DATABASE_URL` (staging DB)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` (companies bucket)
- `RESEND_API_KEY` (optional, can use dev mode)

**Impact:** Catch integration issues before production

---

## Medium Priority (Next Sprint) 🟡

### 4. Implement Subcategories UI

**Priority:** MEDIUM
**Estimated Effort:** 4 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `src/components/companies/subcategory-picker.tsx`
- [ ] Multi-select dropdown (max 3 subcategories)
- [ ] Integrate with `company-profile-form.tsx`
- [ ] Add to `src/lib/validation.ts` (validate max 3)
- [ ] Write tests (`subcategory-picker.test.tsx`)
- [ ] Add i18n keys to `companies.json`

**Component API:**
```tsx
<SubcategoryPicker
  categoryId={form.categoryId}
  value={form.subcategories}
  onChange={(ids) => form.setSubcategories(ids)}
  max={3}
  locale={locale}
/>
```

**Impact:** Enables companies to select subcategories via UI

---

### 5. Implement Business Hours Picker

**Priority:** MEDIUM
**Estimated Effort:** 6 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `src/components/companies/business-hours-picker.tsx`
- [ ] Time inputs for 7 days (Monday-Sunday)
- [ ] Open/close time for each day
- [ ] Optional "Closed" toggle per day
- [ ] Integrate with `company-profile-form.tsx`
- [ ] Validate HH:MM format in schema
- [ ] Write tests (`business-hours-picker.test.tsx`)
- [ ] Add i18n keys (day names, labels)

**Component API:**
```tsx
<BusinessHoursPicker
  value={form.businessHours}
  onChange={(hours) => form.setBusinessHours(hours)}
  locale={locale}
/>
```

**Data Structure:**
```json
{
  "monday": { "open": "09:00", "close": "17:00" },
  "tuesday": { "open": "09:00", "close": "17:00" },
  "wednesday": null,  // Closed
  ...
}
```

**Impact:** User-friendly business hours editing

---

### 6. Suppress VIES Test Noise

**Priority:** LOW
**Estimated Effort:** 30 minutes
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update `src/lib/__tests__/vies.test.ts`
- [ ] Mock `console.error` in retry tests
- [ ] Suppress expected "VIES_API_UNAVAILABLE" errors
- [ ] Re-run tests to verify cleaner output

**Impact:** Cleaner test output (cosmetic)

---

## Low Priority (Future Iterations) 🟢

### 7. Add JSDoc Comments

**Priority:** LOW
**Estimated Effort:** 3 hours
**Status:** ⬜ Not Started

**Files to Document:**
- [ ] `src/lib/vies.ts` (checkVAT, checkVATWithRetry)
- [ ] `src/lib/utils/slug.ts` (generateSlug, ensureUniqueSlug)
- [ ] `src/app/actions/companies/upgrade.ts`
- [ ] `src/app/actions/companies/update.ts`
- [ ] `src/app/actions/admin/companies/verify.ts`
- [ ] `src/app/actions/admin/companies/reject.ts`

**Format:**
```typescript
/**
 * Checks VAT number via VIES API with retry logic
 * @param countryCode - EU country code (e.g., "PL")
 * @param vatNumber - VAT number without country prefix
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns VIES response with validation result
 * @throws Error if VIES unavailable after retries
 */
export async function checkVATWithRetry(...)
```

**Impact:** Improved code maintainability

---

### 8. Background Job for VIES Re-verification

**Priority:** LOW
**Estimated Effort:** 4 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Set up Inngest (or alternative cron service)
- [ ] Create `src/lib/jobs/reverify-companies.ts`
- [ ] Query companies verified > 6 months ago
- [ ] Re-run VIES check for each
- [ ] Update `viesVerified` status
- [ ] Send email notifications on status change
- [ ] Add tests for job logic

**Cron Schedule:** Weekly on Sunday 2 AM

**Impact:** Automated verification status updates (spec requirement)

---

### 9. Admin Users Management

**Priority:** LOW
**Estimated Effort:** 12 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `src/app/(admin)/[locale]/admin/users/page.tsx`
- [ ] Create `src/components/admin/users-table.tsx`
- [ ] Create `src/app/actions/admin/users/change-role.ts`
- [ ] Create `src/app/actions/admin/users/ban.ts`
- [ ] Create `src/app/actions/admin/users/delete.ts`
- [ ] Add filters (role, verified, banned)
- [ ] Add search (email, display name)
- [ ] Write comprehensive tests
- [ ] Add i18n keys for users management

**Impact:** Complete admin panel functionality

---

### 10. E2E Testing with Playwright

**Priority:** LOW
**Estimated Effort:** 8 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Install Playwright (`npm install -D @playwright/test`)
- [ ] Create `e2e/companies/upgrade.spec.ts`
- [ ] Create `e2e/companies/profile-edit.spec.ts`
- [ ] Create `e2e/admin/verify-company.spec.ts`
- [ ] Create `e2e/admin/categories.spec.ts`
- [ ] Test file uploads (logo, banner)
- [ ] Test VIES integration (mock or staging)
- [ ] Add to CI/CD pipeline

**Scenarios to Cover:**
- Complete company upgrade flow
- Logo/banner upload with cropping
- Admin verification workflow
- Category drag & drop

**Impact:** Higher confidence in critical paths

---

### 11. Component Documentation (Storybook)

**Priority:** LOW
**Estimated Effort:** 8 hours
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Install Storybook (`npx storybook@latest init`)
- [ ] Create stories for company components:
  - [ ] `CompanyUpgradeForm.stories.tsx`
  - [ ] `CompanyProfileCard.stories.tsx`
  - [ ] `CompanyProfileForm.stories.tsx`
  - [ ] `LogoUpload.stories.tsx`
  - [ ] `BannerUpload.stories.tsx`
  - [ ] `CategoryPicker.stories.tsx`
  - [ ] `ViesStatusBadge.stories.tsx`
- [ ] Create stories for admin components:
  - [ ] `CompaniesTable.stories.tsx`
  - [ ] `CategoriesTree.stories.tsx`
  - [ ] `CategoryFormDialog.stories.tsx`
- [ ] Deploy Storybook to Chromatic or Vercel

**Impact:** Better component discoverability and visual testing

---

## Technical Debt 🛠️

### Refactoring Tasks

| Task | Priority | Effort | File(s) |
|------|----------|--------|---------|
| Refactor `company-profile-form.tsx` (200+ lines) | Low | 3h | src/components/companies/company-profile-form.tsx |
| Extract upload logic to custom hook | Low | 2h | src/components/companies/{logo,banner}-upload.tsx |
| Add error boundary to admin routes | Medium | 2h | src/app/(admin)/[locale]/admin/layout.tsx |
| Optimize category queries (N+1) | Low | 4h | src/app/actions/admin/categories/*.ts |

---

## Progress Tracking

**Overall Completion:**
- Critical: 0/1 (0%)
- High: 0/2 (0%)
- Medium: 0/3 (0%)
- Low: 0/5 (0%)
- Technical Debt: 0/4 (0%)

**Total: 0/15 (0%)**

---

**Last Updated:** 2025-12-16
**Next Review:** After critical items completed
**Owner:** Development Team
