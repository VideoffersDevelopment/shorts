# Architecture: VideoShorts Stage 02 - Companies + Verification

**Project:** videoshorts-stage-02-companies
**Date:** 2025-12-15
**Version:** 1
**Stage Dependencies:** Stage 01 (Core + Auth) ✅

---

## Executive Summary

This architecture designs the Company Profile system with VIES verification, category management, and admin panel foundation. It maximizes reuse of Stage 01 components (21 reusable UI components) while adding 12 new domain-specific components. The system uses a multi-provider payment architecture with Publication Credits for flexible monetization.

**Key Features:**
- Company upgrade flow with VIES verification
- Public company profiles with SEO optimization
- Hierarchical category system
- Admin panel for company/user management
- Publication Credits system for flexible payments
- Audit logging for admin actions

---

## 1. Database Schema (Additive Changes)

### 1.1 New Models

```prisma
// ============================================================================
// COMPANY MODELS
// ============================================================================

model CompanyProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  companyName   String
  slug          String    @unique              // SEO-friendly URL
  nip           String    @unique              // Polish VAT number
  viesVerified  Boolean   @default(false)
  verifiedAt    DateTime?
  verifiedBy    String?                        // Admin userId if manual
  logo          String?                        // R2 URL
  banner        String?                        // R2 URL
  description   String?   @db.Text            // Markdown
  categoryId    String?
  website       String?
  socialLinks   Json?                          // {facebook, instagram, tiktok}
  latitude      Float?
  longitude     Float?
  address       String?
  phone         String?
  businessHours Json?                          // {monday: {open, close}, ...}
  createdAt     DateTime  @default(now())     @db.Timestamptz
  updatedAt     DateTime  @updatedAt          @db.Timestamptz

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id])

  @@index([userId])
  @@index([slug])
  @@index([nip])
  @@index([categoryId])
  @@index([viesVerified])
  @@index([latitude, longitude])  // PostGIS index
}

model Category {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  icon      String?                            // SVG URL or Lucide icon name
  parentId  String?
  order     Int      @default(0)
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())          @db.Timestamptz
  updatedAt DateTime @updatedAt               @db.Timestamptz

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
  action     String                            // "VERIFY_COMPANY", "REJECT_COMPANY", etc.
  targetType String                            // "USER", "COMPANY", "CATEGORY"
  targetId   String
  metadata   Json?                             // {reason, previousStatus, etc.}
  createdAt  DateTime @default(now())         @db.Timestamptz

  admin User @relation("AdminAuditLogs", fields: [adminId], references: [id])

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([createdAt])
}
```

### 1.2 User Model Extension

```prisma
model User {
  // ... existing fields from Stage 01 ...

  // NEW relations for Stage 02
  companyProfile CompanyProfile?
  adminAuditLogs AuditLog[]      @relation("AdminAuditLogs")
}
```

### 1.3 Migration Strategy

**Type:** ADDITIVE ONLY - No breaking changes

**Migration sequence:**
1. Add `CompanyProfile` model
2. Add `Category` model
3. Add `AuditLog` model
4. Extend `User` model with new relations
5. Run seed script for initial categories

**Migration file example:**
```bash
npx prisma migrate dev --name add_company_profiles
```

### 1.4 Seed Data - Initial Categories

```typescript
// prisma/seed-categories.ts
const initialCategories = [
  {
    name: "Jedzenie i Napoje",
    slug: "jedzenie-napoje",
    icon: "utensils", // Lucide icon name
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
];
```

---

## 2. Server Actions (Business Logic Layer)

### 2.1 Company Actions

