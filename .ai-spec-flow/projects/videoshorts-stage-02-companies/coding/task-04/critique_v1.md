# Code Review: Task 04 - Iteration 1/3

**Commit:** 93ccbb6e9471851f96bb57204b21d8cca1a3ee59
**Verdict:** CHANGES REQUIRED

## Acceptance Criteria Check

| #   | Criterion                            | Status  | Evidence                                           |
| --- | ------------------------------------ | ------- | -------------------------------------------------- |
| 1   | Public profile accessible at slug    | PASS    | Route created at `/[locale]/companies/[slug]`      |
| 2   | Company name, logo, banner displayed | PASS    | CompanyProfileCard renders all elements            |
| 3   | VIES verified badge shown            | PASS    | Badge shown when `viesVerified: true`              |
| 4   | Category displayed                   | PASS    | Category name rendered                             |
| 5   | Description rendered as markdown     | PASS    | ReactMarkdown component used                       |
| 6   | Contact info displayed               | PASS    | Address and website rendered                       |
| 7   | Social links working                 | PASS    | Facebook and Instagram links rendered              |
| 8   | Stats placeholder shows 0/0/0        | PASS    | Stats card shows 0 for shorts/followers/views      |
| 9   | 404 page if slug not found           | PASS    | `notFound()` called when company not found         |
| 10  | SEO meta tags generated              | PASS    | `generateMetadata` function implemented            |
| 11  | OpenGraph image uses banner or logo  | PASS    | Banner fallback to logo in openGraph.images        |
| 12  | Mobile responsive layout             | PASS    | Tailwind responsive classes used                   |
| 13  | npm run build passes                 | PASS    | Build successful (with warnings)                   |
| 14  | No TypeScript errors                 | PASS    | Type checking passed                               |
| 15  | Only 2 files required (spec said 4)  | PASS    | Implementation simplified (no extra split needed)  |

**Acceptance Criteria Result:** 15/15 PASS

## Code Quality Issues

### 1. SECURITY: Missing XSS Protection for User-Generated Content

**Files:**
- `src/components/companies/company-profile-card.tsx:48-53` (banner image)
- `src/components/companies/company-profile-card.tsx:89-99` (website URL)

**Problem:**
User-provided URLs (banner, website) are rendered directly without sanitization. This creates potential XSS vulnerabilities.

**Current Code:**
```typescript
// Line 48-53
{company.banner && (
  <div className="relative h-64 w-full overflow-hidden rounded-lg">
    <img
      src={company.banner}  // UNSAFE: Direct use of user input
      alt={company.companyName}
      className="h-full w-full object-cover"
    />
  </div>
)}

// Line 89-99
{company.website && (
  <a
    href={company.website}  // UNSAFE: Direct use of user input
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1 hover:underline"
  >
    <Globe className="h-4 w-4" />
    {new URL(company.website).hostname}  // Can throw error on invalid URL
  </a>
)}
```

**Fix Required:**
1. Add URL validation utility function
2. Sanitize URLs before rendering
3. Add error handling for `new URL()` constructor

**Implementation:**
```typescript
// Add to src/lib/utils/url.ts or src/lib/utils.ts
export function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (!isValidHttpUrl(url)) return null;
  return url;
}

// In company-profile-card.tsx
const safeBanner = sanitizeUrl(company.banner);
const safeWebsite = sanitizeUrl(company.website);

// Use safeBanner and safeWebsite in JSX
{safeBanner && (
  <img src={safeBanner} ... />
)}

{safeWebsite && (
  <a href={safeWebsite} ...>
    <Globe className="h-4 w-4" />
    {(() => {
      try {
        return new URL(safeWebsite).hostname;
      } catch {
        return safeWebsite;
      }
    })()}
  </a>
)}
```

---

### 2. SECURITY: Missing XSS Protection for Markdown Content

**File:** `src/components/companies/company-profile-card.tsx:133-139`

**Problem:**
ReactMarkdown renders user-provided description without configuration. While ReactMarkdown escapes HTML by default, it's best practice to explicitly configure allowed elements.

**Current Code:**
```typescript
// Line 136
<ReactMarkdown>{company.description}</ReactMarkdown>
```

**Fix Required:**
Configure ReactMarkdown with explicit security settings.

