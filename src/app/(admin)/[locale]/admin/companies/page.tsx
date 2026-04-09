import { prisma } from "@/lib/prisma"
import { getText } from "@/lib/i18n/server"
import { CompaniesDataTable } from "@/components/admin/companies-data-table"
import { type Locale } from "@/lib/i18n/config"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    status?: "all" | "verified" | "pending"
    search?: string
  }>
}

const DEFAULT_PAGE_SIZE = 20

export default async function AdminCompaniesPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const localeTyped = locale as Locale
  const resolvedSearchParams = await searchParams

  // Parse pagination params
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(resolvedSearchParams.pageSize || String(DEFAULT_PAGE_SIZE), 10)))
  const sortBy = resolvedSearchParams.sortBy || "createdAt"
  const sortOrder = resolvedSearchParams.sortOrder || "desc"

  // Build where clause
  const where = {
    ...(resolvedSearchParams.status === "verified" && { viesVerified: true }),
    ...(resolvedSearchParams.status === "pending" && { viesVerified: false }),
    ...(resolvedSearchParams.search && {
      OR: [
        { companyName: { contains: resolvedSearchParams.search, mode: "insensitive" as const } },
        { nip: { contains: resolvedSearchParams.search } }
      ]
    })
  }

  // Build orderBy - handle nested fields and validate sortBy
  const validSortFields = ["companyName", "nip", "viesVerified", "status", "createdAt"]
  const orderBy = validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder }
    : { createdAt: "desc" as const }

  // Fetch data with pagination
  const [companies, totalCount] = await Promise.all([
    prisma.companyProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true } }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.companyProfile.count({ where })
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {await getText("companies.title", "admin", localeTyped)}
      </h1>

      <CompaniesDataTable
        companies={companies.map((c) => ({ ...c, userId: c.user.id }))}
        pagination={{
          page,
          pageSize,
          totalCount,
          totalPages,
        }}
        locale={locale}
      />
    </div>
  )
}