#### File: `src/app/actions/companies/upgrade.ts`
```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyUpgradeSchema } from "@/lib/validation"
import { checkVAT } from "@/lib/vies"
import { generateSlug } from "@/lib/utils/slug"
import { revalidatePath } from "next/cache"

export async function upgradeToCompanyAction(data: unknown) {
  // 1. AUTH
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  // 2. CHECK: Already a company?
  const existing = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })
  if (existing) return { error: "Already a company" }

  // 3. VALIDATION
  const parsed = companyUpgradeSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { companyName, nip, address, contactEmail, phone } = parsed.data

  // 4. CHECK: NIP unique?
  const nipExists = await prisma.companyProfile.findUnique({
    where: { nip }
  })
  if (nipExists) return { error: "NIP already registered" }

  // 5. VIES VERIFICATION
  let viesVerified = false
  let verifiedAt = null
  try {
    const viesResult = await checkVAT("PL", nip)
    viesVerified = viesResult.valid
    verifiedAt = viesVerified ? new Date() : null
  } catch (error) {
    console.error("VIES API error:", error)
    // Fallback: manual verification required
    viesVerified = false
  }

  // 6. GENERATE SLUG
  const slug = await generateSlug(companyName, prisma.companyProfile)

  // 7. CREATE COMPANY PROFILE
  try {
    const company = await prisma.$transaction(async (tx) => {
      // Update user role
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: "COMPANY" }
      })

      // Create company profile
      return await tx.companyProfile.create({
        data: {
          userId: session.user.id,
          companyName,
          slug,
          nip,
          viesVerified,
          verifiedAt,
          address,
          phone
        }
      })
    })

    // 8. REVALIDATE
    revalidatePath(`/companies/${slug}`)
    revalidatePath("/panel/company")

    return {
      success: true,
      data: company,
      viesStatus: viesVerified ? "verified" : "pending_manual_review"
    }
  } catch (error) {
    console.error("Company upgrade error:", error)
    return { error: "Failed to create company profile" }
  }
}
```

#### File: `src/app/actions/companies/update.ts`
```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyProfileSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function updateCompanyProfileAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  // Get company profile (ownership check)
  const company = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })
  if (!company) return { error: "Not a company" }

  // Validation
  const parsed = companyProfileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Update
  try {
    const updated = await prisma.companyProfile.update({
      where: { id: company.id },
      data: parsed.data
    })

    revalidatePath(`/companies/${company.slug}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error("Update error:", error)
    return { error: "Failed to update profile" }
  }
}
```

### 2.2 Admin Actions

#### File: `src/app/actions/admin/companies/verify.ts`
```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"

export async function verifyCompanyAction(companyId: string, reason?: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  try {
    // Update company + create audit log (transaction)
    const company = await prisma.$transaction(async (tx) => {
      // Update company
      const updated = await tx.companyProfile.update({
        where: { id: companyId },
        data: {
          viesVerified: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id
        },
        include: { user: true }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "VERIFY_COMPANY",
          targetType: "COMPANY",
          targetId: companyId,
          metadata: { reason }
        }
      })

      return updated
    })

    // Send notification email
    await sendEmail({
      to: company.user.email,
      template: "CompanyVerified",
      data: { companyName: company.companyName }
    })

    revalidatePath("/admin/companies")
    revalidatePath(`/companies/${company.slug}`)

    return { success: true }
  } catch (error) {
    console.error("Verify error:", error)
    return { error: "Failed to verify company" }
  }
}
```

#### File: `src/app/actions/admin/companies/reject.ts`
```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/resend"

