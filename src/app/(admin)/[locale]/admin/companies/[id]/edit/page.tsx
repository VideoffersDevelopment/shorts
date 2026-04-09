import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getText } from "@/lib/i18n/server"
import { type Locale } from "@/lib/i18n/config"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AdminCompanyEditForm } from "./admin-company-edit-form"

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function AdminCompanyEditPage({ params }: PageProps) {
  const { locale, id } = await params
  const localeTyped = locale as Locale

  // Check admin access
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect(`/${locale}/auth/login`)
  }

  // Fetch company with categories
  const [company, categories] = await Promise.all([
    prisma.companyProfile.findUnique({
      where: { id },
      include: { user: { select: { email: true } } }
    }),
    prisma.category.findMany({
      where: { enabled: true, parentId: null },
      include: {
        children: {
          where: { enabled: true },
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    })
  ])

  if (!company) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/admin/companies`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {await getText("companies.title", "admin", localeTyped)}
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {await getText("companies.edit.title", "admin", localeTyped)}
        </h1>
        <p className="text-muted-foreground mt-1">
          {company.companyName} ({company.nip})
        </p>
        <p className="text-sm text-muted-foreground">
          {company.user.email}
        </p>
      </div>

      {/* Read-only info */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">
          {await getText("companies.edit.readOnlyInfo", "admin", localeTyped)}
        </h3>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">NIP: </span>
            <span className="font-mono">{company.nip}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Slug: </span>
            <span className="font-mono">{company.slug}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Status: </span>
            <span className={
              company.status === "ACTIVE" ? "text-green-600" :
              company.status === "SUSPENDED" ? "text-red-600" :
              "text-yellow-600"
            }>
              {await getText(`companies.companyStatus.${company.status}`, "admin", localeTyped)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">VIES: </span>
            <span className={company.viesVerified ? "text-green-600" : "text-yellow-600"}>
              {company.viesVerified
                ? await getText("companies.status.verified", "admin", localeTyped)
                : await getText("companies.status.pending", "admin", localeTyped)
              }
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-card rounded-lg border p-6">
        <AdminCompanyEditForm
          companyId={company.id}
          profile={company}
          categories={categories}
          locale={locale}
        />
      </div>
    </div>
  )
}
