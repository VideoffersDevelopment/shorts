"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { CompanyProfileForm } from "@/components/companies/company-profile-form"
import { adminUpdateCompanyAction } from "@/app/actions/admin/companies/update"
import type { CompanyProfile, Category } from "@prisma/client"
import type { ActionResult } from "@/lib/types/action-result"

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

interface AdminCompanyEditFormProps {
  companyId: string
  profile: CompanyProfile
  categories: CategoryWithChildren[]
  locale: string
}

export function AdminCompanyEditForm({
  companyId,
  profile,
  categories,
  locale
}: AdminCompanyEditFormProps) {
  const router = useRouter()

  // Wrap the admin action to include companyId
  const handleSubmit = useCallback(async (data: unknown): Promise<ActionResult<CompanyProfile>> => {
    return adminUpdateCompanyAction(companyId, data)
  }, [companyId])

  const handleSuccess = useCallback(() => {
    // Refresh data and optionally redirect
    router.refresh()
  }, [router])

  return (
    <CompanyProfileForm
      profile={profile}
      categories={categories}
      submitAction={handleSubmit}
      onSuccess={handleSuccess}
    />
  )
}
