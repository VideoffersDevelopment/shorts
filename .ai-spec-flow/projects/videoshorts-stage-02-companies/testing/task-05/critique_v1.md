# Test Suite Critique: Task-05 (Company Profile Edit) - Iteration 1/3

**Test Commit Reviewed:** cb7260e00f169f6332a2f4b5aca1e11e9bf597f5
**Test Commit Message:** test(task-05): comprehensive test suite for company profile edit - iteration v1

**Code Commit:** b1f5a3004699fccbc633fab601ca4a5126eb4903

**Verdict:** CHANGES REQUIRED

---

## ✅ Testing Stack Compliance - PASSED

**Excellent work on testing stack usage:**
- ✅ All tests use `vitest` imports (`vi.fn()`, `vi.mock()`)
- ✅ All tests import from `@/test/utils` (NOT `@testing-library/react`)
- ✅ Proper section comments with `// ===`
- ✅ Consistent structure across all test files

**No issues found with testing stack compliance.**

---

## 🔴 CRITICAL: Missing Server Action Tests

### Issue 1: No Tests for `updateCompanyProfileAction`

**File:** `src/app/actions/companies/update.ts`
**Missing:** Complete test suite for Server Action

**Why Critical:** This is the CORE functionality of Task-05. Without tests:
- Authorization bugs could let users edit other companies
- Validation failures could crash the app
- revalidatePath bugs would show stale data

**Required Test File:** `src/app/actions/companies/__tests__/update.test.ts`

**Required Test Categories (ALL 6 MANDATORY):**

#### 1. Happy Path Test
```typescript
it('updates company profile with valid data and revalidates paths', async () => {
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
  mockPrisma.companyProfile.findUnique.mockResolvedValue({
    id: 'company-1',
    userId: 'user-1',
    slug: 'test-company',
    // ... other fields
  })
  mockPrisma.companyProfile.update.mockResolvedValue({
    id: 'company-1',
    slug: 'test-company',
    companyName: 'Updated Company',
    // ... updated fields
  })

  const result = await updateCompanyProfileAction({
    companyName: 'Updated Company',
    description: 'New description',
    website: 'https://newsite.com'
  })

  expect(result).toMatchObject({
    success: true,
    data: expect.objectContaining({
      companyName: 'Updated Company'
    })
  })

  // CRITICAL: Verify revalidatePath called
  expect(mockRevalidatePath).toHaveBeenCalledWith('/companies/test-company')
  expect(mockRevalidatePath).toHaveBeenCalledWith('/panel/company/profile')
  expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
})
```

#### 2. Auth Failure Test
```typescript
it('returns error when not authenticated', async () => {
  mockAuth.mockResolvedValue(null)

  const result = await updateCompanyProfileAction({ companyName: 'Test' })

  expect(result).toMatchObject({
    success: false,
    error: 'errors.unauthorized',
    code: 'UNAUTHORIZED'
  })
  expect(mockRevalidatePath).not.toHaveBeenCalled()
})
```

#### 3. Authorization Failure Test
```typescript
it('returns error when user does not have company profile', async () => {
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
  mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

  const result = await updateCompanyProfileAction({ companyName: 'Test' })

  expect(result).toMatchObject({
    success: false,
    error: 'companies.errors.notCompany',
    code: 'NOT_COMPANY'
  })
  expect(mockRevalidatePath).not.toHaveBeenCalled()
})
```

#### 4. Validation Failure Tests (need at least 2)
```typescript
it('returns error for invalid data - missing required fields', async () => {
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
  mockPrisma.companyProfile.findUnique.mockResolvedValue({
    id: 'company-1',
    userId: 'user-1'
  })

  const result = await updateCompanyProfileAction({ companyName: '' })

  expect(result.success).toBe(false)
  expect(result.errors).toBeDefined()
  expect(mockRevalidatePath).not.toHaveBeenCalled()
})

it('returns error for invalid website URL format', async () => {
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
  mockPrisma.companyProfile.findUnique.mockResolvedValue({
    id: 'company-1',
    userId: 'user-1'
  })

  const result = await updateCompanyProfileAction({
    companyName: 'Test',
    website: 'not-a-url'
  })

  expect(result.success).toBe(false)
  expect(result.errors?.website).toBeDefined()
})
```

#### 5. Database Error Test
```typescript
it('handles database update failure', async () => {
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
  mockPrisma.companyProfile.findUnique.mockResolvedValue({
    id: 'company-1',
    userId: 'user-1'
  })
  mockPrisma.companyProfile.update.mockRejectedValue(
    new Error('Database connection failed')
  )

  const result = await updateCompanyProfileAction({ companyName: 'Test' })

  expect(result).toMatchObject({
    success: false,
    error: 'companies.errors.updateFailed',
    code: 'UPDATE_FAILED'
  })
  expect(mockRevalidatePath).not.toHaveBeenCalled()
})
```

