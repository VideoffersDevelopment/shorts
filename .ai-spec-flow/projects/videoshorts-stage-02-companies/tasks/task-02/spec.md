# Task 02: VIES Integration & Utilities

## Overview

**Priority:** HIGH
**Dependencies:** task-01
**Complexity:** Medium (6 files, ~6k tokens)
**Status:** pending

## What to Build

Implement VIES API client for NIP verification and utility functions for slug generation. These are critical infrastructure pieces used by company upgrade and management features.

**RISK:** VIES API is external EU service and can be unstable. Implement robust error handling and retry logic.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/lib/vies.ts` | Create | VIES API client with retry logic |
| `src/lib/utils/slug.ts` | Create | Slug generation utility |
| `src/lib/validation.ts` | Modify | Add company validation schemas |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `soap` dependency |

## VIES Client Implementation

```typescript
// src/lib/vies.ts
import soap from "soap"

export interface VIESResponse {
  valid: boolean
  name: string
  address: string
  countryCode: string
  vatNumber: string
  requestDate: Date
}

const VIES_WSDL = "http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl"

export async function checkVAT(
  countryCode: string,
  vatNumber: string
): Promise<VIESResponse> {
  try {
    const client = await soap.createClientAsync(VIES_WSDL, {
      wsdl_options: {
        timeout: 10000 // 10s timeout
      }
    })

    const result = await client.checkVatAsync({
      countryCode,
      vatNumber
    })

    return {
      valid: result[0].valid,
      name: result[0].name || "",
      address: result[0].address || "",
      countryCode,
      vatNumber,
      requestDate: result[0].requestDate
    }
  } catch (error) {
    console.error("VIES API error:", error)
    throw new Error("VIES_API_UNAVAILABLE")
  }
}

// Retry wrapper with exponential backoff
export async function checkVATWithRetry(
  countryCode: string,
  vatNumber: string,
  maxRetries = 3
): Promise<VIESResponse> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await checkVAT(countryCode, vatNumber)
    } catch (error) {
      lastError = error as Error
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }

  throw lastError || new Error("VIES_API_UNAVAILABLE")
}
```

## Slug Generation Utility

```typescript
// src/lib/utils/slug.ts
import slugify from "slugify"

export async function generateSlug(
  text: string,
  model: any, // Prisma model with slug field
  maxRetries = 10
): Promise<string> {
  let baseSlug = slugify(text, {
    lower: true,
    strict: true,
    locale: "pl"
  })

  let slug = baseSlug
  let attempt = 0

  while (attempt < maxRetries) {
    const existing = await model.findUnique({
      where: { slug }
    })

    if (!existing) {
      return slug
    }

    // Append number
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  // Fallback: add timestamp
  return `${baseSlug}-${Date.now()}`
}
```

## Validation Schemas

```typescript
// src/lib/validation.ts (EXTEND)

// NIP validation (Polish VAT number)
export const nipSchema = z.string()
  .regex(/^\d{10}$|^\d{2}-\d{3}-\d{3}-\d{2}$/, "Invalid NIP format")
  .transform(nip => nip.replace(/-/g, "")) // Normalize to 10 digits

// Company upgrade form
export const companyUpgradeSchema = z.object({
  companyName: z.string().min(2, "Name too short").max(100, "Name too long"),
  nip: nipSchema,
  address: z.string().min(5, "Address too short").max(200, "Address too long"),
  contactEmail: z.string().email("Invalid email"),
  phone: z.string().optional()
})

export type CompanyUpgradeInput = z.infer<typeof companyUpgradeSchema>

// Company profile edit form
export const companyProfileSchema = z.object({
  companyName: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url("Invalid URL").optional(),
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
  address: z.string().max(200).optional(),
  phone: z.string().optional(),
  businessHours: z.record(z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/)
  })).optional()
})

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>

// Category management
export const categorySchema = z.object({
  name: z.string().min(2, "Name too short").max(50, "Name too long"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  icon: z.string().optional(),
  parentId: z.string().cuid().nullable().optional(),
  order: z.number().int().min(0).optional(),
  enabled: z.boolean().optional()
})

export type CategoryInput = z.infer<typeof categorySchema>
```

## Acceptance Criteria

- [ ] VIES client can check VAT numbers (test with real Polish NIP)
- [ ] Retry logic works (exponential backoff: 1s, 2s, 4s)
- [ ] VIES errors handled gracefully (return error, don't crash)
- [ ] Slug generation creates unique slugs
- [ ] Slug conflicts handled (append -2, -3, etc.)
- [ ] NIP validation regex works for both formats: `1234567890` and `12-345-678-90`
- [ ] All Zod schemas validate correctly
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

This task is backend-only. Verification via API testing:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create test script: `test-vies.ts` | Script ready |
| 2 | Test VIES with valid NIP: `7010851675` | Returns `{valid: true, name: "...", address: "..."}` |
| 3 | Test VIES with invalid NIP: `0000000000` | Returns `{valid: false}` |
| 4 | Test slug generation: `"Kowalska Cukiernia"` | Returns `"kowalska-cukiernia"` |
| 5 | Test slug conflict: create duplicate | Returns `"kowalska-cukiernia-2"` |
| 6 | Test NIP validation: `"12-345-678-90"` | Normalizes to `"1234567890"` |

## Notes

- **VIES API:** EU public service, can be slow or unavailable
- **Retry Logic:** Critical for production stability
- **Error Handling:** Fallback to manual verification if VIES fails
- **Polish NIP Format:** 10 digits, optionally with dashes (XX-XXX-XXX-XX)
- **Slug Uniqueness:** Database constraint, must check before creating
