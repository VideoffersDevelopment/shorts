# Task 01: Database Schema & Infrastructure

## Overview

**Priority:** HIGH
**Dependencies:** None
**Complexity:** Simple (8 files, ~8k tokens)
**Status:** pending

## What to Build

Create the database schema for Stage 02, including CompanyProfile, Category, and AuditLog models. Run migrations and seed initial categories.

This task establishes the foundation for all company-related features.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `prisma/migrations/YYYYMMDD_add_company_profiles.sql` | Create | Prisma migration for Stage 02 models |
| `prisma/seed-categories.ts` | Create | Seed script for initial categories |
| `src/lib/types/action-result.ts` | Create | Standardized error handling types |

## Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add CompanyProfile, Category, AuditLog models + User relations |
| `prisma/seed.ts` | Import and run seed-categories script |
| `package.json` | Add seed script if not present |

## Database Models

### CompanyProfile Model
```prisma
model CompanyProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  companyName   String
  slug          String    @unique
  nip           String    @unique
  viesVerified  Boolean   @default(false)
  verifiedAt    DateTime? @db.Timestamptz
  verifiedBy    String?
  logo          String?
  banner        String?
  description   String?   @db.Text
  categoryId    String?
  website       String?
  socialLinks   Json?
  latitude      Float?
  longitude     Float?
  address       String?
  phone         String?
  businessHours Json?
  createdAt     DateTime  @default(now()) @db.Timestamptz
  updatedAt     DateTime  @updatedAt @db.Timestamptz

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id])

  @@index([userId])
  @@index([slug])
  @@index([nip])
  @@index([categoryId])
  @@index([viesVerified])
  @@index([latitude, longitude])
}
```

### Category Model
```prisma
model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  icon      String?
  parentId  String?
  order     Int      @default(0)
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz

  parent          Category?        @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[]       @relation("CategoryHierarchy")
  companyProfiles CompanyProfile[]

  @@index([slug])
  @@index([parentId])
  @@index([enabled])
  @@index([order])
}
```

### AuditLog Model
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String
  targetType String
  targetId   String
  metadata   Json?
  createdAt  DateTime @default(now()) @db.Timestamptz

  admin User @relation("AdminAuditLogs", fields: [adminId], references: [id])

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

### User Model Extension
```prisma
model User {
  // ... existing fields ...

  // NEW relations
  companyProfile CompanyProfile?
  adminAuditLogs AuditLog[]      @relation("AdminAuditLogs")
}
```

## Seed Data - Initial Categories

```typescript
// prisma/seed-categories.ts
const initialCategories = [
  {
    name: "Jedzenie i Napoje",
    slug: "jedzenie-napoje",
    icon: "utensils",
    order: 1,
    children: [
      { name: "Restauracje", slug: "restauracje", order: 1 },
      { name: "Kawiarnie", slug: "kawiarnie", order: 2 },
      { name: "Catering", slug: "catering", order: 3 }
    ]
  },
  {
    name: "Usługi",
    slug: "uslugi",
    icon: "briefcase",
    order: 2,
    children: [
      { name: "Fryzjerzy", slug: "fryzjerzy", order: 1 },
      { name: "Mechanicy", slug: "mechanicy", order: 2 },
      { name: "Serwis IT", slug: "serwis-it", order: 3 }
    ]
  },
  {
    name: "Retail",
    slug: "retail",
    icon: "shopping-bag",
    order: 3,
    children: [
      { name: "Odzież", slug: "odziez", order: 1 },
      { name: "Elektronika", slug: "elektronika", order: 2 },
      { name: "Meble", slug: "meble", order: 3 }
    ]
  }
]
```

## ActionResult Types

```typescript
// src/lib/types/action-result.ts
export type ActionError = {
  success: false
  error: string
  code?: string
  field?: string
  details?: unknown
}

export type ActionSuccess<T> = {
  success: true
  data: T
  message?: string
}

export type ActionResult<T> = ActionSuccess<T> | ActionError

export function formatZodError(error: ZodError): ActionError {
  const firstError = error.errors[0]
  return {
    success: false,
    error: firstError.message,
    code: "VALIDATION_ERROR",
    field: firstError.path.join("."),
    details: error.errors
  }
}

export function createError(
  key: string,
  code?: string,
  field?: string
): ActionError {
  return {
    success: false,
    error: key,
    code,
    field
  }
}
```

## Acceptance Criteria

- [ ] Prisma schema includes CompanyProfile, Category, AuditLog models
- [ ] User model extended with companyProfile and adminAuditLogs relations
- [ ] Migration runs successfully: `npx prisma migrate dev --name add_company_profiles`
- [ ] Seed script creates 3 parent categories with 9 subcategories
- [ ] ActionResult types created in `src/lib/types/action-result.ts`
- [ ] All indexes created correctly
- [ ] No breaking changes to existing Stage 01 schema
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

This task is backend-only. Verification via database inspection:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run `npx prisma migrate dev` | Migration succeeds |
| 2 | Run `npx prisma db seed` | 12 categories created (3 parents + 9 children) |
| 3 | Run `npx prisma studio` | Open Prisma Studio |
| 4 | Navigate to Category model | See 12 categories with hierarchy |
| 5 | Check CompanyProfile model | Schema visible, 0 records |
| 6 | Check AuditLog model | Schema visible, 0 records |

## Notes

- **ADDITIVE ONLY:** No breaking changes to Stage 01
- All DateTime fields use `@db.Timestamptz` (consistent with Stage 01)
- All IDs use `cuid()` (consistent with Stage 01)
- Seed script is idempotent (check for existing categories before creating)