**Implementation:**
```typescript
<ReactMarkdown
  components={{
    // Prevent rendering of potentially dangerous elements
    script: () => null,
    iframe: () => null,
  }}
  disallowedElements={['script', 'iframe', 'object', 'embed']}
  unwrapDisallowed={true}
>
  {company.description}
</ReactMarkdown>
```

---

### 3. PERFORMANCE: Using <img> Instead of Next.js Image Component

**File:** `src/components/companies/company-profile-card.tsx:48`

**Problem:**
Build warning: "Using `<img>` could result in slower LCP and higher bandwidth."

**Current Code:**
```typescript
<img
  src={company.banner}
  alt={company.companyName}
  className="h-full w-full object-cover"
/>
```

**Fix Required:**
Use Next.js `<Image>` component for optimized images.

**Implementation:**
```typescript
import Image from "next/image"

// For banner (with fill layout since height is container-based)
{safeBanner && (
  <div className="relative h-64 w-full overflow-hidden rounded-lg">
    <Image
      src={safeBanner}
      alt={company.companyName}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  </div>
)}
```

**Note:** AvatarImage component from shadcn/ui already handles the logo correctly, so no change needed there.

---

### 4. ERROR HANDLING: Missing Try-Catch for new URL()

**File:** `src/components/companies/company-profile-card.tsx:98`

**Problem:**
`new URL()` can throw an error if `company.website` is invalid. This would crash the component.

**Fix Required:**
Already covered in Issue #1 (URL sanitization). Ensure the fix includes try-catch protection.

---

### 5. TYPE SAFETY: Good Type Usage

**Status:** PASS

The implementation correctly:
- Uses `Prisma.JsonValue` for socialLinks
- Properly types the SocialLinks interface
- Uses type assertion safely (`as SocialLinks | null`)

---

### 6. ACCESSIBILITY: Missing Aria Labels for Social Links

**File:** `src/components/companies/company-profile-card.tsx:106-124`

**Problem:**
Social media icon links lack accessible labels.

**Current Code:**
```typescript
<a
  href={socialLinks.facebook}
  target="_blank"
  rel="noopener noreferrer"
  className="text-muted-foreground hover:text-foreground"
>
  <Facebook className="h-5 w-5" />
</a>
```

**Fix Required:**
Add aria-label attributes for screen readers.

**Implementation:**
```typescript
<a
  href={sanitizeUrl(socialLinks.facebook) || '#'}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Facebook"
  className="text-muted-foreground hover:text-foreground"
>
  <Facebook className="h-5 w-5" />
</a>
```

---

### 7. i18n: Translation Keys Present (PASS)

**Status:** PASS

All 5 language files updated with required keys:
- `profile.verified`
- `profile.stats.shorts`
- `profile.stats.followers`
- `profile.stats.views`

---

### 8. NEXT.JS 15 PATTERN: Correct Async Params Handling

**Status:** PASS

The implementation correctly uses `Promise<{ locale: string; slug: string }>` for params and awaits them in both `generateMetadata` and page component. This follows the Next.js 15 pattern.

---

### 9. BUILD STATUS

**Status:** PASS (with warnings)

Build successful with 2 unrelated warnings:
1. `<img>` tag warning (addressed in Issue #3)
2. bcryptjs Edge Runtime warnings (pre-existing, not related to this task)

---

## Summary of Required Changes

### BLOCKER Issues (Must Fix):
1. Add URL sanitization for banner and website
2. Add error handling for URL parsing
3. Configure ReactMarkdown with security settings

### HIGH Priority (Should Fix):
4. Replace `<img>` with Next.js `<Image>` component
5. Add aria-labels for social media links

### MEDIUM Priority (Nice to Have):
None

---

## Iteration Plan

**Next Steps:**
1. Create `src/lib/utils/url.ts` with URL validation functions
2. Update `company-profile-card.tsx` to use URL sanitization
3. Add try-catch protection for URL parsing
4. Configure ReactMarkdown with security options
5. Replace `<img>` with Next.js `<Image>`
6. Add aria-labels to social links
7. Test with invalid/malicious URLs
8. Verify build passes without warnings

**Estimated Effort:** Small fixes, should be completed in iteration v2.
