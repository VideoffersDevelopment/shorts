# Task 05: Company Profile Edit

## Overview

**Priority:** HIGH
**Dependencies:** task-04
**Complexity:** Medium (15 files, ~15k tokens)
**Status:** pending

## What to Build

Create the company profile editing interface with logo/banner upload, description editor, category picker, and all profile fields. Reuse avatar upload pattern from Stage 01 for image uploads.

This task enables companies to manage their public presence.

## Files to Create

| File | Type | Description |
|------|------|-------------|
| `src/app/(main)/[locale]/panel/company/profile/page.tsx` | Create | Company profile edit page |
| `src/components/companies/company-profile-form.tsx` | Create | Main edit form component |
| `src/components/companies/logo-upload.tsx` | Create | Logo upload with crop |
| `src/components/companies/banner-upload.tsx` | Create | Banner upload with crop |
| `src/components/companies/category-picker.tsx` | Create | Category dropdown picker |
| `src/app/api/companies/logo/route.ts` | Create | Logo upload API endpoint |
| `src/app/api/companies/banner/route.ts` | Create | Banner upload API endpoint |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/actions/companies/update.ts` | Already created in task-03, may need minor updates |

## Company Profile Edit Page

```typescript
// src/app/(main)/[locale]/panel/company/profile/page.tsx
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

## Logo Upload Component

```typescript
// src/components/companies/logo-upload.tsx
"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Upload } from "lucide-react"
import { toast } from "sonner"

interface LogoUploadProps {
  currentLogo?: string
  companyName: string
  onLogoChange: (url: string) => void
}

export function LogoUpload({ currentLogo, companyName, onLogoChange }: LogoUploadProps) {
  const t = useTranslations("companies")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0
  })
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("logo.errors.invalidType"))
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("logo.errors.tooLarge"))
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setIsOpen(true)
  }, [t])

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !previewUrl) return

    setIsUploading(true)

    try {
      // Get presigned URL
      const response = await fetch("/api/companies/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: selectedFile.type })
      })

      if (!response.ok) throw new Error("Failed to get upload URL")

      const { uploadUrl, publicUrl } = await response.json()

      // Upload to R2
      await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type }
      })

      // Update parent
      onLogoChange(publicUrl)
      toast.success(t("logo.success"))
      setIsOpen(false)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(t("logo.errors.uploadFailed"))
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, previewUrl, onLogoChange, t])

  return (
    <div>
      <Avatar className="h-24 w-24 cursor-pointer" onClick={() => document.getElementById("logo-input")?.click()}>
        <AvatarImage src={currentLogo} alt={companyName} />
        <AvatarFallback>{companyName[0]}</AvatarFallback>
      </Avatar>

      <input
        id="logo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("logo.title")}</DialogTitle>
          </DialogHeader>

          {previewUrl && (
            <div className="space-y-4">
              <ReactCrop
                crop={crop}
                onChange={setCrop}
                aspect={1}
                minWidth={200}
                minHeight={200}
              >
                <img src={previewUrl} alt="Preview" className="max-h-96" />
              </ReactCrop>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t("logo.cancel")}
                </Button>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? t("logo.uploading") : t("logo.upload")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

## Logo Upload API Route

```typescript
// src/app/api/companies/logo/route.ts
import { auth } from "@/lib/auth"
import { getUploadUrl } from "@/lib/r2"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    )
  }

  const { contentType } = await req.json()

  // Validate content type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid file type", code: "INVALID_FILE_TYPE" },
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
      { error: "Failed to generate upload URL", code: "R2_ERROR" },
      { status: 500 }
    )
  }
}
```

## Category Picker Component

```typescript
// src/components/companies/category-picker.tsx
"use client"

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

## Acceptance Criteria

- [ ] Edit page accessible at `/panel/company/profile`
- [ ] Form pre-filled with current company data
- [ ] Logo upload works (5MB max, 1:1 aspect ratio, crop tool)
- [ ] Banner upload works (10MB max, 1920:400 aspect ratio, crop tool)
- [ ] Description field supports markdown (textarea for MVP)
- [ ] Category picker shows hierarchical structure
- [ ] Social links validation (Facebook, Instagram URLs)
- [ ] Location fields (latitude, longitude, address)
- [ ] Business hours field (JSON textarea for MVP)
- [ ] Save button triggers Server Action
- [ ] Success: show toast and update profile
- [ ] Error: show validation errors
- [ ] Redirect if not COMPANY role
- [ ] `npm run build` passes
- [ ] No TypeScript errors

## Visual Verification Steps

### Prerequisites
- Dev server: `npm run dev` on localhost:3000
- Test company: Created via upgrade flow

### Steps

| Step | Action | Expected Result | Selector/URL |
|------|--------|-----------------|--------------|
| 1 | Navigate to edit page | Page loads with pre-filled data | `/panel/company/profile` |
| 2 | Click logo avatar | File upload dialog opens | `.avatar` |
| 3 | Upload logo image | Crop dialog appears | `input[type="file"]` |
| 4 | Crop and upload | Logo updates, toast success | `button:has-text("Upload")` |
| 5 | Fill description | Textarea accepts markdown | `textarea[name="description"]` |
| 6 | Select category | Dropdown shows hierarchy | `.select-trigger` |
| 7 | Add social links | URL fields validate | `input[name="socialLinks.facebook"]` |
| 8 | Click Save | Success toast, profile updated | `button[type="submit"]` |

### Screenshot Checkpoints
- `01-edit-form.png` - Edit form with pre-filled data
- `02-logo-crop.png` - Logo crop dialog
- `03-category-picker.png` - Category dropdown expanded
- `04-save-success.png` - Success toast after save

## Notes

- **Reuse Pattern:** Logo/banner upload identical to avatar-upload.tsx from Stage 01
- **Aspect Ratios:** Logo 1:1, Banner 1920:400
- **Markdown Editor:** Simple textarea for MVP, can enhance later
- **Business Hours:** JSON textarea for MVP, dedicated picker in future
- **R2 Upload:** Direct upload via presigned URLs (same as Stage 01)