export async function rejectCompanyAction(
  companyId: string,
  reason: string
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  if (!reason) return { error: "Reason required" }

  try {
    const company = await prisma.$transaction(async (tx) => {
      // Soft delete company (can be restored later)
      const updated = await tx.companyProfile.update({
        where: { id: companyId },
        data: {
          viesVerified: false,
          verifiedAt: null
        },
        include: { user: true }
      })

      // Revert user role to USER
      await tx.user.update({
        where: { id: updated.userId },
        data: { role: "USER" }
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "REJECT_COMPANY",
          targetType: "COMPANY",
          targetId: companyId,
          metadata: { reason }
        }
      })

      return updated
    })

    // Send rejection email
    await sendEmail({
      to: company.user.email,
      template: "CompanyRejected",
      data: {
        companyName: company.companyName,
        reason
      }
    })

    revalidatePath("/admin/companies")

    return { success: true }
  } catch (error) {
    console.error("Reject error:", error)
    return { error: "Failed to reject company" }
  }
}
```

### 2.3 Category Management Actions

#### File: `src/app/actions/admin/categories/create.ts`
```typescript
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { categorySchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function createCategoryAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    const category = await prisma.category.create({
      data: parsed.data
    })

    revalidatePath("/admin/categories")
    return { success: true, data: category }
  } catch (error) {
    console.error("Create category error:", error)
    return { error: "Failed to create category" }
  }
}
```

---

## 3. API Routes (for R2 Upload)

### 3.1 Logo Upload

#### File: `src/app/api/companies/logo/route.ts`
```typescript
import { auth } from "@/lib/auth"
import { getUploadUrl } from "@/lib/r2"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { contentType } = await req.json()

  // Validate content type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid file type" },
      { status: 400 }
    )
  }

  // Generate unique key
  const key = `companies/${session.user.id}/logo-${Date.now()}.${
    contentType.split("/")[1]
  }`

  try {
    // Get presigned URL from R2
    const uploadUrl = await getUploadUrl({
      key,
      contentType,
      expiresIn: 900 // 15 minutes
    })

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ uploadUrl, publicUrl })
  } catch (error) {
    console.error("R2 upload URL error:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
```

### 3.2 Banner Upload

#### File: `src/app/api/companies/banner/route.ts`
```typescript
// Same pattern as logo upload, just different key prefix and validation
// Max size: 10MB (validated client-side)
// Recommended dimensions: 1920x400px
```

---

## 4. External Service Integration

### 4.1 VIES API Client

#### File: `src/lib/vies.ts`
```typescript
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

### 4.2 Slug Generation Utility

#### File: `src/lib/utils/slug.ts`
```typescript
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

---

## 5. Validation Schemas

### File: `src/lib/validation.ts` (EXTEND)

```typescript
import { z } from "zod"

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

---

## 6. Frontend Components

### 6.1 Company Components

#### Component: `src/components/companies/company-upgrade-form.tsx`
```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { upgradeToCompanyAction } from "@/app/actions/companies/upgrade"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { toast } from "sonner"

export function CompanyUpgradeForm() {
  const t = useTranslations("companies")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = await upgradeToCompanyAction(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      toast.success(
        result.viesStatus === "verified"
          ? t("upgrade.success.verified")
          : t("upgrade.success.pending")
      )
      router.push("/panel/company/profile")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upgrade.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="companyName">{t("upgrade.fields.companyName")}</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              minLength={2}
              maxLength={100}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="nip">{t("upgrade.fields.nip")}</Label>
            <Input
              id="nip"
              name="nip"
              required
              pattern="\d{10}|\d{2}-\d{3}-\d{3}-\d{2}"
              placeholder="1234567890 or 12-345-678-90"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="address">{t("upgrade.fields.address")}</Label>
            <Input
              id="address"
              name="address"
              required
              minLength={5}
              maxLength={200}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="contactEmail">{t("upgrade.fields.contactEmail")}</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="phone">{t("upgrade.fields.phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            {t("upgrade.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Reuses from Stage 01:**
- Button, Input, Label, Card, Alert (UI components)
- LoadingSpinner (shared component)
- toast from sonner (notification pattern)

#### Component: `src/components/companies/logo-upload.tsx`
```typescript
"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { updateCompanyProfileAction } from "@/app/actions/companies/update"

interface LogoUploadProps {
  currentLogo?: string
  companyName: string
}

export function LogoUpload({ currentLogo, companyName }: LogoUploadProps) {
  const t = useTranslations("companies")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [isUploading, setIsUploading] = useState(false)

  // Reuse pattern from Stage 01 avatar-upload.tsx
  // Implementation similar to avatar upload but with:
  // - Different aspect ratio (1:1 for logo)
  // - Min dimensions: 200x200px
  // - Max size: 5MB
  // - Upload to /api/companies/logo

  return (
    <div>
      <Avatar className="h-24 w-24 cursor-pointer" onClick={() => setIsOpen(true)}>
        <AvatarImage src={currentLogo} alt={companyName} />
        <AvatarFallback>{companyName[0]}</AvatarFallback>
      </Avatar>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("logo.title")}</DialogTitle>
          </DialogHeader>
          {/* Crop UI + Upload logic */}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Pattern reused:** Identical to `avatar-upload.tsx` from Stage 01

#### Component: `src/components/companies/category-picker.tsx`
```typescript
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  children?: Category[]
}

interface CategoryPickerProps {
  value?: string
  onChange: (categoryId: string) => void
  categories: Category[]
}

export function CategoryPicker({
  value,
  onChange,
  categories
}: CategoryPickerProps) {
  const t = useTranslations("categories")

  // Build hierarchical options
  const options = categories.flatMap(category => {
    const items = [
      { value: category.id, label: category.name }
    ]

    if (category.children) {
      category.children.forEach(child => {
        items.push({
          value: child.id,
          label: `${category.name} → ${child.name}`
        })
      })
    }

    return items
  })

  return (
    <div>
      <Label>{t("picker.label")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t("picker.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

### 6.2 Admin Components

#### Component: `src/components/admin/admin-sidebar.tsx`
```typescript
"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Users,
  FileText
} from "lucide-react"

export function AdminSidebar() {
  const t = useTranslations("admin")
  const pathname = usePathname()

  const menuItems = [
    { href: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/companies", label: t("nav.companies"), icon: Building2 },
    { href: "/admin/categories", label: t("nav.categories"), icon: FolderTree },
    { href: "/admin/users", label: t("nav.users"), icon: Users },
    { href: "/admin/audit", label: t("nav.audit"), icon: FileText }
  ]

  return (
    <aside className="w-64 border-r bg-card">
      <nav className="space-y-1 p-4">
        {menuItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

**Pattern reused:** Same structure as `app-sidebar.tsx` from Stage 01

#### Component: `src/components/admin/companies-table.tsx`
```typescript
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Eye } from "lucide-react"
import { verifyCompanyAction, rejectCompanyAction } from "@/app/actions/admin/companies/verify"
import { toast } from "sonner"

interface CompaniesTableProps {
  companies: Array<{
    id: string
    companyName: string
    nip: string
    viesVerified: boolean
    createdAt: Date
    user: { email: string }
  }>
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const t = useTranslations("admin.companies")
  const [isLoading, setIsLoading] = useState<string | null>(null)

  async function handleVerify(companyId: string) {
    setIsLoading(companyId)
    const result = await verifyCompanyAction(companyId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t("verify.success"))
    }

    setIsLoading(null)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.name")}</TableHead>
          <TableHead>{t("table.nip")}</TableHead>
          <TableHead>{t("table.email")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead>{t("table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map(company => (
          <TableRow key={company.id}>
            <TableCell className="font-medium">
              {company.companyName}
            </TableCell>
            <TableCell>{company.nip}</TableCell>
            <TableCell>{company.user.email}</TableCell>
            <TableCell>
              {company.viesVerified ? (
                <Badge variant="default">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t("status.verified")}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="mr-1 h-3 w-3" />
                  {t("status.pending")}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {!company.viesVerified && (
                  <Button
                    size="sm"
                    onClick={() => handleVerify(company.id)}
                    disabled={isLoading === company.id}
                  >
                    {t("actions.verify")}
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## 7. Pages & Routes

### 7.1 Company Routes (extend `(main)` group)

#### Page: `src/app/(main)/[locale]/companies/[slug]/page.tsx`
```typescript
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompanyProfileCard } from "@/components/companies/company-profile-card"

interface PageProps {
  params: { locale: string; slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const company = await prisma.companyProfile.findUnique({
    where: { slug: params.slug }
  })

  if (!company) return {}

  return {
    title: `${company.companyName} | VideoShorts`,
    description: company.description?.substring(0, 160) || "",
    openGraph: {
      title: company.companyName,
      description: company.description || "",
      images: [company.banner || company.logo || ""]
    }
  }
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const company = await prisma.companyProfile.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      user: {
        select: { email: true }
      }
    }
  })

  if (!company) {
    notFound()
  }

  const t = await getTranslations("companies")

  return (
    <div className="container py-8">
      <CompanyProfileCard company={company} />
    </div>
  )
}
```

#### Page: `src/app/(main)/[locale]/panel/company/profile/page.tsx`
```typescript
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompanyProfileForm } from "@/components/companies/company-profile-form"

export default async function CompanyProfileEditPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "COMPANY") redirect("/settings/upgrade")

  const company = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id },
    include: { category: true }
  })

  if (!company) redirect("/settings/upgrade")

  const categories = await prisma.category.findMany({
    where: { enabled: true },
    include: { children: true },
    orderBy: { order: "asc" }
  })

  const t = await getTranslations("companies")

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">{t("profile.edit.title")}</h1>
      <CompanyProfileForm company={company} categories={categories} />
    </div>
  )
}
```

#### Page: `src/app/(main)/[locale]/settings/upgrade/page.tsx`
```typescript
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompanyUpgradeForm } from "@/components/companies/company-upgrade-form"