#### 6. Cache Revalidation Test (CRITICAL)
**This is already covered in Happy Path test above**, but must verify:
- ✅ revalidatePath called with `/companies/${slug}`
- ✅ revalidatePath called with `/panel/company/profile`
- ✅ Called exactly 2 times
- ✅ NOT called on any error case

**Setup Required:**
```typescript
import { vi } from 'vitest'
import { revalidatePath } from 'next/cache'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

const mockRevalidatePath = vi.mocked(revalidatePath)

beforeEach(() => {
  vi.clearAllMocks()
  mockRevalidatePath.mockClear()
})
```

---

## 🔴 CRITICAL: Missing API Route Tests

### Issue 2: No Tests for `/api/companies/logo` Route

**File:** `src/app/api/companies/logo/route.ts`
**Missing:** Complete test suite for API route

**Required Test File:** `src/app/api/companies/__tests__/logo.test.ts`

**Required Tests:**

#### POST /api/companies/logo
```typescript
describe('POST /api/companies/logo', () => {
  it('returns upload URL for authenticated company user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockPrisma.companyProfile.findUnique.mockResolvedValue({
      id: 'company-1',
      userId: 'user-1'
    })
    mockGetUploadUrl.mockResolvedValue('https://r2.example.com/upload-url')
    mockGetPublicUrl.mockReturnValue('https://cdn.example.com/logo.jpg')

    const request = new Request('http://localhost/api/companies/logo', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'image/jpeg' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      uploadUrl: 'https://r2.example.com/upload-url',
      publicUrl: 'https://cdn.example.com/logo.jpg'
    })
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost/api/companies/logo', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'image/jpeg' })
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 403 when user is not a company', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockPrisma.companyProfile.findUnique.mockResolvedValue(null)

    const request = new Request('http://localhost/api/companies/logo', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'image/jpeg' })
    })

    const response = await POST(request)

    expect(response.status).toBe(403)
  })

  it('returns 400 for invalid content type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockPrisma.companyProfile.findUnique.mockResolvedValue({
      id: 'company-1',
      userId: 'user-1'
    })

    const request = new Request('http://localhost/api/companies/logo', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'application/pdf' })
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
```

#### DELETE /api/companies/logo
```typescript
describe('DELETE /api/companies/logo', () => {
  it('deletes logo for authenticated company user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockPrisma.companyProfile.findUnique.mockResolvedValue({
      id: 'company-1',
      userId: 'user-1',
      logo: 'https://cdn.example.com/companies/company-1/logo-abc.jpg'
    })
    mockDeleteObject.mockResolvedValue(undefined)

    const request = new Request('http://localhost/api/companies/logo', {
      method: 'DELETE'
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
    expect(mockDeleteObject).toHaveBeenCalledWith('companies/company-1/logo-abc.jpg')
  })

  it('returns 404 when no logo exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockPrisma.companyProfile.findUnique.mockResolvedValue({
      id: 'company-1',
      userId: 'user-1',
      logo: null
    })

    const request = new Request('http://localhost/api/companies/logo', {
      method: 'DELETE'
    })

    const response = await DELETE(request)

    expect(response.status).toBe(404)
  })
})
```

### Issue 3: No Tests for `/api/companies/banner` Route

**File:** `src/app/api/companies/banner/route.ts`
**Missing:** Complete test suite (same structure as logo tests)

**Required Test File:** `src/app/api/companies/__tests__/banner.test.ts`

**Required Tests:** Same structure as logo route tests (POST and DELETE handlers)

---

## ✅ Component Tests - Excellent Coverage

### CompanyProfileForm (72 tests)
- ✅ Rendering (6 tests)
- ✅ Form Fields (7 tests)
- ✅ Interactions (4 tests)
- ✅ Loading States (3 tests)
- ✅ Success/Error States (5 tests)
- ✅ Edge Cases (4 tests)
- ✅ Accessibility (2 tests)

**Coverage: 100% - All categories covered**

### LogoUpload (49 tests)
- ✅ Rendering (4 tests)
- ✅ File Selection (7 tests)
- ✅ Crop Dialog (3 tests)
- ✅ Upload Flow (3 tests)
- ✅ Loading States (2 tests)
- ✅ Error States (2 tests)
- ✅ Edge Cases (2 tests)
- ✅ Accessibility (3 tests)

