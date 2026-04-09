import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getText } from "@/lib/i18n/server"
import { UsersDataTable } from "@/components/admin/users-data-table"
import { type Locale } from "@/lib/i18n/config"
import { Role } from "@prisma/client"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    page?: string
    pageSize?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    role?: "USER" | "COMPANY" | "ADMIN"
    status?: "active" | "blocked"
    search?: string
  }>
}

const DEFAULT_PAGE_SIZE = 20

export default async function AdminUsersPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const localeTyped = locale as Locale
  const resolvedSearchParams = await searchParams
  const session = await auth()

  // Parse pagination params
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(resolvedSearchParams.pageSize || String(DEFAULT_PAGE_SIZE), 10)))
  const sortBy = resolvedSearchParams.sortBy || "createdAt"
  const sortOrder = resolvedSearchParams.sortOrder || "desc"

  // Build where clause
  const where = {
    ...(resolvedSearchParams.role &&
      Object.values(Role).includes(resolvedSearchParams.role) && {
        role: resolvedSearchParams.role,
      }),
    ...(resolvedSearchParams.status === "active" && { isBlocked: false }),
    ...(resolvedSearchParams.status === "blocked" && { isBlocked: true }),
    ...(resolvedSearchParams.search && {
      OR: [
        { email: { contains: resolvedSearchParams.search, mode: "insensitive" as const } },
        { profile: { displayName: { contains: resolvedSearchParams.search, mode: "insensitive" as const } } },
      ],
    }),
  }

  // Build orderBy - validate sortBy field
  const validSortFields = ["email", "role", "isBlocked", "createdAt", "emailVerified"]
  const orderBy = validSortFields.includes(sortBy)
    ? { [sortBy]: sortOrder }
    : { createdAt: "desc" as const }

  // Fetch data with pagination
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
        emailVerified: true,
        createdAt: true,
        profile: { select: { displayName: true } },
        companyProfile: { select: { companyName: true } },
        creditBatches: { select: { currentBalance: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {await getText("users.title", "admin", localeTyped)}
      </h1>

      <UsersDataTable
        users={users.map((u) => ({
          ...u,
          walletBalance: u.creditBatches.reduce((sum, b) => sum + b.currentBalance, 0),
        }))}
        pagination={{
          page,
          pageSize,
          totalCount,
          totalPages,
        }}
        locale={locale}
        currentUserId={session?.user?.id || ""}
      />
    </div>
  )
}