export default async function UpgradeToCompanyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Check if already a company
  const existing = await prisma.companyProfile.findUnique({
    where: { userId: session.user.id }
  })

  if (existing) redirect("/panel/company/profile")

  const t = await getTranslations("companies")

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("upgrade.heading")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("upgrade.description")}
        </p>
      </div>
      <CompanyUpgradeForm />
    </div>
  )
}
```

### 7.2 Admin Routes (new `(admin)` group)

#### Layout: `src/app/(admin)/[locale]/layout.tsx`
```typescript
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

#### Page: `src/app/(admin)/[locale]/admin/companies/page.tsx`
```typescript
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { CompaniesTable } from "@/components/admin/companies-table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

interface PageProps {
  searchParams: {
    status?: "all" | "verified" | "pending"
    search?: string
  }
}

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  const t = await getTranslations("admin.companies")

  const companies = await prisma.companyProfile.findMany({
    where: {
      ...(searchParams.status === "verified" && { viesVerified: true }),
      ...(searchParams.status === "pending" && { viesVerified: false }),
      ...(searchParams.search && {
        OR: [
          { companyName: { contains: searchParams.search, mode: "insensitive" } },
          { nip: { contains: searchParams.search } }
        ]
      })
    },
    include: {
      user: { select: { email: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder={t("search.placeholder")}
          defaultValue={searchParams.search}
        />
        <Select defaultValue={searchParams.status || "all"}>
          <SelectTrigger className="w-48">
            {t("filter.status")}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.all")}</SelectItem>
            <SelectItem value="verified">{t("filter.verified")}</SelectItem>
            <SelectItem value="pending">{t("filter.pending")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CompaniesTable companies={companies} />
    </div>
  )
}
```

