# Task Summary: VideoShorts Stage 02 - Companies

**Quick reference for coder agent**

---

## Task Execution Order

```
task-01 → task-02 → task-03 → task-04 → task-05
                              ↓
                           task-09
                              ↑
          task-06 → task-07 → task-08
```

---

## Task Quick Reference

### task-01: Database Schema & Infrastructure
- **Files:** 8 files, ~8k tokens
- **Focus:** Prisma migrations, seed categories, ActionResult types
- **Key Output:** CompanyProfile, Category, AuditLog models

### task-02: VIES Integration & Utilities
- **Files:** 6 files, ~6k tokens
- **Focus:** VIES API client, slug generation, validation schemas
- **Key Output:** NIP verification with retry logic

### task-03: Company Upgrade Flow
- **Files:** 12 files, ~12k tokens
- **Focus:** Upgrade form, Server Actions, upgrade page
- **Key Output:** USER → COMPANY conversion with VIES check

### task-04: Public Company Profile
- **Files:** 10 files, ~10k tokens
- **Focus:** Public profile page at `/companies/[slug]`
- **Key Output:** SEO-optimized company landing page

### task-05: Company Profile Edit
- **Files:** 15 files, ~15k tokens
- **Focus:** Edit form, logo/banner upload, category picker
- **Key Output:** Full profile management interface

### task-06: Admin Panel Foundation
- **Files:** 11 files, ~11k tokens
- **Focus:** Admin layout, sidebar, middleware protection
- **Key Output:** Admin infrastructure with dashboard

### task-07: Admin Companies Management
- **Files:** 9 files, ~9k tokens
- **Focus:** Companies table, verify/reject actions, audit logs
- **Key Output:** Company verification interface

### task-08: Admin Categories Management
- **Files:** 10 files, ~10k tokens
- **Focus:** Category CRUD, hierarchical tree, validation
- **Key Output:** Category management interface

### task-09: Navigation & Translations
- **Files:** 18 files, ~18k tokens
- **Focus:** Role-based menus, 5 languages (pl, en, de, es, ru)
- **Key Output:** Complete UI integration and i18n

---

## Critical Patterns to Follow

### 1. Server Action Pattern
```typescript
"use server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { ActionResult } from "@/lib/types/action-result"

export async function myAction(data: unknown): Promise<ActionResult<T>> {
  // 1. Auth check
  const session = await auth()
  if (!session?.user?.id) return createError("errors.unauthorized")

  // 2. Validation
  const parsed = schema.safeParse(data)
  if (!parsed.success) return formatZodError(parsed.error)

  // 3. Business logic
  const result = await prisma.model.create({ data: parsed.data })

  // 4. Revalidate
  revalidatePath("/path")

  // 5. Return
  return { success: true, data: result }
}
```

### 2. R2 Upload Pattern
Reuse from Stage 01 `avatar-upload.tsx`:
- Presigned URL from API route
- Client-side crop with react-image-crop
- Direct upload to R2
- Update DB with publicUrl via Server Action

### 3. Role-Based Navigation
```typescript
// Only show if user has specific role
{session.user.role === "COMPANY" && (
  <MenuItem href="/panel/company/profile" />
)}
```

---

## Common Pitfalls

1. **VIES API Instability:** Always implement retry logic and fallback
2. **Slug Conflicts:** Check uniqueness, auto-append suffix
3. **Image Upload Size:** Validate client-side (logo 5MB, banner 10MB)
4. **Admin Auth:** Check both session AND role in middleware + Server Actions
5. **Translations:** Complete all 5 languages (pl, en, de, es, ru)

---

## Testing Checklist

- [ ] Database migrations run successfully
- [ ] VIES API works with real Polish NIPs
- [ ] Company upgrade flow completes end-to-end
- [ ] Public profile accessible and SEO-optimized
- [ ] Logo/banner upload with crop works
- [ ] Admin can verify/reject companies
- [ ] Admin can manage categories
- [ ] Role-based navigation shows correct items
- [ ] All 5 languages have complete translations
- [ ] `npm run build` passes without errors

---

## File Locations Reference

```
prisma/
├── schema.prisma          # Extended with Stage 02 models
└── seed-categories.ts     # Initial category data

src/
├── app/
│   ├── actions/
│   │   ├── companies/     # Company upgrade, update
│   │   └── admin/         # Admin verify, reject, categories
│   ├── api/companies/     # Logo/banner upload endpoints
│   ├── (main)/[locale]/
│   │   ├── companies/[slug]/  # Public profile
│   │   ├── panel/company/     # Company dashboard
│   │   └── settings/upgrade/  # Upgrade flow
│   └── (admin)/[locale]/admin/  # Admin panel
├── components/
│   ├── companies/         # Company UI components
│   └── admin/             # Admin UI components
└── lib/
    ├── vies.ts           # VIES API client
    ├── utils/slug.ts     # Slug generation
    ├── validation.ts     # Zod schemas
    └── types/action-result.ts  # Standardized errors
```

---

**For Coder:** Read full task specs in `tasks/task-XX/spec.md` before implementation.