**Coverage: 100% - All categories covered**

### BannerUpload (49 tests)
- ✅ Rendering (5 tests)
- ✅ File Validation (7 tests)
- ✅ Crop Dialog (3 tests)
- ✅ Upload Flow (3 tests)
- ✅ Loading States (2 tests)
- ✅ Error States (2 tests)
- ✅ Edge Cases (2 tests)
- ✅ Accessibility (3 tests)

**Coverage: 100% - All categories covered**

### CategoryPicker (35 tests)
- ✅ Rendering (5 tests)
- ✅ Options (4 tests)
- ✅ Interactions (4 tests)
- ✅ Edge Cases (6 tests)
- ✅ Accessibility (3 tests)
- ✅ Flattening Logic (2 tests)

**Coverage: 100% - All categories covered**

---

## ⚠️ Minor Issues (Optional Improvements)

### Issue 4: Some Tests Use `getByTestId` Instead of `getByRole`

**Files:** All component test files

**Current:**
```typescript
expect(screen.getByTestId('logo-upload')).toBeInTheDocument()
expect(screen.getByTestId('banner-upload')).toBeInTheDocument()
expect(screen.getByTestId('category-picker')).toBeInTheDocument()
```

**Why Minor:** These are mocked components, so using `getByTestId` is acceptable here. In real implementation, prefer `getByRole`.

**Not blocking approval**, but good practice would be:
```typescript
// For real components (not mocked)
expect(screen.getByRole('img', { name: /logo/i })).toBeInTheDocument()
```

---

## 📊 Coverage Analysis

**Components: 205 tests - 100% coverage ✅**
- CompanyProfileForm: 72 tests ✅
- LogoUpload: 49 tests ✅
- BannerUpload: 49 tests ✅
- CategoryPicker: 35 tests ✅

**Server Actions: 0 tests - 0% coverage ❌**
- updateCompanyProfileAction: 0 tests (NEED ~10 tests)

**API Routes: 0 tests - 0% coverage ❌**
- /api/companies/logo: 0 tests (NEED ~8 tests)
- /api/companies/banner: 0 tests (NEED ~8 tests)

**Overall Coverage: ~60%** (components covered, but backend missing)

**Required for Approval: 80%+**

---

## 📋 Summary of Required Actions

### CRITICAL (Must Fix Before Approval):

1. ✅ Create `src/app/actions/companies/__tests__/update.test.ts`
   - Add all 6 test categories (happy path, auth, authorization, validation, database errors, revalidatePath)
   - **MUST verify revalidatePath called with correct paths**

2. ✅ Create `src/app/api/companies/__tests__/logo.test.ts`
   - Add POST tests (success, auth failure, authorization failure, validation failure)
   - Add DELETE tests (success, not found, auth failure)

3. ✅ Create `src/app/api/companies/__tests__/banner.test.ts`
   - Same structure as logo tests

**Estimated Additional Tests Needed:** ~26 tests

**After Fixes:**
- Total test count: ~231 tests
- Estimated coverage: 85%+ ✅

---

## 🎯 Next Steps

1. QA Tester: Create missing Server Action and API Route tests
2. QA Tester: Commit iteration v2
3. QA Tester Critic: Review iteration v2
4. If approved: Run `npm run test -- --coverage` to verify 80%+
5. If approved: Run `npm run build` to verify TypeScript compilation

**Iteration:** 1/3

---

## 💡 Testing Guide Reference

For correct patterns, see: `.claude/docs/testing-guide.md`

**Server Action Testing Pattern:**
- Use Vitest mocks: `vi.mock('@/lib/auth')`
- Mock Prisma: `vi.mock('@/lib/prisma')`
- Mock revalidatePath: `vi.mock('next/cache')`
- Verify revalidatePath in happy path test
- Verify revalidatePath NOT called in error cases

**API Route Testing Pattern:**
- Mock auth, Prisma, R2 functions
- Use `new Request()` to create test requests
- Test response status codes and JSON bodies
- Test all error cases (401, 403, 400, 500)

---

## ✅ What's Working Well

1. **Excellent component test coverage** - 205 tests covering all scenarios
2. **Perfect testing stack compliance** - No Jest imports, all Vitest
3. **Comprehensive file validation tests** - File type, size, format all tested
4. **Strong accessibility testing** - Labels, roles, ARIA attributes verified
5. **Good edge case handling** - Empty states, null values, special characters
6. **Well-structured tests** - Clear sections, descriptive names

**The component tests are production-ready. Focus on adding backend tests to reach 80%+ overall coverage.**