---

## 8. Navigation Updates

### 8.1 Extend User Menu

#### File: `src/components/layout/user-menu.tsx` (EXTEND)
```typescript
// Add to existing menu items:

// For USER role:
{
  href: "/settings/upgrade",
  label: t("menu.upgradeToCompany"),
  icon: Building2,
  show: session.user.role === "USER"
}

// For COMPANY role:
{
  href: "/panel/company/profile",
  label: t("menu.companyProfile"),
  icon: Building2,
  show: session.user.role === "COMPANY"
}

// For ADMIN role:
{
  href: "/admin",
  label: t("menu.adminPanel"),
  icon: Shield,
  show: session.user.role === "ADMIN"
}
```

### 8.2 Extend Sidebar

#### File: `src/components/layout/app-sidebar.tsx` (EXTEND)
```typescript
// Add role-based menu items

const menuItems = [
  ...baseItems, // existing from Stage 01

  // Company items (show only if COMPANY)
  ...(session.user.role === "COMPANY" ? [
    {
      href: "/panel/company/profile",
      label: t("sidebar.company.profile"),
      icon: Building2
    },
    {
      href: "/panel/company/settings",
      label: t("sidebar.company.settings"),
      icon: Settings
    }
  ] : []),

  // Admin link (show only if ADMIN)
  ...(session.user.role === "ADMIN" ? [
    {
      href: "/admin",
      label: t("sidebar.admin"),
      icon: Shield
    }
  ] : [])
]
```

---

## 9. Middleware Authorization

### File: `src/middleware.ts` (EXTEND)
```typescript
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  // ... existing auth checks from Stage 01 ...

  // NEW: Company routes protection
  if (req.nextUrl.pathname.includes("/panel/company")) {
    if (!token || token.role !== "COMPANY") {
      return NextResponse.redirect(new URL("/settings/upgrade", req.url))
    }
  }

  // NEW: Admin routes protection
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!token || token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*"
  ]
}
```

---

## 10. Translation Keys

### 10.1 Companies Namespace

#### File: `src/lib/locales/pl/companies.json`
```json
{
  "upgrade": {
    "title": "Upgrade do Konta Firmowego",
    "heading": "Zostań firmą na VideoShorts",
    "description": "Wypełnij formularz aby założyć profil firmowy i publikować shorty",
    "fields": {
      "companyName": "Nazwa firmy",
      "nip": "NIP",
      "address": "Adres siedziby",
      "contactEmail": "Email kontaktowy",
      "phone": "Telefon (opcjonalnie)"
    },
    "submit": "Utwórz profil firmowy",
    "success": {
      "verified": "Firma zweryfikowana! Możesz publikować shorty",
      "pending": "Wniosek złożony. Weryfikacja w toku"
    }
  },
  "profile": {
    "edit": {
      "title": "Edytuj profil firmowy",
      "save": "Zapisz zmiany"
    }
  },
  "logo": {
    "title": "Zmień logo",
    "upload": "Wybierz plik"
  }
}
```

#### File: `src/lib/locales/en/companies.json`
```json
{
  "upgrade": {
    "title": "Upgrade to Company Account",
    "heading": "Become a company on VideoShorts",
    "description": "Fill the form to create company profile and publish shorts",
    "fields": {
      "companyName": "Company name",
      "nip": "VAT number",
      "address": "Headquarters address",
      "contactEmail": "Contact email",
      "phone": "Phone (optional)"
    },
    "submit": "Create company profile",
    "success": {
      "verified": "Company verified! You can publish shorts",
      "pending": "Application submitted. Verification in progress"
    }
  },
  "profile": {
    "edit": {
      "title": "Edit company profile",
      "save": "Save changes"
    }
  },
  "logo": {
    "title": "Change logo",
    "upload": "Select file"
  }
}
```

**Note:** Repeat for `de/`, `es/`, `ru/` locales

### 10.2 Admin Namespace

#### File: `src/lib/locales/pl/admin.json`
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "companies": "Firmy",
    "categories": "Kategorie",
    "users": "Użytkownicy",
    "audit": "Logi"
  },
  "companies": {
    "title": "Zarządzanie firmami",
    "table": {
      "name": "Nazwa",
      "nip": "NIP",
      "email": "Email",
      "status": "Status",
      "actions": "Akcje"
    },
    "status": {
      "verified": "Zweryfikowana",
      "pending": "Oczekuje"
    },
    "actions": {
      "verify": "Zweryfikuj",
      "reject": "Odrzuć",
      "view": "Podgląd"
    },
    "search": {
      "placeholder": "Szukaj firmy..."
    },
    "filter": {
      "status": "Status",
      "all": "Wszystkie",
      "verified": "Zweryfikowane",
      "pending": "Oczekujące"
    },
    "verify": {
      "success": "Firma zweryfikowana"
    }
  }
}
```

**Note:** Repeat for all 5 languages

### 10.3 Categories Namespace

#### File: `src/lib/locales/pl/categories.json`
```json
{
  "picker": {
    "label": "Kategoria",
    "placeholder": "Wybierz kategorię"
  }
}
```

**Note:** Repeat for all 5 languages

---

## 11. Implementation Phases

### Phase 1: Database & Core Infrastructure (Days 1-2)
**Tasks:**
1. Create Prisma migration (CompanyProfile, Category, AuditLog)
2. Run migration + seed categories
3. Implement VIES client with retry logic
4. Create slug generation utility
5. Extend validation schemas

**Dependencies:** None
**Output:** Database ready, VIES integration tested

---

### Phase 2: Company Upgrade Flow (Days 3-4)
**Tasks:**
1. Create Server Actions: upgrade, update
2. Create API routes: logo upload, banner upload
3. Build CompanyUpgradeForm component
4. Build LogoUpload component (reuse avatar pattern)
5. Create upgrade page route
6. Add translations (5 languages)

**Dependencies:** Phase 1
**Output:** Users can upgrade to COMPANY role

---

### Phase 3: Public Company Profile (Day 5)
**Tasks:**
1. Create CompanyProfileCard component
2. Create public profile page (`/companies/[slug]`)
3. Add SEO metadata generation
4. Style with banner + logo layout

**Dependencies:** Phase 2
**Output:** Public company profiles visible

---

### Phase 4: Company Profile Edit (Days 6-7)
**Tasks:**
1. Create CompanyProfileForm component
2. Build CategoryPicker component
3. Create edit page route
4. Add MarkdownEditor for description (with preview)
5. Integrate with Server Actions

**Dependencies:** Phase 3
**Output:** Companies can edit profiles

---

### Phase 5: Admin Panel Foundation (Days 8-9)
**Tasks:**
1. Create AdminSidebar component
2. Create admin layout with protection
3. Create CompaniesTable component
4. Build admin companies page with filters
5. Implement verify/reject actions

**Dependencies:** Phase 2
**Output:** Admin can verify companies

---

### Phase 6: Category Management (Day 10)
**Tasks:**
1. Create category CRUD Server Actions
2. Build CategoriesTreeView component
3. Create admin categories page
4. Add drag-drop reordering (optional for MVP)

**Dependencies:** Phase 5
**Output:** Admin can manage categories

---

### Phase 7: Navigation & Polish (Day 11)
**Tasks:**
1. Extend user menu with role-based items
2. Update sidebar with company/admin links
3. Extend middleware with route protection
4. Add audit log viewer (basic)
5. Final translation review

**Dependencies:** All previous phases
**Output:** Complete navigation, protected routes

---

### Phase 8: Testing & Documentation (Days 12-13)
**Tasks:**
1. Manual testing: upgrade flow, VIES verification
2. Test admin verification flow
3. Test category management
4. Verify all 5 language translations
5. Update documentation

**Dependencies:** All previous phases
**Output:** Stage 02 ready for QA

---

## 12. Reusable Components from Stage 01

| Component | Path | Reuse in Stage 02 |
|-----------|------|-------------------|
| Button | `src/components/ui/button.tsx` | Forms, actions |
| Input | `src/components/ui/input.tsx` | All form fields |
| Textarea | `src/components/ui/textarea.tsx` | Description field |
| Label | `src/components/ui/label.tsx` | Form labels |
| Card | `src/components/ui/card.tsx` | Profile cards, forms |
| Alert | `src/components/ui/alert.tsx` | Status messages |
| Dialog | `src/components/ui/dialog.tsx` | Crop tools, confirmations |
| Avatar | `src/components/ui/avatar.tsx` | Logo display |
| Dropdown Menu | `src/components/ui/dropdown-menu.tsx` | Category picker |
| Separator | `src/components/ui/separator.tsx` | Section dividers |
| Sheet | `src/components/ui/sheet.tsx` | Mobile admin menu |
| Table | `src/components/ui/table.tsx` | Admin data tables |
| Badge | `src/components/ui/badge.tsx` | Verification status |
| Select | `src/components/ui/select.tsx` | Category selection |
| Loading Spinner | `src/components/shared/loading-spinner.tsx` | Loading states |
| Error Boundary | `src/components/shared/error-boundary.tsx` | Error handling |
| Locale Switcher | `src/components/shared/locale-switcher.tsx` | Language switching |
| Theme Toggle | `src/components/theme/theme-toggle.tsx` | Dark mode |
| App Sidebar | `src/components/layout/app-sidebar.tsx` | Extended with new items |
| Header | `src/components/layout/header.tsx` | Unchanged |
| Footer | `src/components/layout/footer.tsx` | Unchanged |

**Total Reused:** 21 components

---

## 13. New Components to Create

| Component | Path | Purpose | Complexity |
|-----------|------|---------|------------|
| CompanyUpgradeForm | `src/components/companies/company-upgrade-form.tsx` | Upgrade flow | Medium |
| CompanyProfileForm | `src/components/companies/company-profile-form.tsx` | Edit profile | Medium |
| CompanyProfileCard | `src/components/companies/company-profile-card.tsx` | Public display | Low |
| LogoUpload | `src/components/companies/logo-upload.tsx` | Logo with crop | Low |
| BannerUpload | `src/components/companies/banner-upload.tsx` | Banner with crop | Low |
| CategoryPicker | `src/components/companies/category-picker.tsx` | Hierarchical select | Medium |
| MarkdownEditor | `src/components/companies/markdown-editor.tsx` | Description editor | Medium |
| VIESStatusBadge | `src/components/companies/vies-status-badge.tsx` | Status display | Low |
| AdminSidebar | `src/components/admin/admin-sidebar.tsx` | Admin nav | Low |
| CompaniesTable | `src/components/admin/companies-table.tsx` | Company list | Medium |
| CategoriesTreeView | `src/components/admin/categories-tree.tsx` | Category tree | High |
| AuditLogViewer | `src/components/admin/audit-log-viewer.tsx` | Admin history | Low |

**Total New:** 12 components

---

## 14. Critical Risks & Mitigations

### Risk 1: VIES API Instability
**Probability:** HIGH
**Impact:** MEDIUM

**Mitigation:**
- Retry logic with exponential backoff (3 attempts)
- Fallback to manual admin verification
- Cache VIES results for 6 months
- Clear user messaging: "Verification in progress"
- Admin dashboard shows pending verifications

### Risk 2: Slug Conflicts
**Probability:** MEDIUM
**Impact:** LOW

**Mitigation:**
- Auto-append number suffix if conflict: `company-name-2`
- Display conflict warning in UI
- Allow manual slug override (with uniqueness check)
- Validate slug availability before saving

### Risk 3: Image Upload Performance
**Probability:** LOW
**Impact:** MEDIUM

**Mitigation:**
- Client-side compression before upload
- Direct upload to R2 (presigned URLs)
- Progress indicator for user feedback
- Retry mechanism with exponential backoff
- Max file size validation: 5MB logo, 10MB banner

### Risk 4: Admin Role Escalation
**Probability:** LOW
**Impact:** HIGH

**Mitigation:**
- Strict middleware checks on `/admin/*` routes
- Audit log ALL admin actions
- Session validation on every admin action
- No self-promotion (USER cannot become ADMIN)
- Database-level role constraints

---

## 15. Success Criteria

### Functional Requirements:
- ✅ USER can upgrade to COMPANY account
- ✅ VIES API verification works (automatic NIP validation)
- ✅ Fallback to manual verification when VIES down
- ✅ Company can create and edit profile (logo, banner, description)
- ✅ Public company profile visible at `/companies/[slug]`
- ✅ Category system works (hierarchical, icons)
- ✅ ADMIN can manage categories (CRUD)
- ✅ ADMIN can manually verify companies
- ✅ ADMIN can view company and user lists
- ✅ Audit log records all admin actions

### Non-Functional Requirements:
- ✅ VIES check < 5s (p95)
- ✅ Company profile load < 2s (LCP)
- ✅ Image upload (logo/banner) < 5s
- ✅ Admin panel responsive (mobile, tablet, desktop)
- ✅ Public profiles SEO-optimized (meta tags, OG images)

### Security Requirements:
- ✅ Only verified companies can publish shorts (enforced in Stage 03)
- ✅ NIP unique constraint in database
- ✅ Admin endpoint authorization (role check)
- ✅ Image upload validation (file type, size)
- ✅ VIES API rate limiting (defensive)

### Integration Requirements:
- ✅ VIES API integration functional
- ✅ Cloudflare R2 upload for logo/banner
- ✅ Mapbox autocomplete for location (optional for MVP)
- ✅ Email notifications (verification success/fail)

---

## 16. Dependencies & Prerequisites

### External Services:
- **VIES API:** EU VAT validation (public, no credentials needed)
- **Cloudflare R2:** Bucket `videoshorts-companies` configured
- **Mapbox:** Token configured (optional for MVP, can use plain text)
- **Resend:** Email service for notifications

### Stage 01 Prerequisites:
- ✅ User authentication system
- ✅ User profiles with avatar upload
- ✅ R2 integration working
- ✅ Role enum (USER, COMPANY, ADMIN) defined
- ✅ Layout components (header, sidebar, footer)
- ✅ UI component library (shadcn/ui)
- ✅ i18n setup (5 languages)

### Database Prerequisites:
- ✅ PostgreSQL with PostGIS extension
- ✅ Prisma ORM configured
- ✅ Migration system working
- ✅ First ADMIN user created (seed script)

---

## 17. Out of Scope (NOT in Stage 02)

- ❌ Upload shortsów (Stage 03)
- ❌ Dashboard analytics (Stage 07)
- ❌ Follow companies (Stage 05)
- ❌ Moderacja shortsów/komentarzy (Stage 06)
- ❌ Full admin moderation queue (Stage 06)
- ❌ Company tiers/subscriptions (Post-MVP)
- ❌ Non-EU company verification (Post-MVP)
- ❌ Advanced category features (drag-drop can be simple number input initially)
- ❌ Mapbox autocomplete (can use plain text input initially)
- ❌ Business hours picker (can use JSON text input initially)

---

## Architecture Document Status

**Status:** ✅ COMPLETE - Ready for Implementation

**Prepared by:** AI Architect Agent
**Date:** 2025-12-15
**Iteration:** v1

**Next Steps:**
1. Review by Tech Lead
2. Approval by Product Owner
3. Task breakdown by Task Planner
4. Implementation by Coder Agent

---

**End of Architecture Document**
